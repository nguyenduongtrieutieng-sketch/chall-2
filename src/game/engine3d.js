import * as THREE from "three";
import { sound } from "../audio";
import { BOSS_ROSTER, BLOCKADE_MINIONS } from "./maps";

export class Engine3D {
  constructor(container, fighter, mapConfig, diffConfig, auxType, callbacks) {
    this.container = container;
    this.fighter = fighter;
    this.map = mapConfig;
    this.diff = diffConfig;
    this.auxType = auxType;
    this.cb = callbacks;

    this.width = container.clientWidth || 900;
    this.height = container.clientHeight || 700;

    this.running = false;
    this.score = 0;
    this.runGold = 0;
    this.runDiamonds = 0;
    this.wave = 1;
    this.maxWaves = 9;
    this.shakeAmount = 0;

    // 3D Smooth Flight Kinematics
    this.rollAngle = 0;
    this.pitchAngle = 0;
    this.keys = { w: false, a: false, s: false, d: false };

    // Player State
    this.player = {
      x: 0,
      y: -12,
      targetX: 0,
      targetY: -12,
      hp: fighter.maxHp,
      maxHp: fighter.maxHp,
      shield: false,
      shieldDuration: 0,
      stealth: false,
      stealthDuration: 0,
      laserBeam: false,
      laserBeamDuration: 0,
      wingsExpanded: false,
      wingsDuration: 0,
      currentForm: fighter.currentForm || "phoenix", // for void_phantom
      cooldowns: { Q: 0, E: 0, R: 0, X: 0, AUX: 0 },
      lastShotTime: 0
    };

    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.drones = [];
    this.mines = [];
    this.rifts = [];
    this.particles = [];
    this.boss = null;
    this.bossSkillCooldown = 2.4;
    this.bossSkillTimer = 0;
    this.waveTimer = 0;
    this.waveState = "spawning"; // spawning, blockade, boss, victory
    this.mouse = { x: 0, y: 0, isDown: true };

    this.initThree();
    this.createPlayerMesh();
    this.initBackground();
    this.initStarfield();
    this.initCosmicDebris();
    this.bindEvents();
  }

