import Papa from 'papaparse';

import type { LanguageProficiency } from '@/lib/profile/domain';
import {
  extractLinkedInFiles,
  LINKEDIN_IMPORT_LIMITS,
} from './linkedin-archive';
import {
  certificationDedupeKey,
  educationDedupeKey,
  experienceDedupeKey,
  languageDedupeKey,
  projectDedupeKey,
  publicationDedupeKey,
  skillDedupeKey,
} from './linkedin-dedupe';
import {
  emptyLinkedInImportData,
  type LinkedInImportData,
  type LinkedInImportResult,
} from './linkedin-types';

const MAX_ROWS_PER_FILE = 2_000;
const MAX_COLUMNS = 100;
const MAX_CELL_LENGTH = 5_000;
const MAX_MAPPED_FIELDS = MAX_ROWS_PER_FILE * MAX_COLUMNS;

type CsvRow = {
  ordinal: number;
  values: Record<string, string>;
};

const aliases = {
  positions: {
    role: ['Title', 'Position'],
    company: ['Company Name', 'Company'],
    startDate: ['Started On', 'Start Date'],
    endDate: ['Finished On', 'End Date'],
    description: ['Description'],
  },
  education: {
    degree: ['Degree Name', 'Degree'],
    school: ['School Name', 'School'],
    startDate: ['Start Date', 'Started On'],
    endDate: ['End Date', 'Finished On'],
    description: ['Notes', 'Description'],
  },
  skills: { name: ['Name', 'Skill'] },
  certifications: {
    name: ['Name'],
    issuer: ['Authority', 'Issuing Organization', 'Issuer'],
    date: ['Started On', 'Issue Date'],
    credentialId: ['License Number', 'Credential ID'],
    url: ['Url', 'URL'],
  },
  projects: {
    title: ['Title', 'Name'],
    date: ['Started On', 'Start Date', 'Year'],
    description: ['Description'],
    url: ['Url', 'URL'],
  },
  languages: {
    name: ['Name', 'Language'],
    proficiency: ['Proficiency'],
  },
  publications: {
    title: ['Name', 'Title'],
    publisher: ['Publisher'],
    date: ['Published On', 'Publication Date', 'Date'],
    url: ['Url', 'URL'],
    authors: ['Authors'],
    description: ['Description', 'Summary'],
  },
} as const;

export const sanitizeCsvCell = (value: string): string => {
  const safeCharacters = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return (
        code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)
      );
    })
    .join('');
  const normalized = safeCharacters.trim().slice(0, MAX_CELL_LENGTH);
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
};

const deterministicId = (
  section: string,
  sourceName: string,
  sourceRowOrdinal: number
): string => `linkedin:${section}:${sourceName}:${sourceRowOrdinal}`;

