'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export function SlideUp({ children, delay = 0, duration = 0.6 }: SlideUpProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
}
