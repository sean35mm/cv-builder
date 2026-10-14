import type { ProfileContent } from '@/lib/types';

// Fictional people for the landing page. Specimen uses Noor; the hero fan
// shows all three, one per template.
export const NOOR: ProfileContent = {
  username: 'noor',
  name: 'Noor Haddad',
  title: 'Staff software engineer, payments',
  location: 'Lisbon, Portugal',
  bio: 'I build the unglamorous systems money moves through: ledgers, reconciliation, payouts. I care about boring correctness, clear runbooks, and code a new teammate can read on their first day.',
  experience: [
    {
      id: 'tessera',
      role: 'Staff software engineer',
      company: 'Tessera',
      startDate: '2022-03',
      current: true,
      description:
        'Lead the ledger team of six. Rebuilt month-end reconciliation so finance closes in two days instead of nine, and moved payouts to an idempotent job queue with zero double-sends since launch.',
    },
    {
      id: 'fieldnote',
      role: 'Senior software engineer',
      company: 'Fieldnote',
      startDate: '2018-06',
      endDate: '2022-02',
      current: false,
      description:
        'Owned offline sync for the mobile apps. Designed the conflict model and the test harness that replays a year of real edit histories before every release.',
    },
    {
      id: 'kiln',
      role: 'Software engineer',
      company: 'Kiln CI',
      startDate: '2015-09',
      endDate: '2018-05',
      current: false,
      description:
        'Built the remote build cache. Median pipeline time fell from 14 minutes to 6.',
    },
  ],
  education: [
    {
      id: 'porto',
      degree: 'BSc, Computer Science',
      school: 'University of Porto',
      startDate: '2011-09',
      endDate: '2015-06',
      current: false,
    },
  ],
  skills: [
    'TypeScript',
    'Rust',
    'PostgreSQL',
    'Distributed systems',
    'Payments',
    'Technical writing',
  ],
  languages: [
    { id: 'ar', name: 'Arabic', proficiency: 'native' },
    { id: 'en', name: 'English', proficiency: 'fluent' },
    { id: 'pt', name: 'Portuguese', proficiency: 'professional' },
  ],
  projects: [
    {
      id: 'ledgerlint',
      title: 'ledgerlint',
      year: '2024',
      description:
        'Open-source linter for double-entry schemas. Flags unbalanced postings and missing currency columns before they reach production.',
      technologies: ['Rust', 'PostgreSQL'],
      isFeatured: true,
    },
    {
      id: 'quiet-hours',
      title: 'Quiet Hours',
      year: '2021',
      description:
        'A small macOS utility that holds notifications until your calendar is clear.',
      technologies: ['Swift'],
    },
  ],
  publications: [
    {
      id: 'reconciliation',
      title: 'Reconciliation without the spreadsheet',
      publisher: 'Tessera engineering blog',
      date: '2023-10',
    },
  ],
  certifications: [],
  volunteering: [],
  exhibitions: [],
  awards: [],
  interests: [],
};

export const AMARA: ProfileContent = {
  username: 'amara',
  name: 'Amara Obi',
  title: 'Architect, civic and cultural buildings',
  location: 'Lagos, Nigeria',
  bio: 'I design libraries, markets and schools that stay cool without air conditioning. Most of my work starts with a site visit at noon and a long conversation with whoever sweeps the floor.',
  experience: [
    {
      id: 'studio-ile',
      role: 'Associate director',
      company: 'Studio Ilé',
      startDate: '2020-01',
      current: true,
      description:
        'Lead the civic portfolio. Delivered the Yaba Library on budget, with passive cooling that keeps reading rooms under 28°C year-round.',
    },
    {
      id: 'mbs',
      role: 'Project architect',
      company: 'MBS Architects',
      startDate: '2015-04',
      endDate: '2019-12',
      current: false,
      description:
        'Ran site coordination for two secondary schools and a covered market for 900 traders.',
    },
  ],
  education: [
    {
      id: 'aa',
      degree: 'MArch',
      school: 'Architectural Association, London',
      startDate: '2013-09',
      endDate: '2015-06',
      current: false,
    },
  ],
  skills: ['Passive design', 'Rhino', 'Site management', 'Timber'],
  languages: [
    { id: 'yo', name: 'Yoruba', proficiency: 'native' },
    { id: 'en', name: 'English', proficiency: 'fluent' },
  ],
  projects: [
    {
      id: 'yaba',
      title: 'Yaba Library',
      year: '2023',
      description:
        'A three-storey public library wrapped in a perforated brick screen.',
      technologies: ['Brick', 'Timber'],
      isFeatured: true,
    },
  ],
  publications: [],
  certifications: [],
  volunteering: [],
  exhibitions: [
    {
      id: 'venice',
      title: 'Shade as Public Space',
      venue: 'Venice Architecture Biennale',
      year: '2023',
    },
  ],
  awards: [
    {
      id: 'riba',
      title: 'RIBA International Emerging Architect',
      issuer: 'RIBA',
      year: '2022',
    },
  ],
  interests: [],
};

export const KEN: ProfileContent = {
  username: 'ken',
  name: 'Ken Ito',
  title: 'Product designer, design systems',
  location: 'Tokyo, Japan',
  bio: 'I make design systems that teams actually use: fewer components, better defaults, and documentation people read.',
  experience: [
    {
      id: 'mori',
      role: 'Lead product designer',
      company: 'Mori',
      startDate: '2021-04',
      current: true,
      description:
        'Built the shared component library used by four product teams. Cut new-screen design time roughly in half.',
    },
    {
      id: 'pixelbank',
      role: 'Product designer',
      company: 'Pixelbank',
      startDate: '2017-06',
      endDate: '2021-03',
      current: false,
      description: 'Designed onboarding and card controls for the mobile app.',
    },
    {
      id: 'hana',
      role: 'Design intern',
      company: 'Studio Hana',
      startDate: '2016-06',
      endDate: '2016-09',
      current: false,
    },
  ],
  education: [
    {
      id: 'musabi',
      degree: 'BFA, Visual Communication',
      school: 'Musashino Art University',
      startDate: '2012-04',
      endDate: '2016-03',
      current: false,
    },
  ],
  skills: ['Figma', 'Design systems', 'Prototyping', 'Motion', 'Typography'],
  languages: [
    { id: 'ja', name: 'Japanese', proficiency: 'native' },
    { id: 'en', name: 'English', proficiency: 'professional' },
  ],
  projects: [
    {
      id: 'kumo',
      title: 'Kumo icons',
      year: '2022',
      description: 'An open-source set of 400 icons drawn on a 20px grid.',
      technologies: ['Figma', 'SVG'],
    },
  ],
  publications: [],
  certifications: [],
  volunteering: [],
  exhibitions: [],
  awards: [],
  interests: [],
};
