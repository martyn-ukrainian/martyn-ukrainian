/**
 * Open-source projects shown on the landing page.
 *
 * Each project gets one media slot. Drop the recording into `public/demos/`
 * and point `media` at it — see `public/demos/README.md` for how to record.
 *
 *   { kind: 'cast',  src: '/demos/termcast.cast' }   asciinema recording
 *   { kind: 'video', src: '/demos/roy.mp4', poster: '/demos/roy.jpg' }
 *   { kind: 'none',  hint: '…' }                     placeholder until recorded
 */

export type ProjectMedia =
  | { kind: 'cast'; src: string; caption?: string }
  | { kind: 'video'; src: string; poster?: string; caption?: string }
  | { kind: 'none'; hint?: string }

export type Project = {
  slug: string
  name: string
  kicker: string
  blurb: string
  stack: string[]
  repo: string
  extraLink?: { label: string; href: string }
  media: ProjectMedia
}

export const projects: Project[] = [
  {
    slug: 'termcast',
    name: 'termcast',
    kicker: 'CLI · Claude Code',
    blurb:
      'Narrated terminal screencasts, written as bash. It performs a scenario instead of recording one — types commands out character-by-character like a person, prints canned output, and speaks the narration aloud (Piper locally, or Cartesia over the API). Write the script once and every take is identical. Ships a Claude Code skill that turns a plain-language topic into a runnable demo.',
    stack: ['Bash', 'Piper', 'Cartesia', 'Claude Code skill'],
    repo: 'https://github.com/martyn-ukrainian/termcast',
    media: {
      kind: 'none',
      hint: 'Video with sound — the spoken narration is the whole point. Record a scenario performing itself.',
    },
  },
  {
    slug: 'voice-agent-skills',
    name: 'voice-agent-skills',
    kicker: 'Voice AI · Claude Code',
    blurb:
      'Claude Code skills that scaffold a voice agent you talk to in the terminal — microphone and speakers directly, no browser and no WebRTC signaling. Deepgram STT → LLM → Cartesia TTS over Pipecat’s LocalAudioTransport, with a push-to-talk trigger word, self-echo muting, and the transcript streamed to stdout so a coding agent can read the conversation live. A second skill generates the structured flows that drive it.',
    stack: ['Python', 'Pipecat', 'Deepgram', 'Cartesia'],
    repo: 'https://github.com/martyn-ukrainian/voice-agent-skills',
    media: {
      kind: 'none',
      hint: 'Video with sound — a short back-and-forth with the agent, transcript scrolling in the terminal.',
    },
  },
  {
    slug: 'roy',
    name: 'roy',
    kicker: 'Realtime · Self-hosted ML',
    blurb:
      'Realtime backend and on-prem ML inference for autonomous systems. A FastAPI service ingests MAVLink telemetry from a simulated drone, runs YOLO detection over the video feed, and has a self-hosted Llama write the situational alerts — all decoupled over MQTT so any subsystem can be swapped. Built to show how much low-latency voice infrastructure and autonomous-systems backends have in common.',
    stack: ['FastAPI', 'MAVLink', 'YOLO', 'Llama', 'MQTT'],
    repo: 'https://github.com/martyn-ukrainian/roy',
    media: {
      kind: 'none',
      hint: 'asciinema cast — MAVLink ingest, YOLO detections and the generated alerts are all text.',
    },
  },
  {
    slug: 'lora-greenhouse',
    name: 'RPLGM',
    kicker: 'IoT · Python',
    blurb:
      'LoRa greenhouse monitoring for where wifi does not reach. ESP32 sensor nodes in C++ report to a Raspberry Pi gateway; a Python/FastAPI service stores and charts the readings and pushes Telegram alerts when one drifts out of range.',
    stack: ['Python', 'FastAPI', 'ESP32 / C++', 'LoRa', 'Raspberry Pi'],
    repo: 'https://github.com/martyn-ukrainian/raspberry-pi-lora-greenhouse-monitoring',
    media: {
      kind: 'none',
      hint: 'Video — the nodes in the greenhouse, then the dashboard and a Telegram alert landing.',
    },
  },
]