const parseRows = (
  name: string,
  bytes: Uint8Array,
  required: ReadonlyArray<readonly string[]>,
  warnings: string[]
): CsvRow[] => {
  if (bytes.byteLength > LINKEDIN_IMPORT_LIMITS.maxFileBytes) {
    warnings.push(`${name}: the CSV exceeds the 10 MiB per-file limit.`);
    return [];
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    warnings.push(`${name}: only UTF-8 LinkedIn CSV files are supported.`);
    return [];
  }
  const rows: CsvRow[] = [];
  let headers: string[] | undefined;
  let malformed = false;
  let aborted = false;
  let sourceRowOrdinal = 0;
  let mappedFields = 0;
  Papa.parse<string[]>(text, {
    skipEmptyLines: 'greedy',
    step: (parsed, parser) => {
      if (aborted) return;
      sourceRowOrdinal += 1;
      malformed ||= parsed.errors.length > 0;
      const cells = parsed.data;
      const abort = (warning: string) => {
        aborted = true;
        rows.length = 0;
        warnings.push(`${name}: ${warning}`);
        parser.abort();
      };
      if (cells.length > MAX_COLUMNS) {
        abort(
          `the CSV exceeds the ${MAX_COLUMNS}-column limit and was not imported.`
        );
        return;
      }
      if (cells.some((cell) => cell.length > MAX_CELL_LENGTH)) {
        abort(
          `a cell exceeds the ${MAX_CELL_LENGTH}-character limit and the file was not imported.`
        );
        return;
      }
      if (!headers) {
        headers = cells.map(sanitizeCsvCell);
        if (
          headers.length === 0 ||
          headers.some((header) => !header) ||
          new Set(headers).size !== headers.length
        ) {
          abort(
            'the CSV headers are empty or duplicated and the file was not imported.'
          );
          return;
        }
        const headerSet = new Set(headers);
        if (
          !required.every((group) =>
            group.some((header) => headerSet.has(header))
          )
        ) {
          abort(
            'expected LinkedIn column names were not found; localized or unknown formats are not guessed.'
          );
        }
        return;
      }
      if (rows.length >= MAX_ROWS_PER_FILE) {
        abort(
          `the CSV exceeds the ${MAX_ROWS_PER_FILE}-row limit and was not imported.`
        );
        return;
      }
      mappedFields += headers.length;
      if (mappedFields > MAX_MAPPED_FIELDS) {
        abort('the CSV exceeds the mapped-field limit and was not imported.');
        return;
      }
      rows.push({
        ordinal: sourceRowOrdinal,
        values: Object.fromEntries(
          headers.map((header, index) => [
            header,
            sanitizeCsvCell(cells[index] ?? ''),
          ])
        ),
      });
    },
  });
  if (malformed) {
    warnings.push(`${name}: malformed CSV rows were not imported.`);
  }
  if (!aborted && rows.length === 0) {
    warnings.push(`${name}: no data rows were found.`);
  }
  return rows;
};

const value = (row: CsvRow, names: readonly string[]): string => {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(row.values, name))
      return row.values[name];
  }
  return '';
};

const monthNumbers: Record<string, string> = {
  january: '01',
  jan: '01',
  february: '02',
  feb: '02',
  march: '03',
  mar: '03',
  april: '04',
  apr: '04',
  may: '05',
  june: '06',
  jun: '06',
  july: '07',
  jul: '07',
  august: '08',
  aug: '08',
  september: '09',
  sep: '09',
  sept: '09',
  october: '10',
  oct: '10',
  november: '11',
  nov: '11',
  december: '12',
  dec: '12',
};

export const normalizeLinkedInMonth = (input: string): string | undefined => {
  const raw = input.trim();
  if (!raw) return undefined;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return raw;
  if (/^\d{4}$/.test(raw)) return `${raw}-01`;
  const numeric = raw.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/);
  if (numeric) return `${numeric[2]}-${numeric[1].padStart(2, '0')}`;
  const named = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (named && monthNumbers[named[1].toLowerCase()]) {
    return `${named[2]}-${monthNumbers[named[1].toLowerCase()]}`;
  }
  return undefined;
};

const validUrl = (input: string): string | undefined => {
  if (!input) return undefined;
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password
      ? input.slice(0, 500)
      : undefined;
  } catch {
    return undefined;
  }
};

const proficiency = (input: string): LanguageProficiency | undefined => {
  const normalized = input.normalize('NFC').toLowerCase();
  if (normalized.includes('native') || normalized.includes('bilingual'))
    return 'native';
  if (normalized === 'fluent' || normalized.includes('full professional'))
    return 'fluent';
  if (normalized.includes('professional working')) return 'professional';
  if (
    normalized.includes('limited working') ||
    normalized.includes('conversational')
  ) {
    return 'conversational';
  }
  if (normalized.includes('elementary') || normalized === 'basic')
    return 'basic';
  return undefined;
};

const uniqueBy = <T>(values: T[], key: (value: T) => string): T[] => {
  const seen = new Set<string>();
  return values.filter((item) => {
    const semanticKey = key(item);
    if (seen.has(semanticKey)) return false;
    seen.add(semanticKey);
    return true;
  });
};

