# Sino v008: rig repair and the 3D phone

Delivered on 2026-10-16 after the owner reported that Sino's arms bent in curves and the hands and props cut into the body and helmet. v008 replaces the v006 skin weights and the arm animation of every clip. Geometry, materials, face shapes, the jetpack and the clip names are unchanged, so the runtime, the loops and the stills recipes keep working.

## What was wrong

- The skin weights came from a distance blend (`scripts/rig_sino.py`, Gaussian with a 4 cm sigma against the two nearest bones). On a 10 cm upper arm the elbow blend covered about 10 cm, the wrist about 6 cm. A bent elbow therefore bent the whole sleeve into a banana, the wrist smeared into the glove, and every glove vertex carried a little of every finger bone, so a thumb curl pulled the palm.
- Rings, trims, sleeve threads, the wrist gadget and the harness had their own single-bone weights, so they floated off the sleeve or pierced it when the arm bent.
- The clips' elbow poles sat in front of the body, so the arms bent the wrong way (elbow forward, forearm back). The wave and thinking targets pushed the glove through the helmet or the neck ring.
- Blender deformed with dual quaternions while glTF uses linear blend skinning, so the stills and loops did not match the realtime hero.

## What v008 does

Built by `sino-3d-mascot/scripts/repair_v008/build_v008.py` from the v006 web master (`blender/sino_master_v006_web.blend`), saved as `blender/sino_master_v008_web.blend`, exported by `export_v008.py` and compressed with `gltf-transform optimize --compress draco --palette false`.

- Limbs are skinned as hinges. The owner bone comes from the arc-length position along the chain, with a smoothstep transition of 3 cm at the elbow and knee and 2 cm at the wrist. The shoulder and hip keep the old smooth blend into the torso over the first 3 cm.
- Sleeve and chest wall are separated by a flood fill from the forearm through the mesh, not by distance alone: the hanging arm is only about 4 cm from the chest, so distance alone pulled the chest along.
- The glove has a solid palm, finger bones confined to the fingers (adjacent fingers blend softly, it is a mitt), and thumb bones confined to the thumb. At most 4 influences per vertex.
- Every small island on the suit or gloves copies the interpolated weights of the surface under it, so it moves with that surface.
- Linear blend skinning in Blender (`use_deform_preserve_volume` off).
- Arm and hand keys of all ten clips were rebuilt from IK targets that clear the helmet, the neck ring and the torso, with the elbow poles behind and outside the body. Fingers are not keyed: the owner wants no finger motion in the hero, so every clip keeps the glove's rest shape. Stills and loops still shape the fingers per pose. Head, chest, root, eye and antenna keys are the v006 ones.
- Still and loop recipes: the wave still uses the clip's own arm (the old target was out of reach for her 19.7 cm arm), and the thumbs-up straightens the thumb explicitly.

## Checks

`scripts/repair_v008/check_rig.py` runs headless on the blend and exits non-zero on any failure: linear skinning, hinge widths (elbow and knee 3.2 cm or less, wrist 2.6 cm or less), no torso weight in the sleeve and no arm weight in the torso, glove influence count and palm solidity, thumb confinement, attachments matching their host surface, zero hand/arm against head/torso/legs intersections over every clip (3-frame step), and sleeves staying straight around their bone in bent poses (radial drift 1.2 cm or less). All pass on v008. The still and loop audits (`scripts/web_assets/audit_poses.py`, `scripts/loops/audit_collisions.py`) report zero intersections for the hero, the twelve stills and the five loops.

Known limits: the checks are geometric and do not cover every runtime blend with the cursor look-at. The sleeve geometry still carries baked fabric folds near the elbow from v004; they are shape, not skinning.

## 3D phone prop

The phone in the stills and loops is now a real model, built by `scripts/props3d/build_phone.py` from the iPhone 17 Pro GLB in `sino-3d-mascot/iphone-17-pro/`. The two brand inlays on the back glass (the logo and its leaf) are given the frosted back material, so the back is plain; the screen wallpaper is replaced by a generated Sineva chat screen in the brand palette, no text. The prop is scaled to the 16.5 cm of the old box phone so the existing grips apply. A web LOD (8,197 triangles, 89,808 bytes draco, no normal maps) sits in `sino-3d-mascot/export/web/props/phone.draco.glb` for a later realtime use (CPR-95); the website does not load it yet.

## Delivery

| Asset | v008 | Limit |
|---|---:|---:|
| GLB raw / Brotli | 1,222,960 / 388,478 bytes | 600,000 bytes Brotli |
| Geometry / primitives | 58,417 tris before draco simplify / 24 | 80,000 tris / 30 draw calls |
| Clips | the ten v006 names | |

Stills, poster, loops and one-shots were re-rendered from v008 and use versioned paths (`/mascot/poses/v008/`, `/mascot/poster/v008/`, `/og/default-v008.png`) so returning visitors do not keep the old immutable files.
