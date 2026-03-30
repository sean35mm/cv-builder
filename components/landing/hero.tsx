'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Reveal } from '@/components/motion';
import { UsernameClaim } from './username-claim';

type HeroProps = {
  onSignIn: () => void;
};

const themes = [
  {
    name: 'Sage',
    slug: 'sage',
    persona: {
      fullName: 'Jane Doe',
      title: 'Product Designer',
      location: 'San Francisco',
      experience: [
        {
          role: 'Senior Designer',
          company: 'Stripe',
          period: '2022 – Present',
        },
        { role: 'Product Designer', company: 'Figma', period: '2019 – 2022' },
      ],
      skills: ['Design Systems', 'Figma', 'Prototyping', 'User Research'],
      username: 'janedoe',
    },
  },
  {
    name: 'Ocean',
    slug: 'ocean',
    persona: {
      fullName: 'Marcus Chen',
      title: 'Software Engineer',
      location: 'Seattle',
      experience: [
        { role: 'Staff Engineer', company: 'Vercel', period: '2023 – Present' },
        { role: 'Senior SWE', company: 'Shopify', period: '2020 – 2023' },
      ],
      skills: ['TypeScript', 'React', 'System Design', 'GraphQL'],
      username: 'marcusc',
    },
  },
  {
    name: 'Rose',
    slug: 'rose',
    persona: {
      fullName: 'Priya Sharma',
      title: 'Data Scientist',
      location: 'New York',
      experience: [
        {
          role: 'Lead Data Scientist',
          company: 'Spotify',
          period: '2021 – Present',
        },
        { role: 'ML Engineer', company: 'Meta', period: '2018 – 2021' },
      ],
      skills: ['Python', 'PyTorch', 'A/B Testing', 'SQL'],
      username: 'priyasharma',
    },
  },
  {
    name: 'Slate',
    slug: 'slate',
    persona: {
      fullName: 'Alex Rivera',
      title: 'Engineering Manager',
      location: 'Austin',
      experience: [
        { role: 'Eng Manager', company: 'Linear', period: '2022 – Present' },
        { role: 'Tech Lead', company: 'Notion', period: '2019 – 2022' },
      ],
      skills: ['Team Building', 'Architecture', 'Go', 'Postgres'],
      username: 'arivera',
    },
  },
  {
    name: 'Teal',
    slug: 'teal',
    persona: {
      fullName: 'Lena Kowalski',
      title: 'UX Researcher',
      location: 'Berlin',
      experience: [
        {
          role: 'Senior Researcher',
          company: 'Wise',
          period: '2021 – Present',
        },
        { role: 'UX Researcher', company: 'Klarna', period: '2018 – 2021' },
      ],
      skills: ['Usability Testing', 'Surveys', 'Analytics', 'Workshops'],
      username: 'lenak',
    },
  },
  {
    name: 'Amber',
    slug: 'amber',
    persona: {
      fullName: 'Omar Farouk',
      title: 'DevOps Engineer',
      location: 'Toronto',
      experience: [
        {
          role: 'Platform Engineer',
          company: 'Datadog',
          period: '2022 – Present',
        },
        { role: 'SRE', company: 'Cloudflare', period: '2019 – 2022' },
      ],
      skills: ['Kubernetes', 'Terraform', 'AWS', 'Observability'],
      username: 'ofarouk',
    },
  },
] as const;

type Persona = (typeof themes)[number]['persona'];

function ProfileMock({ theme, persona }: { theme: string; persona: Persona }) {
  return (
    <div
      className={`theme-${theme} rounded-lg border bg-card p-6 text-card-foreground h-full`}
    >
      <div className="mb-5">
        <div className="text-2xl font-serif font-semibold text-foreground">
          {persona.fullName}
        </div>
        <div className="text-sm text-muted-foreground mt-0.5">
          {persona.title} &middot; {persona.location}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Experience
          </div>
          <div className="space-y-2.5">
            {persona.experience.map((exp) => (
              <div key={exp.company}>
                <div className="text-sm font-medium text-foreground">
                  {exp.role}
                </div>
                <div className="text-xs text-muted-foreground">
                  {exp.company} &middot; {exp.period}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {persona.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-[11px] text-muted-foreground font-mono">
          opencv.app/@{persona.username}
        </span>
      </div>
    </div>
  );
}

export function Hero({ onSignIn }: HeroProps) {
  const [activeTheme, setActiveTheme] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    let interval: ReturnType<typeof setInterval>;

    const start = () => {
      interval = setInterval(() => {
        setActiveTheme((i) => (i + 1) % themes.length);
      }, 3000);
    };

    const handleVisibility = () => {
      clearInterval(interval);
      if (!document.hidden) start();
    };

    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [reduce]);

  return (
    <section className="relative px-4 pt-32 pb-32 sm:px-6 lg:px-8">
      {/* Subtle dot grid texture */}
      <div
        className="dot-grid-pattern pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 15%, black 50%, transparent 85%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 15%, black 50%, transparent 85%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_380px] lg:gap-20">
        {/* Left: copy */}
        <div>
          <Reveal delay={0.05}>
            <span className="inline-block rounded-full border px-3 py-1 text-[11px] font-mono tracking-widest text-muted-foreground mb-6">
              BETA
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-4xl font-serif tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
              Your career,
              <br />
              beautifully presented.
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
              Build a polished, shareable CV in minutes. Claim your personal URL
              and make a lasting first impression.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-8">
              <UsernameClaim onClaim={onSignIn} />
            </div>
          </Reveal>
        </div>

        {/* Right: rotating theme preview */}
        <Reveal delay={0.25} direction="right" className="hidden lg:block">
          <div className="relative">
            {/* Theme selector dots */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              {themes.map((t, i) => (
                <button
                  key={t.slug}
                  onClick={() => setActiveTheme(i)}
                  aria-label={`Preview ${t.name} theme`}
                  className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                    i === activeTheme
                      ? 'scale-125 bg-foreground border-foreground'
                      : 'bg-muted-foreground/20 border-muted-foreground/30 hover:bg-muted-foreground/40'
                  }`}
                />
              ))}
            </div>

            {/* Card */}
            <div className="relative h-[420px] w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={themes[activeTheme].slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <ProfileMock
                    theme={themes[activeTheme].slug}
                    persona={themes[activeTheme].persona}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs text-muted-foreground">
                {themes[activeTheme].name} theme
              </span>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Gradient bridge into features section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40"
        style={{
          background:
            'linear-gradient(to bottom, transparent, hsl(var(--card)))',
        }}
      />
    </section>
  );
}
