"use client";

import { FadeIn, SlideUp } from "@/components/motion";
import { motion, useReducedMotion } from "framer-motion";
import { UsernameClaim } from "./username-claim";

interface HeroProps {
  onSignIn: () => void;
}

export function Hero({ onSignIn }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(1400px_700px_at_50%_-10%,hsl(var(--primary))/22,transparent),radial-gradient(1000px_500px_at_85%_25%,hsl(var(--secondary))/18,transparent),radial-gradient(900px_600px_at_15%_65%,hsl(var(--accent))/16,transparent),hsl(var(--background))]">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(620px_320px_at_20%_60%,hsla(var(--primary),0.4),transparent_65%)",
            "radial-gradient(620px_320px_at_80%_30%,hsla(var(--secondary),0.38),transparent_65%)",
          ],
        }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "reverse" }}
      />

      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  backgroundPosition: ["0% 0%", "100% 50%", "0% 0%"],
                }
          }
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage:
              "linear-gradient(120deg, hsla(var(--primary),0.18), transparent 55%), linear-gradient(300deg, hsla(var(--secondary),0.14), transparent 60%)",
            backgroundSize: "160% 160%",
          }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.35) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn delay={0.2}>
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Own Your Professional Website in Minutes
          </h1>
        </FadeIn>
        <SlideUp delay={0.4}>
          <p className="mx-auto mb-10 max-w-3xl text-lg text-muted-foreground md:text-2xl">
            Secure your username to showcase your work with a polished online
            CV.
          </p>
        </SlideUp>
        <SlideUp delay={0.6}>
          <UsernameClaim onClaim={onSignIn} />
        </SlideUp>
      </div>
    </section>
  );
}
