# ❖ SYSTEM ARCHITECTURE SPECIFICATION

---

## 1. WebGL2 & PBR Rendering Pipeline

The engine leverages Three.js r158 configured for WebGL2 native execution.

```javascript
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

### 1.1 Procedural Normal Mapping (Sobel Filter)
Surfaces in modern AAA titles achieve realism through high-density tangent-space normal maps. Instead of loading heavy multi-megabyte image assets, the engine calculates the spatial gradient of procedural heightmaps at runtime using a 3x3 discrete Sobel operator:

$$\frac{\partial H}{\partial x} \approx \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix} * H, \quad \frac{\partial H}{\partial y} \approx \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix} * H$$

The resulting normal vector $\vec{n} = (-\text{strength} \cdot \frac{\partial H}{\partial x}, -\text{strength} \cdot \frac{\partial H}{\partial y}, 1.0)$ is normalized and encoded into the RGB channels of a CanvasTexture, producing authentic bevels, rivet highlights, and recessed seams.

### 1.2 PMREM HDR Environment Reflections
Roughness and metalness parameters in PBR shaders require an environmental radiance map to compute specular lobes. The engine dynamically draws an equirectangular cyber-industrial skyline onto a 1024x512 canvas, processes it through `THREE.PMREMGenerator`, and binds the result to `scene.environment`.

---

## 2. Physics & Grounding Architecture (Cannon-es)

Player locomotion is simulated via a rigid-body sphere capsule ($r = 0.65\text{m}$, $m = 75\text{kg}$) with high angular damping ($1.0$) to prevent unwanted rolling.

### 2.1 Raycast Ground Detection
Rather than relying on vertical velocity heuristics (which fail on ramps and jumping apexes), the engine shoots a downward physics raycast each tick:

```javascript
function isPlayerGrounded() {
  const from = new CANNON.Vec3(playerBody.position.x, playerBody.position.y, playerBody.position.z);
  const to = new CANNON.Vec3(playerBody.position.x, playerBody.position.y - playerRadius - 0.25, playerBody.position.z);
  const result = new CANNON.RaycastResult();
  return world.raycastClosest(from, to, { collisionFilterMask: ~0 }, result);
}
```

---

## 3. Kinetic Weapon Rig & Spring Dynamics

Linear interpolation (`lerp`) results in synthetic, robotic weapon animations. To achieve the weighty, mechanical recoil of Call of Duty, the engine utilizes a 3D damped harmonic oscillator:

$$m \ddot{\vec{x}} + c \dot{\vec{x}} + k (\vec{x} - \vec{x}_{\text{target}}) = \vec{F}_{\text{impulse}}$$

```javascript
class SpringDamper3D {
  constructor(stiffness = 180, damping = 16) {
    this.stiffness = stiffness; this.damping = damping;
    this.position = new THREE.Vector3(); this.velocity = new THREE.Vector3(); this.target = new THREE.Vector3();
  }
  update(delta) {
    const disp = this.position.clone().sub(this.target);
    const force = disp.multiplyScalar(-this.stiffness).sub(this.velocity.clone().multiplyScalar(this.damping));
    this.velocity.addScaledVector(force, delta);
    this.position.addScaledVector(this.velocity, delta);
  }
  applyImpulse(impulse) { this.velocity.add(impulse); }
}
```

This model is independently instantiated for:
1. **Recoil Spring**: Sharp backward kick and upward pitch, followed by a settling oscillation.
2. **Sway Spring**: Mouse delta inertia that lags behind rotational camera movement.
3. **ADS Spring**: Smooth positional glide into the optical sightline.
