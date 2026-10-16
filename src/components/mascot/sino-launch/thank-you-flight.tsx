'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { pickLoopSource, readLoopEnv } from '@/components/motion/sino-loop-source'
import { canLaunch, readLaunchEnvironment } from './launch-bus'
import styles from './sino-launch.module.css'

export function ThankYouFlight({ children }: { children: ReactNode }) {
  const [src, setSrc] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    let pending: string | null = null
    try {
      pending = sessionStorage.getItem('sineva:contact-handoff')
      sessionStorage.removeItem('sineva:contact-handoff')
    } catch {
      return
    }
    if (!pending || Date.now() - Number(pending) > 60000 || !canLaunch(readLaunchEnvironment()))
      return
    const env = readLoopEnv()
    const kind = env && pickLoopSource(env)
    if (!kind) return
    // This request is allowed only after a recent form handoff, never on a direct visit or refresh.
    const timer = setTimeout(() => {
      setSrc(null)
      setPlaying(false)
    }, 1500)
    // A deferred state update avoids changing the server-rendered layout during hydration.
    queueMicrotask(() => setSrc(`/mascot/launch/sino-flyby-mail.${kind}`))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const stop = () => {
      if (motion.matches || document.hidden) {
        setSrc(null)
        setPlaying(false)
      }
    }
    motion.addEventListener('change', stop)
    document.addEventListener('visibilitychange', stop)
    const video = videoRef.current
    return () => {
      clearTimeout(timer)
      motion.removeEventListener('change', stop)
      document.removeEventListener('visibilitychange', stop)
      video?.pause()
      video?.removeAttribute('src')
      video?.load()
    }
  }, [])
  return (
    <>
      <div className="size-full" style={{ opacity: playing ? 0 : 1 }}>
        {children}
      </div>
      {src ? (
        <div className={styles.overlay} aria-hidden="true">
          <video
            ref={videoRef}
            src={src}
            muted
            playsInline
            autoPlay
            tabIndex={-1}
            className={styles.flyby}
            onPlaying={() => setPlaying(true)}
            onEnded={() => {
              setSrc(null)
              setPlaying(false)
            }}
            onError={() => {
              setSrc(null)
              setPlaying(false)
            }}
          />
        </div>
      ) : null}
    </>
  )
}
