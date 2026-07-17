import { LINKEDIN_IMPORT_LIMITS } from './linkedin-archive';

export type LinkedInImportFileKind = 'zip' | 'csv';

export type LinkedInImportFile = {
  name: string;
  type?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

type FileKind = LinkedInImportFileKind | undefined;

const kindFromExtension = (name: string): FileKind => {
  const extension = name
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .split('.')
    .at(-1);
  if (extension === 'zip') return 'zip';
  if (extension === 'csv') return 'csv';
  return undefined;
};

const normalizedType = (type: string | undefined): string =>
  type?.normalize('NFC').trim().toLowerCase().split(';', 1)[0] ?? '';

const kindFromType = (type: string | undefined): FileKind => {
  const mimeType = normalizedType(type);
  if (mimeType === 'application/zip') return 'zip';
  if (mimeType === 'text/csv') return 'csv';
  return undefined;
};

export const preflightLinkedInImportFile = ({
  name,
  type,
  size,
}: Pick<LinkedInImportFile, 'name' | 'type' | 'size'>): LinkedInImportFileKind => {
  const extensionKind = kindFromExtension(name);
  const typeKind = kindFromType(type);
  if (normalizedType(type) && !typeKind) {
    throw new Error('Use a LinkedIn ZIP or supported CSV file.');
  }
  if (extensionKind && typeKind && extensionKind !== typeKind) {
    throw new Error(
      'The selected file type does not match its extension. Choose a LinkedIn ZIP or CSV.'
    );
  }
  const kind = extensionKind ?? typeKind;
  if (!kind) {
    throw new Error('Use a LinkedIn ZIP or supported CSV file.');
  }
  if (
    kind === 'zip' &&
    size > LINKEDIN_IMPORT_LIMITS.maxCompressedBytes
  ) {
    throw new Error('The selected file exceeds the 25 MiB limit.');
  }
  if (kind === 'csv' && size > LINKEDIN_IMPORT_LIMITS.maxFileBytes) {
    throw new Error('The CSV exceeds the 10 MiB per-file limit.');
  }
  return kind;
};

export const readLinkedInImportFile = async (
  file: LinkedInImportFile
): Promise<Uint8Array> => {
  preflightLinkedInImportFile(file);
  return new Uint8Array(await file.arrayBuffer());
};