  initBackground() {
    const bgUrl = this.map.image || "/maps/map1_thien_ha_sa_hoang.png";
    const loader = new THREE.TextureLoader();
    loader.load(bgUrl, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.bgTexture = texture;

      // Set scene background
      this.scene.background = texture;

      // Immersive background plane placed behind all action at depth Z = -24
      const planeGeo = new THREE.PlaneGeometry(160, 240);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        depthWrite: false,
        depthTest: false,
        fog: false // Crucial: Never let fog wash out the cosmic starfield!
      });
      this.bgPlane = new THREE.Mesh(planeGeo, planeMat);
      this.bgPlane.position.set(0, 5, -24);
      this.bgPlane.renderOrder = -1000;
      this.scene.add(this.bgPlane);
    });
  }

  initThree() {
    this.scene = new THREE.Scene();
    // Space is a dark cosmic vacuum - use subtle dark fog that NEVER washes out the background
    this.scene.fog = new THREE.FogExp2(0x02050e, 0.002);

    // 3D Chase Camera (Behind and above the ship)
    this.camera = new THREE.PerspectiveCamera(52, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, -18, 24);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Dynamic Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.6);
    dirLight.position.set(15, 25, 35);
    this.scene.add(dirLight);

    this.hullLight = new THREE.PointLight(this.map.ambientColor, 2.5, 45);
    this.hullLight.position.set(0, -10, 8);
    this.scene.add(this.hullLight);
  }

  initStarfield() {
    const starCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 90;
      positions[i + 1] = (Math.random() - 0.5) * 90;
      positions[i + 2] = (Math.random() - 0.5) * 40 - 5;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18, // Crisp fine star points, NOT large distracting squares
      transparent: true,
      opacity: 0.75
    });
    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  initCosmicDebris() {
    this.debrisGroup = new THREE.Group();
    const debrisCount = 6; // Subtle cosmic accents, non-obstructive
    for (let i = 0; i < debrisCount; i++) {
      let geo, mat;
      if (this.map.debrisType === "ice_crystal") {
        geo = new THREE.OctahedronGeometry(Math.random() * 0.8 + 0.3, 0);
        mat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.6 });
      } else if (this.map.debrisType === "molten_magma") {
        geo = new THREE.DodecahedronGeometry(Math.random() * 0.9 + 0.4, 0);
        mat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, emissive: 0xef4444, emissiveIntensity: 0.6, roughness: 0.8 });
      } else {
        geo = new THREE.TetrahedronGeometry(Math.random() * 0.8 + 0.4, 1);
        mat = new THREE.MeshStandardMaterial({ color: 0x2e1065, emissive: 0x8b5cf6, emissiveIntensity: 0.5, metalness: 0.9 });
      }
      const m = new THREE.Mesh(geo, mat);
      m.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 15 - 5);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      m.rotSpeed = { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02 };
      this.debrisGroup.add(m);
    }
    this.scene.add(this.debrisGroup);
  }

  createPlayerMesh() {
    this.playerGroup = new THREE.Group();
    this.thrusterFlames = [];
    const f = this.fighter;

    if (f.id === "void_phantom") {
      // 2 DẠNG BIẾN HÌNH: HỎA PHỤNG & THIÊN NGUYỆT
      this.buildVoidPhantomMesh();
    } else if (f.id === "thunder_judgement") {
      // THANH LONG 72M DREADNOUGHT
      this.buildThanhLongMesh();
    } else if (f.id === "boreal_valkyrie") {
      // IMPERIAL AURORA (BĂNG HÀ NGA HOÀNG)
      this.buildAuroraMesh();
    } else if (f.id === "solar_phoenix") {
      // BÃO LỬA ĐỊA NGỤC (CÁNH BIẾN HÌNH MỞ/THU)
      this.buildHellfireTsarMesh();
    } else if (f.id === "chronos_prime") {
      // THAO TÚNG HƯ KHÔNG (VÀNH ĐAI LỖ ĐEN)
      this.buildVoidManipulatorMesh();
    } else {
      // SA HOÀNG BẤT DIỆT (DEFAULT SOVEREIGN)
      this.buildTsarEternalMesh();
    }

    // Shield Dome Forcefield
    const shieldGeo = new THREE.SphereGeometry(3.8, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.visible = false;
    this.playerGroup.add(this.shieldMesh);

    // Laser Beam Mesh for Titan Mega-Beam (aligned forward along local -Z towards enemies)
    const beamGeo = new THREE.CylinderGeometry(0.7, 0.7, 70, 16);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.85 });
    this.laserBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.laserBeamMesh.rotation.x = -Math.PI / 2;
    this.laserBeamMesh.position.set(0, 0, -35);
    this.laserBeamMesh.visible = false;
    this.playerGroup.add(this.laserBeamMesh);

    this.playerGroup.position.set(this.player.x, this.player.y, 0);
    this.scene.add(this.playerGroup);
  }

  buildModularFighter(opts = {}) {
    const {
      hullColor = 0xb91c1c,
      trimColor = 0xffd700,
      canopyColor = 0xffeb3b,
      canopyEmissive = 0xf59e0b,
      flameColor = 0xff8c00,
      wingSpan = 1.0,
      wingSweep = 0.28,
      tailAngle = 0.42,
      wingsGroup = null,
      crest = null,
      extraParts = []
    } = opts;

    const hullMat = new THREE.MeshStandardMaterial({
      color: hullColor,
      metalness: 0.85,
      roughness: 0.25
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: trimColor,
      metalness: 0.92,
      roughness: 0.18,
      emissive: trimColor,
      emissiveIntensity: 0.22
    });

    // 1. Fuselage Main Body & Dorsal Spine
    const fuselageGeo = new THREE.BoxGeometry(1.3, 0.52, 3.8);
    const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
    fuselage.position.set(0, 0, -0.1);
    this.playerGroup.add(fuselage);

    const spineGeo = new THREE.BoxGeometry(0.65, 0.32, 3.2);
    const spine = new THREE.Mesh(spineGeo, trimMat);
    spine.position.set(0, 0.35, -0.2);
    this.playerGroup.add(spine);

    // Left & Right Air Intakes
    const intakeGeo = new THREE.BoxGeometry(0.42, 0.34, 1.6);
    const intakeL = new THREE.Mesh(intakeGeo, hullMat);
    intakeL.position.set(-0.92, -0.1, -0.6);
    const intakeR = intakeL.clone();
    intakeR.position.x = 0.92;
    this.playerGroup.add(intakeL, intakeR);

    // 2. Chined Stealth Radome Nose Cone (pointing forward along local -Z)
    const noseGeo = new THREE.ConeGeometry(0.68, 2.5, 4);
    const nose = new THREE.Mesh(noseGeo, hullMat);
    nose.rotation.x = -Math.PI / 2;
    nose.rotation.y = Math.PI / 4; // 4-facet stealth chine
    nose.position.set(0, 0, -3.05);
    this.playerGroup.add(nose);

    // Pitot probe tip
    const probeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
    const probe = new THREE.Mesh(probeGeo, trimMat);
    probe.rotation.x = -Math.PI / 2;
    probe.position.set(0, 0, -4.6);
    this.playerGroup.add(probe);

    // 3. Faceted Cockpit Canopy (facing camera above/behind)
    const canopyGeo = new THREE.SphereGeometry(0.44, 16, 12);
    canopyGeo.scale(0.7, 0.75, 2.3);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: canopyColor,
      emissive: canopyEmissive,
      emissiveIntensity: 0.75,
      metalness: 0.3,
      roughness: 0.1,
      transparent: true,
      opacity: 0.88
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.44, -1.2);
    this.playerGroup.add(canopy);

    // 4. Forward Canards (vây lái mũi khí động học)
    const canardGeo = new THREE.BoxGeometry(0.95, 0.06, 0.7);
    const canardL = new THREE.Mesh(canardGeo, trimMat);
    canardL.position.set(-1.0, 0.08, -1.9);
    canardL.rotation.y = 0.35;
    canardL.rotation.z = -0.1;
    const canardR = canardL.clone();
    canardR.position.x = 1.0;
    canardR.rotation.y = -0.35;
    canardR.rotation.z = 0.1;
    this.playerGroup.add(canardL, canardR);

    // 5. Main Swept Delta Wings & Slat Trims
    const wingContainer = wingsGroup || this.playerGroup;
    const wingGeo = new THREE.BoxGeometry(2.9 * wingSpan, 0.11, 2.0);
    const wingL = new THREE.Mesh(wingGeo, hullMat);
    wingL.position.set(-1.95 * wingSpan, 0.0, 0.25);
    wingL.rotation.y = wingSweep;
    wingL.rotation.z = -0.05;

    const wingR = new THREE.Mesh(wingGeo, hullMat);
    wingR.position.set(1.95 * wingSpan, 0.0, 0.25);
    wingR.rotation.y = -wingSweep;
    wingR.rotation.z = 0.05;

    const slatGeo = new THREE.BoxGeometry(2.2 * wingSpan, 0.06, 1.3);
    const slatL = new THREE.Mesh(slatGeo, trimMat);
    slatL.position.set(-1.7 * wingSpan, 0.08, 0.25);
    slatL.rotation.y = wingSweep;
    slatL.rotation.z = -0.05;

    const slatR = new THREE.Mesh(slatGeo, trimMat);
    slatR.position.set(1.7 * wingSpan, 0.08, 0.25);
    slatR.rotation.y = -wingSweep;
    slatR.rotation.z = 0.05;

    wingContainer.add(wingL, wingR, slatL, slatR);

    // 6. Wingtip Pylons & Weapons
    const pylonGeo = new THREE.CylinderGeometry(0.11, 0.11, 2.2, 8);
    const pylonL = new THREE.Mesh(pylonGeo, trimMat);
    pylonL.rotation.x = -Math.PI / 2;
    pylonL.position.set(-3.4 * wingSpan, 0.0, 0.35);

    const muzzleGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.3, 8);
    const muzzleMat = new THREE.MeshBasicMaterial({ color: canopyEmissive });
    const muzzleL = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzleL.rotation.x = -Math.PI / 2;
    muzzleL.position.set(-3.4 * wingSpan, 0.0, -0.85);

    const pylonR = pylonL.clone();
    pylonR.position.x = 3.4 * wingSpan;
    const muzzleR = muzzleL.clone();
    muzzleR.position.x = 3.4 * wingSpan;

    wingContainer.add(pylonL, pylonR, muzzleL, muzzleR);

    // 7. Twin Outward-Canted V-Tail Stabilizers
    const tailGeo = new THREE.BoxGeometry(0.08, 1.4, 1.3);
    const tailL = new THREE.Mesh(tailGeo, hullMat);
    tailL.position.set(-0.75, 0.7, 1.25);
    tailL.rotation.z = -tailAngle;
    tailL.rotation.x = 0.35;

    const tailR = new THREE.Mesh(tailGeo, hullMat);
    tailR.position.set(0.75, 0.7, 1.25);
    tailR.rotation.z = tailAngle;
    tailR.rotation.x = 0.35;

    const capGeo = new THREE.BoxGeometry(0.1, 0.3, 0.8);
    const capL = new THREE.Mesh(capGeo, trimMat);
    capL.position.set(-0.75, 0.7, 1.25);
    capL.rotation.z = -tailAngle;
    capL.rotation.x = 0.35;

    const capR = capL.clone();
    capR.position.x = 0.75;
    capR.rotation.z = tailAngle;

    this.playerGroup.add(tailL, tailR, capL, capR);

    // 8. Twin Jet Engine Nacelles & Titanium Exhaust Nozzles
    const nacelleGeo = new THREE.CylinderGeometry(0.38, 0.42, 2.6, 12);
    const nacelleL = new THREE.Mesh(nacelleGeo, hullMat);
    nacelleL.rotation.x = -Math.PI / 2;
    nacelleL.position.set(-0.65, -0.12, 0.6);

    const nacelleR = nacelleL.clone();
    nacelleR.position.x = 0.65;

    const nozzleGeo = new THREE.CylinderGeometry(0.36, 0.33, 0.35, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.95, roughness: 0.2 });
    const nozzleL = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleL.rotation.x = -Math.PI / 2;
    nozzleL.position.set(-0.65, -0.12, 1.9);

    const nozzleR = nozzleL.clone();
    nozzleR.position.x = 0.65;

    this.playerGroup.add(nacelleL, nacelleR, nozzleL, nozzleR);

    // 9. Twin 3D Dynamic Afterburner Thruster Flames (pointing rearward along +Z)
    const flameGeo = new THREE.ConeGeometry(0.32, 2.0, 12);
    const flameMat = new THREE.MeshBasicMaterial({
      color: flameColor,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const innerFlameGeo = new THREE.ConeGeometry(0.16, 1.3, 12);
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.rotation.x = Math.PI / 2;
    flameL.position.set(-0.65, -0.12, 3.0);

    const innerL = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    innerL.rotation.x = Math.PI / 2;
    innerL.position.set(-0.65, -0.12, 2.65);

    const flameR = flameL.clone();
    flameR.position.x = 0.65;

    const innerR = innerL.clone();
    innerR.position.x = 0.65;

    this.playerGroup.add(flameL, flameR, innerL, innerR);
    this.thrusterFlames.push(flameL, flameR, innerL, innerR);

    // Extra attachments & emblems
    if (crest) this.playerGroup.add(crest);
    for (let part of extraParts) this.playerGroup.add(part);

    return { hullMat, trimMat, canopyMat, flameMat };
  }

  buildTsarEternalMesh() {
    // Sa Hoàng Bất Diệt (Imperial Sovereign Dreadnought - Royal Crimson & 24K Gold)
    const crestGroup = new THREE.Group();
    const eagleShield = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 })
    );
    eagleShield.scale.set(0.9, 1.4, 0.35);
    eagleShield.position.set(0, 0.52, -0.2);

    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.32, 6),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95 })
    );
    crown.position.set(0, 0.82, -0.2);
    crestGroup.add(eagleShield, crown);

    // Dual-barrel heavy plasma cannons on each wing
    const gunExtraGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95 });
    const gunExtraL = new THREE.Mesh(gunExtraGeo, gunMat);
    gunExtraL.rotation.x = -Math.PI / 2;
    gunExtraL.position.set(-3.1, -0.1, 0.2);

    const gunExtraR = gunExtraL.clone();
    gunExtraR.position.x = 3.1;

    this.buildModularFighter({
      hullColor: 0xb91c1c, // Imperial Royal Crimson
      trimColor: 0xffd700, // 24K Gold
      canopyColor: 0xffeb3b, // Golden Glass
      canopyEmissive: 0xf59e0b,
      flameColor: 0xff8c00, // Thermonuclear Flame
      wingSpan: 1.05,
      wingSweep: 0.28,
      crest: crestGroup,
      extraParts: [gunExtraL, gunExtraR]
    });
  }

  buildVoidPhantomMesh() {
    // Bóng Ma Vũ Trụ (Song Trạng Thái: Hỏa Phụng ⇄ Thiên Nguyệt)
    const isPhoenix = this.player.currentForm === "phoenix";

    // Crescent Moon Rings for Moon state
    const ringGeo = new THREE.TorusGeometry(2.2, 0.16, 8, 28, Math.PI * 1.5);
    this.lunarMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: isPhoenix ? 0.0 : 1.0
    });
    this.lunarRings = new THREE.Mesh(ringGeo, this.lunarMat);
    this.lunarRings.rotation.x = Math.PI / 2;
    this.lunarRings.rotation.z = Math.PI * 0.3;
    this.lunarRings.visible = !isPhoenix;

    this.phantomMats = this.buildModularFighter({
      hullColor: isPhoenix ? 0xff4500 : 0x0e7490,
      trimColor: isPhoenix ? 0xff9100 : 0x00e5ff,
      canopyColor: isPhoenix ? 0xff6d00 : 0x38bdf8,
      canopyEmissive: isPhoenix ? 0xd97706 : 0x0284c7,
      flameColor: isPhoenix ? 0xff3d00 : 0x00e5ff,
      wingSpan: 1.0,
      wingSweep: 0.32,
      extraParts: [this.lunarRings]
    });
  }

  buildThanhLongMesh() {
    // Thanh Long 72m Dreadnought (Lôi Đình Phán Quyết - Azure Dragon)
    const hornsGroup = new THREE.Group();
    const hornGeo = new THREE.CylinderGeometry(0.06, 0.22, 2.6, 6);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.85, 0.2, -2.6);
    hornL.rotation.z = -0.32;
    hornL.rotation.x = -Math.PI / 2 + 0.15;

    const hornR = hornL.clone();
    hornR.position.x = 0.85;
    hornR.rotation.z = 0.32;
    hornsGroup.add(hornL, hornR);

    // Lightning dragon spine ridges
    for (let i = 0; i < 4; i++) {
      const scaleGeo = new THREE.ConeGeometry(0.18, 0.5, 4);
      const scaleMesh = new THREE.Mesh(scaleGeo, hornMat);
      scaleMesh.rotation.x = 0.4;
      scaleMesh.position.set(0, 0.52, -1.0 + i * 0.7);
      hornsGroup.add(scaleMesh);
    }

    this.buildModularFighter({
      hullColor: 0x0284c7, // Azure Ocean Blue
      trimColor: 0xffd700, // Imperial Gold Trims
      canopyColor: 0x00e5ff, // Electric Lightning Cyan
      canopyEmissive: 0x0284c7,
      flameColor: 0x00e5ff, // Electric Cyan Plasma
      wingSpan: 1.15,
      wingSweep: 0.24,
      crest: hornsGroup
    });
  }

  buildAuroraMesh() {
    // Băng Hà Cực Bắc - Imperial Aurora (White Snow & Glacial Sky Blue)
    const iceTips = [];
    const iceGeo = new THREE.OctahedronGeometry(0.38, 0);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const iceL = new THREE.Mesh(iceGeo, iceMat);
    iceL.position.set(-3.7, 0.0, 0.35);
    const iceR = iceL.clone();
    iceR.position.x = 3.7;
    iceTips.push(iceL, iceR);

    // Silver-gold dual eagle emblem
    const crest = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95 })
    );
    crest.scale.set(0.85, 1.4, 0.35);
    crest.position.set(0, 0.52, -0.2);

    this.buildModularFighter({
      hullColor: 0xf8fafc, // Pure Polar Snow White
      trimColor: 0x0284c7, // Imperial Glacial Blue
      canopyColor: 0x38bdf8, // Ice Glacial Canopy
      canopyEmissive: 0x0284c7,
      flameColor: 0x38bdf8, // Glacial Cryo Blue Flame
      wingSpan: 1.05,
      wingSweep: 0.30,
      crest,
      extraParts: iceTips
    });
  }

  buildHellfireTsarMesh() {
    // Bão Lửa Địa Ngục (Black Titanium Mach 6.5 & Crimson Mechanical Expanding Wings)
    this.hellfireWingsGroup = new THREE.Group();
    this.playerGroup.add(this.hellfireWingsGroup);

    this.buildModularFighter({
      hullColor: 0x18181b, // Stealth Black Titanium
      trimColor: 0xef4444, // Molten Lava Crimson
      canopyColor: 0xdc2626, // Crimson Cockpit Glass
      canopyEmissive: 0xb91c1c,
      flameColor: 0xff3d00, // Mach 6.5 Hyper Thrust Flame
      wingSpan: 1.1,
      wingSweep: 0.32,
      wingsGroup: this.hellfireWingsGroup
    });
  }

  buildVoidManipulatorMesh() {
    // Kẻ Thao Túng Hư Không (Singularity Warship with Event Horizon Ring)
    const ringGeo = new THREE.TorusGeometry(2.1, 0.14, 12, 36);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    this.eventHorizonRing = new THREE.Mesh(ringGeo, ringMat);
    this.eventHorizonRing.rotation.x = Math.PI / 2;
    this.eventHorizonRing.position.set(0, 0, 0.8);

    // Singularity Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0.35, -0.1);

    this.buildModularFighter({
      hullColor: 0x3b0764, // Deep Singularity Void Purple
      trimColor: 0xc084fc, // Amethyst Horizon
      canopyColor: 0xa855f7, // Singularity Violet Glass
      canopyEmissive: 0x7c3aed,
      flameColor: 0xa855f7, // Dark Matter Ultraviolet Flame
      wingSpan: 0.98,
      wingSweep: 0.34,
      extraParts: [this.eventHorizonRing, coreMesh]
    });
  }

  bindEvents() {
    this.onMouseMove = (e) => {
      const rect = this.container.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const xNorm = ((e.clientX - rect.left) / this.width) * 2 - 1;
        const yNorm = -((e.clientY - rect.top) / this.height) * 2 + 1;
        this.mouse.x = Math.max(-15, Math.min(15, xNorm * 16));
        this.mouse.y = Math.max(-16, Math.min(8, yNorm * 12));
      }
    };

    this.onMouseDown = (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) {
        e.preventDefault();
        this.castAuxiliary();
      }
    };

    this.onMouseUp = (e) => {
      if (e.button === 0) this.mouse.isDown = false;
    };

    this.onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      // WASD / Arrow movement keys
      if (k === "w" || k === "arrowup") this.keys.w = true;
      if (k === "s" || k === "arrowdown") this.keys.s = true;
      if (k === "a" || k === "arrowleft") this.keys.a = true;
      if (k === "d" || k === "arrowright") this.keys.d = true;

      // Specific skill keys approved by user: Q, E, R, X
      if (["q", "e", "r", "x"].includes(k)) {
        this.castSkill(k.toUpperCase());
      }
      if (k === " " || k === "f") {
        this.castAuxiliary();
      }
      if (k === "escape") {
        this.extractSafely();
      }
    };

    this.onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") this.keys.w = false;
      if (k === "s" || k === "arrowdown") this.keys.s = false;
      if (k === "a" || k === "arrowleft") this.keys.a = false;
      if (k === "d" || k === "arrowright") this.keys.d = false;
    };

    this.onContextMenu = (e) => e.preventDefault();

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.container.addEventListener("contextmenu", this.onContextMenu);
  }

  destroy() {
    this.running = false;
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.container.removeEventListener("contextmenu", this.onContextMenu);
    try {
      if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
      if (this.renderer) {
        this.renderer.dispose();
      }
    } catch (e) {}
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.startWave(1);
    requestAnimationFrame(this.loop.bind(this));
  }

  startWave(waveNum) {
    this.wave = waveNum;
    this.waveTimer = 0;

    if (waveNum <= this.maxWaves) {
      this.waveState = "spawning";
      // 1. Open Spacetime Warp Rift (Cổng dịch chuyển xé rách không gian)
      this.createWarpRift();

      // 2. Spawn Blockade Squad (Tối thiểu 9 quái trở lên)
      const count = Math.max(9, 7 + waveNum * 2);
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (this.running && !this.boss) this.spawnBlockadeMinion(i, count);
        }, 400 + i * 350);
      }
    } else {
      // Wave 9 Cleared -> Spawn Epic Boss
      this.spawnBoss();
    }
  }

  createWarpRift() {
    sound.playSkill("portal_deflect");
    const riftGroup = new THREE.Group();

    // Spacetime Tear (Chromatic Ring)
    const tearGeo = new THREE.TorusGeometry(3.5, 0.35, 12, 32);
    const tearMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true });
    const tear = new THREE.Mesh(tearGeo, tearMat);
    tear.rotation.x = Math.PI / 2;
    riftGroup.add(tear);

    // Inner Singularity
    const innerGeo = new THREE.SphereGeometry(2.2, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x2e1065 });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    riftGroup.add(inner);

    riftGroup.position.set(0, 22, 0);
    this.scene.add(riftGroup);
    this.rifts.push({ group: riftGroup, timer: 4.5 });
  }

  buildFunnyChicken(archetypeKey, isBoss = false, bossData = null) {
    const group = new THREE.Group();
    const scale = isBoss ? 2.8 : 1.15;

    // Body Color & Theme
    let bodyColor = 0xf8fafc; // Classic white chicken
    let combColor = 0xef4444; // Red comb
    let beakColor = 0xf59e0b; // Yellow-orange beak

    if (archetypeKey === "siege_turret") {
      bodyColor = 0xea580c; // Fiery orange-red rooster
    } else if (archetypeKey === "void_interceptor") {
      bodyColor = 0x9333ea; // Alien purple void chicken
      combColor = 0x06b6d4; // Cyan neon comb
    } else if (archetypeKey === "aegis_drone") {
      bodyColor = 0xfef08a; // Cute baby chick yellow
    }

    if (isBoss) {
      bodyColor = bossData ? new THREE.Color(bossData.color) : 0xfbbf24;
      combColor = 0xff0055;
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.35,
      metalness: 0.1
    });

    const combMat = new THREE.MeshStandardMaterial({
      color: combColor,
      roughness: 0.25,
      emissive: combColor,
      emissiveIntensity: 0.25
    });

    const beakMat = new THREE.MeshStandardMaterial({
      color: beakColor,
      roughness: 0.2
    });

    // 1. Plump Oval Body
    const bodyGeo = new THREE.SphereGeometry(1.0, 16, 14);
    bodyGeo.scale(1.0, 1.25, 1.1);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // 2. Googly Big Eyes (Mắt to tròn ngơ ngác, con ngươi lé hài hước)
    const eyeWhiteGeo = new THREE.SphereGeometry(0.38, 12, 12);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeSparkleGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const eyeSparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left Eye
    const eyeL = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeL.position.set(-0.35, 0.46, 0.95);
    const pupilL = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    pupilL.position.set(-0.28, 0.46, 1.29); // Cross-eyed derp!
    const sparkleL = new THREE.Mesh(eyeSparkleGeo, eyeSparkleMat);
    sparkleL.position.set(-0.24, 0.52, 1.41);

    // Right Eye
    const eyeR = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeR.position.set(0.35, 0.46, 0.95);
    const pupilR = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    pupilR.position.set(0.28, 0.46, 1.29); // Cross-eyed derp!
    const sparkleR = new THREE.Mesh(eyeSparkleGeo, eyeSparkleMat);
    sparkleR.position.set(0.32, 0.52, 1.41);

    group.add(eyeL, pupilL, sparkleL, eyeR, pupilR, sparkleR);

    // 3. Orange Cone Beak & Red Wattle
    const beakGeo = new THREE.ConeGeometry(0.26, 0.7, 4);
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.08, 1.38);
    group.add(beak);

    // Red Wattle (Yếm gà đung đưa dưới mỏ)
    const wattleGeo = new THREE.SphereGeometry(0.16, 8, 8);
    wattleGeo.scale(0.8, 1.4, 0.8);
    const wattleL = new THREE.Mesh(wattleGeo, combMat);
    wattleL.position.set(-0.1, -0.25, 1.18);
    const wattleR = new THREE.Mesh(wattleGeo, combMat);
    wattleR.position.set(0.1, -0.25, 1.18);
    group.add(wattleL, wattleR);

    // 4. Red Rooster Comb (3 múi mào gà nhô cao)
    const combBump1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), combMat);
    combBump1.position.set(0, 1.25, 0.4);
    const combBump2 = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), combMat);
    combBump2.position.set(0, 1.48, 0.05);
    const combBump3 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), combMat);
    combBump3.position.set(0, 1.25, -0.3);
    group.add(combBump1, combBump2, combBump3);

    // 5. Flapping Chicken Wings (Cặp cánh gà vỗ phập phồng)
    const wingGeo = new THREE.BoxGeometry(0.14, 0.65, 1.05);
    const wingL = new THREE.Mesh(wingGeo, bodyMat);
    wingL.position.set(-1.12, 0.1, 0.1);

    const wingR = new THREE.Mesh(wingGeo, bodyMat);
    wingR.position.set(1.12, 0.1, 0.1);

    group.add(wingL, wingR);

    // 6. Orange Chicken Feet (Cặp chân gà vàng cam)
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.48, 6);
    const legL = new THREE.Mesh(legGeo, beakMat);
    legL.position.set(-0.35, -1.15, 0.0);
    const footGeo = new THREE.BoxGeometry(0.34, 0.06, 0.45);
    const footL = new THREE.Mesh(footGeo, beakMat);
    footL.position.set(-0.35, -1.35, 0.15);

    const legR = new THREE.Mesh(legGeo, beakMat);
    legR.position.set(0.35, -1.15, 0.0);
    const footR = new THREE.Mesh(footGeo, beakMat);
    footR.position.set(0.35, -1.35, 0.15);

    group.add(legL, footL, legR, footR);

    // 7. Funny Rear Tail Feathers
    const tail1 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 4), combMat);
    tail1.rotation.x = -0.55;
    tail1.position.set(0, 0.55, -1.2);
    const tail2 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.75, 4), bodyMat);
    tail2.rotation.x = -0.45;
    tail2.rotation.z = -0.3;
    tail2.position.set(-0.25, 0.45, -1.15);
    const tail3 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.75, 4), bodyMat);
    tail3.rotation.x = -0.45;
    tail3.rotation.z = 0.3;
    tail3.position.set(0.25, 0.45, -1.15);
    group.add(tail1, tail2, tail3);

    // 8. Custom Accessories according to archetype
    if (archetypeKey === "aegis_drone") {
      // Astronaut Fishbowl Bubble Helmet for Shield Chicken
      const helmetGeo = new THREE.SphereGeometry(1.3, 16, 16);
      const helmetMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        wireframe: true
      });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      group.add(helmet);
    } else if (archetypeKey === "siege_turret") {
      // Dual Egg Bazookas on its back
      const bazookaGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.2, 8);
      const bazookaMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
      const bazookaL = new THREE.Mesh(bazookaGeo, bazookaMat);
      bazookaL.rotation.x = Math.PI / 2;
      bazookaL.position.set(-0.7, 0.7, 0.2);
      const bazookaR = bazookaL.clone();
      bazookaR.position.x = 0.7;
      group.add(bazookaL, bazookaR);
    } else if (archetypeKey === "void_interceptor") {
      // Red Ninja Headband
      const headband = new THREE.Mesh(
        new THREE.TorusGeometry(0.95, 0.08, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      headband.position.set(0, 0.65, 0.05);
      group.add(headband);
    }

    // Boss Accessories (Giant Imperial Golden Crown)
    if (isBoss) {
      const crownGeo = new THREE.CylinderGeometry(0.7, 0.5, 0.55, 5);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.35
      });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(0, 1.7, 0.1);
      group.add(crown);
    }

    group.rotation.x = 0.25; // Lean slightly forward towards player
    group.scale.set(scale, scale, scale);

    return { group, wingL, wingR };
  }

  spawnFeatherBurst(x, y) {
    const featherCount = 8;
    for (let k = 0; k < featherCount; k++) {
      const geo = new THREE.PlaneGeometry(0.35, 0.6);
      const isGold = Math.random() < 0.3;
      const mat = new THREE.MeshBasicMaterial({
        color: isGold ? 0xffd700 : 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + (Math.random() - 0.5) * 0.8, y + (Math.random() - 0.5) * 0.8, 0);
      mesh.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(mesh);
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 3;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        rotSpd: (Math.random() - 0.5) * 10,
        life: 0.65
      });
    }

    // 60% chance to drop a delicious golden crispy roast chicken drumstick (đùi gà quay)!
    if (Math.random() < 0.6) {
      const drumstickGroup = new THREE.Group();
      const meat = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.2 })
      );
      meat.scale.set(0.9, 1.3, 0.9);
      const bone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.45, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      bone.position.set(0, -0.4, 0);
      drumstickGroup.add(meat, bone);
      drumstickGroup.position.set(x, y, 0);
      drumstickGroup.rotation.z = Math.random() * Math.PI;
      this.scene.add(drumstickGroup);
      this.particles.push({
        mesh: drumstickGroup,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -3.5, // Floats down towards player!
        rotSpd: 3.0,
        life: 3.5,
        isPickup: true
      });
    }
  }

  spawnBlockadeMinion(index, total) {
    const hpBase = (120 + this.wave * 35) * this.diff.hpMul;
    const dmg = (16 + this.wave * 4) * this.diff.dmgMul;

    // Pick minion archetype: Frontline Shield, Midline Artillery, Flanker Void
    let archetypeKey = "aegis_drone";
    if (index % 3 === 1) archetypeKey = "siege_turret";
    if (index % 3 === 2) archetypeKey = "void_interceptor";
    const archetype = BLOCKADE_MINIONS[archetypeKey] || BLOCKADE_MINIONS.aegis_drone;

    // Build funny 3D Space Chicken
    const chicken = this.buildFunnyChicken(archetypeKey, false);
    const group = chicken.group;

    // Target stop position for blockade formation (forming an impassable wall)
    const spacing = 28 / total;
    const targetX = (index - total / 2) * spacing;
    const targetY = archetype.stopY + (Math.random() - 0.5) * 2;

    group.position.set(targetX * 0.4, 22, 0);
    this.scene.add(group);

    this.enemies.push({
      mesh: group,
      wingL: chicken.wingL,
      wingR: chicken.wingR,
      archetype,
      hp: hpBase,
      maxHp: hpBase,
      damage: dmg,
      targetX,
      targetY,
      inPosition: false,
      hasShield: false,
      shieldTimer: 0,
      shootTimer: Math.random() * 2,
      skillTimer: Math.random() * 4 + 2,
      goldDrop: Math.round(18 * this.diff.goldRewardMul),
      diamondDrop: Math.random() < 0.25 ? 1 : 0
    });
  }

  spawnBoss() {
    this.waveState = "boss";
    const bossData = BOSS_ROSTER[this.map.bossId] || BOSS_ROSTER.frost_sovereign;

    // Giant Mother Chicken Boss
    const chicken = this.buildFunnyChicken("boss", true, bossData);
    const group = chicken.group;

    group.position.set(0, 24, 0);
    this.scene.add(group);

    const maxHp = bossData.maxHp * this.diff.hpMul;
    this.boss = {
      mesh: group,
      wingL: chicken.wingL,
      wingR: chicken.wingR,
      name: "ĐẠI BẠO CHÚA GÀ VŨ TRỤ (" + bossData.name + ")",
      hp: maxHp,
      maxHp,
      targetY: 10,
      skills: bossData.skills.slice(0, this.diff.bossSkillsCount),
      timer: 0,
      escalation: 0
    };

    sound.playExplosion(true);
    this.shake(25);
  }

  castSkill(key) {
    const skill = this.fighter.skills.find((s) => s.key === key);
    if (!skill || this.player.cooldowns[key] > 0) return;

    if (key === "R" && skill.requiresTideCloak) {
      if (this.cb.onTideCloakNuke) {
        this.cb.onTideCloakNuke(() => this.executeSkill(skill));
        return;
      }
    }
    this.executeSkill(skill);
  }

  executeSkill(skill) {
    this.player.cooldowns[skill.key] = skill.cooldown;
    sound.playSkill(skill.key === "R" ? "bomb" : skill.type);
    this.shake(skill.key === "R" ? 30 : 10);

    // 1. BÓNG MA VŨ TRỤ: [Q] CHUYỂN DẠNG NHẬT NGUYỆT
    if (skill.type === "transform_shift") {
      this.player.currentForm = this.player.currentForm === "phoenix" ? "moon" : "phoenix";
      this.player.stealth = true;
      this.player.stealthDuration = 2.0;

      // Update mesh colors
      if (this.phantomMats) {
        if (this.player.currentForm === "phoenix") {
          this.phantomMats.hullMat.color.setHex(0xff4500);
          this.phantomMats.trimMat.color.setHex(0xff9100);
          this.phantomMats.canopyMat.color.setHex(0xff6d00);
          this.phantomMats.canopyMat.emissive.setHex(0xd97706);
          this.phantomMats.flameMat.color.setHex(0xff3d00);
          if (this.lunarRings) this.lunarRings.visible = false;
        } else {
          this.phantomMats.hullMat.color.setHex(0x0e7490);
          this.phantomMats.trimMat.color.setHex(0x00e5ff);
          this.phantomMats.canopyMat.color.setHex(0x38bdf8);
          this.phantomMats.canopyMat.emissive.setHex(0x0284c7);
          this.phantomMats.flameMat.color.setHex(0x00e5ff);
          if (this.lunarRings) this.lunarRings.visible = true;
        }
      }
      return;
    }

    // 2. DEFENSIVE SHIELDS
    if (skill.type === "shield" || skill.type === "shield_regen") {
      this.player.shield = true;
      this.player.shieldDuration = skill.duration || 4;
      if (skill.type === "shield_regen") {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.maxHp * 0.3);
      }
    }

    // 3. WING EXPAND BUFF (BÃO LỬA ĐỊA NGỤC)
    if (skill.type === "wing_expand_buff") {
      this.player.wingsExpanded = true;
      this.player.wingsDuration = skill.duration || 6;
      if (this.hellfireWingsGroup) {
        this.hellfireWingsGroup.scale.set(1.4, 1.4, 1.4);
      }
    }

    // 4. TITAN MEGA-BEAM / LASER BEAM
    if (skill.type === "laser_beam") {
      this.player.laserBeam = true;
      this.player.laserBeamDuration = skill.duration || 3;
      this.laserBeamMesh.visible = true;
    }

    // 5. SCREEN NUKES (TSAR BOMBA / ECLIPSE / THANH LONG / SUPERNOVA)
    if (
      skill.type === "screen_nuke" ||
      skill.type === "eclipse_nuke" ||
      skill.type === "azure_dragon_nuke" ||
      skill.type === "freeze_all_nuke" ||
      skill.type === "inferno_nuke" ||
      skill.type === "spacetime_rift_nuke" ||
      skill.key === "R"
    ) {
      this.enemies.forEach((e) => {
        e.hp -= 6500;
        this.runGold += e.goldDrop;
      });
      this.enemyBullets.forEach((eb) => this.scene.remove(eb.mesh));
      this.enemyBullets = [];
      if (this.boss) {
        this.boss.hp -= 6500;
      }
    }

    // 6. BARRAGE / DRONES / MINES
    if (skill.type === "barrage" || skill.type === "fire_column") {
      for (let i = -7; i <= 7; i++) {
        this.createBullet(this.player.x, this.player.y, i * 0.35, 0.95, this.fighter.bullet.damage * 1.6);
      }
    } else if (skill.type === "chain_lightning_mines") {
      for (let i = -1; i <= 1; i++) {
        const mMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
        mMesh.position.set(this.player.x + i * 4, this.player.y + 3, 0);
        this.scene.add(mMesh);
        this.mines.push({ mesh: mMesh, timer: 5.0 });
      }
    } else if (skill.type === "dash_blade" || skill.type === "turbo_dash" || skill.type === "aurora_dash") {
      // Supersonic Dash Forward
      this.player.targetY = Math.min(10, this.player.y + 12);
      this.player.shield = true;
      this.player.shieldDuration = 1.5;
    }
  }

  castAuxiliary() {
    if (this.player.cooldowns.AUX > 0) return;
    this.player.cooldowns.AUX = 30; // 30s Cooldown
    sound.playSkill("shield");

    if (this.auxType === "shield_2s") {
      this.player.shield = true;
      this.player.shieldDuration = 2.0;
    } else {
      // Tsar Support Fleet
      for (let i = 0; i < 4; i++) {
        const dMesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 4), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
        dMesh.position.set(this.player.x + (i - 1.5) * 2.5, this.player.y - 2, 0);
        this.scene.add(dMesh);
        this.drones.push({ mesh: dMesh, timer: 6.0, offset: (i - 1.5) * 2.5 });
      }
    }
  }

  shake(amount) {
    this.shakeAmount = amount;
  }

  createBullet(x, y, vx, vy, dmg) {
    const geo = new THREE.CylinderGeometry(0.14, 0.14, 1.3, 6);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.fighter.bullet.color) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 1, 0);
    this.scene.add(mesh);
    this.bullets.push({ mesh, vx, vy, damage: dmg });
  }

  createEnemyBullet(x, y, vx, vy, color = 0xfffbeb) {
    // Glowing Space Egg Projectile!
    const geo = new THREE.SphereGeometry(0.32, 10, 10);
    geo.scale(0.8, 1.25, 0.8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.random() * Math.PI;
    mesh.position.set(x, y - 0.5, 0);
    this.scene.add(mesh);
    this.enemyBullets.push({ mesh, vx, vy, damage: 22 * this.diff.dmgMul });
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // 0. Smooth vertical background texture scrolling
    if (this.bgTexture) {
      this.bgTexture.offset.y += dt * 0.08;
    }

    // 1. KEYBOARD WASD / ARROW MOVEMENT
    const moveSpeed = this.fighter.speed * dt * 3.2;
    if (this.keys.w) this.player.targetY = Math.min(10, this.player.targetY + moveSpeed);
    if (this.keys.s) this.player.targetY = Math.max(-18, this.player.targetY - moveSpeed);
    if (this.keys.a) this.player.targetX = Math.max(-16, this.player.targetX - moveSpeed);
    if (this.keys.d) this.player.targetX = Math.min(16, this.player.targetX + moveSpeed);

    // Mouse Steering Blend
    this.player.targetX += (this.mouse.x - this.player.targetX) * 0.05;
    this.player.targetY += (this.mouse.y - this.player.targetY) * 0.05;

    // Smooth Ship Lerp
    const dx = this.player.targetX - this.player.x;
    const dy = this.player.targetY - this.player.y;
    this.player.x += dx * 0.18;
    this.player.y += dy * 0.18;
    this.playerGroup.position.set(this.player.x, this.player.y, 0);

    // Smooth Banking & Pitch Kinematics
    const targetRoll = -dx * 0.06;
    const targetPitch = dy * 0.04;
    this.rollAngle += (targetRoll - this.rollAngle) * 0.15;
    this.pitchAngle += (targetPitch - this.pitchAngle) * 0.15;

    this.playerGroup.rotation.z = this.rollAngle;
    this.playerGroup.rotation.x = Math.PI / 2 + this.pitchAngle;

    // Dynamic Thruster Flames Pulsing & Flicker
    if (this.thrusterFlames && this.thrusterFlames.length > 0) {
      const flicker = 0.85 + Math.random() * 0.35;
      for (let flame of this.thrusterFlames) {
        flame.scale.set(1, flicker, 1);
      }
    }

    // Rotating Event Horizon Ring (if Chronos)
    if (this.eventHorizonRing) {
      this.eventHorizonRing.rotation.z += 0.05;
    }

    // Shield status
    this.shieldMesh.visible = this.player.shield;
    if (this.player.shield) {
      this.shieldMesh.rotation.y += 0.08;
      this.player.shieldDuration -= dt;
      if (this.player.shieldDuration <= 0) this.player.shield = false;
    }

    // Wing Expand duration
    if (this.player.wingsExpanded) {
      this.player.wingsDuration -= dt;
      if (this.player.wingsDuration <= 0) {
        this.player.wingsExpanded = false;
        if (this.hellfireWingsGroup) this.hellfireWingsGroup.scale.set(1, 1, 1);
      }
    }

    // Laser Beam duration
    if (this.player.laserBeam) {
      this.player.laserBeamDuration -= dt;
      if (this.player.laserBeamDuration <= 0) {
        this.player.laserBeam = false;
        this.laserBeamMesh.visible = false;
      } else {
        // Laser deals continuous damage to enemies
        this.enemies.forEach((e) => {
          if (Math.abs(e.mesh.position.x - this.player.x) < 2.0 && e.mesh.position.y > this.player.y) {
            e.hp -= 200 * dt;
          }
        });
        if (this.boss && Math.abs(this.boss.mesh.position.x - this.player.x) < 3.5) {
          this.boss.hp -= 250 * dt;
        }
      }
    }

    // Cooldown countdowns
    for (let k in this.player.cooldowns) {
      if (this.player.cooldowns[k] > 0) {
        this.player.cooldowns[k] = Math.max(0, this.player.cooldowns[k] - dt);
      }
    }

    // Environmental Burn Aura (Hard: 0.2%/s, Hell: 0.5%/s)
    if (this.boss && this.diff.burnRate > 0 && !this.player.shield) {
      this.player.hp -= this.player.maxHp * this.diff.burnRate * dt;
      if (this.player.hp <= 0) {
        this.handleDeath();
        return;
      }
    }

    // Auto-fire Player Bullets
    const tNow = performance.now();
    if (this.mouse.isDown && tNow - this.player.lastShotTime > this.fighter.bullet.fireRate) {
      sound.playLaser(680);
      const dmgMultiplier = this.player.wingsExpanded ? 1.5 : 1.0;
      this.createBullet(this.player.x - 0.8, this.player.y, 0, 0.9, this.fighter.bullet.damage * dmgMultiplier);
      this.createBullet(this.player.x + 0.8, this.player.y, 0, 0.9, this.fighter.bullet.damage * dmgMultiplier);
      if (this.player.wingsExpanded) {
        this.createBullet(this.player.x - 2.2, this.player.y - 0.4, -0.15, 0.85, this.fighter.bullet.damage * 0.75);
        this.createBullet(this.player.x + 2.2, this.player.y - 0.4, 0.15, 0.85, this.fighter.bullet.damage * 0.75);
      }
      this.player.lastShotTime = tNow;
    }

    // Update Warp Rifts
    for (let i = this.rifts.length - 1; i >= 0; i--) {
      const r = this.rifts[i];
      r.group.rotation.z += 0.06;
      r.timer -= dt;
      if (r.timer <= 0) {
        this.scene.remove(r.group);
        this.rifts.splice(i, 1);
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.mesh.position.x += b.vx;
      b.mesh.position.y += b.vy;
      if (b.mesh.position.y > 28) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }

    // Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.mesh.position.x += eb.vx;
      eb.mesh.position.y += eb.vy;

      // Hit Player Check
      const dist = eb.mesh.position.distanceTo(this.playerGroup.position);
      if (dist < 1.8 && !this.player.stealth) {
        if (this.player.shield) {
          sound.playSkill("shield");
        } else {
          this.player.hp -= eb.damage;
          this.shake(9);
          sound.playExplosion(false);
          if (this.player.hp <= 0) {
            this.handleDeath();
            return;
          }
        }
        this.scene.remove(eb.mesh);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (eb.mesh.position.y < -24) {
        this.scene.remove(eb.mesh);
        this.enemyBullets.splice(i, 1);
      }
    }

    // Update Blockade Enemies (Funny 3D Space Chickens)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Flap chicken wings comically!
      if (e.wingL && e.wingR) {
        const flap = Math.sin(tNow * 0.016 + i * 1.5) * 0.55;
        e.wingL.rotation.z = flap;
        e.wingR.rotation.z = -flap;
      }

      // Move into formation, then STOP and hold blockade position!
      if (!e.inPosition) {
        const dx = e.targetX - e.mesh.position.x;
        const dy = e.targetY - e.mesh.position.y;
        e.mesh.position.x += dx * 0.08;
        e.mesh.position.y += dy * 0.08;
        if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
          e.inPosition = true;
        }
      } else {
        // Comical hovering & waddling!
        e.mesh.position.x = e.targetX + Math.sin(tNow * 0.003 + i) * 0.45;
        e.mesh.position.y = e.targetY + Math.cos(tNow * 0.003 + i) * 0.35;
        e.mesh.rotation.z = Math.sin(tNow * 0.004 + i) * 0.15;
      }

      // Enemy Basic Attack (Shooting glowing eggs)
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        this.createEnemyBullet(e.mesh.position.x, e.mesh.position.y, 0, -0.26, e.archetype.basicAttack.bulletColor || 0xfffbeb);
        e.shootTimer = (e.archetype.basicAttack.interval / 1000) * (Math.random() * 0.4 + 0.8);
      }

      // Enemy Active Skill Cast
      e.skillTimer -= dt;
      if (e.skillTimer <= 0) {
        if (e.archetype.type === "blockade_artillery") {
          // Siege Turret: 8-egg spread barrage
          for (let k = -2; k <= 2; k++) {
            this.createEnemyBullet(e.mesh.position.x, e.mesh.position.y, k * 0.12, -0.24, 0xfef08a);
          }
        } else if (e.archetype.type === "blockade_shield") {
          // Aegis Drone: Repulsor wave
          this.createEnemyBullet(e.mesh.position.x, e.mesh.position.y, (Math.random() - 0.5) * 0.2, -0.3, 0x38bdf8);
        } else {
          // Void Interceptor: Mine Drop
          this.createEnemyBullet(e.mesh.position.x, e.mesh.position.y, (Math.random() - 0.5) * 0.3, -0.15, 0xc084fc);
        }
        e.skillTimer = 5.0 + Math.random() * 3;
      }

      // Check Bullet Collisions
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (e.mesh.position.distanceTo(b.mesh.position) < 1.4) {
          e.hp -= b.damage;
          this.scene.remove(b.mesh);
          this.bullets.splice(j, 1);
          if (e.hp <= 0) break;
        }
      }

      // Enemy Destroyed (Feather Burst & Roast Chicken Drumstick Drop)
      if (e.hp <= 0) {
        sound.playExplosion(false);
        this.score += 100;
        this.runGold += e.goldDrop;
        this.runDiamonds += e.diamondDrop;
        this.spawnFeatherBurst(e.mesh.position.x, e.mesh.position.y);
        this.scene.remove(e.mesh);
        this.enemies.splice(i, 1);
      }
    }

    // Update Particles (Feather bursts & roast chicken drumstick drops)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.rotation.z += p.rotSpd * dt;

      // Pickup roast chicken drumsticks!
      if (p.isPickup) {
        if (p.mesh.position.distanceTo(this.playerGroup.position) < 2.5) {
          this.runGold += 35;
          try { sound.playLaser(950, 0.08); } catch (err) {}
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
          continue;
        }
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // Wave Progression Check
    if (this.waveState === "spawning" && this.enemies.length === 0 && this.rifts.length === 0) {
      if (this.wave < this.maxWaves) {
        this.startWave(this.wave + 1);
      } else {
        this.spawnBoss();
      }
    }

    // Boss Loop
    if (this.boss) {
      this.updateBoss(dt, tNow);
    }

    // Parallax Starfield & Cosmic Debris
    this.stars.position.y -= 0.12;
    if (this.stars.position.y < -35) this.stars.position.y = 35;

    this.debrisGroup.children.forEach((d) => {
      d.position.y -= 0.08;
      d.rotation.x += d.rotSpeed.x;
      d.rotation.y += d.rotSpeed.y;
      if (d.position.y < -35) d.position.y = 35;
    });

    // 3D Chase Camera tracking ship with subtle lag
    this.camera.position.x = this.player.x * 0.35;
    this.camera.position.y = this.player.y - 8;
    this.camera.lookAt(this.player.x * 0.2, this.player.y + 12, 0);

    // Camera Shake
    if (this.shakeAmount > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmount * 0.04;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeAmount * 0.04;
      this.shakeAmount -= dt * 25;
    }

    // Report stats to React In-Game HUD
    if (this.cb.onUpdateStats) {
      this.cb.onUpdateStats({
        hp: Math.max(0, Math.round(this.player.hp)),
        maxHp: this.player.maxHp,
        score: this.score,
        runGold: this.runGold,
        runDiamonds: this.runDiamonds,
        wave: this.wave,
        remainingEnemies: this.enemies.length,
        cooldowns: this.player.cooldowns,
        currentForm: this.player.currentForm,
        bossHp: this.boss ? Math.round(this.boss.hp) : null,
        bossMaxHp: this.boss ? this.boss.maxHp : null,
        bossName: this.boss ? this.boss.name : null,
        burnActive: this.boss && this.diff.burnRate > 0
      });
    }
  }

  updateBoss(dt, tNow) {
    const b = this.boss;
    // Comical giant boss wings flap & waddle
    if (b.wingL && b.wingR) {
      const bossFlap = Math.sin(tNow * 0.012) * 0.55;
      b.wingL.rotation.z = bossFlap;
      b.wingR.rotation.z = -bossFlap;
    }
    b.mesh.rotation.z = Math.sin(tNow * 0.002) * 0.12;

    if (b.mesh.position.y > b.targetY) b.mesh.position.y -= 0.06;
    b.mesh.position.x = Math.sin(tNow * 0.001) * 12;

    // Hell mode arithmetic progression of skill speed
    if (this.diff.id === "hell") {
      b.escalation += dt * 0.025;
    }

    b.timer += dt;
    const effectiveCd = Math.max(0.65, this.bossSkillCooldown - b.escalation);
    if (b.timer > effectiveCd) {
      this.castBossSkill(b);
      b.timer = 0;
    }

    // Check Bullet Hits on Boss
    for (let j = this.bullets.length - 1; j >= 0; j--) {
      const bull = this.bullets[j];
      if (b.mesh.position.distanceTo(bull.mesh.position) < 3.8) {
        b.hp -= bull.damage;
        this.scene.remove(bull.mesh);
        this.bullets.splice(j, 1);
      }
    }

    if (b.hp <= 0) {
      sound.playExplosion(true);
      this.shake(35);
      this.spawnFeatherBurst(b.mesh.position.x, b.mesh.position.y);
      this.spawnFeatherBurst(b.mesh.position.x - 2, b.mesh.position.y + 1);
      this.spawnFeatherBurst(b.mesh.position.x + 2, b.mesh.position.y - 1);
      this.scene.remove(b.mesh);
      this.boss = null;
      this.runGold += 6000 * this.diff.goldRewardMul;
      this.runDiamonds += this.diff.diamondReward;
      setTimeout(() => this.handleVictory(), 2000);
    }
  }

  castBossSkill(b) {
    sound.playLaser(320);
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.createEnemyBullet(b.mesh.position.x, b.mesh.position.y, Math.cos(angle) * 0.3, Math.sin(angle) * 0.3);
    }
  }

  handleDeath() {
    this.running = false;
    sound.playExplosion(true);
    // Hardcore Permadeath: Ship is broken, in-run loot is LOST!
    if (this.cb.onGameOver) {
      this.cb.onGameOver({
        isWin: false,
        score: this.score,
        lostGold: this.runGold,
        lostDiamonds: this.runDiamonds,
        shipDamaged: true
      });
    }
  }

  handleVictory() {
    this.running = false;
    if (this.cb.onGameOver) {
      this.cb.onGameOver({
        isWin: true,
        score: this.score,
        savedGold: this.runGold,
        savedDiamonds: this.runDiamonds,
        shipDamaged: false
      });
    }
  }

  extractSafely() {
    this.running = false;
    try {
      sound.playSkill("shield");
    } catch (e) {}
    if (this.cb && this.cb.onGameOver) {
      try {
        this.cb.onGameOver({
          isWin: true,
          isExtracted: true,
          score: this.score,
          savedGold: this.runGold,
          savedDiamonds: this.runDiamonds,
          shipDamaged: false
        });
      } catch (err) {
        console.error("onGameOver error:", err);
      }
    }
  }
}
