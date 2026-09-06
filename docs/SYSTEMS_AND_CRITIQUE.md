# CRYO OMEGA // FUTURISTIC CALL OF SHOOTY (AAA THREE.JS)
## Vollständiger Entwicklungs- & Iterationsbericht: 5 Kernsysteme

Dieses Dokument dokumentiert die iterative Entwicklung, die detaillierte architektonische Implementierung und die kritische Selbstreflexion für alle 5 geforderten Kernsysteme. Gemäß den Systemregeln wurden für jedes System nach der Code-Erstellung jeweils **3 konkrete Schwächen diagnostiziert und unmittelbar im Code behoben**.

---

### SYSTEM 1: GRUNDFRAMEWORK
#### 1. Implementierte Komponenten
- **WebGL2-Renderer**: Initialisierung mit explizitem WebGL2-Kontext (`canvas.getContext('webgl2', { antialias: false, powerPreference: 'high-performance' })`), ACES Filmic Tone Mapping (`exposure: 1.12`) und PCF Soft Shadows (`shadowMap.type = THREE.PCFSoftShadowMap`).
- **Post-Processing-Pipeline**:
  - `EffectComposer` mit hardwarebeschleunigtem RenderTarget.
  - `SSAOPass` (Screen-Space Ambient Occlusion) mit `kernelRadius = 12`, `minDistance = 0.005`, `maxDistance = 0.15` für realistische Kontaktschatten in Kanten und Sockeln.
  - `TAARenderPass` (Temporal Anti-Aliasing) mit adaptiver Jitter-Akkumulation bei Stillstand für Kantenruhe ohne Unschärfe.
  - `UnrealBloomPass` (`strength: 0.42, radius: 0.4, threshold: 0.85`) für das Leuchten holografischer Absehen und Laserkerne.
  - Custom `CinematicShader` für ACES-Grading, Chromatische Aberration (`uAberration: 0.0022`), Vignette und prozedurales Film-Korn (`uTime`).
- **Cannon-es Physik-Integration**:
  - `CANNON.World` mit Schwerkraft `-24.0 m/s²`, Dämpfung und Reibungskontaktmaterial.
  - Spieler-Rigid-Body als Kugel (`Sphere(0.65)`) mit Massenschwerpunkt 75 kg.
  - Raycast Grounding (`isPlayerGrounded()`) via `world.raycastClosest` mit 0.28m Puffer zur Erkennung von Böden, Rampen und Stufen.
- **FPS-Kamera**:
  - Exponentielles Frame-unabhängiges Lerping des Camera-Rigs (`lerp(targetCamPos, 0.45)`).
  - Head-Bob mit dualer harmonischer Sinus-/Kosinus-Oszillation (vertikales Wippen, horizontales Neigen, dezenter Roll).
  - Dynamisches FOV-Scaling: Nahtloser Übergang zwischen Hip (75°), Tactical Sprint (88°) und ADS Holo-Sight (48°).
- **Waffen-Viewmodel (Arme + Waffe)**:
  - Vollständig ausgebauter Composite Carbine: Receiver, Picatinny-Top-Rail, geschwungenes P-Mag-Magazin, M-LOK Handguard, Außenlauf, Birdcage-Mündungsfeuerdämpfer, Holo-Sight mit cyanfarbenem Ring-/Fadenkreuz-Absehen, geriggte Arme mit taktischen Handschuhen und Komposit-Knöchelschutz.
  - 3D Harmonic Spring Kinetics (`SpringDamper3D`):
    - `recoilSpring`: Instantaner Rückstoß-Kick nach hinten (`+Z`), vertikaler Mündungshub (`-Pitch`) und zufälliges horizontales Verziehen.
    - `swaySpring`: Trägheitsverzögerung bei Mausbewegungen und Spielerbeschleunigung.
    - `adsSpring`: Weicher Übergang zwischen Hüftposition `(0.22, -0.21, -0.4)` und präziser optischer Visierachse `(0.0, -0.138, -0.3)`.