export function mapLinkedInCsvFiles(
  files: Record<string, Uint8Array>,
  ignoredFiles: string[] = []
): LinkedInImportResult {
  const data = emptyLinkedInImportData();
  const warnings: string[] = [];
  const parsedFiles: string[] = [];
  const rowsFor = (
    name: string,
    required: ReadonlyArray<readonly string[]>
  ) => {
    const bytes = files[name];
    if (!bytes) return [];
    parsedFiles.push(name);
    return parseRows(name, bytes, required, warnings);
  };

  const positions = rowsFor('positions.csv', [
    aliases.positions.role,
    aliases.positions.company,
    aliases.positions.startDate,
  ]);
  if (positions.length) {
    data.experience = uniqueBy(
      positions.flatMap((row) => {
        const role = value(row, aliases.positions.role).slice(0, 120);
        const company = value(row, aliases.positions.company).slice(0, 120);
        const startDate = normalizeLinkedInMonth(
          value(row, aliases.positions.startDate)
        );
        if (!role || !company || !startDate) {
          warnings.push(
            `positions.csv row ${row.ordinal}: required role, company, or date was invalid.`
          );
          return [];
        }
        const endDate = normalizeLinkedInMonth(
          value(row, aliases.positions.endDate)
        );
        return [
          {
            id: deterministicId('experience', 'positions.csv', row.ordinal),
            role,
            company,
            startDate,
            endDate,
            current: !endDate,
            description:
              value(row, aliases.positions.description).slice(0, 1000) ||
              undefined,
          },
        ];
      }),
      experienceDedupeKey
    ).slice(0, 50);
  }
  positions.length = 0;

  const education = rowsFor('education.csv', [
    aliases.education.degree,
    aliases.education.school,
    aliases.education.startDate,
  ]);
  if (education.length) {
    data.education = uniqueBy(
      education.flatMap((row) => {
        const degree = value(row, aliases.education.degree).slice(0, 120);
        const school = value(row, aliases.education.school).slice(0, 120);
        const startDate = normalizeLinkedInMonth(
          value(row, aliases.education.startDate)
        );
        if (!degree || !school || !startDate) {
          warnings.push(
            `education.csv row ${row.ordinal}: required degree, school, or date was invalid.`
          );
          return [];
        }
        const endDate = normalizeLinkedInMonth(
          value(row, aliases.education.endDate)
        );
        return [
          {
            id: deterministicId('education', 'education.csv', row.ordinal),
            degree,
            school,
            startDate,
            endDate,
            current: !endDate,
            description:
              value(row, aliases.education.description).slice(0, 1000) ||
              undefined,
          },
        ];
      }),
      educationDedupeKey
    ).slice(0, 50);
  }
  education.length = 0;

  const skills = rowsFor('skills.csv', [aliases.skills.name]);
  if (skills.length) {
    data.skills = uniqueBy(
      skills
        .map((row) => value(row, aliases.skills.name).slice(0, 50))
        .filter(Boolean),
      skillDedupeKey
    ).slice(0, 50);
  }
  skills.length = 0;

  const certifications = rowsFor('certifications.csv', [
    aliases.certifications.name,
    aliases.certifications.issuer,
  ]);
  if (certifications.length) {
    data.certifications = uniqueBy(
      certifications.flatMap((row) => {
        const name = value(row, aliases.certifications.name).slice(0, 160);
        const issuer = value(row, aliases.certifications.issuer).slice(0, 160);
        if (!name || !issuer) {
          warnings.push(
            `certifications.csv row ${row.ordinal}: name or issuer was missing.`
          );
          return [];
        }
        const rawUrl = value(row, aliases.certifications.url);
        const link = validUrl(rawUrl);
        if (rawUrl && !link) {
          warnings.push(
            `certifications.csv row ${row.ordinal}: invalid URL was omitted.`
          );
        }
        const normalizedDate = normalizeLinkedInMonth(
          value(row, aliases.certifications.date)
        );
        return [
          {
            id: deterministicId(
              'certification',
              'certifications.csv',
              row.ordinal
            ),
            name,
            issuer,
            year: normalizedDate?.slice(0, 4),
            credentialId:
              value(row, aliases.certifications.credentialId).slice(0, 160) ||
              undefined,
            link,
          },
        ];
      }),
      certificationDedupeKey
    ).slice(0, 50);
  }
  certifications.length = 0;

  const projects = rowsFor('projects.csv', [
    aliases.projects.title,
    aliases.projects.date,
  ]);
  if (projects.length) {
    data.projects = uniqueBy(
      projects.flatMap((row) => {
        const title = value(row, aliases.projects.title).slice(0, 160);
        const normalizedDate = normalizeLinkedInMonth(
          value(row, aliases.projects.date)
        );
        if (!title || !normalizedDate) {
          warnings.push(
            `projects.csv row ${row.ordinal}: title or date was invalid.`
          );
          return [];
        }
        const rawUrl = value(row, aliases.projects.url);
        const link = validUrl(rawUrl);
        if (rawUrl && !link) {
          warnings.push(
            `projects.csv row ${row.ordinal}: invalid URL was omitted.`
          );
        }
        return [
          {
            id: deterministicId('project', 'projects.csv', row.ordinal),
            title,
            year: normalizedDate.slice(0, 4),
            description:
              value(row, aliases.projects.description).slice(0, 1000) ||
              undefined,
            link,
          },
        ];
      }),
      projectDedupeKey
    ).slice(0, 50);
  }
  projects.length = 0;

  const languages = rowsFor('languages.csv', [aliases.languages.name]);
  if (languages.length) {
    data.languages = uniqueBy(
      languages.flatMap((row) => {
        const name = value(row, aliases.languages.name).slice(0, 100);
        if (!name) return [];
        const rawProficiency = value(row, aliases.languages.proficiency);
        const mappedProficiency = proficiency(rawProficiency);
        if (rawProficiency && !mappedProficiency) {
          warnings.push(
            `languages.csv row ${row.ordinal}: unknown proficiency was omitted.`
          );
        }
        return [
          {
            id: deterministicId('language', 'languages.csv', row.ordinal),
            name,
            proficiency: mappedProficiency,
          },
        ];
      }),
      languageDedupeKey
    ).slice(0, 50);
  }
  languages.length = 0;

  const publications = rowsFor('publications.csv', [
    aliases.publications.title,
  ]);
  if (publications.length) {
    data.publications = uniqueBy(
      publications.flatMap((row) => {
        const title = value(row, aliases.publications.title).slice(0, 200);
        if (!title) return [];
        const rawUrl = value(row, aliases.publications.url);
        const url = validUrl(rawUrl);
        if (rawUrl && !url) {
          warnings.push(
            `publications.csv row ${row.ordinal}: invalid URL was omitted.`
          );
        }
        const authors = value(row, aliases.publications.authors)
          .split(/[;,]/)
          .map((author) => author.trim().slice(0, 120))
          .filter(Boolean)
          .slice(0, 20);
        return [
          {
            id: deterministicId('publication', 'publications.csv', row.ordinal),
            title,
            publisher:
              value(row, aliases.publications.publisher).slice(0, 160) ||
              undefined,
            date:
              value(row, aliases.publications.date).slice(0, 100) || undefined,
            url,
            authors: authors.length
              ? uniqueBy(authors, skillDedupeKey)
              : undefined,
            description:
              value(row, aliases.publications.description).slice(0, 1000) ||
              undefined,
          },
        ];
      }),
      publicationDedupeKey
    ).slice(0, 50);
  }
  publications.length = 0;

  if (parsedFiles.length === 0) {
    warnings.push('No supported LinkedIn CSV files were found.');
  }
  if (ignoredFiles.length) {
    warnings.push(`${ignoredFiles.length} unrelated file(s) were ignored.`);
  }
  return { data, warnings, ignoredFiles, parsedFiles };
}

export async function parseLinkedInExportBytes(
  fileName: string,
  bytes: Uint8Array
): Promise<LinkedInImportResult> {
  const extracted = await extractLinkedInFiles(fileName, bytes);
  return mapLinkedInCsvFiles(extracted.files, extracted.ignoredFiles);
}

export const linkedInImportCount = (data: LinkedInImportData): number =>
  Object.values(data).reduce((total, entries) => total + entries.length, 0);
