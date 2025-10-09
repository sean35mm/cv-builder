"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SlideUp } from "@/components/motion";

const faqs = [
  {
    question: "How does publishing work?",
    answer:
      "Once you complete your profile, you'll get a unique URL like opencv.app/@yourusername that you can share anywhere. Your profile will be publicly accessible and optimized for mobile devices.",
  },
  {
    question: "Can I customize the design?",
    answer:
      "Yes! Choose from professional templates and customize colors, fonts, layouts, and content to match your personal brand and industry.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and only collect the information you provide. Your data is never sold or shared with third parties.",
  },
  {
    question: "Can I update my profile later?",
    answer:
      "Yes, you can edit and update your profile anytime. Changes are reflected immediately on your public page.",
  },
];

export function FAQ() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about getting started
            </p>
          </div>
        </SlideUp>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
