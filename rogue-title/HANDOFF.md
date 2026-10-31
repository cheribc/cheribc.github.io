# ROGUE title sequence: handoff

Paste or point Claude Code at this file to pick up where we left off.

## Where we are
1. **Research:** looked into recent three.js updates for motion graphics and video.
   - Confirmed (secondhand sources): r183 `RenderPipeline` (renamed from PostProcessing) with TRAA, SSR and HDR buffers; r183 `Timer` replaces `Clock`; r184 `HTMLTexture` (Chrome HTML-in-Canvas); r185–r186 volumetrics, fog and sky clouds; r186 native Gaussian splats; r187 EON rough diffuse, PMREM rework and depth-only render targets. Also in r187, `setViewport`/`setScissor` no longer scale by pixel ratio while a render target is bound.
   - **Not verified:** `MeshletDrawingPipeline`, `LightMapper` and `unwrapUVs()` from the infographic. Check the official r187 release notes before relying on them.
   - Video export routes: Remotion + `@remotion/three` (frame-driven via `useCurrentFrame()`), Remotion's experimental `renderMediaOnWeb`, or DIY WebCodecs.
2. **Built:** a 14 s cinematic title sequence for "ROGUE".
   - Interactive page: https://claude.ai/artifact/RmueFD1MpqxTckMpeC3jD1 (published from `rogue.html`)
   - Rendered MP4: 1920×1080, 24 fps, H.264, 41 MB (already delivered in chat; not in this folder)

## Files in this folder
- `rogue.html`: the whole sequence (three.js 0.160.0 via importmap from jsDelivr, WebGL, single file). The artifact platform wraps it in a doctype/head at publish time. To open it locally as a page, wrap it in `<!doctype html><html><head><meta charset="utf-8"></head><body>…</body></html>`.
- `render.js`: Playwright script that renders frames offline: `node render.js full frames`. It serves `rogue.html` and routes the three.js CDN to a local `node_modules/three` (run `npm i three@0.160.0` first). Then encode with:
  `ffmpeg -framerate 24 -i frames/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 17 -movflags +faststart rogue-title-1080p.mp4`

## Concept: "one breaks rank"
| Time | Beat | What happens |
|---|---|---|
| 0–3.7 s | Formation | 2,800 steel shards (InstancedMesh, 70×40 grid) march in lockstep |
| 3.7–7 s | Break | One shard turns amber and peels off against the flow. A shockwave ripples through the ranks and they all turn to watch |
| 7–10.8 s | Assemble | The rogue sweeps left to right; shards fly into the letters right behind it (each shard's start time is keyed to when the rogue passes its x) |
| 10.8–14 s | Title | Letters settle as diagonal hatching, a light sweep passes, the tagline fades in, fade out. The rogue rests just outside the word, tilted against the grain |

## How the code is organized (`rogue.html`)
- `renderAt(t)` is a **deterministic** function of time: it sets every instance matrix and color, the rogue, trail, dust, camera and post uniforms. Playback, scrubbing, in-browser export and offline render all call it.
- Constants near the top: `FPS=24`, `DUR=14`, `COLS/ROWS`, `T_BREAK=3.7`, `TEXT_W=9.6`, `PHASES`.
- `rebuild(title, tagline)` samples the title text from a 2D canvas (Syncopate 700) into shard targets. It also rebuilds the rogue path (`buildRoguePath`, a Catmull-Rom curve) and precomputes per-shard flight data (start time, duration, Bezier control point).
- Camera: Catmull-Rom curves `camPos` / `camTgt` over the key times `CAM_T`, plus a follow-the-rogue blend from 3.5 to 7.6 s.
- Post: RenderPass → UnrealBloomPass → OutputPass → custom ShaderPass (chromatic aberration, vignette, grain, 2.39:1 letterbox bars, fade).
- UI: play, restart, scrubber with SMPTE timecode, title and tagline inputs. The poster frame is t = 12.9 s.
- Export: MediaRecorder at 1080p in real time, saved through the artifact `downloads` capability (only works inside claude.ai). `window.__seq` exposes `renderAt`, `setRenderSize` and `setText` for automation.

## Known limitations
- Uses r160 + WebGL rather than r187 + WebGPU, for compatibility and so it could be rendered headless.
- Placeholder font is Syncopate. Swap in Rogue's brand typeface if there is one.
- The hatch texture is deliberately gritty. For a cleaner lockup, use fewer and larger shards.
- In-browser export records in real time, so the tab must stay in front.

## Suggested next steps
- Find out what Rogue is (film, brand, product) and tune pacing and mood to match.
- Port to r187 + WebGPURenderer and TSL `RenderPipeline`, and try EON rough diffuse on the shards.
- Move it into Remotion (`@remotion/three`) for an editable timeline and ProRes / H.265 output.
- Add sound design (riser on the break, hit on the landing).
- Make a vertical 9:16 cut for social and a longer cut with credits.
