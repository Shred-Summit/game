import * as THREE from 'three';

// Deterministic pseudo-random number generator (mulberry32)
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const PARK_CONFIGS = {
  'big-white': {
    name: 'BIG WHITE TELUS PARK',
    checkpointCount: 8, checkpointInterval: 600,
    railWidthScale: 1,
    railTypes: ['parkRail'],
    zones: {
      1: {
        medium: { feet: 40, lipHeight: 2.7, lipAngle: 0.55 },
        small:  { feet: 30, lipHeight: 2.0, lipAngle: 0.45 },
        big:    { feet: 60, lipHeight: 4.0, lipAngle: 0.65 },
      },
      2: {
        medium: { feet: 100, lipHeight: 6.75, lipAngle: 0.55 },
        small:  { feet: 75,  lipHeight: 5.0,  lipAngle: 0.45 },
        big:    { feet: 150, lipHeight: 10.0, lipAngle: 0.65 },
      },
    },
    zoneThreshold: -2400,
    booterFeet: 200, booterPositions: [-3950, -4200],
    railsPerChunk: [6, 10],
  },
  'woodward': {
    name: 'WOODWARD COPPER PARK',
    checkpointCount: 6, checkpointInterval: 600,
    railWidthScale: 1,
    railTypes: ['kinkRail', 'flatDownFlat', 'down', 'cRail', 'flat'],
    zones: {
      1: {
        medium: { feet: 100, lipHeight: 6.75, lipAngle: 0.55 },
        small:  { feet: 75,  lipHeight: 5.0,  lipAngle: 0.50 },
        big:    { feet: 125, lipHeight: 8.5,  lipAngle: 0.60 },
      },
      2: {
        medium: { feet: 125, lipHeight: 8.5,  lipAngle: 0.60 },
        small:  { feet: 100, lipHeight: 6.75, lipAngle: 0.55 },
        big:    { feet: 150, lipHeight: 10.0, lipAngle: 0.65 },
      },
    },
    zoneThreshold: -1800,
    booterFeet: 150, booterPositions: [-3000, -3250],
    railsPerChunk: [6, 10],
  },
  'xgames': {
    name: 'X-GAMES PARK',
    checkpointCount: 6, checkpointInterval: 600,
    railWidthScale: 1,
    railTypes: ['kinkRail', 'downFlatDown', 'down', 'donkeyDick', 'waterfall'],
    zones: {
      1: {
        medium: { feet: 150, lipHeight: 10.0, lipAngle: 0.60 },
        small:  { feet: 125, lipHeight: 8.5,  lipAngle: 0.55 },
        big:    { feet: 200, lipHeight: 13.5, lipAngle: 0.65 },
      },
      2: {
        medium: { feet: 200, lipHeight: 13.5, lipAngle: 0.65 },
        small:  { feet: 150, lipHeight: 10.0, lipAngle: 0.60 },
        big:    { feet: 200, lipHeight: 13.5, lipAngle: 0.65 },
      },
    },
    zoneThreshold: -1800,
    booterFeet: 200, booterPositions: [-3000, -3250],
    railsPerChunk: [8, 12],
    heavyKinks: true,
  },
  'street': {
    name: 'HEAVY METAL STREET',
    checkpointCount: 6, checkpointInterval: 600,
    railWidthScale: 1,
    railTypes: ['ledge', 'stairRail', 'hubbaLedge', 'flatDownFlat', 'kinkRail'],
    isStreet: true,
    zones: {
      1: {
        medium: { feet: 30, lipHeight: 2.0, lipAngle: 0.45 },
        small:  { feet: 20, lipHeight: 1.5, lipAngle: 0.40 },
        big:    { feet: 45, lipHeight: 2.5, lipAngle: 0.50 },
      },
      2: {
        medium: { feet: 50, lipHeight: 3.0, lipAngle: 0.50 },
        small:  { feet: 35, lipHeight: 2.0, lipAngle: 0.45 },
        big:    { feet: 65, lipHeight: 4.0, lipAngle: 0.55 },
      },
    },
    zoneThreshold: -1800,
    booterFeet: 100, booterPositions: [-3000, -3250],
    railsPerChunk: [8, 12],
  },
  'slopestyle': {
    name: 'SLOPESTYLE COURSE',
    checkpointCount: 6, checkpointInterval: 600,
    railWidthScale: 1,
    railTypes: ['kinkRail', 'downFlatDown', 'flatDownFlat', 'waterfall', 'donkeyDick'],
    zones: {
      1: {
        medium: { feet: 60,  lipHeight: 4.0,  lipAngle: 0.55 },
        small:  { feet: 45,  lipHeight: 3.0,  lipAngle: 0.50 },
        big:    { feet: 80,  lipHeight: 5.5,  lipAngle: 0.60 },
      },
      2: {
        medium: { feet: 100, lipHeight: 6.75, lipAngle: 0.60 },
        small:  { feet: 75,  lipHeight: 5.0,  lipAngle: 0.55 },
        big:    { feet: 125, lipHeight: 8.5,  lipAngle: 0.65 },
      },
      3: {
        medium: { feet: 150, lipHeight: 10.0, lipAngle: 0.65 },
        small:  { feet: 125, lipHeight: 8.5,  lipAngle: 0.60 },
        big:    { feet: 200, lipHeight: 13.5, lipAngle: 0.65 },
      },
    },
    zoneThreshold: -1200,
    zone3Threshold: -2400,
    booterFeet: 250, booterPositions: [-3200, -3500],
    railsPerChunk: [4, 6],
    fixedLayout: true,
  },
};

