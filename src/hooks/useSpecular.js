import { useEffect, useRef } from 'react'

// Drives the cursor-following highlight on `.glass-specular` elements by
// setting CSS custom props (--mx, --my) directly on the ref'd node.
// We do this in JS (not CSS-only) because we need element-relative coords,
// and we throttle via rAF so it stays at 120fps even with rapid mousemoves.
export function useSpecular() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    let pendingX = 50
    let pendingY = 0

    const apply = () => {
      frame = 0
      el.style.setProperty('--mx', `${pendingX}%`)
      el.style.setProperty('--my', `${pendingY}%`)
    }

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      pendingX = ((e.clientX - r.left) / r.width) * 100
      pendingY = ((e.clientY - r.top) / r.height) * 100
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const onLeave = () => {
      pendingX = 50
      pendingY = 0
      if (!frame) frame = requestAnimationFrame(apply)
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}
