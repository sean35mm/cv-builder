'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion, useReducedMotion } from 'framer-motion';

const faqs = [
  {
    question: 'How does publishing work?',
    answer:
      "Once you complete your profile, you'll get a unique URL like opencv.app/@yourusername that you can share anywhere. Your profile will be publicly accessible and optimized for mobile devices.",
  },
  {
    question: 'Can I customize the design?',
    answer:
      'Yes! Choose from professional templates and customize colors, fonts, layouts, and content to match your personal brand and industry.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We use industry-standard encryption and only collect the information you provide. Your data is never sold or shared with third parties.',
  },
  {
    question: 'Can I update my profile later?',
    answer:
      'Yes, you can edit and update your profile anytime. Changes are reflected immediately on your public page.',
  },
];

export function FAQ() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-10 left-1/2 h-60 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,hsla(var(--primary),0.14),transparent_70%)] blur-2xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Everything you need to know about getting started
          </p>
        </div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={reduce ? undefined : { once: true, amount: 0.2 }}
          transition={reduce ? undefined : { duration: 0.45 }}
          className="rounded-2xl p-[1px] bg-[linear-gradient(135deg,hsla(var(--primary),0.35),hsla(var(--accent),0.35)_50%,transparent)]"
        >
          <div className="rounded-2xl bg-card/65 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.55)]">
            <Accordion
              type="single"
              collapsible
              className="w-full divide-y divide-border/60"
            >
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="px-4 md:px-6"
                >
                  <AccordionTrigger className="py-5 text-left text-base md:text-lg hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
