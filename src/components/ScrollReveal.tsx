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
  duration = 600,
}: ScrollRevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 })

  let initialTransform = 'translateY(24px)'
  if (direction === 'down') initialTransform = 'translateY(-24px)'
  else if (direction === 'scale') initialTransform = 'scale(0.95)'
  else if (direction === 'fade') initialTransform = 'none'

  return (
    <div
      ref={ref}
      className={`transition-all ${className}`}
      style={{
        ...style,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : initialTransform,
        filter: inView ? 'blur(0px)' : 'blur(4px)',
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'transform, opacity, filter',
      }}
    >
      {children}
    </div>
  )
}