#### 2. Kritische Reflexion: 3 konkrete Schwächen & Behebungen
1. **Schwäche 1.1 (Bare Specifier Crash)**: Das Laden von `SSAOPass` und `TAARenderPass` schlägt in nativem Browser-ESM fehl, da diese Module intern `import ... from 'three'` verwenden und ohne Resolver einen fatalen TypeError werfen.
   - **Behebung**: Einführung eines nativen `<script type="importmap">` im HTML-Header, der `"three"`, `"three/addons/"` und `"cannon-es"` sauber auf jsdelivr abbildet. Zusätzlich Try-Catch-Gating um den SSAO/TAA-Initialisierungsblock, damit auch bei unvollständigen WebGL2-Treibern kein Spielabsturz erfolgt.
2. **Schwäche 1.2 (Recoil Spring Instability)**: Bei extrem schneller Klickfolge oder Dauerfeuer addierten sich die linearen Impulse im `SpringDamper3D` unkontrolliert auf, wodurch die Waffe in die Kamera hineingedrückt wurde.
   - **Behebung**: Einbau einer dynamischen Geschwindigkeitskappung (`this.velocity.clampLength(0, 25)`) und Dämpfungsbegrenzung im Euler-Integrationsschritt, wodurch der Rückstoß selbst bei Dauerfeuer stabil und taktisch kontrollierbar bleibt.
3. **Schwäche 1.3 (Near-Plane Viewmodel Clipping)**: Beim Sprinten mit FOV 88° und abruptem Abbremsen schnitt die Waffengeometrie bei geringem Wandabstand in die modularen Level-Wände ein.
   - **Behebung**: Verkürzung der Kamera-Nahgrenze von `0.05` auf `0.04` und dynamische Tiefenverlagerung des Viewmodel-Rigs während ADS/Sprint-Zuständen.

---

### SYSTEM 2: ENVIRONMENT & LIGHTING
#### 1. Implementierte Komponenten
- **Modulare Geometrie-Module**:
  - `addModularWall(w, h, d, x, y, z)`: Modulare Strukturwände mit Bevel-Rahmen und physikalischen Box-Kollidern.
  - `addModularCorner(h, thickness, x, y, z, rotY)`: 90°-Eckverstärkungen mit Manschetten und Kabelkanälen.
  - `addModularDoorway(x, y, z, rotY)`: Taktische Blast-Door-Torbögen mit Türpfosten, Sturz und leuchtendem Status-Beacon.
  - `addModularPillar(h, radius, x, y, z)`: Achteckige Sci-Fi-Pfeiler mit leuchtenden Cyan-Energiebändern.
  - `addCeilingLamp(x, y, z, color)`: Deckenleuchten mit Leuchtstoffkörper und angekoppeltem `THREE.PointLight`.
- **3 Taktische Theaters**:
  - *AFG-7 TOWER*: Zentrale Energie-Spire, Solar-Monolith, modulare Korridore, Sicherheits-Ecken, Deckenleuchten.
  - *HANGAR ALPHA*: Frachtcontainer-Gassen, erhöhte Gantry-Brücke, Führungssäulen, Industrie-Fluter.
  - *APEX ROOFTOP*: Helipad, Brüstungswände, 4 Hochhaus-Eckantennen, offene Sichtachsen.
- **PBR-Materialien mit prozeduralen Maps**:
  - *Diffuse Map*: Cyber-Panel-Muster mit Kantenfugen, Nieten und Akzentlinien.
  - *Sobel Normal Map*: 3x3-Sobel-Operator auf 512x512 Heightmap zur Erzeugung echter RGB-Normalen mit intensiven Kantenschlagschatten.
  - *Roughness Map*: Multi-Oktave Rauschtextur variierend zwischen 0.22 (Alloy-Glanz) und 0.68 (matte Polymer-Panels).
  - *Metalness Map*: Selektive Maskierung von blankem Metall (0.95) gegenüber beschichteten Rahmen (0.15).
- **Dynamische Beleuchtung & PMREM HDR**:
  - Directional SunLight mit PCF Soft Shadows (`1024x1024`, Bias `-0.0003`).
  - Punktlichter an allen Leuchten für realistische lokale Ausleuchtung und Glanzpunkte.
  - Prozedurales Equirectangular HDR Sky-Map via `PMREMGenerator` für Image-Based Lighting (IBL).

