'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Edit, Palette, Share2 } from 'lucide-react';

const features = [
  {
    icon: Edit,
    title: 'Guided Editor',
    description:
      'Step-by-step interface to build your CV with ease. No design skills required.',
    badge: 'Easy to Use',
  },
  {
    icon: Palette,
    title: 'Customizable Templates',
    description:
      'Choose from professional templates and customize colors, fonts, and layouts.',
    badge: 'Flexible',
  },
  {
    icon: Share2,
    title: 'Share & Track',
    description:
      'Get a unique URL like opencv.app/@username and track views with built-in analytics.',
    badge: 'Professional',
  },
];

export function Features() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24">
      {/* soft background separators */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--primary),0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-10 right-1/3 h-60 w-[30rem] rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--accent),0.16),transparent_70%)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.35) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Everything You Need to Stand Out
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a polished presence that highlights your strengths and work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={reduce ? undefined : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={reduce ? undefined : { once: true, amount: 0.2 }}
              transition={
                reduce ? undefined : { duration: 0.45, delay: idx * 0.05 }
              }
              className="group"
            >
              {/* gradient border wrapper */}
              <div className="relative rounded-2xl p-[1px] bg-[linear-gradient(135deg,hsla(var(--primary),0.35),hsla(var(--accent),0.35)_50%,transparent)]">
                <div className="rounded-2xl bg-card/65 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_-20px_rgba(2,6,23,0.4)] transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-white/15 grid place-items-center">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-0.5 text-xs"
                        >
                          {feature.badge}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <div className="p-4 flex items-center justify-between text-xs text-muted-foreground/80">
                    <span>Refined, fast, intuitive</span>
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
