"use client";

import { SlideUp } from "@/components/motion";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Create",
    description: "Sign up and start building your profile",
  },
  {
    number: "02",
    title: "Customize",
    description: "Add your experience, skills, and personal touch",
  },
  {
    number: "03",
    title: "Publish",
    description: "Get your unique opencv.app/@username URL",
  },
  {
    number: "04",
    title: "Share",
    description: "Send your link to employers and track engagement",
  },
];

export function Workflow() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              From Zero to Professional in 4 Steps
            </h2>
            <p className="text-xl text-muted-foreground">
              Get your online CV ready in under 10 minutes
            </p>
          </div>
        </SlideUp>
        <div className="relative">
          {/* Connecting line */}
          <motion.div
            className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            viewport={{ once: true }}
          />
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 mx-auto bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
