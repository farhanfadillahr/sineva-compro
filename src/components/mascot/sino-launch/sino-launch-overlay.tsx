'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { pickLoopSource, readLoopEnv } from '@/components/motion/sino-loop-source'
import {
  createLaunchBus,
  isPlainLaunchClick,
  readLaunchEnvironment,
  type LaunchKind,
  type LaunchRequest,
} from './launch-bus'
import styles from './sino-launch.module.css'

const SOURCES = {
  webm: '/mascot/launch/sino-launch.webm',
  mov: '/mascot/launch/sino-launch.mov',
}
const kindOf = (target: EventTarget | null): { kind: LaunchKind; element: HTMLElement } | null => {
  if (!(target instanceof Element)) return null
  const element = target.closest<HTMLElement>('[data-sino-launch]')
  if (!element || element.getAttribute('aria-disabled') === 'true') return null
  const kind = element.dataset.sinoLaunch
  return kind === 'booking' || kind === 'whatsapp' || kind === 'waitlist' ? { kind, element } : null
}

/** Persistent in the public layout. No media request until an eligible CTA is hovered or focused. */
export function SinoLaunchOverlay() {
  const [launch, setLaunch] = useState<(LaunchRequest & { src: string; id: number }) | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    let storage: Storage | undefined
    try {
      storage = sessionStorage
    } catch {
      /* Use memory caps. */
    }
    const bus = createLaunchBus({ environment: readLaunchEnvironment, storage })
    let warm: HTMLVideoElement | null = null
    let source: string | null = null
    let expire: ReturnType<typeof setTimeout> | null = null
    function release() {
      if (expire) clearTimeout(expire)
      expire = null
      warm?.pause()
      warm?.removeAttribute('src')
      warm?.load()
      warm = null
      source = null
    }
    function preload(event: Event) {
      const action = kindOf(event.target)
      if (!action || !bus.eligible(action.kind) || warm) return
      const env = readLoopEnv()
      const kind = env && pickLoopSource(env)
      if (!kind) return
      source = SOURCES[kind]
      warm = document.createElement('video')
      warm.muted = true
      warm.playsInline = true
      warm.preload = 'auto'
      warm.src = source
      warm.load()
      expire = setTimeout(release, 30000)
    }
    const unsubscribe = bus.subscribe((request) => {
      if (source) setLaunch({ ...request, src: source, id: performance.now() })
      if (expire) clearTimeout(expire)
      expire = setTimeout(release, 1500)
    })
    function click(event: MouseEvent) {
      const action = kindOf(event.target)
      if (!action || !isPlainLaunchClick(event) || action.element.getAttribute('type') === 'submit')
        return
      // No await, preventDefault or router call: native navigation proceeds on this same event.
      bus.requestLaunch({
        kind: action.kind,
        originRect: action.element.getBoundingClientRect(),
        ready: Boolean(warm && warm.readyState >= 3),
      })
    }
    function submitted(event: Event) {
      const detail = (
        event as CustomEvent<{ kind: LaunchKind; originRect: LaunchRequest['originRect'] }>
      ).detail
      bus.requestLaunch({ ...detail, ready: Boolean(warm && warm.readyState >= 3) })
    }
    function visibility() {
      if (document.hidden) {
        release()
        setLaunch(null)
      }
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    function reduced() {
      if (motion.matches) {
        release()
        setLaunch(null)
      }
    }
    document.addEventListener('pointerover', preload, { passive: true })
    document.addEventListener('focusin', preload)
    document.addEventListener('click', click)
    document.addEventListener('sineva:launch', submitted)
    document.addEventListener('visibilitychange', visibility)
    motion.addEventListener('change', reduced)
    return () => {
      unsubscribe()
      release()
      document.removeEventListener('pointerover', preload)
      document.removeEventListener('focusin', preload)
      document.removeEventListener('click', click)
      document.removeEventListener('sineva:launch', submitted)
      document.removeEventListener('visibilitychange', visibility)
      motion.removeEventListener('change', reduced)
    }
  }, [])

  useEffect(() => {
    if (!launch) return
    const video = videoRef.current
    const timer = setTimeout(() => setLaunch(null), 1500)
    void video?.play()?.catch(() => setLaunch(null))
    return () => {
      clearTimeout(timer)
      video?.pause()
      video?.removeAttribute('src')
      video?.load()
    }
  }, [launch])

  if (!launch) return null
  return (
    <div aria-hidden="true" data-slot="sino-launch-overlay" className={styles.overlay}>
      <video
        key={launch.id}
        ref={videoRef}
        className={styles.launch}
        src={launch.src}
        muted
        playsInline
        autoPlay
        tabIndex={-1}
        style={
          {
            '--launch-x': `${Math.max(0, launch.originRect.left + launch.originRect.width / 2 - 90)}px`,
            '--launch-y': `${Math.max(0, launch.originRect.top - 100)}px`,
          } as CSSProperties
        }
        onEnded={() => setLaunch(null)}
        onError={() => setLaunch(null)}
      />
    </div>
  )
}
