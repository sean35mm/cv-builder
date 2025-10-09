"use client";

import { Button } from "@/components/ui/button";
import { SlideUp } from "@/components/motion";

interface ClosingCTAProps {
  onSignIn: () => void;
}

export function ClosingCTA({ onSignIn }: ClosingCTAProps) {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SlideUp>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Thousands of Professionals
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Over 50% of hiring managers prefer candidates with personal
            websites. Don't miss out on this competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={onSignIn}
              className="text-lg px-8 py-3"
            >
              Start Building Your CV
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-8 py-3 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <a href="/@sample" target="_blank" rel="noopener noreferrer">
                See Examples
              </a>
            </Button>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
