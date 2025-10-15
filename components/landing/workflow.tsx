'use client';

import { motion, useReducedMotion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Create',
    description: 'Sign up and start building your profile',
  },
  {
    number: '02',
    title: 'Customize',
    description: 'Add your experience, skills, and personal touch',
  },
  {
    number: '03',
    title: 'Publish',
    description: 'Get your unique opencv.app/@username URL',
  },
  {
    number: '04',
    title: 'Share',
    description: 'Send your link to employers and track engagement',
  },
];

export function Workflow() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-56 w-[36rem] -translate-y-1/3 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--primary),0.18),transparent_70%)] blur-2xl" />
        <div className="absolute bottom-0 right-1/4 h-56 w-[32rem] translate-y-1/4 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--accent),0.18),transparent_70%)] blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            From Zero to Professional in 4 Steps
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Get your online CV ready in under 10 minutes
          </p>
        </div>

        {/* timeline wrapper */}
        <div className="relative">
          {/* horizontal line on md+ */}
          <motion.div
            className="hidden md:block absolute top-14 left-0 right-0 h-px bg-gradient-to-r from-primary/20 via-primary to-primary/20"
            initial={reduce ? undefined : { scaleX: 0 }}
            whileInView={reduce ? undefined : { scaleX: 1 }}
            transition={reduce ? undefined : { duration: 0.9 }}
            viewport={reduce ? undefined : { once: true }}
            style={{ transformOrigin: 'left' }}
          />

          {/* vertical line on mobile */}
          <motion.div
            className="md:hidden absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary to-primary/20"
            initial={reduce ? undefined : { scaleY: 0 }}
            whileInView={reduce ? undefined : { scaleY: 1 }}
            transition={reduce ? undefined : { duration: 0.9 }}
            viewport={reduce ? undefined : { once: true }}
            style={{ transformOrigin: 'top' }}
          />

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={reduce ? undefined : { opacity: 0, y: 14 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={reduce ? undefined : { once: true, amount: 0.2 }}
                transition={
                  reduce ? undefined : { duration: 0.45, delay: idx * 0.06 }
                }
                className="relative"
              >
                {/* connector dots */}
                <div className="hidden md:block absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 ring-2 ring-white/20" />

                <div className="flex md:block gap-4">
                  <div className="relative md:mb-4 md:mx-auto">
                    <div className="w-14 h-14 grid place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold shadow-lg shadow-primary/20">
                      {step.number}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="rounded-2xl p-[1px] bg-[linear-gradient(135deg,hsla(var(--primary),0.35),hsla(var(--accent),0.35)_50%,transparent)]">
                      <div className="rounded-2xl bg-card/65 backdrop-blur-xl border border-white/10 p-5 shadow-[0_10px_40px_-20px_rgba(2,6,23,0.4)]">
                        <h3 className="text-lg font-semibold mb-1.5">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-6">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
