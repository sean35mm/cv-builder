'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { motion, useReducedMotion } from 'framer-motion';

// Mock profile screenshots - in real app, these would be actual images
const profiles = [
  { username: 'johndoe', description: 'Software Engineer' },
  { username: 'sarahsmith', description: 'UX Designer' },
  { username: 'mikejohnson', description: 'Product Manager' },
  { username: 'emilychen', description: 'Data Scientist' },
];

export function Gallery() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-6 left-1/3 h-60 w-[38rem] rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--primary),0.16),transparent_70%)] blur-2xl" />
        <div className="absolute bottom-0 right-1/3 h-60 w-[30rem] translate-y-1/3 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--accent),0.16),transparent_70%)] blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            See What You Can Create
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Professional profiles that make an impact
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Carousel className="w-full">
            <CarouselContent>
              {profiles.map((profile, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={reduce ? undefined : { opacity: 0, y: 12 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={reduce ? undefined : { once: true, amount: 0.2 }}
                    transition={reduce ? undefined : { duration: 0.45 }}
                    className="p-2"
                  >
                    <div className="group [perspective:1200px]">
                      <div className="relative rounded-2xl p-[1px] bg-[linear-gradient(135deg,hsla(var(--primary),0.35),hsla(var(--accent),0.35)_50%,transparent)]">
                        <div className="relative rounded-2xl bg-card/65 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.55)] transition-transform duration-500 transform-gpu group-hover:-rotate-1 group-hover:translate-y-[-2px]">
                          {/* device frame top bar */}
                          <div className="flex items-center gap-1.5 px-4 py-3">
                            <span className="h-2 w-2 rounded-full bg-red-400/70" />
                            <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
                            <span className="h-2 w-2 rounded-full bg-green-400/70" />
                            <div className="ml-auto h-2 w-16 rounded bg-muted/60" />
                          </div>
                          {/* mock content area */}
                          <div className="px-4 pb-5">
                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 via-accent/15 to-transparent/10 ring-1 ring-white/10" />
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">
                                  @{profile.username}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {profile.description}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground/80">
                                Preview
                              </span>
                            </div>
                          </div>
                          {/* subtle reflection */}
                          <div className="pointer-events-none absolute inset-x-6 -bottom-3 h-8 rounded-full bg-gradient-to-t from-foreground/5 to-transparent blur" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
