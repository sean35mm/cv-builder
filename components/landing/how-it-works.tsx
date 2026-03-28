'use client';

import { Reveal } from '@/components/motion';

const STEPS = [
  {
    number: '01',
    title: 'Claim your username',
    description: 'Reserve a short, memorable URL that belongs to you.',
  },
  {
    number: '02',
    title: 'Build your profile',
    description: 'Add experience, projects, and skills with the guided editor.',
  },
  {
    number: '03',
    title: 'Share everywhere',
    description: 'Drop your link on LinkedIn, in emails, or on your portfolio.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="mb-12 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
        </Reveal>

        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={0.1 + i * 0.08}>
              <div className="relative">
                <span className="block font-serif text-5xl tracking-tight text-muted-foreground/15 sm:text-6xl">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-medium text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
