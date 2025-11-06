// hooks/useIsTargetPhoneWidths.ts
import { useEffect, useState } from 'react'

export default function useIsTargetPhoneWidths(tolerance = 12) {
  const targets = [360, 412] // S8+ and Fold5 folded (CSS pixels)
  const [isTarget, setIsTarget] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const widths = [
      window.innerWidth,
      window.outerWidth,
      screen.width,
      document.documentElement?.clientWidth || 0,
    ]
    return targets.some(t => widths.some(w => Math.abs(w - t) <= tolerance))
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const check = () => {
      const wInner = window.innerWidth
      const wOuter = window.outerWidth
      const wScreen = (window.screen && window.screen.width) || 0
      const wDoc = document.documentElement?.clientWidth || 0
      const widths = [wInner, wOuter, wScreen, wDoc]

      // LOG — helpful to inspect what Fold5 is reporting
      // Remove or comment out in production
      // eslint-disable-next-line no-console
      console.log('[useIsTargetPhoneWidths] widths:', {
        inner: wInner,
        outer: wOuter,
        screen: wScreen,
        doc: wDoc,
        devicePixelRatio: window.devicePixelRatio,
      })

      const hit = targets.some(t => widths.some(w => Math.abs(w - t) <= tolerance))
      setIsTarget(hit)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [tolerance])

  return isTarget
}
