import React, { useEffect, useRef, useState } from 'react'
import { projects, type Project, type ProjectMedia } from '../lib/projects'

/* ── Terminal-window chrome, shared by every media kind so the layout is
      identical whether a demo exists yet or not. ──────────────────────────── */
function Frame({
  label,
  fluid,
  children,
}: {
  label: string
  /** Let the content set its own height instead of holding a 16:10 box. */
  fluid?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="pv-frame">
      <div className="pv-bar">
        <i /> <i /> <i />
        <span>{label}</span>
      </div>
      <div className={fluid ? 'pv-body pv-body-fluid' : 'pv-body'}>{children}</div>
    </div>
  )
}

function PlayOverlay({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button className="pv-play" onClick={onClick} aria-label={text}>
      <span className="pv-play-icon" aria-hidden>
        ▶
      </span>
      <span>{text}</span>
    </button>
  )
}

/** asciinema recording — the player bundle is only fetched once you press play. */
function CastPlayer({ src, label }: { src: string; label: string }) {
  const [playing, setPlaying] = useState(false)
  const mount = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!playing || !mount.current) return
    let disposed = false
    let player: { dispose: () => void } | undefined

    import('asciinema-player').then((mod) => {
      if (disposed || !mount.current) return
      // fit: 'width' lets the cast fill the frame and pick its own height —
      // 'both' would letterbox any recording whose shape is not 16:10.
      player = mod.create(src, mount.current, {
        autoPlay: true,
        fit: 'width',
        idleTimeLimit: 2,
        theme: 'asciinema',
      })
    })

    return () => {
      disposed = true
      player?.dispose()
    }
  }, [playing, src])

  return (
    <Frame label={label} fluid={playing}>
      {playing ? (
        <div className="pv-cast" ref={mount} />
      ) : (
        <>
          <FauxTerminal lines={['$ ', '']} />
          <PlayOverlay text="Play demo" onClick={() => setPlaying(true)} />
        </>
      )}
    </Frame>
  )
}

/** MP4/WebM — `preload="none"`, so nothing downloads until it is played. */
function VideoPlayer({
  src,
  poster,
  label,
}: {
  src: string
  poster?: string
  label: string
}) {
  const [playing, setPlaying] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  return (
    <Frame label={label}>
      <video
        ref={video}
        className="pv-video"
        src={src}
        poster={poster}
        preload="none"
        controls={playing}
        playsInline
        onPlay={() => setPlaying(true)}
      />
      {!playing && (
        <PlayOverlay
          text="Play demo"
          onClick={() => {
            setPlaying(true)
            void video.current?.play()
          }}
        />
      )}
    </Frame>
  )
}

/** Static terminal-ish backdrop, also used as the not-yet-recorded state. */
function FauxTerminal({ lines }: { lines: string[] }) {
  return (
    <pre className="pv-faux" aria-hidden>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i === lines.length - 1 && <b className="pv-caret" />}
          {'\n'}
        </span>
      ))}
    </pre>
  )
}

function Placeholder({ hint, label }: { hint?: string; label: string }) {
  return (
    <Frame label={label}>
      <FauxTerminal lines={['$ # demo recording pending', '']} />
      <div className="pv-pending">
        <strong>Demo coming soon</strong>
        {hint && <span>{hint}</span>}
      </div>
    </Frame>
  )
}

function Media({ media, label }: { media: ProjectMedia; label: string }) {
  if (media.kind === 'cast') return <CastPlayer src={media.src} label={label} />
  if (media.kind === 'video')
    return <VideoPlayer src={media.src} poster={media.poster} label={label} />
  return <Placeholder hint={media.hint} label={label} />
}

function ProjectRow({ project }: { project: Project }) {
  const caption = 'caption' in project.media ? project.media.caption : undefined

  return (
    <article className="project">
      <div className="project-media">
        <Media media={project.media} label={project.name} />
        {caption && <p className="project-caption">{caption}</p>}
      </div>

      <div className="project-copy">
        <span className="card-kicker">{project.kicker}</span>
        <h3>{project.name}</h3>
        <p>{project.blurb}</p>
        <ul className="chips">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <div className="project-links">
          <a href={project.repo} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          {project.extraLink && (
            <a href={project.extraLink.href} target="_blank" rel="noreferrer">
              {project.extraLink.label} ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProjectShowcase() {
  return (
    <div className="projects">
      {projects.map((project) => (
        <ProjectRow key={project.slug} project={project} />
      ))}
      <p className="projects-note">
        Every terminal demo here is performed by{' '}
        <a
          href="https://github.com/martyn-ukrainian/termcast"
          target="_blank"
          rel="noreferrer"
        >
          termcast
        </a>{' '}
        — one of the projects above.
      </p>
    </div>
  )
}
