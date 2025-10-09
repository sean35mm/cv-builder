"use client";

import { Button } from "@/components/ui/button";
import { FadeIn, SlideUp } from "@/components/motion";
import { motion } from "framer-motion";

interface HeroProps {
  onSignIn: () => void;
}

export function Hero({ onSignIn }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      {/* Background decoration */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, hsl(var(--primary)) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, hsl(var(--primary)) 0%, transparent 50%)",
            "radial-gradient(circle at 40% 80%, hsl(var(--primary)) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn delay={0.2}>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Launch Your Personal Website in Minutes
          </h1>
        </FadeIn>
        <SlideUp delay={0.4}>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Over 50% of hiring managers are more impressed by candidates with
            personal websites. Create a polished online CV that showcases your
            professionalism and tech savvy.
          </p>
        </SlideUp>
        <SlideUp delay={0.6}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={onSignIn} className="text-lg px-8 py-3">
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="text-lg px-8 py-3"
            >
              <a href="/@sample" target="_blank" rel="noopener noreferrer">
                View Example
              </a>
            </Button>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
