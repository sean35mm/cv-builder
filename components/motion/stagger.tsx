'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, Children } from 'react';

type StaggerProps = {
  children: ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
};

export function Stagger({
  children,
  delay = 0,
  staggerDelay = 0.08,
  className,
}: StaggerProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
