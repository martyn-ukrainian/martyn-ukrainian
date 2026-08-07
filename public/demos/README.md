# Project demos

Recordings shown by `<ProjectShowcase />` on the landing page. Drop a file in
here, then point the matching entry in `lib/projects.ts` at it — nothing else
to wire up.

```ts
media: { kind: 'cast',  src: '/demos/roy.cast' }
media: { kind: 'video', src: '/demos/termcast.mp4', poster: '/demos/termcast.jpg' }
media: { kind: 'none',  hint: '…' }   // placeholder, shown until recorded
```

Nothing is downloaded until a visitor presses play — the asciinema player
bundle and every video use lazy loading.

## Which format for which project

| Project | Format | Why |
| --- | --- | --- |
| termcast | video + audio | The spoken narration is the product |
| voice-agent-skills | video + audio | You have to hear the agent answer |
| roy | asciinema cast | Telemetry, detections and alerts are all text |
| RPLGM | video | The hardware in the greenhouse is the story |

## Recording an asciinema cast

```bash
brew install asciinema        # or: pipx install asciinema
asciinema rec public/demos/roy.cast --cols 100 --rows 26 --idle-time-limit 2
# …do the thing, then Ctrl-D
```

Keep it to `--cols 100` or narrower — the player scales to fit, and anything
wider turns to mush on a phone. `.cast` files are plain JSON, typically 20–80 KB.

## Recording a video

Record the terminal window with audio (QuickTime *New Screen Recording*, or
OBS), then transcode down before committing:

```bash
ffmpeg -i raw.mov -vf "scale=1280:-2" -c:v libx264 -crf 28 -preset slow \
       -c:a aac -b:a 96k -movflags +faststart public/demos/termcast.mp4

# poster frame, taken 2s in
ffmpeg -i public/demos/termcast.mp4 -ss 2 -vframes 1 public/demos/termcast.jpg
```

Aim for **under 2 MB** and 30–60 seconds. This repo is also the GitHub profile
repo, and anything committed here stays in git history forever — if a clip
refuses to slim down, host it on Vercel Blob and use the absolute URL instead.

## Recording a termcast with termcast

`termcast` scripts are deterministic, so the take is repeatable — write the
scenario once and re-record until the framing is right:

```bash
cd ~/development/termcast
./examples/hello-world.sh          # rehearse
# then start the screen recorder and run it again
```
