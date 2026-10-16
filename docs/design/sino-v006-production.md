# Sino v006 production notes

Superseded by v008 for skin weights, arm animation and the rendered assets: see [sino-v008-rig-repair.md](sino-v008-rig-repair.md). The jetpack, the thrust sockets, the launch overlay and the runtime behaviour described here still apply.

Delivered on 2026-10-16 for CPR-96 and CPR-99. The owner requested that moving limbs and props never pass through Sino. This delivery corrects the source geometry/poses as well as adding the jetpack.

## Editable source and recipes

- `assets/mascot/sino-v006-web.blend` is the editable Blender 5.2 master.
- `assets/mascot/v006/production-scripts.zip` contains the build, export, render, encode, collision-audit and alpha-comparison recipes in their original `scripts/` layout. Extract into the sibling `sino-3d-mascot` project. Paths at the top of the recipes point to that local project and should be adjusted when moved. The build recipe starts from the preserved v005 master; the delivered v006 blend can be rendered directly.
- `public/mascot/sino-v006.glb` is the Draco web export. Validate with `npx @gltf-transform/cli@4 validate public/mascot/sino-v006.glb`.
- `assets/mascot/v006/validation.json` records model and video budgets. The adjacent JSON files preserve the collision results.

## Geometry and animation corrections

The two nozzles add about 256 triangles and retract at rest. `FX-jet_L` and `FX-jet_R` provide animated thrust sockets. Ten clips retain the seven original names and add launch, hover and landing. The original arm animation was changed where it crossed the torso; the seven clips are therefore not byte-identical to v005. Removing the redundant cornea shell prevents it crossing the closed eyelids. The eyelid shapes and eye specular material remain.

Hand targets, elbow poles and prop placement were corrected in the still and loop recipes. The laptop screen now faces Sino with hands below the lid, and the phone, clipboard, magnifier and megaphone clear the helmet and body. Corrected poses and hero poster use versioned URLs so returning visitors do not keep the old immutable assets.

The BVH audit checks every exported GLB clip frame, all 72 frames of each loop, all one-shot frames, and the hero plus twelve stills. It compares deformed hand/forearm surfaces against torso/head and props against torso/head/legs. The laptop has an additional hands/screen test. Joint seams and deliberate finger grips are excluded. These checked surfaces have zero reported intersections. This is a defined geometric check rather than a proof about every possible runtime blend or cursor pose; browser inspection remains part of QA.

## Budgets

| Asset | Delivered | Limit |
|---|---:|---:|
| GLB raw / Brotli | 1,174,076 / 367,332 bytes | 600,000 bytes Brotli |
| Geometry / base primitives | 56,233 tris / 22 | 80,000 tris / 30 draw calls |
| Realtime effects | 5 additional draw calls, no extra lights | 27 total |
| Largest loop | 861,305 bytes | 900,000 bytes each |
| Largest one-shot | 391,436 bytes | 600,000 bytes each |
| Added runtime + overlay JS | 3,957 bytes gzip | 6,000 bytes gzip |

One-shots ship as 720 x 960 launch and 1280 x 540 fly-bys. All are silent, end empty, and include WebM/VP9 alpha, MOV/HEVC alpha and a WebP poster. Loops are 720 x 720. Source, decoded VP9 and AVFoundation-decoded HEVC frames were compared on white and pale teal. The comparison script resets the selected video frame timestamp before compositing.

## Runtime behavior and verification

The logo intro finishes before the hero launch starts. The root hop is scaled to fit the existing stage. A click/key skips to landing; reactions queue during flight; leaving the hero resets to idle. Flames use the exported thrust socket scale, with a 2 Hz flicker and a preallocated 24-quad smoke pool. Resources dispose with the runtime.

CTA animation warms only on hover/focus. An unready click skips animation. Navigation has no awaited media, timeout or `preventDefault`. Caps are once per CTA kind and at most twice per session. A recent contact handoff timestamp permits one mail fly-by, then the thumbs loop; a refresh skips the fly-by. No form answers are stored for this decoration. The single CTA kill switch is `LAUNCH_ENABLED` in `launch-bus.ts`.

Automated checks cover sequencing, skips, caps, reduced motion, Save-Data, webdriver, expiry, unmount disposal, original link behavior, one-time thank-you delivery, dimensions, clip names and size budgets. GLB validator reports no errors, warnings or hints. The production browser rendered the model without console errors, and booking navigation reached Contact. Home was checked at desktop and 360 px with no horizontal overflow.

Real Safari/iOS playback, Android FPS, the Lighthouse baseline comparison and the <=16 ms navigation latency benchmark are still unverified. W4 analytics remains dependent on CPR-51 hosting. Those checks must not be reported as passed from unit tests alone.
