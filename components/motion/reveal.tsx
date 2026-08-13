'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useSyncExternalStore } from 'react';

type RevealProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  offset?: number;
  once?: boolean;
  className?: string;
  as?: keyof typeof motion;
};

const directionMap = {
  up: { y: 1 },
  down: { y: -1 },
  left: { x: 1 },
  right: { x: -1 },
  none: {},
};

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  offset = 16,
  once = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();
  const mounted = useMounted();

  const dir = directionMap[direction];
  const initial = {
    opacity: 0,
    ...('x' in dir ? { x: dir.x * offset } : {}),
    ...('y' in dir ? { y: dir.y * offset } : {}),
  };
  const visible = { opacity: 1, x: 0, y: 0 };
  const shouldReduce = mounted && reduce;

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={shouldReduce ? visible : undefined}
      whileInView={shouldReduce ? undefined : visible}
      viewport={{ once, amount: 0.15 }}
      transition={
        shouldReduce
          ? { duration: 0 }
          : {
              duration,
              delay,
              ease: [0.16, 1, 0.3, 1],
            }
      }
    >
      {children}
    </motion.div>
  );
}
