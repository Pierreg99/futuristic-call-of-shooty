# ❖ ROBOTIC COMBAT AI SPECIFICATION

---

## 1. Enemy Classes

The battlefield features two distinct robotic combat units engineered with specific tactical behaviors:

### 1.1 Pulsar Recon Drone
* **Role**: Fast skirmisher / harasser.
* **Health**: 100 HP.
* **Movement**: Hovering flight ($4.2\text{ m/s}$) with sinusoidal altitude oscillation.
* **Chassis**: Icosahedron energy core with tri-axis rotating gyroscopic armor plates.
* **Behavior**: Closes distance aggressively, maintaining line-of-sight and firing synchronized laser shocks.

### 1.2 Aegis Colossus Heavy Walker Mech
* **Role**: Heavy frontline armored assault titan.
* **Health**: 250 HP.
* **Movement**: Ground-bound bipedal march ($2.4\text{ m/s}$) with heavy footfall ground-shaking cues.
* **Chassis**: Reinforced composite torso ($1.6\text{m} \times 1.4\text{m}$) housing a glowing optical sensor core and twin arm-mounted heavy energy cannons.
* **Behavior**: Advances relentlessly, absorbs heavy fire, and unleashes high-damage suppression salvos.

---

## 2. Finite State Machine (FSM)

Both robotic classes execute a 4-state intelligence loop:

```
[ IDLE ]  ---( Player in Detection Radius )--->  [ ALERT ]
   ^                                                |
   |                                    ( Target Confirmed < 1.2s )
   |                                                v
[ SEARCH ] <---( Line of Sight Lost > 30m )---  [ ATTACK ]
```

1. **`IDLE`**: Patrols assigned perimeter waypoints with low-power cyan sensor illumination.
2. **`ALERT`**: Locks orientation onto detected sound or visual contact; sensor flashes amber.
3. **`ATTACK`**: Engages hostile target, moves into lethal firing envelope, and triggers primary weapons; sensor glows crimson.
4. **`SEARCH`**: Inspects last-known target position when line-of-sight is broken by cover.
