# ❖ ENGINEERING ARCHITECTURE PLAN

## Mission
Deliver a browser-native first-person shooter engine in Three.js and Cannon-es that matches modern Call of Duty visual and mechanical benchmarks without requiring external assets, pre-build steps, or heavy bundlers.

## Architectural Pillars

```
+-----------------------------------------------------------------------------+
|                     FUTURISTIC CALL OF SHOOTY ARCHITECTURE                  |
+-----------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
+------------------+                                      +------------------+
| GRAPHICS PIPELINE|                                      | PHYSICS & RIG    |
+------------------+                                      +------------------+
| - WebGL2         |                                      | - Cannon-es      |
| - Sobel Normals  |                                      | - Raycast Ground |
| - PMREM HDR Env  |                                      | - SpringDamper3D |
| - UnrealBloom    |                                      | - S-Curve Camera |
+------------------+                                      +------------------+
         |                                                         |
         +----------------------------+----------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
+------------------+                                      +------------------+
| INPUT ABSTRACTION|                                      | GAMEPLAY & AI    |
+------------------+                                      +------------------+
| - Pointer Lock   |                                      | - Pulsar Drones  |
| - Virtual Stick  |                                      | - Aegis Mechs    |
| - Touch Look/Aim |                                      | - Multi-Theaters |
| - Action Buttons |                                      | - Web Audio HRTF |
+------------------+                                      +------------------+
```

## System Requirements & Budgets
* **Frame Budget**: 16.67ms (60 FPS target) on mid-tier mobile / desktop.
* **Draw Calls**: < 90 draw calls per frame via shared geometry instancing and PBR texture atlas.
* **Memory Ceiling**: < 120MB heap utilization. Zero memory leaks through explicit mesh geometry and material disposal.
* **Asset Payload**: 0 KB external downloads (100% procedurally synthesized shaders, audio nodes, and canvas maps).
