'use client';

import { FadeIn, SlideUp } from '@/components/motion';
import { motion, useReducedMotion } from 'framer-motion';
import { UsernameClaim } from './username-claim';

interface HeroProps {
  onSignIn: () => void;
}

export function Hero({ onSignIn }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(1600px 900px at 50% 0%, hsl(var(--primary)/0.32), transparent 70%), radial-gradient(1200px 700px at 90% 35%, hsl(var(--secondary)/0.24), transparent 70%), radial-gradient(1100px 700px at 10% 70%, hsl(var(--accent)/0.22), transparent 70%), radial-gradient(800px 500px at 50% 50%, hsl(var(--primary)/0.06), transparent 70%), hsl(var(--background))',
      }}
    >
      <motion.div
        className="absolute inset-0"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                background: [
                  'radial-gradient(620px_320px_at_20%_60%,hsla(var(--primary),0.28),transparent_65%)',
                  'radial-gradient(620px_320px_at_80%_30%,hsla(var(--accent),0.24),transparent_65%)',
                ],
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 20, repeat: Infinity, repeatType: 'reverse' }
        }
      />

      <div className="pointer-events-none absolute inset-0">
        {/* Slow-moving linear gradients */}
        <motion.div
          className="absolute inset-0 opacity-18"
          animate={
            shouldReduceMotion
              ? undefined
              : { backgroundPosition: ['0% 0%', '100% 50%', '0% 0%'] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            backgroundImage:
              'linear-gradient(120deg, hsla(var(--primary),0.14), transparent 55%), linear-gradient(300deg, hsla(var(--secondary),0.10), transparent 60%)',
            backgroundSize: '160% 160%',
          }}
        />

        {/* Aurora ribbons (soft teal/green) */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            maskImage:
              'radial-gradient(60% 60% at 50% 50%, black 55%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(60% 60% at 50% 50%, black 55%, transparent 100%)',
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : { backgroundPosition: ['0% 0%', '100% 50%', '0% 0%'] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 28, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <div
            className="absolute left-[-10%] top-[15%] h-[40vh] w-[80vw] blur-3xl opacity-22"
            style={{
              background:
                'linear-gradient(120deg, hsla(var(--primary),0.28), hsla(var(--accent),0.24))',
            }}
          />
          <div
            className="absolute right-[-10%] bottom-[10%] h-[35vh] w-[70vw] blur-3xl opacity-18"
            style={{
              background:
                'linear-gradient(300deg, hsla(var(--accent),0.22), hsla(var(--primary),0.20))',
            }}
          />
        </motion.div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-18"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, hsla(var(--foreground),0.25) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120%_120%_at_50%_50%, rgba(0,0,0,0)_65%, rgba(0,0,0,0.02) 100%)',
          }}
        />

        {/* Ultra subtle grain overlay */}
        <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.02]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <filter id="noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="2"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn delay={0.2}>
          <h1 className="!m-0 !mb-4 text-4xl tracking-tight text-foreground md:!text-8xl font-serif">
            Own Your Little Piece of the Internet
          </h1>
        </FadeIn>
        <SlideUp delay={0.6}>
          <UsernameClaim onClaim={onSignIn} />
        </SlideUp>
        <SlideUp delay={0.4}>
          <p className="mx-auto mb-10 max-w-3xl text-lg text-muted-foreground md:text-2xl">
            Over 50% of hiring managers prefer candidates with personal
            websites. Claim your username and launch a polished CV online in
            minutes for free.
          </p>
        </SlideUp>
      </div>
    </section>
  );
}