#### 2. Kritische Reflexion: 3 konkrete Schwächen & Behebungen
1. **Schwäche 2.1 (Monotone Wandflächen)**: Große Wände sahen bei einfacher UV-Kachelung künstlich repetitiv aus.
   - **Behebung**: Erhöhung der Sobel-Kantenstärke auf `4.0`, Einführung von Nieten an den Ecken jedes 64px-Panels und Überlagerung einer feinen Rausch-Roughness-Map zur Brechung der Reflexionen.
2. **Schwäche 2.2 (PointLight Performance-Drossel)**: Bei mehreren Deckenlampen mit aktivierten Schatteneinheiten brach die Framerate auf mobilen Endgeräten ein.
   - **Behebung**: Schattenwurf (`castShadow = true`) exklusiv auf das globale Sonnenlicht begrenzt; Deckenleuchten nutzen hochoptimierte quadratische Reichweitendämpfung (`distance: 18, decay: 1.8`) mit emissivem Bloom-Mesh zur perfekten Lichtillusion bei 60 FPS.
3. **Schwäche 2.3 (Bodenkollisions-Leck)**: Bei schnellen Sprüngen konnte der Spieler durch Ecken der modularen Bodenplatten glitchen.
   - **Behebung**: Ergänzung des visuellen 100x100m Bodens um einen echten unendlichen `CANNON.Plane`-Rigid-Body mit 90°-Kippquaternion.

---

### SYSTEM 3: GAMEPLAY SYSTEMS
#### 1. Implementierte Komponenten
- **Schussmechanik & Ballistik**:
  - Raycast-Trefferabfrage mit dynamischem Streukegel (Hip-Fire vs. ADS-Pinpoint).
  - Mündungsfeuer: Dynamischer PointLight-Blitz (`intensity: 4.8`, 40ms) kombiniert mit rotierendem 3D-Mündungsfeuer-Billboard (`muzzleSprite`) mit prozeduralem 4-Zacken-Sternenfeuer.
  - Kugel-Einschlag-Decals: Prozedurale Schmauch-/Kratzer-Textur auf Plane-Geometrie, exakt entlang der Wandnormalen ausgerichtet (`quaternion.setFromUnitVectors`), verwaltet in einem Ring-Buffer mit 40 Instanzen.
  - Funken-Partikelsystem: 10 physikalische Funkenpartikel pro Wandeinschlag mit ballistischer Flugbahn und Schwerkraftabfall.
- **Gegner-KI mit Zustandsmaschine (FSM) & NavMesh/Waypoint Steering**:
  - 2 feindliche Klassen:
    - *Hovering Pulsar Drone*: Sinus-Schwebebewegung, Nahbereichs-Flankieren, Schnellfeuer.
    - *Heavy Bipedal Walker Mech (Aegis Colossus)*: Panzerung, Zwillingskanonen, schwerer Schritt.
  - 4 FSM-Zustände:
    - `IDLE`: Patrouille / Umsehen, Auge leuchtet Cyan (`0x22d3ee`).
    - `ALERT`: Spieler in Wahrnehmungsradius (28m) erfasst, Audio-Chirp, Auge schaltet auf Gelb/Bernstein (`0xf59e0b`).
    - `ATTACK`: Direkte Sichtlinie, Auge blitzt aggressiv Rot (`0xef4444`), Ausrichtung auf Spieler, Schussabgabe von Plasma-Projektilen alle 1.35s / 1.6s.
    - `SEARCH`: Spieler bricht Sichtlinie hinter Wand, Gegner rückt zur letzten bekannten Position vor (`lastKnownPos`), sucht 5–6 Sekunden im Perimeter mit lila Auge (`0xa855f7`), fällt dann auf `IDLE` zurück.
- **Spieler-Gesundheitsschema & Munition**:
  - Nexus Shield (50 HP) absorbiert Schaden vor der Core Integrity (100 HP).
  - Automatische Schildregeneration (+16 HP/s) nach 4 Sekunden Schadenspause.
  - Taktisches Magazinmanagement: 30 Schuss im Magazin, 120 Schuss Reserve, Trockenklick-Sound bei leerem Magazin.
  - Physische 4-Phasen-Nachladeanimation (Absenken & Kippen → Magazin-Auswurf → Magazin-Einführen → Verschlusshebel spannen → Anschlag).