export class Terrain {
  constructor(scene, seed = null, parkId = 'big-white', nightMode = false) {
    this.scene = scene;
    this.parkId = parkId;
    this.nightMode = nightMode;
    this.config = PARK_CONFIGS[parkId] || PARK_CONFIGS['big-white'];
    // Seeded RNG for deterministic terrain in multiplayer
    this.rng = seed != null ? mulberry32(seed) : null;
    this.chunks = [];
    this.chunkLength = 300;
    this.chunkWidth = 120;
    this.slopeAngle = 0.28;
    this.chunksGenerated = 0;
    this.obstacles = [];
    this.ramps = [];
    this.exclusionZones = []; // global across all chunks { x, zStart, zEnd, halfWidth }
    this.checkpoints = [];
    this.checkpointCount = this.config.checkpointCount;
    this.checkpointInterval = this.config.checkpointInterval;
    this.nextCheckpointZ = -300;

    // Materials — smooth, realistic snow
    this.snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xeaf0f6, roughness: 0.75, metalness: 0.02,
    });

    this.treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a, roughness: 1.0, flatShading: true,
    });

    this.darkTreeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f2a0f, roughness: 1.0, flatShading: true,
    });

    this.trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f, roughness: 1.0,
    });

    this.rampMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8ddef, roughness: 0.3, metalness: 0.05, flatShading: true,
    });

    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a6672, roughness: 0.95, flatShading: true,
    });

    this.metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc, metalness: 0.9, roughness: 0.1,
    });

    this.rustyMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x998877, metalness: 0.7, roughness: 0.3,
    });

    this.paintedMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x2266cc, metalness: 0.6, roughness: 0.2,
    });

    this.poleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600, roughness: 0.6,
    });

    // Street park materials
    this.concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777, roughness: 0.9, metalness: 0.0, flatShading: true,
    });
    this.metalRailMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc, roughness: 0.3, metalness: 0.6,
    });
    this.buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555, roughness: 0.85, metalness: 0.0,
    });
    this.windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd88, emissive: 0xffdd88, emissiveIntensity: 0.3,
    });
    this.barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0xdd3333, roughness: 0.6, metalness: 0.1,
    });

    // Floodlight materials (used day and night, but lights only active at night)
    this.floodlightPoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555, roughness: 0.7, metalness: 0.3,
    });
    this.floodlightHeadMaterial = new THREE.MeshStandardMaterial({
      color: nightMode ? 0xffeedd : 0x888888,
      emissive: nightMode ? 0xffeedd : 0x000000,
      emissiveIntensity: nightMode ? 1.0 : 0,
      roughness: 0.3, metalness: 0.5,
    });

    // Night mode: slight blue tint on snow, brighter windows
    if (nightMode) {
      this.snowMaterial.color.set(0xc0ccdd);
      this.rampMaterial.color.set(0xb0c0d8);
      this.windowMaterial.emissiveIntensity = 1.0;
    }

    for (let i = 0; i < 5; i++) {
      this.generateChunk();
    }
  }

  // Deterministic random when seeded, otherwise Math.random
  rand() {
    return this.rng ? this.rng() : Math.random();
  }

  generateChunk() {
    const zOffset = -this.chunksGenerated * this.chunkLength;
    const yOffset = -this.chunksGenerated * this.chunkLength * this.slopeAngle;

    // Higher resolution for smooth snow surface
    const geometry = new THREE.PlaneGeometry(this.chunkWidth, this.chunkLength, 120, 120);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const globalZ = zOffset + z;

      // Use global coordinates for continuous terrain across chunks
      const globalHeight = this.computeHeight(x, globalZ);
      positions.setY(i, globalHeight - yOffset);

      // Subtle snow color variation — whites and light blues
      const normalizedX = Math.abs(x) / (this.chunkWidth / 2);
      if (this.config.isStreet) {
        // Snow-on-asphalt: darker base with occasional dark pavement patches
        const base = 0.82 + Math.sin(x * 0.1 + globalZ * 0.05) * 0.04;
        const patch = Math.sin(x * 0.3 + globalZ * 0.2) * Math.sin(x * 0.17 + globalZ * 0.13);
        const dark = patch > 0.6 ? 0.12 : 0;
        colors[i * 3] = base - dark;
        colors[i * 3 + 1] = base - dark;
        colors[i * 3 + 2] = base - dark + 0.01;
      } else {
        const base = 0.92 + Math.sin(x * 0.1 + globalZ * 0.05) * 0.04;
        const blueShift = normalizedX > 0.5 ? 0.02 : 0;
        colors[i * 3] = base - blueShift;
        colors[i * 3 + 1] = base + 0.01;
        colors[i * 3 + 2] = base + blueShift * 2 + 0.02;
      }
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = this.snowMaterial.clone();
    material.vertexColors = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, yOffset, zOffset);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const chunk = { mesh, zOffset, yOffset, objects: [] };

    // Exclusion zones — global, persists across chunks

    // Features: jumps and rails
    // Determine zone level for this chunk
    const chunkMidZ = zOffset - this.chunkLength / 2;
    const zoneLevel = this.getZoneLevel(chunkMidZ);

    // --- Slopestyle fixed layout: section-based feature placement ---
    // Rail sections get only rails (no jumps), jump sections get only jumps
    const isFixedLayout = this.config.fixedLayout;
    let fixedSection = null; // 'rails' | 'jumps'
    if (isFixedLayout) {
      // 0 to -600: rails, -600 to -1200: jumps, -1200 to -1800: rails,
      // -1800 to -2400: jumps, -2400 to -3000: jumps (big), -3000+: booters
      const absZ = Math.abs(chunkMidZ);
      if (absZ < 600) fixedSection = 'rails';
      else if (absZ < 1200) fixedSection = 'jumps';
      else if (absZ < 1800) fixedSection = 'rails';
      else fixedSection = 'jumps';
    }

    // --- Phase 1: Jump pairs (left = medium, right = small/big) ---
    // Zone 2 jumps are much bigger (~167 unit footprint for 150ft) —
    // use a single slot per chunk so they don't overlap with landings
    const jumpSlots = (isFixedLayout && fixedSection === 'rails') ? [] : [-150];
    const zoneConfig = this.config.zones[zoneLevel];
    const jumpDefs = {
      medium: { ...zoneConfig.medium, size: 'medium' },
      small:  { ...zoneConfig.small,  size: 'small' },
      big:    { ...zoneConfig.big,    size: 'big' },
    };

    for (const slotZ of jumpSlots) {
      const featureGlobalZ = zOffset + slotZ;
      // Stop regular jumps before the massive booter zone
      const booterStopZ = this.config.booterPositions[0] + 50;
      if (featureGlobalZ <= booterStopZ) continue;
      // Past zone threshold → right jump is big, otherwise small
      const pastCP4 = featureGlobalZ <= this.config.zoneThreshold;
      const pair = [
        { def: jumpDefs.medium, x: -12 },  // left = always medium
        { def: pastCP4 ? jumpDefs.big : jumpDefs.small, x: 12 }, // right = small or big
      ];

      for (const { def, x } of pair) {
        const feature = this.createJump(def.feet);
        const type = 'kicker';
        const scale = def.feet / 30;
        const width = 4.0 * scale;   // match createJump's rampWidth
        const length = 5.0 * scale;  // match createJump's rampLength
        const { size, lipHeight, lipAngle } = def;

        // Embed in terrain
        const halfW = width / 2;
        const halfL = length / 2;
        let minY = Infinity;
        for (const sx of [-halfW, 0, halfW]) {
          for (const sz of [-halfL, -halfL / 2, 0, halfL / 2, halfL]) {
            const h = this.computeHeight(x + sx, featureGlobalZ + sz);
            if (h < minY) minY = h;
          }
        }
        minY -= 0.3;

        feature.position.set(x, minY, featureGlobalZ);
        this.scene.add(feature);
        chunk.objects.push(feature);
        const rampData = {
          mesh: feature,
          position: new THREE.Vector3(x, minY, featureGlobalZ),
          type, width, length, size, lipHeight, lipAngle, surfaceHeight: 0,
        };

        if (feature.userData.landing) {
          const ld = feature.userData.landing;
          const lipZ = featureGlobalZ - length / 2;
          // Landing starts after the air gap (space between lip and landing surface)
          rampData.landingZoneStartZ = lipZ - (ld.airGap || 0);
          rampData.landingZoneEndZ = lipZ - (ld.airGap || 0) - ld.gap - ld.length;
          // Landing hitbox heights from the visual mesh's local coordinates + ramp world Y
          // This ensures collision surface matches the visible landing surface exactly
          rampData.landingTopHeight = minY + ld.topLocalY;
          rampData.landingBottomHeight = minY + ld.endLocalY;
          rampData.landingWidth = ld.width;
          rampData.landingGap = ld.gap;
          rampData.landingLength = ld.length;
        }

        this.ramps.push(rampData);

        // Exclusion zone: ramp body + landing zone + 6 unit buffer (~20ft)
        const buffer = 6;
        const zTop = featureGlobalZ + length / 2 + buffer; // uphill of ramp
        let zBottom = featureGlobalZ - length / 2 - buffer; // downhill of ramp
        if (rampData.landingZoneEndZ) {
          zBottom = rampData.landingZoneEndZ - buffer; // extend through landing
        }
        this.exclusionZones.push({ x, zStart: zBottom, zEnd: zTop, halfWidth: width / 2 + buffer });
      }
    }

    // --- FINAL BOOTERS: massive jumps back to back before finish line ---
    for (const booterGlobalZ of this.config.booterPositions) {
      if (booterGlobalZ < zOffset - this.chunkLength || booterGlobalZ >= zOffset) continue;

      const booterFeet = this.config.booterFeet;
      const feature = this.createJump(booterFeet);
      const bScale = booterFeet / 30;
      const bWidth = 4.0 * bScale;
      const bLength = 5.0 * bScale;
      const bx = 0; // centered on the run

      // Embed in terrain
      const bHalfW = bWidth / 2;
      const bHalfL = bLength / 2;
      let bMinY = Infinity;
      for (const sx of [-bHalfW, 0, bHalfW]) {
        for (const sz of [-bHalfL, -bHalfL / 2, 0, bHalfL / 2, bHalfL]) {
          const h = this.computeHeight(bx + sx, booterGlobalZ + sz);
          if (h < bMinY) bMinY = h;
        }
      }
      bMinY -= 0.3;

      feature.position.set(bx, bMinY, booterGlobalZ);
      this.scene.add(feature);
      chunk.objects.push(feature);

      const booterData = {
        mesh: feature,
        position: new THREE.Vector3(bx, bMinY, booterGlobalZ),
        type: 'kicker', width: bWidth, length: bLength, size: 'massive',
        lipHeight: 2.0 * bScale, lipAngle: 0.65, surfaceHeight: 0,
      };

      if (feature.userData.landing) {
        const ld = feature.userData.landing;
        const lipZ = booterGlobalZ - bLength / 2;
        booterData.landingZoneStartZ = lipZ - (ld.airGap || 0);
        booterData.landingZoneEndZ = lipZ - (ld.airGap || 0) - ld.gap - ld.length;
        // Landing hitbox heights from the visual mesh's local coordinates + ramp world Y
        booterData.landingTopHeight = bMinY + ld.topLocalY;
        booterData.landingBottomHeight = bMinY + ld.endLocalY;
        booterData.landingWidth = ld.width;
        booterData.landingGap = ld.gap;
        booterData.landingLength = ld.length;
      }

      this.ramps.push(booterData);

      // Big exclusion zone around the entire booter
      const bBuffer = 12;
      const bZTop = booterGlobalZ + bLength / 2 + bBuffer;
      let bZBottom = booterGlobalZ - bLength / 2 - bBuffer;
      if (booterData.landingZoneEndZ) {
        bZBottom = booterData.landingZoneEndZ - bBuffer;
      }
      this.exclusionZones.push({ x: bx, zStart: bZBottom, zEnd: bZTop, halfWidth: bWidth / 2 + bBuffer });
    }

    // --- Phase 2: Park rails with entry lips ---
    // Skip rails in slopestyle jump sections
    const skipRails = isFixedLayout && fixedSection === 'jumps';
    // Helper: check if a position overlaps any exclusion zone (jumps + landings)
    const isInExclusionZone = (ox, oz, halfLen = 0) => {
      for (const zone of this.exclusionZones) {
        if (oz + halfLen >= zone.zStart && oz - halfLen <= zone.zEnd &&
            Math.abs(ox - zone.x) < zone.halfWidth) {
          return true;
        }
      }
      return false;
    };

    const [minRails, maxRails] = this.config.railsPerChunk;
    const targetRails = skipRails ? 0 : minRails + Math.floor(this.rand() * (maxRails - minRails + 1));
    let placedRails = 0;
    const maxAttempts = targetRails * 4; // retry to fill gaps between jumps
    for (let attempt = 0; attempt < maxAttempts && placedRails < targetRails; attempt++) {
      const x = zoneLevel === 2
        ? (this.rand() - 0.5) * 45
        : (this.rand() - 0.5) * 35;
      const z = -20 - this.rand() * (this.chunkLength - 40);

      // Rail dimensions by zone
      let railLength, railHeight, lipHeight;
      if (zoneLevel === 2) {
        railLength = 35 + this.rand() * 10; // 35-45 units
        railHeight = 0.9;
        lipHeight = 0.5;
      } else {
        railLength = 30 + this.rand() * 10; // 30-40 units
        railHeight = 0.7;
        lipHeight = 0.4;
      }

      // Skip if rail overlaps a jump or landing zone
      const featureGlobalZCheck = zOffset + z;
      if (isInExclusionZone(x, featureGlobalZCheck, railLength / 2)) continue;

      const feature = this.createRailByType(railLength, railHeight);
      const width = 4.0;
      const length = railLength;
      const surfaceHeight = railHeight;

      // Compute terrain slope at rail endpoints to tilt rail
      const featureGlobalZ = zOffset + z;
      const upY = this.computeHeight(x, featureGlobalZ + railLength / 2);
      const downY = this.computeHeight(x, featureGlobalZ - railLength / 2);
      const midY = (upY + downY) / 2;
      const tiltAngle = Math.atan2(upY - downY, railLength);

      feature.position.set(x, midY, featureGlobalZ);
      feature.rotation.x = -tiltAngle; // match slope angle
      this.scene.add(feature);
      chunk.objects.push(feature);
      this.ramps.push({
        mesh: feature,
        position: new THREE.Vector3(x, midY, featureGlobalZ),
        type: 'rail', width, length, surfaceHeight,
        lipHeight: 0, lipAngle: 0,
      });

      // Register gap-on kicker for collision
      if (feature.userData.lip) {
        const lip = feature.userData.lip;
        const lipWorldZ = featureGlobalZ + lip.zOffset;
        const lipTerrainY = this.computeHeight(x, lipWorldZ);
        this.ramps.push({
          mesh: feature,
          position: new THREE.Vector3(x, lipTerrainY, lipWorldZ),
          type: 'kicker',
          width: lip.width,
          length: lip.length,
          lipHeight: lip.height,
          lipAngle: 0.35,
          surfaceHeight: 0,
        });
      }

      // Exclusion zone: rail + lip + buffer
      const lipExtra = feature.userData.lip ? feature.userData.lip.length + 1.5 : 0;
      const buffer = 6;
      this.exclusionZones.push({
        x, zStart: featureGlobalZ - railLength / 2 - buffer,
        zEnd: featureGlobalZ + railLength / 2 + lipExtra + buffer,
        halfWidth: width / 2 + buffer,
      });
      placedRails++;
    }

    // --- Phase 3: Scenery (placed AFTER features to avoid exclusion zones) ---

    if (this.config.isStreet) {
      // Urban scenery: buildings, street lights, barriers
      const buildingCount = 8 + Math.floor(this.rand() * 6);
      for (let i = 0; i < buildingCount; i++) {
        const side = this.rand() > 0.5 ? 1 : -1;
        const x = side * (30 + this.rand() * 20);
        const z = (this.rand() - 0.5) * this.chunkLength;
        const globalZ = zOffset + z;
        const y = this.computeHeight(x, globalZ);

        const building = this.createBuilding();
        building.position.set(x, y, globalZ);
        this.scene.add(building);
        chunk.objects.push(building);
        this.obstacles.push({
          position: new THREE.Vector3(x, y, globalZ),
          radius: 4.0, type: 'rock',
        });
      }

      // Street lights along edges
      const lightCount = 3 + Math.floor(this.rand() * 3);
      for (let i = 0; i < lightCount; i++) {
        const side = this.rand() > 0.5 ? 1 : -1;
        const x = side * (24 + this.rand() * 6);
        const z = (this.rand() - 0.5) * this.chunkLength;
        const globalZ = zOffset + z;
        const y = this.computeHeight(x, globalZ);

        const light = this.createStreetLight(side);
        light.position.set(x, y, globalZ);
        this.scene.add(light);
        chunk.objects.push(light);
        this.obstacles.push({
          position: new THREE.Vector3(x, y, globalZ),
          radius: 0.5, type: 'tree',
        });
      }

      // Crowd barriers along sides
      const barrierCount = 4 + Math.floor(this.rand() * 4);
      for (let i = 0; i < barrierCount; i++) {
        const side = this.rand() > 0.5 ? 1 : -1;
        const x = side * (22 + this.rand() * 4);
        const z = (this.rand() - 0.5) * this.chunkLength;
        const globalZ = zOffset + z;
        const y = this.computeHeight(x, globalZ);
        if (isInExclusionZone(x, globalZ)) continue;

        const barrier = this.createBarrier();
        barrier.position.set(x, y, globalZ);
        this.scene.add(barrier);
        chunk.objects.push(barrier);
      }
    } else {
      // Standard park scenery: trees and rocks
      const treeCount = 25 + Math.floor(this.rand() * 15);
      for (let i = 0; i < treeCount; i++) {
        const side = this.rand() > 0.5 ? 1 : -1;
        const edgeBias = this.rand() < 0.7;
        const x = edgeBias
          ? side * (28 + this.rand() * 25)
          : (this.rand() - 0.5) * 50;
        const z = (this.rand() - 0.5) * this.chunkLength;
        const globalZ = zOffset + z;
        const y = this.computeHeight(x, globalZ);
        if (Math.abs(x) < 8) continue;
        if (isInExclusionZone(x, globalZ)) continue;

        const tree = this.createPineTree();
        tree.position.set(x, y, globalZ);
        this.scene.add(tree);
        chunk.objects.push(tree);
        this.obstacles.push({
          position: new THREE.Vector3(x, y, globalZ),
          radius: 1.2, type: 'tree',
        });
      }

      const rockCount = 3 + Math.floor(this.rand() * 4);
      for (let i = 0; i < rockCount; i++) {
        const x = (this.rand() - 0.5) * 50;
        const z = (this.rand() - 0.5) * this.chunkLength;
        const globalZ = zOffset + z;
        const y = this.computeHeight(x, globalZ);
        if (Math.abs(x) < 6) continue;
        if (isInExclusionZone(x, globalZ)) continue;

        const rock = this.createRock();
        rock.position.set(x, y, globalZ);
        this.scene.add(rock);
        chunk.objects.push(rock);
        this.obstacles.push({
          position: new THREE.Vector3(x, y, globalZ),
          radius: 2.0, type: 'rock',
        });
      }
    }

    // Floodlights along the run (always placed, but only lit at night)
    const floodCount = 2 + (this.rand() > 0.5 ? 1 : 0);
    for (let i = 0; i < floodCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = side * (22 + this.rand() * 4);
      const z = -this.chunkLength * (i / floodCount) + (this.rand() - 0.5) * 30;
      const globalZ = zOffset + z;
      const y = this.computeHeight(x, globalZ);
      const light = this.createFloodlight(side);
      light.position.set(x, y, globalZ);
      this.scene.add(light);
      chunk.objects.push(light);
      this.obstacles.push({
        position: new THREE.Vector3(x, y, globalZ),
        radius: 0.5, type: 'tree',
      });
    }

    // Checkpoints
    while (this.nextCheckpointZ > zOffset - this.chunkLength) {
      const cpZ = this.nextCheckpointZ;
      const cpY = this.computeHeight(0, cpZ);
      const cpNumber = this.checkpoints.length + 1;
      const isFinish = cpNumber === this.config.checkpointCount;
      const checkpoint = isFinish ? this.createFinishLine() : this.createCheckpoint();
      checkpoint.position.set(0, cpY, cpZ);
      this.scene.add(checkpoint);
      chunk.objects.push(checkpoint);
      this.checkpoints.push({
        position: new THREE.Vector3(0, cpY + 2, cpZ),
        z: cpZ, reached: false, mesh: checkpoint, isFinish,
      });
      this.nextCheckpointZ -= this.checkpointInterval;
    }

    this.chunks.push(chunk);
    this.chunksGenerated++;
  }

  computeHeight(x, globalZ) {
    let height = 0;
    height += Math.sin(x * 0.04 + globalZ * 0.006) * 0.8;
    height += Math.sin(globalZ * 0.02 + x * 0.03) * 0.5;
    height += Math.sin(x * 0.08 + globalZ * 0.015) * 0.25;
    height += globalZ * this.slopeAngle;
    const normalizedX = Math.abs(x) / (this.chunkWidth / 2);
    if (normalizedX > 0.5) {
      height += Math.pow((normalizedX - 0.5) / 0.5, 2.0) * 16;
    }
    return height;
  }

  getZoneLevel(globalZ) {
    if (this.config.zone3Threshold && globalZ <= this.config.zone3Threshold) return 3;
    return globalZ <= this.config.zoneThreshold ? 2 : 1;
  }

  // --- JUMPS (sized by "feet" — 30, 40, 50, 60, 75, 100, 125, 150) ---

  createJump(feet) {
    const group = new THREE.Group();
    const scale = feet / 30;
    const rampHeight = 2.0 * scale;
    const rampLength = 5.0 * scale;
    const rampWidth = 4.0 * scale;
    const halfW = rampWidth / 2;
    const lipThick = 0.3 * scale;

    // Curved ramp profile — smooth transition like a real kicker
    const segments = 10;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(rampLength * 0.15, 0); // flat approach
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const px = rampLength * 0.15 + t * rampLength * 0.85;
      const py = rampHeight * Math.pow(t, 0.65); // smooth ease-in curve
      shape.lineTo(px, py);
    }
    shape.lineTo(rampLength + lipThick, rampHeight); // flat lip
    shape.lineTo(rampLength + lipThick, rampHeight * 0.3); // back drops down
    shape.lineTo(rampLength * 0.85, 0);
    shape.lineTo(0, 0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: rampWidth, bevelEnabled: false,
    });
    geometry.rotateY(Math.PI / 2);
    geometry.translate(-halfW, 0, rampLength / 2);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.rampMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Snow side walls for ramp
    for (const side of [-1, 1]) {
      const wallShape = new THREE.Shape();
      wallShape.moveTo(0, 0);
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const wz = -rampLength / 2 + t * rampLength;
        const wy = rampHeight * Math.pow(t, 0.65) + 0.2 * scale;
        wallShape.lineTo(wz + rampLength / 2, wy);
      }
      wallShape.lineTo(rampLength, 0);
      wallShape.lineTo(0, 0);

      const wallGeo = new THREE.ExtrudeGeometry(wallShape, {
        depth: 0.3 * scale, bevelEnabled: false,
      });
      wallGeo.rotateY(Math.PI / 2);
      wallGeo.translate(side * (halfW + 0.15 * scale), 0, rampLength / 2);
      const wall = new THREE.Mesh(wallGeo, this.snowMaterial);
      wall.castShadow = true;
      group.add(wall);
    }

    // === LANDING ZONE ===
    // Real park jump: ramp → lip → air gap → knuckle → linear landing slope → runout
    const airGap = 3.0 * scale;           // air space between lip and landing start
    const landingGap = 2.0 * scale;       // flat table after air gap (knuckle)
    const landingLen = 8.0 + 22.0 * scale;  // long downhill landing slope (base + scaled)
    const landingWidth = rampWidth * 1.4;  // wider than ramp
    const landingHalfW = landingWidth / 2;
    const totalLandingDist = landingGap + landingLen;
    // Landing top starts near lip height, adjusted for air gap terrain drop
    const landingTopY = rampHeight * 0.92 - (airGap * this.slopeAngle);
    // Landing end must reach actual terrain level at that Z distance from group center
    const distToLandingEnd = rampLength / 2 + airGap + totalLandingDist;
    // Extra depth keeps visual landing surface above terrain for full length
    const landingEndY = -(distToLandingEnd * this.slopeAngle) - 2.0 * scale;

    // Landing profile: flat table then straight slope (like real park jumps)
    const landingSegs = 20;
    const tableFrac = landingGap / totalLandingDist;
    const landingShape = new THREE.Shape();
    landingShape.moveTo(0, landingTopY);
    for (let i = 0; i <= landingSegs; i++) {
      const t = i / landingSegs;
      const x = t * totalLandingDist;
      let y;
      if (t <= tableFrac) {
        // Flat table / knuckle section
        y = landingTopY;
      } else {
        // Linear slope from table height down to bottom
        const slopeT = (t - tableFrac) / (1 - tableFrac);
        y = landingTopY * (1 - slopeT) + landingEndY * slopeT;
      }
      landingShape.lineTo(x, y);
    }
    // Smooth runout that blends into terrain at the correct height
    const runoutLen = 4.0 * scale;
    const distToRunoutEnd = rampLength / 2 + airGap + totalLandingDist + runoutLen;
    const runoutEndY = -(distToRunoutEnd * this.slopeAngle);
    landingShape.lineTo(totalLandingDist + runoutLen, runoutEndY);
    // Fill deep underneath so landing always sinks into terrain
    const fillDepth = runoutEndY - rampHeight - 5 * scale;
    landingShape.lineTo(totalLandingDist + runoutLen, fillDepth);
    landingShape.lineTo(0, fillDepth);
    landingShape.lineTo(0, landingTopY);

    const landingGeo = new THREE.ExtrudeGeometry(landingShape, {
      depth: landingWidth, bevelEnabled: false,
    });
    landingGeo.rotateY(Math.PI / 2);
    landingGeo.translate(-landingHalfW, 0, -rampLength / 2 - airGap);
    landingGeo.computeVertexNormals();

    const landingMesh = new THREE.Mesh(landingGeo, this.rampMaterial);
    landingMesh.castShadow = true;
    landingMesh.receiveShadow = true;
    group.add(landingMesh);

    // Landing snow sidewalls
    for (const side of [-1, 1]) {
      const lWallShape = new THREE.Shape();
      lWallShape.moveTo(0, landingTopY + 0.15 * scale);
      for (let i = 0; i <= landingSegs; i++) {
        const t = i / landingSegs;
        const x = t * totalLandingDist;
        let y;
        if (t <= tableFrac) {
          y = landingTopY + 0.15 * scale;
        } else {
          const slopeT = (t - tableFrac) / (1 - tableFrac);
          y = landingTopY * (1 - slopeT) + landingEndY * slopeT + 0.15 * scale;
        }
        lWallShape.lineTo(x, y);
      }
      lWallShape.lineTo(totalLandingDist + runoutLen, runoutEndY + 0.15 * scale);
      lWallShape.lineTo(totalLandingDist + runoutLen, fillDepth);
      lWallShape.lineTo(0, fillDepth);
      lWallShape.lineTo(0, landingTopY + 0.15 * scale);

      const lWallGeo = new THREE.ExtrudeGeometry(lWallShape, {
        depth: 0.25 * scale, bevelEnabled: false,
      });
      lWallGeo.rotateY(Math.PI / 2);
      lWallGeo.translate(side * (landingHalfW + 0.12 * scale), 0, -rampLength / 2 - airGap);
      const lWall = new THREE.Mesh(lWallGeo, this.snowMaterial);
      lWall.castShadow = true;
      group.add(lWall);
    }

    // Store landing metadata for physics
    group.userData.landing = {
      airGap: airGap,
      gap: landingGap,
      length: landingLen,
      width: landingWidth,
      topLocalY: landingTopY,
      endLocalY: landingEndY,
    };

    // Size label pole
    const labelPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, rampHeight + 2, 6),
      this.poleMaterial
    );
    labelPole.position.set(halfW + 0.8, (rampHeight + 2) / 2, -rampLength * 0.4);
    group.add(labelPole);

    return group;
  }

  // --- RAIL TYPES ---

  // Helper: add a snow kicker for gap-on entry at the +Z (uphill) end of a rail
  // Based on real park gap-on: small kicker → 2-3ft gap → rail
  addRailEntryLip(group, railEndZ, entryHeight) {
    const lipHeight = Math.min(entryHeight * 0.65, 0.6);
    if (lipHeight < 0.1) return;
    const lipLen = lipHeight * 3;   // gentle approach slope
    const lipW = 5.0;               // wide enough to hit easily
    const gap = 0.8;                // ~2.5ft gap-on

    // Triangle kicker: slope up from approach (+Z) to peak near rail
    const lipShape = new THREE.Shape();
    lipShape.moveTo(0, 0);
    lipShape.lineTo(lipLen, 0);
    lipShape.lineTo(lipLen, lipHeight);
    lipShape.closePath();

    const geo = new THREE.ExtrudeGeometry(lipShape, { depth: lipW, bevelEnabled: false });
    geo.rotateY(Math.PI / 2);
    geo.translate(-lipW / 2, 0, 0);
    const lip = new THREE.Mesh(geo, this.rampMaterial);
    lip.position.z = railEndZ + gap + lipLen;
    lip.castShadow = true;
    group.add(lip);

    // Store lip metadata for collision registration
    group.userData.lip = {
      zOffset: railEndZ + gap + lipLen / 2,
      width: lipW,
      length: lipLen,
      height: lipHeight,
    };
  }

  createFlatRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const railLength = 8 * lengthScale;
    const railHeight = 0.7;

    // Posts (scale count with length)
    const postCount = Math.max(3, Math.round(2 * lengthScale) + 1);
    for (let i = 0; i < postCount; i++) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, railHeight, 6),
        this.rockMaterial
      );
      post.position.set(0, railHeight / 2, -railLength / 2 + i * (railLength / (postCount - 1)));
      post.castShadow = false;
      group.add(post);
    }

    // Round rail
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, railLength, 8),
      this.metalMaterial
    );
    rail.rotation.x = Math.PI / 2;
    rail.position.y = railHeight;
    rail.castShadow = true;
    group.add(rail);

    this.addRailEntryLip(group, railLength / 2, railHeight);
    return group;
  }

  createDownRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const railLength = 10 * lengthScale;
    const startHeight = 1.2;
    const endHeight = 0.5;

    // Posts at varying heights (scale count with length)
    const postCount = Math.max(4, Math.round(3 * lengthScale) + 1);
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1);
      const h = THREE.MathUtils.lerp(endHeight, startHeight, t);
      const z = -railLength / 2 + i * (railLength / (postCount - 1));
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, h, 6),
        this.rockMaterial
      );
      post.position.set(0, h / 2, z);
      post.castShadow = false;
      group.add(post);
    }

    // Angled rail
    const midY = (startHeight + endHeight) / 2;
    const angle = Math.atan2(startHeight - endHeight, railLength);
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, railLength * 1.05, 8),
      this.metalMaterial
    );
    rail.rotation.x = Math.PI / 2 - angle;
    rail.position.set(0, midY, 0);
    rail.castShadow = true;
    group.add(rail);

    this.addRailEntryLip(group, railLength / 2, startHeight);
    return group;
  }

  createRainbowRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const segments = Math.round(16 * lengthScale);
    const railLength = 10 * lengthScale;
    const peakHeight = 1.2;

    // Create curved rail using segments
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      const z1 = -railLength / 2 + t1 * railLength;
      const z2 = -railLength / 2 + t2 * railLength;
      const y1 = Math.sin(t1 * Math.PI) * peakHeight + 0.3;
      const y2 = Math.sin(t2 * Math.PI) * peakHeight + 0.3;

      const segLen = Math.sqrt((z2 - z1) ** 2 + (y2 - y1) ** 2);
      const angle = Math.atan2(y2 - y1, z2 - z1);

      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, segLen, 6),
        this.paintedMetalMaterial
      );
      seg.rotation.x = Math.PI / 2 - angle;
      seg.position.set(0, (y1 + y2) / 2, (z1 + z2) / 2);
      group.add(seg);
    }

    // Support posts
    for (const t of [0.15, 0.5, 0.85]) {
      const z = -railLength / 2 + t * railLength;
      const y = Math.sin(t * Math.PI) * peakHeight + 0.3;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, y, 6),
        this.rockMaterial
      );
      post.position.set(0, y / 2, z);
      group.add(post);
    }

    // Entry lip at +Z end (rainbow ends are low at 0.3)
    this.addRailEntryLip(group, railLength / 2, 0.3);
    return group;
  }

  createFlatDownFlatRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const totalLength = 12 * lengthScale;
    const flatLen = 3 * lengthScale;
    const railHeight = 0.9;
    const dropHeight = 0.35;

    // First flat section (high, uphill +Z)
    const flat1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, flatLen, 8),
      this.metalMaterial
    );
    flat1.rotation.x = Math.PI / 2;
    flat1.position.set(0, railHeight, totalLength / 2 - flatLen / 2);
    flat1.castShadow = true;
    group.add(flat1);

    // Down section (drops from +Z to -Z)
    const downLen = totalLength - flatLen * 2;
    const downAngle = Math.atan2(dropHeight, downLen);
    const downActual = Math.sqrt(downLen ** 2 + dropHeight ** 2);
    const down = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, downActual, 8),
      this.rustyMetalMaterial
    );
    down.rotation.x = Math.PI / 2 - downAngle;
    down.position.set(0, railHeight - dropHeight / 2, 0);
    down.castShadow = true;
    group.add(down);

    // Second flat section (low, downhill -Z)
    const flat2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, flatLen, 8),
      this.metalMaterial
    );
    flat2.rotation.x = Math.PI / 2;
    flat2.position.set(0, railHeight - dropHeight, -totalLength / 2 + flatLen / 2);
    flat2.castShadow = true;
    group.add(flat2);

    // Posts (high at +Z, low at -Z)
    for (const z of [-totalLength / 2, -flatLen / 2, flatLen / 2, totalLength / 2]) {
      const h = z > 0 ? railHeight : railHeight - dropHeight;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, Math.max(h, 0.3), 6),
        this.rockMaterial
      );
      post.position.set(0, Math.max(h, 0.3) / 2, z);
      group.add(post);
    }

    this.addRailEntryLip(group, totalLength / 2, railHeight);
    return group;
  }

  createBox(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const boxLength = 8 * lengthScale;
    const boxWidth = 1.2 * widthScale;
    const boxHeight = 0.6;

    // Main box surface
    const boxGeo = new THREE.BoxGeometry(boxWidth, 0.12, boxLength);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x4488cc, roughness: 0.3, metalness: 0.1,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(0, boxHeight, 0);
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Side panels
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, boxHeight, boxLength),
        this.rockMaterial
      );
      panel.position.set(side * boxWidth / 2, boxHeight / 2, 0);
      group.add(panel);
    }

    // Entry ramp
    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(2, 0);
    rampShape.lineTo(2, boxHeight);
    rampShape.lineTo(0, 0);
    const rampGeo = new THREE.ExtrudeGeometry(rampShape, { depth: boxWidth, bevelEnabled: false });
    rampGeo.rotateY(Math.PI / 2);
    rampGeo.translate(boxWidth / 2, 0, boxLength / 2);
    const rampMesh = new THREE.Mesh(rampGeo, this.rampMaterial);
    rampMesh.castShadow = true;
    group.add(rampMesh);

    this.addRailEntryLip(group, boxLength / 2, boxHeight);
    return group;
  }

  createCRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const railHeight = 0.8;
    const s = lengthScale;

    // C-shaped: forward, sideways, forward
    const segments = [
      { start: [0, 0, -5 * s], end: [0, 0, -1.5 * s] },
      { start: [0, 0, -1.5 * s], end: [2, 0, -1.5 * s] },
      { start: [2, 0, -1.5 * s], end: [2, 0, 5 * s] },
    ];

    for (const seg of segments) {
      const dx = seg.end[0] - seg.start[0];
      const dz = seg.end[2] - seg.start[2];
      const len = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);

      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, len, 8),
        this.paintedMetalMaterial
      );
      rail.rotation.x = Math.PI / 2;
      rail.rotation.y = angle;
      rail.position.set(
        (seg.start[0] + seg.end[0]) / 2,
        railHeight,
        (seg.start[2] + seg.end[2]) / 2
      );
      rail.castShadow = true;
      group.add(rail);
    }

    // Posts
    for (const pos of [[0, -5 * s], [0, -1.5 * s], [2, -1.5 * s], [2, 2 * s], [2, 5 * s]]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, railHeight, 6),
        this.rockMaterial
      );
      post.position.set(pos[0], railHeight / 2, pos[1]);
      group.add(post);
    }

    this.addRailEntryLip(group, 5 * s, railHeight);
    return group;
  }

  createKinkRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const railHeight = 1.0;
    const kinkDrop = 0.3;
    const s = lengthScale;

    // Kink: flat (high at +Z), drop, flat (low at -Z)
    // Player enters from +Z (uphill) and rides toward -Z (downhill)

    // Flat 1 (high, uphill +Z)
    const flat1Len = 4 * s;
    const r1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, flat1Len, 8),
      this.metalMaterial
    );
    r1.rotation.x = Math.PI / 2;
    r1.position.set(0, railHeight, 3 * s);
    r1.castShadow = true;
    group.add(r1);

    // Kink (drops from +Z to -Z)
    const kinkZLen = 2 * s;
    const kinkLen = Math.sqrt(kinkZLen ** 2 + kinkDrop ** 2);
    const kinkAngle = Math.atan2(kinkDrop, kinkZLen);
    const kink = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, kinkLen, 8),
      this.rustyMetalMaterial
    );
    kink.rotation.x = Math.PI / 2 - kinkAngle;
    kink.position.set(0, railHeight - kinkDrop / 2, 0);
    kink.castShadow = true;
    group.add(kink);

    // Flat 2 (low, downhill -Z)
    const flat2Len = 4 * s;
    const r2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, flat2Len, 8),
      this.metalMaterial
    );
    r2.rotation.x = Math.PI / 2;
    r2.position.set(0, railHeight - kinkDrop, -3 * s);
    r2.castShadow = true;
    group.add(r2);

    // Posts
    for (const z of [-5 * s, -1 * s, 1 * s, 5 * s]) {
      const h = z >= 1 * s ? railHeight : railHeight - kinkDrop;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, h, 6),
        this.rockMaterial
      );
      post.position.set(0, h / 2, z);
      group.add(post);
    }

    this.addRailEntryLip(group, 5 * s, railHeight);
    return group;
  }

  // --- DOWN-FLAT-DOWN RAIL: starts high, drops, flat middle, drops again ---
  createDownFlatDownRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const totalLength = 14 * lengthScale;
    const startHeight = 1.3;
    const midHeight = 0.9;
    const endHeight = 0.4;
    const segLen = totalLength / 3;

    // Down section 1 (high end at +Z, drops toward center)
    const drop1Len = Math.sqrt(segLen ** 2 + (startHeight - midHeight) ** 2);
    const drop1Angle = Math.atan2(startHeight - midHeight, segLen);
    const d1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, drop1Len, 8),
      this.metalMaterial
    );
    d1.rotation.x = Math.PI / 2 - drop1Angle;
    d1.position.set(0, (startHeight + midHeight) / 2, segLen);
    d1.castShadow = true;
    group.add(d1);

    // Flat middle section
    const flat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, segLen, 8),
      this.rustyMetalMaterial
    );
    flat.rotation.x = Math.PI / 2;
    flat.position.set(0, midHeight, 0);
    flat.castShadow = true;
    group.add(flat);

    // Down section 2 (drops from center toward -Z low end)
    const drop2Len = Math.sqrt(segLen ** 2 + (midHeight - endHeight) ** 2);
    const drop2Angle = Math.atan2(midHeight - endHeight, segLen);
    const d2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, drop2Len, 8),
      this.metalMaterial
    );
    d2.rotation.x = Math.PI / 2 - drop2Angle;
    d2.position.set(0, (midHeight + endHeight) / 2, -segLen);
    d2.castShadow = true;
    group.add(d2);

    // Posts (high at +Z, low at -Z)
    const postPositions = [-totalLength / 2, -segLen / 2, segLen / 2, totalLength / 2];
    const postHeights = [endHeight, midHeight, midHeight, startHeight];
    for (let i = 0; i < postPositions.length; i++) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, postHeights[i], 6),
        this.rockMaterial
      );
      post.position.set(0, postHeights[i] / 2, postPositions[i]);
      group.add(post);
    }

    this.addRailEntryLip(group, totalLength / 2, startHeight);
    return group;
  }

  // --- DONKEY DICK RAIL: tall thick cylindrical posts with rail on top ---
  createDonkeyDickRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const railLength = 10 * lengthScale;
    const postHeight = 1.5;
    const postRadius = 0.08 * widthScale;

    // Thick cylindrical posts
    const postCount = Math.max(3, Math.round(2 * lengthScale) + 1);
    for (let i = 0; i < postCount; i++) {
      const z = -railLength / 2 + i * (railLength / (postCount - 1));
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(postRadius, postRadius * 1.1, postHeight, 12),
        this.rustyMetalMaterial
      );
      post.position.set(0, postHeight / 2, z);
      post.castShadow = false;
      group.add(post);

      // Rounded cap on each post
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(postRadius, 8, 6),
        this.metalMaterial
      );
      cap.position.set(0, postHeight, z);
      group.add(cap);
    }

    // Rail tube connecting tops of posts
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08 * widthScale, 0.08 * widthScale, railLength, 8),
      this.metalMaterial
    );
    rail.rotation.x = Math.PI / 2;
    rail.position.y = postHeight;
    rail.castShadow = true;
    group.add(rail);

    this.addRailEntryLip(group, railLength / 2, postHeight);
    return group;
  }

  // --- WATERFALL RAIL: stepped descending flat segments like stairs ---
  createWaterfallRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const steps = 4;
    const stepLength = 2.5 * lengthScale;
    const stepDrop = 0.35;
    const startHeight = 1.4;
    const totalLength = steps * stepLength + (steps - 1) * 0.6;

    let currentZ = totalLength / 2;
    for (let i = 0; i < steps; i++) {
      const h = startHeight - i * stepDrop;

      // Flat step segment
      const step = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, stepLength, 8),
        this.paintedMetalMaterial
      );
      step.rotation.x = Math.PI / 2;
      step.position.set(0, h, currentZ - stepLength / 2);
      step.castShadow = false;
      group.add(step);

      // Posts for this step
      for (const pz of [currentZ, currentZ - stepLength]) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, h, 6),
          this.rockMaterial
        );
        post.position.set(0, h / 2, pz);
        group.add(post);
      }

      // Connecting drop segment to next step
      if (i < steps - 1) {
        const nextH = h - stepDrop;
        const dropGap = 0.6;
        const dropLen = Math.sqrt(dropGap ** 2 + stepDrop ** 2);
        const dropAngle = Math.atan2(stepDrop, dropGap);
        const drop = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06 * widthScale, 0.06 * widthScale, dropLen, 8),
          this.rustyMetalMaterial
        );
        drop.rotation.x = Math.PI / 2 + dropAngle;
        drop.position.set(0, (h + nextH) / 2, currentZ - stepLength - dropGap / 2);
        drop.castShadow = false;
        group.add(drop);

        currentZ -= stepLength + dropGap;
      }
    }

    this.addRailEntryLip(group, totalLength / 2, startHeight);
    return group;
  }

  // --- RAIL TYPE DISPATCHER ---
  createRailByType(railLength, railHeight) {
    const railTypes = this.config.railTypes;
    const railTypeName = railTypes[Math.floor(this.rand() * railTypes.length)];
    const ws = this.config.railWidthScale;
    const ls = railLength / 10; // normalize to lengthScale

    switch (railTypeName) {
      case 'flat':        return this.createFlatRail(ls * 1.25, ws);
      case 'down':        return this.createDownRail(ls, ws);
      case 'rainbow':     return this.createRainbowRail(ls, ws);
      case 'flatDownFlat': return this.createFlatDownFlatRail(ls * 0.83, ws);
      case 'box':         return this.createBox(ls * 1.25, ws);
      case 'cRail':       return this.createCRail(ls, ws);
      case 'kinkRail':    return this.createKinkRail(ls, ws);
      case 'downFlatDown': return this.createDownFlatDownRail(ls * 0.71, ws);
      case 'donkeyDick':  return this.createDonkeyDickRail(ls, ws);
      case 'waterfall':   return this.createWaterfallRail(ls, ws);
      case 'ledge':       return this.createLedge(ls, ws);
      case 'stairRail':   return this.createStairRail(ls, ws);
      case 'hubbaLedge':  return this.createHubbaLedge(ls, ws);
      default:            return this.createParkRail(railLength, railHeight, 0);
    }
  }

  // --- PARK RAIL: flat tube rail with entry lips ---
  createParkRail(railLength, railHeight, lipHeight) {
    const group = new THREE.Group();
    const tubeRadius = 0.1;

    // Main rail tube
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(tubeRadius, tubeRadius, railLength, 8),
      this.metalMaterial
    );
    rail.rotation.x = Math.PI / 2;
    rail.position.y = railHeight;
    rail.castShadow = true;
    group.add(rail);

    // Support posts
    const postCount = Math.max(2, Math.round(railLength / 12) + 1);
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1);
      const z = -railLength / 2 + t * railLength;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, railHeight, 6),
        this.rockMaterial
      );
      post.position.set(0, railHeight / 2, z);
      post.castShadow = false;
      group.add(post);
    }

    // Gap-on entry kicker at +Z (uphill) end
    this.addRailEntryLip(group, railLength / 2, railHeight);
    return group;
  }

  // --- STREET RAIL TYPES ---

  // Concrete ledge: wide flat grindable surface with snow dusting
  createLedge(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const ledgeLength = 10 * lengthScale;
    const ledgeWidth = 1.8 * widthScale;
    const ledgeHeight = 0.5;

    // Main concrete body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(ledgeWidth, ledgeHeight, ledgeLength),
      this.concreteMaterial
    );
    body.position.y = ledgeHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Snow dusting on top
    const snow = new THREE.Mesh(
      new THREE.BoxGeometry(ledgeWidth + 0.04, 0.04, ledgeLength + 0.04),
      this.snowMaterial
    );
    snow.position.y = ledgeHeight + 0.02;
    group.add(snow);

    this.addRailEntryLip(group, ledgeLength / 2, ledgeHeight);
    return group;
  }

  // Stair rail: metal handrail descending alongside concrete steps
  createStairRail(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const totalLength = 10 * lengthScale;
    const startHeight = 1.2;
    const endHeight = 0.4;
    const stepCount = Math.max(3, Math.round(4 * lengthScale));
    const stepLength = totalLength / stepCount;
    const stepDrop = (startHeight - endHeight) / stepCount;

    // Concrete steps
    for (let i = 0; i < stepCount; i++) {
      const t = i / stepCount;
      const stepZ = totalLength / 2 - stepLength / 2 - i * stepLength;
      const stepY = startHeight - i * stepDrop;
      const stepH = stepY;

      const step = new THREE.Mesh(
        new THREE.BoxGeometry(2.0 * widthScale, stepH, stepLength),
        this.concreteMaterial
      );
      step.position.set(0.8 * widthScale, stepH / 2, stepZ);
      step.castShadow = false;
      group.add(step);

      // Snow on step tread
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(2.0 * widthScale, 0.03, stepLength * 0.9),
        this.snowMaterial
      );
      tread.position.set(0.8 * widthScale, stepH + 0.015, stepZ);
      group.add(tread);
    }

    // Metal handrail — angled tube from high to low
    const railLen = Math.sqrt(totalLength * totalLength + (startHeight - endHeight) * (startHeight - endHeight));
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, railLen, 8),
      this.metalRailMaterial
    );
    const railAngle = Math.atan2(startHeight - endHeight, totalLength);
    rail.rotation.x = Math.PI / 2 - railAngle;
    rail.position.set(-0.3 * widthScale, (startHeight + endHeight) / 2, 0);
    rail.castShadow = true;
    group.add(rail);

    // Support posts for handrail
    for (const t of [0, 0.5, 1]) {
      const pz = totalLength / 2 - t * totalLength;
      const ph = startHeight - t * (startHeight - endHeight);
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, ph, 6),
        this.metalRailMaterial
      );
      post.position.set(-0.3 * widthScale, ph / 2, pz);
      group.add(post);
    }

    this.addRailEntryLip(group, totalLength / 2, startHeight);
    return group;
  }

  // Hubba ledge: angled concrete wedge alongside stairs
  createHubbaLedge(lengthScale = 1, widthScale = 1) {
    const group = new THREE.Group();
    const hubbaLength = 10 * lengthScale;
    const startHeight = 1.0;
    const hubbaWidth = 1.4 * widthScale;

    // Wedge shape using ExtrudeGeometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(hubbaLength, 0);
    shape.lineTo(hubbaLength, 0.05); // nearly flush at bottom end
    shape.lineTo(0, startHeight);
    shape.closePath();

    const extrudeSettings = { depth: hubbaWidth, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Rotate to align: extrude goes along X, we want it along X width
    geo.rotateY(Math.PI / 2);
    geo.translate(hubbaWidth / 2, 0, hubbaLength / 2);

    const wedge = new THREE.Mesh(geo, this.concreteMaterial);
    wedge.castShadow = true;
    wedge.receiveShadow = true;
    group.add(wedge);

    // Snow dusting on angled top surface
    const snowShape = new THREE.Shape();
    snowShape.moveTo(0, 0);
    snowShape.lineTo(hubbaLength, 0);
    snowShape.lineTo(0, startHeight);
    snowShape.closePath();
    const snowGeo = new THREE.ExtrudeGeometry(snowShape, { depth: hubbaWidth + 0.04, bevelEnabled: false });
    snowGeo.rotateY(Math.PI / 2);
    snowGeo.translate((hubbaWidth + 0.04) / 2, 0.03, hubbaLength / 2);
    const snowCap = new THREE.Mesh(snowGeo, this.snowMaterial);
    group.add(snowCap);

    this.addRailEntryLip(group, hubbaLength / 2, startHeight);
    return group;
  }

  // --- URBAN SCENERY ---

  createBuilding() {
    const group = new THREE.Group();
    const bw = 6 + this.rand() * 6;   // 6-12 wide
    const bh = 8 + this.rand() * 12;  // 8-20 tall
    const bd = 8 + this.rand() * 7;   // 8-15 deep

    // Main building body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      this.buildingMaterial
    );
    body.position.y = bh / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Snow on roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(bw + 0.1, 0.15, bd + 0.1),
      this.snowMaterial
    );
    roof.position.y = bh + 0.075;
    group.add(roof);

    // Windows — merged into a single geometry (1 draw call instead of 60+)
    const windowW = 0.6;
    const windowH = 0.8;
    const windowSpacingX = 2.0;
    const windowSpacingY = 2.5;
    const cols = Math.floor((bw - 1) / windowSpacingX);
    const rows = Math.floor((bh - 2) / windowSpacingY);

    const winPositions = [];
    const winIndices = [];
    let vi = 0;

    for (const faceSign of [-1, 1]) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (this.rand() < 0.2) continue; // some windows dark
          const wx = -((cols - 1) * windowSpacingX) / 2 + c * windowSpacingX;
          const wy = 2 + r * windowSpacingY;
          const wz = faceSign * (bd / 2 + 0.01);
          const hw = windowW / 2;
          const hh = windowH / 2;
          // 4 corners of the window quad
          winPositions.push(
            wx - hw, wy - hh, wz,
            wx + hw, wy - hh, wz,
            wx + hw, wy + hh, wz,
            wx - hw, wy + hh, wz
          );
          // Two triangles per quad
          winIndices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
          vi += 4;
        }
      }
    }

    if (winPositions.length > 0) {
      const winGeo = new THREE.BufferGeometry();
      winGeo.setAttribute('position', new THREE.Float32BufferAttribute(winPositions, 3));
      winGeo.setIndex(winIndices);
      winGeo.computeVertexNormals();
      const winMesh = new THREE.Mesh(winGeo, this.windowMaterial);
      group.add(winMesh);
    }

    return group;
  }

  createStreetLight(side = 1) {
    const group = new THREE.Group();
    const poleHeight = 6;

    // Pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, poleHeight, 6),
      this.metalRailMaterial
    );
    pole.position.y = poleHeight / 2;
    group.add(pole);

    // Arm extending inward (toward the run)
    const armLength = 2;
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, armLength, 6),
      this.metalRailMaterial
    );
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-side * armLength / 2, poleHeight - 0.2, 0);
    group.add(arm);

    // Light fixture (bulb)
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffffcc, emissive: 0xffdd88, emissiveIntensity: 0.6,
      })
    );
    bulb.position.set(-side * armLength, poleHeight - 0.3, 0);
    group.add(bulb);

    return group;
  }

  createBarrier() {
    const group = new THREE.Group();
    const barrierLength = 3;
    const barrierHeight = 1.0;

    // Horizontal bar
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, barrierLength),
      this.barrierMaterial
    );
    bar.position.y = barrierHeight;
    group.add(bar);

    // Second horizontal bar
    const bar2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, barrierLength),
      this.barrierMaterial
    );
    bar2.position.y = barrierHeight * 0.5;
    group.add(bar2);

    // Two support legs
    for (const z of [-barrierLength / 2 + 0.15, barrierLength / 2 - 0.15]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, barrierHeight + 0.15, 6),
        this.metalRailMaterial
      );
      leg.position.set(0, (barrierHeight + 0.15) / 2, z);
      group.add(leg);

      // Foot
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.05, 0.5),
        this.metalRailMaterial
      );
      foot.position.set(0, 0.025, z);
      group.add(foot);
    }

    return group;
  }

  createPineTree() {
    const group = new THREE.Group();
    const scale = 0.7 + this.rand() * 0.8;
    const mat = this.rand() > 0.5 ? this.treeMaterial : this.darkTreeMaterial;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 2.5 * scale, 5),
      this.trunkMaterial
    );
    trunk.position.y = 1.25 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    for (let i = 0; i < 5; i++) {
      const radius = (3.0 - i * 0.5) * scale;
      const height = (2.0 - i * 0.15) * scale;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 6), mat
      );
      cone.position.y = (2.5 + i * 1.3) * scale;
      cone.rotation.y = this.rand() * Math.PI;
      cone.castShadow = true;
      group.add(cone);
    }

    for (let i = 0; i < 3; i++) {
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry((2.2 - i * 0.5) * scale, 0.4 * scale, 6),
        this.snowMaterial
      );
      snow.position.y = (3.2 + i * 1.3) * scale;
      group.add(snow);
    }

    return group;
  }

  // Resort-style floodlight pole for night skiing
  createFloodlight(side) {
    const group = new THREE.Group();

    // Tall pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 10, 6),
      this.floodlightPoleMaterial
    );
    pole.position.y = 5;
    pole.castShadow = false;
    group.add(pole);

    // Cross-arm angled toward the run
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.5, 4),
      this.floodlightPoleMaterial
    );
    arm.position.set(-side * 1.0, 9.5, 0);
    arm.rotation.z = side * 0.4; // angle inward toward run
    group.add(arm);

    // Light fixture head (2 fixtures per pole)
    for (let i = 0; i < 2; i++) {
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.25, 0.6),
        this.floodlightHeadMaterial
      );
      head.position.set(-side * (1.2 + i * 0.8), 9.6, 0);
      group.add(head);
    }

    // SpotLight pointing down toward the run (only at night)
    if (this.nightMode) {
      const spot = new THREE.SpotLight(0xfff4e8, 5.0, 55, Math.PI / 3, 0.4, 0.8);
      spot.position.set(-side * 1.5, 9.8, 0);
      spot.castShadow = false;
      const target = new THREE.Object3D();
      target.position.set(-side * 8, 0, 0); // aim toward center of run
      group.add(target);
      spot.target = target;
      group.add(spot);
    }

    return group;
  }

  createRock() {
    const group = new THREE.Group();
    const count = 1 + Math.floor(this.rand() * 3);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.DodecahedronGeometry(1.0 + this.rand() * 1.5, 1);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        pos.setX(j, pos.getX(j) + (this.rand() - 0.5) * 0.4);
        pos.setY(j, pos.getY(j) * 0.5 + (this.rand() - 0.5) * 0.2);
        pos.setZ(j, pos.getZ(j) + (this.rand() - 0.5) * 0.4);
      }
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, this.rockMaterial);
      mesh.position.set((this.rand() - 0.5) * 2, 0, (this.rand() - 0.5) * 2);
      mesh.castShadow = true;
      group.add(mesh);
    }

    const snow = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.4),
      this.snowMaterial
    );
    snow.position.y = 0.5;
    group.add(snow);

    return group;
  }

  createCheckpoint() {
    const group = new THREE.Group();
    const poleHeight = 6;
    for (const side of [-12, 12]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, poleHeight, 6),
        this.poleMaterial
      );
      pole.position.set(side, poleHeight / 2, 0);
      group.add(pole);

      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0xff6600, side: THREE.DoubleSide,
          emissive: 0xff4400, emissiveIntensity: 0.2,
        })
      );
      flag.position.set(side + (side > 0 ? -1 : 1) * 0.75, poleHeight - 0.5, 0);
      group.add(flag);
    }

    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 24, 4),
      new THREE.MeshStandardMaterial({
        color: 0x22cc66, emissive: 0x11aa44, emissiveIntensity: 0.5,
      })
    );
    line.rotation.z = Math.PI / 2;
    line.position.y = poleHeight;
    group.add(line);

    return group;
  }

  createFinishLine() {
    const group = new THREE.Group();
    const poleHeight = 8;
    const gateWidth = 30;

    // Finish line material — checkered black and white
    const finishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3,
    });
    const finishMatDark = new THREE.MeshStandardMaterial({
      color: 0x111111, emissive: 0x000000, emissiveIntensity: 0,
    });

    // Two tall poles
    for (const side of [-gateWidth / 2, gateWidth / 2]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, poleHeight, 8),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.2 })
      );
      pole.position.set(side, poleHeight / 2, 0);
      group.add(pole);

      // Gold sphere on top
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 0.3 })
      );
      sphere.position.set(side, poleHeight + 0.4, 0);
      group.add(sphere);
    }

    // Top crossbar
    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, gateWidth, 8),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.2 })
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.y = poleHeight;
    crossbar.castShadow = false;
    group.add(crossbar);

    // Banner — checkered pattern using multiple quads
    const bannerHeight = 1.8;
    const bannerY = poleHeight - bannerHeight / 2 - 0.3;
    const checkerSize = gateWidth / 16;
    const rows = Math.round(bannerHeight / checkerSize);
    const cols = 16;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isBlack = (r + c) % 2 === 0;
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(checkerSize, checkerSize),
          isBlack ? finishMatDark : finishMat
        );
        tile.position.set(
          -gateWidth / 2 + checkerSize / 2 + c * checkerSize,
          bannerY + checkerSize / 2 + r * checkerSize - bannerHeight / 2,
          0
        );
        // Double-sided so visible from both directions
        tile.material.side = THREE.DoubleSide;
        group.add(tile);
      }
    }

    // "FINISH" text poles (decorative side markers)
    for (const side of [-gateWidth / 2 - 3, gateWidth / 2 + 3]) {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 5, 6),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 0.3 })
      );
      marker.position.set(side, 2.5, 0);
      marker.castShadow = false;
      group.add(marker);

      // Red flag
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1),
        new THREE.MeshStandardMaterial({
          color: 0xff0000, side: THREE.DoubleSide,
          emissive: 0xff2200, emissiveIntensity: 0.3,
        })
      );
      flag.position.set(side + (side > 0 ? -1 : 1) * 1, 4.5, 0);
      group.add(flag);
    }

    // Ground line — bright stripe across the snow
    const groundLine = new THREE.Mesh(
      new THREE.BoxGeometry(gateWidth + 6, 0.05, 1.5),
      new THREE.MeshStandardMaterial({
        color: 0xff3333, emissive: 0xff2222, emissiveIntensity: 0.4,
      })
    );
    groundLine.position.y = 0.03;
    groundLine.receiveShadow = true;
    group.add(groundLine);

    return group;
  }

  getHeightAt(x, z) {
    return this.computeHeight(x, z);
  }

  getSlopeNormalAt(x, z) {
    const eps = 0.5;
    const hL = this.getHeightAt(x - eps, z);
    const hR = this.getHeightAt(x + eps, z);
    const hF = this.getHeightAt(x, z - eps);
    const hB = this.getHeightAt(x, z + eps);
    const normal = new THREE.Vector3(hL - hR, 2 * eps, hF - hB);
    normal.normalize();
    return normal;
  }

  update(playerZ) {
    const neededChunks = Math.ceil(-playerZ / this.chunkLength) + 4;
    while (this.chunksGenerated < neededChunks) {
      this.generateChunk();
    }
    while (
      this.chunks.length > 0 &&
      this.chunks[0].zOffset > -playerZ + this.chunkLength * 2
    ) {
      const old = this.chunks.shift();
      this.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      for (const obj of old.objects) this.scene.remove(obj);
    }
  }

  dispose() {
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      for (const obj of chunk.objects) this.scene.remove(obj);
    }
    this.chunks = [];
    this.obstacles = [];
    this.ramps = [];
    this.checkpoints = [];
  }
}
