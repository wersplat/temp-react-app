import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type AnimateInProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  yOffset?: number;
  xOffset?: number;
};

// Animation variants for different directions
const getDirectionVariants = (direction: 'up' | 'down' | 'left' | 'right', yOffset: number, xOffset: number) => {
  const baseVariants: Variants = {
    hidden: { opacity: 0, y: direction === 'up' ? yOffset : direction === 'down' ? -yOffset : 0, x: direction === 'left' ? xOffset : direction === 'right' ? -xOffset : 0 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
      },
    },
  };
  return baseVariants;
};

export const AnimateIn = ({
  children,
  delay = 0.1,
  duration = 0.5,
  className = '',
  direction = 'up',
  yOffset = 20,
  xOffset = 0,
}: AnimateInProps) => {
  // Direction variants are now handled within getDirectionVariants

  const variants = getDirectionVariants(direction, yOffset, xOffset);
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      custom={{ delay, yOffset, xOffset }}
      transition={{
        delay,
        duration,
        ease: [0.2, 0.6, 0.4, 1] as const,
      }}
      viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  staggerChildren?: number;
  delayChildren?: number;
};

export const StaggerContainer = ({
  children,
  className = '',
  staggerChildren = 0.1,
  delayChildren = 0.1,
}: StaggerContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
      variants={{
        visible: {
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

type StaggerChildProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  yOffset?: number;
  xOffset?: number;
};

export const StaggerChild = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  direction = 'up',
  yOffset = 20,
  xOffset = 0,
}: StaggerChildProps) => {
  const directionMap = {
    up: { y: yOffset, x: 0 },
    down: { y: -yOffset, x: 0 },
    left: { y: 0, x: xOffset },
    right: { y: 0, x: -xOffset },
  };

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...directionMap[direction],
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        delay,
        duration,
        ease: [0.2, 0.6, 0.4, 1] as const,
      },
    },
  };

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
};