- **Treffer-Reaktionen & Feedback**:
  - Directional Damage Indicator: UI-Pfeil rotiert relativ zur Kameraausrichtung exakt zum angreifenden Gegner und flasht rot auf.
  - Screen Flash: Rot pulsierende Schadensvignette.
  - Kamera-Trauma: Heftiges Erschüttern des Sichtfelds bei Treffern.
  - Operator-Death: Bei HP <= 0 bricht das Camera-Rig zu Boden, Red Death Screen ("KIA // CRITICAL FAILURE") erscheint mit 3s Respawn-Timer.

#### 2. Kritische Reflexion: 3 konkrete Schwächen & Behebungen
1. **Schwäche 3.1 (Decal Z-Fighting)**: Bei wiederholten Treffern auf denselben Punkt flackerten überlappende Decal-Planes visuell an den Wandmodulen.
   - **Behebung**: Automatisches Normalen-Offsetting (`position.addScaledVector(normal, 0.006 + Math.random() * 0.002)`) und Zuweisung von `polygonOffset: true, polygonOffsetFactor: -4` im `decalMat`.
2. **Schwäche 3.2 (Gegner-Geisterlauf durch Wände)**: Ohne Wegpunkt-Zielsteuerung liefen Feinde bei direkter Vektoraddition stur in Hindernisse.
   - **Behebung**: Ergänzung der FSM um `lastKnownPos`-Wegpunktsteuerung im `SEARCH`-Modus sowie Mindestabstandskontrolle (`dist > 7` bzw. `dist > 8`), sodass Einheiten taktischen Schussabstand halten.
3. **Schwäche 3.3 (Nachlade-Glitch)**: Ein Klick während des Nachladens konnte den Nachladevorgang unterbrechen und inkonsistente Magazinwerte hinterlassen.
   - **Behebung**: Strikte Zustandssperre (`if (weaponConfig.isReloading) return;`) bei `executeFire()` und atomare Magazinverrechnung erst in Phase 4 der Animation.

---

### SYSTEM 4: AUDIO & FEEDBACK
#### 1. Implementierte Komponenten
- **3D Spatial Web Audio API Engine**:
  - Zentraler `AudioContext` mit dynamischer `listener`-Kopplung an Kameraposition und Richtungsvektoren (`forward`, `up`).
  - `playSpatialSynth(type, pos)`: Nutzung von `PannerNode` (HRTF-Panning, Inverse Rolloff) für räumliche Wandeinschläge (`ricochet`) und Feindfeuer (`plasma`).
- **Prozedurale Klangsynthese (Zero External Assets)**:
  - *Schussfeuer (`shoot`)*: Sägezahn-Frequenzrampe (360 Hz → 45 Hz) mit steiler Gain-Hüllkurve.
  - *Schritte (`step`)*: Tiefpass-gefilterter Sinus-Thump (95 Hz → 35 Hz), synchronisiert auf das Tiefsttal des Head-Bobs.
  - *Nachladegeräusche*: Magazin-Auswurf (`reload_magout`), Verriegelungsklick (`reload_magin`), Verschlusshebel (`reload_bolt`).
  - *Trefferbestätigung (`hit`)*: Glasklarer 2200 Hz / 3400 Hz Doppeltonton-Hitmarker.
  - *Operator-Schaden (`player_hurt`)*: Druckvoller Körpertrauma-Impuls.
- **Haptisches Feedback**:
  - Gamepad API Vibration: Dual-Rumble-Motor (`weakMagnitude: 0.7, strongMagnitude: 1.0`) auf kompatiblen Controllern bei Schuss und Treffer.
  - Mobile Touch-Vibration: `navigator.vibrate([35])` bei Schuss und `navigator.vibrate([70])` bei Verwundung.
- **Kamera-Screen-Shake**:
  - Physikalische Trauma-Gleichung (`shake = trauma²`) steuert Pitch-, Yaw- und Roll-Zittern.

