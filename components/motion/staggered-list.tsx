"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  staggerDelay = 0.1,
}: StaggeredListProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
