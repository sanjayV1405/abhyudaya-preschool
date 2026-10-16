import { useEffect, useState } from 'react'
import { useInView } from '../hooks/useInView'

interface CountUpProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number // ms
  className?: string
}

export function CountUp({
  end,
  suffix = '',
  prefix = '',
  duration = 1800,
  className = '',
}: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.2 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    let startTime: number | null = null
    let animationFrameId: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      // Ease out expo: 1 - pow(2, -10 * progress)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.floor(easeOut * end))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [inView, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count}
      {suffix}
    </span>
  )
}
