# ❖ WEAPON ARSENAL & SKIN SPECIFICATION

---

## 1. Primary Firearm: MK-18 Composite Carbine

The weapon viewmodel is modeled procedurally with fine mechanical components:

```
[ Birdcage Flash Hider ] === [ Fluted Barrel ] === [ M-LOK Handguard ] === [ Picatinny Top Rail & Holo-Sight ] === [ Receiver ] === [ Stock ]
                                                                      |
                                                            [ Curved 30-Rnd P-Mag ]
```

### Technical Specs
* **Caliber**: 6.8mm High-Velocity Armor-Piercing Caseless.
* **Fire Rate**: ~520 RPM (115ms cycle time).
* **Magazine Capacity**: 30 rounds in mag / 120 in tactical reserve.
* **Base Damage**: 34 HP per hitscan impact (3-shot kill against standard units).
* **Recoil Model**: Multi-axis angular kick ($+0.12\text{ rad}$) and backward displacement ($0.04\text{m}$) stabilized by `SpringDamper3D`.

---

## 2. Weapon Camouflage & Skin Variants

Players can toggle skins in real time via the HUD tactical switcher:

### 2.1 Obsidian Stealth (Standard Issue)
* **Receiver**: Matte carbon-graphite composite (`#18202c`, roughness 0.25, metalness 0.9).
* **Rails & Barrel**: Anodized black titanium (`#0b1118`).
* **Tactical Gloves**: Dark Cordura weave with composite knuckle armor plates.

### 2.2 Gold Apex (Honor Guard)
* **Receiver**: Polished 24K electroplated gold (`#f59e0b`, roughness 0.20, metalness 0.95).
* **Rails & Barrel**: Deep burnished obsidian bronze (`#221805`).
* **Tactical Gloves**: Desert tactical leather with brass-reinforced plates.

### 2.3 Frost Damascus (Cryo Spec-Ops)
* **Receiver**: Cryogenic treated ice-blue Damascus steel (`#38bdf8`, roughness 0.18, metalness 0.85).
* **Rails & Barrel**: Matte midnight blue steel (`#0f172a`).
* **Tactical Gloves**: Arctic operations insulated composite glove.
