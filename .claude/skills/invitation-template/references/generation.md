# Generating frames and video in Google Flow

Google Flow (flow.google.com) makes both stills and the video:

| What | Flow setting | Cost |
|------|--------------|------|
| Start + end frames | Mode **Image** (Nano Banana), 9:16, x1 | 0 credits |
| Opening video | Mode **Video**, **Frames** (start + end), 9:16, x1, 6 s, 720p | 18 credits |

Output: H.264 720×1280, ~6 s, with AAC sound.

## How it must be driven

**By hand only**: the person, or browser-tool workers clicking like a person. Scripted
drivers (Playwright, Ego Lite, gflow CLIs) were all blocked by Flow's *"We noticed some
unusual activity"* check after ~15 images. On any *Failed*, *unusual activity*, captcha or
verification: **stop every worker, report, wait**. Never retry around it, never evade it.

What worked for 45 videos: Flow open in the Claude app's built-in browser (already signed
in), an orchestrator session, and **2 Haiku workers** in parallel, each on its own tab, one
design at a time (~4–5 min each). 3 workers tripped the check once after ~45 generations.

The orchestrator spawns each worker with `Agent` (model `haiku`) and this brief, filled in
(the full working copy is `gflow-test/batch/WORKER_BRIEF.md`):

> Drive Google Flow BY HAND in the built-in browser to make ONE intro video for `<DESIGN>`.
> Use only `mcp__Claude_Browser__*` tools; screenshot, click, type. No scripts; never use
> javascript_tool to act. **Pass `tabId` = `<TAB>` on EVERY call** (keys and typing too) —
> otherwise input lands in another worker's tab. Don't sign out or change anything outside
> the Flow composer.
> 1. Open https://flow.google.com/ → New project.
> 2. Rename it: click the title (a date), **triple-click** to select all (Cmd+A is
>    unreliable), type `<DESIGN>`, Enter. Screenshot; no leftover date text.
> 3. Settings: Image, 9:16, x1 ("0 credits"). Close settings. If "Flow Agent" (spark
>    icon) is on, switch it off.
> 4. Type the START prompt (settings closed, prompt box focused, text visible) → generate.
> 5. Type the END prompt → generate. Screenshot both; they must match the design.
> 6. Settings: Video → **Frames** (it may default to "Ingredients"), 9:16, x1, 6 s, 720p.
>    The Length slider: click the thumb, then arrow keys (1 s per press).
> 7. The picker lists the **newest image first** — pick by looking, never by position.
>    Start slot = start image, End slot = end image. Zoom-screenshot to confirm, not swapped.
> 8. Type the motion prompt. Cost must read 18 credits (stop if > 20). Generate **once**.
> 9. Wait for the render (2–6 min), checking about once a minute. Done when the tile shows
>    a play icon. Don't download.
> Hard stops: any Failed / unusual activity / policy / captcha → stop, screenshot, report.
> Report: design, project URL, status, one line per image, slots verified, credits shown.

The orchestrator reviews each report (and a screenshot of the finished tile) before
handing the next design to that worker, and records project URLs (`swarm.json`,
`FLOW_PROJECTS.md`).

## Downloading

The built-in browser can't save files. Downloads go through Ego Lite (the `ego-browser`
skill), signed in to the same Google account: `gflow-test/batch/ego-download.mjs` opens
each project URL, checks the title matches the design id and that there is exactly one
video, then Download → 720p → Original size → `out/<design>/video.mp4`. It never generates.

```bash
# /tmp/ego-dl.json = {"authuser": <google account slot>, "outRoot": ".../out", "items": [{"id": "design-007", "url": "<flow project url>"}]}
ego-browser nodejs < gflow-test/batch/ego-download.mjs
```

## Verify every video before using it

```bash
ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration -of compact out/<design>/video.mp4
```
Expect h264 720×1280, ~6 s, plus an aac stream. Then look at the first and last frames side by
side: closed → open, same camera axis, no text or hands, a clear name area in the last frame.
Reject and regenerate (a new project, never a retry in the same one) if any of those fail.