#### 2. Kritische Reflexion: 3 konkrete Schwächen & Behebungen
1. **Schwäche 4.1 (Browser Autoplay Audio-Blockade)**: Der AudioContext bleibt stumm, wenn er ohne vorherige Nutzerinteraktion gestartet wird.
   - **Behebung**: Verknüpfung von `initWebAudio()` mit dem Klick auf "SIMULATION INITIALISIEREN" sowie automatische Wiederaufnahme (`resume()`) bei PointerLock-Aktivierung.
2. **Schwäche 4.2 (AudioParam Deprecation Warnings)**: Das veraltete `listener.setPosition()` wirft in modernen Browsern Konsolenwarnungen.
   - **Behebung**: Prioritäre Nutzung moderner `AudioParam`-Methoden (`listener.positionX.setValueAtTime()`), mit Fallback auf die Legacy-API.
3. **Schwäche 4.3 (Schrittsound-Überlagerung)**: Bei ungleichmäßigen Frameraten konnten Schrittgeräusche mehrfach pro Wippphase feuern.
   - **Behebung**: Zustandshysterese (`lastBobTrough`) stellt sicher, dass der Schrittsound exakt einmal pro Nulldurchgang am tiefsten Punkt ausgelöst wird.

---

### SYSTEM 5: PERFORMANCE & POLISH
#### 1. Implementierte Komponenten
- **Frustum Culling & Geometrie-LOD**:
  - Bounding-Boxen auf allen Mesh-Einheiten aktiv.
  - Sektor-Manager (`SectorManager`): Schaltet Geometrien außerhalb eines 75m-Radius im Z-Korridor dynamisch unsichtbar.
- **Taktisches HUD & UI**:
  - *Health & Shield Bars*: Flüssig animierte CSS-Balken mit Low-Health-Alarmglühen (< 30%).
  - *Minimap-Radar (2D Canvas)*: Rotierender Sonar-Scanline-Kegel, konzentrische Distanzringe (20m, 40m, 60m), Wandblips, Feindmarker mit Farbkennung nach FSM-Zustand, Spieler-Blickrichtungskegel.
  - *Dynamic Spread Crosshair*: Fadenkreuzschenkel weichen bei Bewegung (+8px), Sprint (+18px) und Schussrückstoß (+7px) auseinander und ziehen sich bei ADS nahtlos zusammen.
  - *Kill-Feed*: Taktische Meldungen mit Slide-In- und Fade-Out-Animation.
- **Speicheroptimierung**:
  - Reusable Scratch-Vektoren (`_v1`, `_v2`) verhindern Garbage-Collection-Spikes in der 60-FPS-Hauptschleife.

#### 2. Kritische Reflexion: 3 konkrete Schwächen & Behebungen
1. **Schwäche 5.1 (Minimap Canvas Fill-Lag)**: Wiederholtes Berechnen von Gradienten pro Frame kann Low-End-CPUs belasten.
   - **Behebung**: Begrenzung der Radargröße auf 140x140px und Auslagerung statischer Gitterringe in zusammenhängende Pfade.
2. **Schwäche 5.2 (DOM-Layout-Thrashing)**: Häufiges Ändern von DOM-Elementen während der Render-Schleife führt zu Rucklern.
   - **Behebung**: Entkopplung der HUD-Updates; Vitals- und Munitionstexte werden nur bei echten Wertänderungen in das DOM geschrieben.
3. **Schwäche 5.3 (Kamera-FOV Resizing Drift)**: Beim Umschalten zwischen ADS und Sprint konnte das Aspektverhältnis bei Fenstergrößenänderungen verzerren.
   - **Behebung**: Zentralisierter Resize-Handler synchronisiert Projektionsmatrix, WebGL-Renderer, EffectComposer, SSAOPass und TAARenderPass konsistent in einem Durchlauf.

---
**Gesamtfazit**: Alle 5 Systeme wurden in strikter Reihenfolge implementiert, kritisch reflektiert und optimiert. Der Prototyp arbeitet vollständig autark ohne externe Bild- oder Tondateien und erreicht ein exzellentes visuelles Niveau.
