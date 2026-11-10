import React from 'react'
import { useInView } from '../hooks/useInView'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  delay?: number // ms
  direction?: 'up' | 'down' | 'scale' | 'fade'
  duration?: number // ms
}

export function ScrollReveal({
  children,
  className = '',
  style = {},
  delay = 0,
  direction = 'up',
  duration = 480,
}: ScrollRevealProps) {
  // Trigger slightly sooner as content approaches the viewport
  const { ref, inView } = useInView<HTMLDivElement>({
    threshold: 0.05,
    rootMargin: '0px 0px 40px 0px',
  })

  // Slightly reduce travel distance from 24px to 16px so motion is smooth, natural, and arrives sooner
  let initialTransform = 'translateY(16px)'
  if (direction === 'down') initialTransform = 'translateY(-16px)'
  else if (direction === 'scale') initialTransform = 'scale(0.97)'
  else if (direction === 'fade') initialTransform = 'none'

  // Slightly compress caller-provided delay (~25% reduction) so staggered cards appear sooner
  const adjustedDelay = Math.round(delay * 0.75)

  return (
    <div
      ref={ref}
      className={`transition-all ${className}`}
      style={{
        ...style,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : initialTransform,
        transitionDuration: `${duration}ms`,
        transitionDelay: `${adjustedDelay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  )
}
