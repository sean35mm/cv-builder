export type RoadmapStatus = 'done' | 'in-progress' | 'planned';

export type RoadmapCategory =
  | 'editor'
  | 'profiles'
  | 'sharing'
  | 'analytics'
  | 'platform';

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  detail: string;
  status: RoadmapStatus;
  category: RoadmapCategory;
  quarter: string;
};

export const STATUS_CONFIG: Record<
  RoadmapStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  done: {
    label: 'Shipped',
    dotClass: 'bg-primary',
    badgeClass: 'border-transparent bg-primary/15 text-primary',
  },
  'in-progress': {
    label: 'In Progress',
    dotClass: 'bg-amber-500',
    badgeClass: 'border-transparent bg-amber-500/15 text-amber-500',
  },
  planned: {
    label: 'Planned',
    dotClass: 'bg-muted-foreground/40',
    badgeClass: 'border-transparent bg-muted text-muted-foreground',
  },
};

export const CATEGORIES: { value: RoadmapCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'editor', label: 'Editor' },
  { value: 'profiles', label: 'Profiles' },
  { value: 'sharing', label: 'Sharing' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'platform', label: 'Platform' },
];

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // ── Q4 2025 (Shipped — the foundation) ──
  {
    id: 'guided-editor',
    title: 'Drag-and-Drop Editor with Live Preview',
    description:
      'A visual editor with 9 section types, inline editing, and a real-time preview pane.',
    detail:
      'Reorder Experience, Education, Skills, Projects, Certifications, Volunteering, Exhibitions, and Awards with @dnd-kit. Every keystroke updates the preview instantly.',
    status: 'done',
    category: 'editor',
    quarter: 'Q4 2025',
  },
  {
    id: 'color-themes',
    title: '12 Color Themes with Light & Dark Mode',
    description:
      'Hand-picked palettes that adjust every surface, accent, and border.',
    detail:
      'Sage, Ocean, Rose, Slate, Teal, Amber, Forest, Sand, Cocoa, Peach, Olive, and Mauve. Each works beautifully in both light and dark mode.',
    status: 'done',
    category: 'profiles',
    quarter: 'Q4 2025',
  },
  {
    id: 'templates',
    title: '3 Profile Templates',
    description:
      'Classic, Modern, and Minimal — each with a distinct personality.',
    detail:
      'Classic uses a two-column layout with serif headings. Modern is card-based with accent colors. Minimal is typography-first with generous whitespace.',
    status: 'done',
    category: 'profiles',
    quarter: 'Q4 2025',
  },
  {
    id: 'public-links',
    title: 'Public Shareable Profile Links',
    description: 'One clean URL with SEO, Open Graph tags, and JSON-LD markup.',
    detail:
      'Share opencv.app/@yourname on LinkedIn, in emails, or anywhere. Rich previews show up automatically on social platforms.',
    status: 'done',
    category: 'sharing',
    quarter: 'Q4 2025',
  },
  {
    id: 'auth-onboarding',
    title: 'Email OTP Auth & Profile Setup Wizard',
    description: 'Passwordless sign-in and a guided setup flow for new users.',
    detail:
      'Enter your email, verify with a 6-digit code, then walk through username selection (with real-time availability), name, title, and social links.',
    status: 'done',
    category: 'platform',
    quarter: 'Q4 2025',
  },

  // ── Q1 2026 (Shipped — growth features) ──
  {
    id: 'pdf-export',
    title: 'Themed PDF Export',
    description: 'Download your profile as a polished, print-ready PDF.',
    detail:
      'Pixel-perfect rendering with React PDF. Your chosen theme and layout are preserved exactly as they appear online. Cached for fast repeat downloads.',
    status: 'done',
    category: 'sharing',
    quarter: 'Q1 2026',
  },
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    description: 'Profile views, PDF downloads, and referral sources.',
    detail:
      'Time range selectors (7/30/90 days), view charts, and referrer tables show when your public profile gets attention.',
    status: 'done',
    category: 'analytics',
    quarter: 'Q1 2026',
  },
  {
    id: 'testimonials',
    title: 'Testimonials & Recommendations',
    description:
      'Request, collect, approve, and display endorsements from colleagues.',
    detail:
      'Generate a shareable token-based link. Recipients submit their recommendation without needing an account. Approve, reject, or reorder from your dashboard.',
    status: 'done',
    category: 'profiles',
    quarter: 'Q1 2026',
  },
  {
    id: 'contact-inbox',
    title: 'Contact Form & Inbox',
    description:
      'A built-in contact form on your profile with a private inbox to manage messages.',
    detail:
      'Visitors can reach out directly from your public profile. Messages land in your inbox with read/replied tracking, honeypot spam protection, and one-click delete.',
    status: 'done',
    category: 'platform',
    quarter: 'Q1 2026',
  },
  {
    id: 'resume-versions',
    title: 'Resume Versions',
    description:
      'Create named snapshots with different section visibility and ordering.',
    detail:
      'Maintain a "Full Profile" and a "One-Pager" version side by side. Set any version as the default for your public profile. Load previous versions to restore settings.',
    status: 'done',
    category: 'editor',
    quarter: 'Q1 2026',
  },

  // ── Q2 2026 (In Progress + Planned) ──
  {
    id: 'project-images',
    title: 'Project Image Uploads',
    description:
      'Add screenshots, tech tags, categories, and featured treatment to project cards.',
    detail:
      'Upload up to three images directly to each project entry. Richer project metadata persists through the editor and appears on public profile cards.',
    status: 'in-progress',
    category: 'editor',
    quarter: 'Q2 2026',
  },
  {
    id: 'profile-directory',
    title: 'Public Profile Directory',
    description: 'Browse and discover other professionals on OpenCV.',
    detail:
      'A searchable directory of public profiles. Filter by role, industry, or skills. Great for networking and discovering how others present themselves.',
    status: 'in-progress',
    category: 'platform',
    quarter: 'Q2 2026',
  },
  {
    id: 'custom-fonts',
    title: 'Custom Font Selection',
    description:
      'Choose from a curated set of fonts to personalize your profile.',
    detail:
      'Pick heading and body fonts from a hand-selected collection. Each pairing is tested to look great across all templates and themes.',
    status: 'planned',
    category: 'profiles',
    quarter: 'Q2 2026',
  },
  {
    id: 'more-templates',
    title: 'Expanded Template Gallery',
    description:
      'New templates including Developer-focused and Creative layouts.',
    detail:
      'A Developer template emphasizing projects, tech stacks, and GitHub activity. A Creative template with large imagery and bold typography. More to come.',
    status: 'planned',
    category: 'profiles',
    quarter: 'Q2 2026',
  },

  // ── Q3 2026 (Planned — growth & polish) ──
  {
    id: 'og-images',
    title: 'Dynamic OG Image Generation',
    description:
      'Auto-generated social preview cards when your profile is shared.',
    detail:
      'Beautiful, branded cards with your name, title, and theme colors. LinkedIn and Twitter posts look professional instead of showing a generic link.',
    status: 'planned',
    category: 'sharing',
    quarter: 'Q3 2026',
  },
  {
    id: 'qr-codes',
    title: 'QR Code for Profiles',
    description:
      'One-click QR code generation for conferences and business cards.',
    detail:
      'Generate a QR code that links to your profile. Download as PNG or SVG for print. Styled to match your chosen theme.',
    status: 'planned',
    category: 'sharing',
    quarter: 'Q3 2026',
  },
  {
    id: 'seo-tools',
    title: 'SEO Optimization Tools',
    description: 'Built-in tools to help your profile rank in search results.',
    detail:
      'Enhanced structured data, sitemap inclusion for public profiles, and keyword suggestions tailored to your industry.',
    status: 'planned',
    category: 'sharing',
    quarter: 'Q3 2026',
  },
  {
    id: 'linkedin-import',
    title: 'Import from LinkedIn',
    description: 'Auto-populate your profile from a LinkedIn export.',
    detail:
      'Upload your LinkedIn data export and we parse it into Experience, Education, Skills, and more. Massively reduces onboarding friction.',
    status: 'planned',
    category: 'editor',
    quarter: 'Q3 2026',
  },
  {
    id: 'more-sections',
    title: 'New Section Types',
    description: 'Languages, Publications, and Interests sections.',
    detail:
      'Frequently requested section types for academics, multilingual professionals, and anyone who wants to show personality beyond work history.',
    status: 'planned',
    category: 'editor',
    quarter: 'Q3 2026',
  },

  // ── Q4 2026 (Planned — aspirational) ──
  {
    id: 'ai-suggestions',
    title: 'AI-Powered Content Suggestions (Backlog)',
    description:
      'Intelligent writing help for descriptions, bios, and bullet points once funding is in place.',
    detail:
      'This is intentionally deferred until the project has sponsorship or a sustainable way to cover model costs for free users.',
    status: 'planned',
    category: 'editor',
    quarter: 'Q4 2026',
  },
  {
    id: 'ai-cover-letter',
    title: 'AI Cover Letter Generator',
    description:
      'Generate a tailored cover letter from a job description and your profile.',
    detail:
      'Paste a job posting and get a personalized cover letter that highlights relevant experience from your profile. Edit, export, and send.',
    status: 'planned',
    category: 'editor',
    quarter: 'Q4 2026',
  },
  {
    id: 'embed-widget',
    title: 'Profile Embed Widget',
    description: 'Embed a mini version of your profile on any website.',
    detail:
      'A lightweight embed for your personal site, blog, or Notion page. Shows your name, title, photo, and key details with a link to the full profile.',
    status: 'planned',
    category: 'sharing',
    quarter: 'Q4 2026',
  },
  {
    id: 'ats-export',
    title: 'ATS-Friendly Export Formats',
    description: 'Export in formats optimized for applicant tracking systems.',
    detail:
      'Plain text, DOCX, and structured JSON exports designed to pass ATS parsing. Keyword optimization suggestions included.',
    status: 'planned',
    category: 'sharing',
    quarter: 'Q4 2026',
  },
  {
    id: 'advanced-analytics',
    title: 'Advanced Analytics',
    description: 'UTM tracking, geographic heatmaps, and weekly email digests.',
    detail:
      'Deep insights into where your views come from, device breakdowns, and exportable reports. Optional weekly summary emails to track your job search.',
    status: 'planned',
    category: 'analytics',
    quarter: 'Q4 2026',
  },
  {
    id: 'multi-language',
    title: 'Multiple Language Support',
    description: 'Maintain your profile in more than one language.',
    detail:
      'Create English and Spanish (or any other language) versions of your profile. Visitors see the right version based on their browser language or a toggle.',
    status: 'planned',
    category: 'platform',
    quarter: 'Q4 2026',
  },
];
