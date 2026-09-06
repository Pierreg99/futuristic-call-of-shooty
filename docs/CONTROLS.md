# ❖ TACTICAL CONTROLS & INPUT SPECIFICATION

The engine features unified dual-input abstraction supporting both desktop keyboard/mouse and mobile/touch environments (Android, Termux, iPad, smartphones).

---

## 1. Desktop Controls (Pointer Lock)

| Input | Action | Description |
|---|---|---|
| **Mouse Move** | Aim / Look | Rotates camera pitch (clamped to [-85°, +85°]) and yaw. Drives weapon sway spring. |
| **Left Click** | Fire | Discharges weapon, triggers multi-axis recoil impulse, muzzle flash, and hitscan raycast. |
| **Right Click** | ADS (Aim Down Sights) | Smoothly aligns holographic sight reticle with screen center, drops FOV to 48°, and scales sensitivity. |
| **W, A, S, D** | Movement | Applies kinetic force vectors to Cannon-es physics body. |
| **Left Shift** | Tactical Sprint | Boosts velocity from 9 m/s to 14 m/s and expands camera FOV to 88°. |
| **Space** | Jump | Executes upward velocity impulse ($8.5\text{ m/s}$) only when raycast confirms ground contact. |
| **R** | Reload | Replenishes magazine (30 rounds) from reserve ammo. |

---

## 2. Mobile Touch Controls (Android / Termux / iOS)

When touch events (`ontouchstart`) or `maxTouchPoints > 0` are detected, the HUD automatically mounts a virtual touch interface:

### 2.1 Virtual Thumbstick (Left Zone)
* Located in the bottom-left viewport region ($140\text{px} \times 140\text{px}$).
* Clamps directional displacement within a circular radius and translates coordinates directly into normalized directional wish vectors ($\vec{v}_{\text{wish}} = (x, y)$).

### 2.2 Touch Drag Look Zone (Right Zone)
* Occupies the upper-right 55% of the viewport.
* Tracks drag delta ($\Delta x, \Delta y$) with sensitivity scaling ($0.004$ hipfire, $0.002$ in ADS) to deliver precision aiming without obstructing sightlines.

### 2.3 On-Screen Action Button Cluster (Bottom Right)
* **`FIRE`** (Red illuminated button): Triggers rapid-fire hitscan burst.
* **`ADS`** (Cyan toggle button): Toggles aim-down-sights alignment and optical zoom.
* **`JUMP`** (Cyan button): Executes physics jump impulse.
* **`RELOAD`** (Amber button): Replenishes carbine magazine.
* **`SPRINT`** (Cyan button): Toggles tactical sprint acceleration.
