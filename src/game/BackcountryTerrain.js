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

// ---- CHAIR CONFIGURATIONS ----
const CHAIRS = {
  summit: {
    name: 'SUMMIT BOWL',
    slopeAngle: 0.65,          // ~33 degrees average pitch
    chunkWidth: 800,            // massive — feels infinite sideways
    chunkLength: 300,
    totalChunks: 6,             // ~1800 units of vertical
    seed: 42,
    // Bowl shape: gentle rise far out — no visible walls
    bowlStrength: 15,           // very gentle rise so it feels open
    bowlWidth: 300,             // bowl floor extends 300 units each side before any rise
    // Cliff bands — Z ranges where terrain drops sharply (vertical rock faces)
    cliffs: [
      { zStart: -200, zEnd: -215, drop: 8 },
      { zStart: -450, zEnd: -468, drop: 14 },
      { zStart: -700, zEnd: -720, drop: 12 },
      { zStart: -950, zEnd: -970, drop: 16 },
      { zStart: -1200, zEnd: -1220, drop: 18 },
      { zStart: -1400, zEnd: -1416, drop: 10 },
    ],
    // Scattered cliff ledges throughout the bowl (x, z, width, drop)
    ledges: [
      // Left side
      { x: -80, z: -200, w: 24, drop: 5 },
      { x: -50, z: -450, w: 20, drop: 6 },
      { x: -90, z: -650, w: 22, drop: 5 },
      { x: -30, z: -850, w: 18, drop: 4 },
      { x: -70, z: -1050, w: 25, drop: 7 },
      { x: -100, z: -1300, w: 20, drop: 5 },
      // Center
      { x: 0, z: -300, w: 28, drop: 5 },
      { x: 10, z: -600, w: 22, drop: 6 },
      { x: -15, z: -900, w: 26, drop: 7 },
      { x: 5, z: -1200, w: 24, drop: 5 },
      // Right side
      { x: 60, z: -250, w: 20, drop: 4 },
      { x: 85, z: -500, w: 22, drop: 6 },
      { x: 45, z: -700, w: 18, drop: 5 },
      { x: 75, z: -950, w: 24, drop: 6 },
      { x: 100, z: -1150, w: 20, drop: 5 },
      { x: 55, z: -1400, w: 22, drop: 4 },
    ],
    // Sub-bowls — concave pockets within the main bowl
    subBowls: [
      { x: -60, z: -350, radius: 50, depth: 5 },
      { x: 50, z: -550, radius: 45, depth: 4 },
      { x: -30, z: -750, radius: 55, depth: 6 },
      { x: 70, z: -1000, radius: 40, depth: 5 },
      { x: -80, z: -1200, radius: 50, depth: 4 },
      { x: 20, z: -1400, radius: 45, depth: 5 },
    ],
    // Trees appear scattered throughout, denser toward bottom
    treeLineZ: -100,
    rockDensity: 1.5,           // rocks per chunk (multiplier)
    treeDensity: 0.8,           // trees per chunk (multiplier)
    checkpointInterval: 380,
    checkpointCount: 4,
  },

  biggie: {
    name: 'BIGGIE PILLOW LINES',
    slopeAngle: 0.42,
    chunkWidth: 2400,
    chunkLength: 75,
    totalChunks: 56,
    seed: 137,
    bowlStrength: 8,
    bowlWidth: 900,             // wide usable terrain
    cliffs: [],
    treeLineZ: 0,
    rockDensity: 2.0,           // rocks for visual variety
    treeDensity: 44.0,          // dense trees — Revelstoke-style tree runs
    checkpointInterval: 340,
    checkpointCount: 12,
    generateRadius: 1,

    // Aggressive pillow field — distinct mounds you launch off
    pillowField: {
      strength: 7.0,
      frequency: 0.065,         // sharper crests for natural air
      secondaryFreq: 0.028,
      secondaryStrength: 5.0,
    },

    // Terrain pop — natural air from riding over pillow crests (~7 feet)
    terrainPop: {
      curvatureThreshold: 0.008,  // min convexity to trigger pop
      popFactor: 14,              // curvature * speed * factor = pop velocity
      maxPop: 11,                 // cap: ~7 feet peak at moderate speed
      sampleDist: 2.0,            // curvature sample distance
      minSpeed: 8,                // must be moving to pop
    },

    // Multi-octave terrain noise for natural rollers, bumps, and variation
    terrainNoise: {
      rollerAmplitude: 4.5,     // large cross-slope rollers
      rollerFreqZ: 0.038,
      rollerFreqX: 0.007,
      mediumAmplitude: 2.8,     // medium terrain bumps
      mediumFreqX: 0.045,
      mediumFreqZ: 0.055,
      smallAmplitude: 1.2,      // small terrain detail
      smallFreqX: 0.11,
      smallFreqZ: 0.14,
    },

    // Variable slope zones
    slopeZones: [
      { endZ: -400,  slope: 0.50 },   // steep entry with pillow drops
      { endZ: -900,  slope: 0.35 },   // mellow pillow glades
      { endZ: -1500, slope: 0.55 },   // steep pillow chutes with cliffs
      { endZ: -2100, slope: 0.32 },   // mellow tree runs
      { endZ: -2800, slope: 0.52 },   // steep cliff and pillow zone
      { endZ: -3500, slope: 0.38 },   // mellow wooded pillows
      { endZ: -4200, slope: 0.48 },   // final steep runout
    ],

    // Partial cliffs spread across the full width
    partialCliffs: [
      // Zone 1: Steep entry (0 to -400) — warm-up drops spread wide
      { zStart: -60,   drop: 8,   xCenter: -400,  xWidth: 250 },
      { zStart: -80,   drop: 10,  xCenter: 200,   xWidth: 200 },
      { zStart: -140,  drop: 12,  xCenter: -100,  xWidth: 280 },
      { zStart: -180,  drop: 15,  xCenter: 500,   xWidth: 300 },
      { zStart: -220,  drop: 8,   xCenter: -600,  xWidth: 220 },
      { zStart: -260,  drop: 18,  xCenter: 50,    xWidth: 350 },
      { zStart: -310,  drop: 10,  xCenter: 400,   xWidth: 250 },
      { zStart: -350,  drop: 12,  xCenter: -350,  xWidth: 280 },
      { zStart: -390,  drop: 8,   xCenter: 650,   xWidth: 200 },

      // Zone 2: Mellow glades (-400 to -900)
      { zStart: -430,  drop: 10,  xCenter: -500,  xWidth: 280 },
      { zStart: -470,  drop: 15,  xCenter: 300,   xWidth: 300 },
      { zStart: -520,  drop: 8,   xCenter: -200,  xWidth: 200 },
      { zStart: -570,  drop: 20,  xCenter: 600,   xWidth: 350 },
      { zStart: -620,  drop: 12,  xCenter: -450,  xWidth: 250 },
      { zStart: -670,  drop: 14,  xCenter: 100,   xWidth: 280 },
      { zStart: -720,  drop: 10,  xCenter: -650,  xWidth: 220 },
      { zStart: -770,  drop: 18,  xCenter: 450,   xWidth: 320 },
      { zStart: -830,  drop: 8,   xCenter: -150,  xWidth: 220 },
      { zStart: -880,  drop: 12,  xCenter: 550,   xWidth: 250 },

      // Zone 3: Steep chutes (-900 to -1500) — big drops
      { zStart: -930,  drop: 25,  xCenter: -350,  xWidth: 380 },
      { zStart: -970,  drop: 15,  xCenter: 500,   xWidth: 300 },
      { zStart: -1030, drop: 35,  xCenter: 0,     xWidth: 400 },
      { zStart: -1090, drop: 20,  xCenter: -550,  xWidth: 300 },
      { zStart: -1140, drop: 45,  xCenter: 250,   xWidth: 450 },
      { zStart: -1200, drop: 15,  xCenter: -200,  xWidth: 250 },
      { zStart: -1260, drop: 30,  xCenter: 600,   xWidth: 350 },
      { zStart: -1320, drop: 50,  xCenter: -400,  xWidth: 400 },
      { zStart: -1380, drop: 20,  xCenter: 150,   xWidth: 300 },
      { zStart: -1440, drop: 40,  xCenter: -600,  xWidth: 350 },
      { zStart: -1480, drop: 25,  xCenter: 400,   xWidth: 300 },

      // Zone 4: Mellow trees (-1500 to -2100)
      { zStart: -1540, drop: 12,  xCenter: -500,  xWidth: 250 },
      { zStart: -1600, drop: 18,  xCenter: 350,   xWidth: 300 },
      { zStart: -1660, drop: 10,  xCenter: -100,  xWidth: 220 },
      { zStart: -1720, drop: 25,  xCenter: 550,   xWidth: 350 },
      { zStart: -1780, drop: 15,  xCenter: -400,  xWidth: 280 },
      { zStart: -1840, drop: 30,  xCenter: 100,   xWidth: 320 },
      { zStart: -1910, drop: 12,  xCenter: -650,  xWidth: 220 },
      { zStart: -1970, drop: 20,  xCenter: 400,   xWidth: 300 },
      { zStart: -2040, drop: 10,  xCenter: -250,  xWidth: 250 },

      // Zone 5: Steep cliff zone (-2100 to -2800) — massive drops
      { zStart: -2130, drop: 40,  xCenter: -300,  xWidth: 400 },
      { zStart: -2180, drop: 25,  xCenter: 500,   xWidth: 350 },
      { zStart: -2240, drop: 60,  xCenter: 50,    xWidth: 500 },
      { zStart: -2300, drop: 15,  xCenter: -550,  xWidth: 250 },
      { zStart: -2360, drop: 50,  xCenter: 300,   xWidth: 400 },
      { zStart: -2420, drop: 70,  xCenter: -150,  xWidth: 450 },
      { zStart: -2490, drop: 20,  xCenter: 650,   xWidth: 300 },
      { zStart: -2550, drop: 55,  xCenter: -400,  xWidth: 400 },
      { zStart: -2620, drop: 35,  xCenter: 200,   xWidth: 350 },
      { zStart: -2690, drop: 45,  xCenter: -500,  xWidth: 380 },
      { zStart: -2760, drop: 30,  xCenter: 450,   xWidth: 300 },

      // Zone 6: Mellow wooded (-2800 to -3500)
      { zStart: -2830, drop: 15,  xCenter: 400,   xWidth: 280 },
      { zStart: -2890, drop: 25,  xCenter: -200,  xWidth: 300 },
      { zStart: -2950, drop: 12,  xCenter: 600,   xWidth: 220 },
      { zStart: -3020, drop: 30,  xCenter: -450,  xWidth: 350 },
      { zStart: -3090, drop: 18,  xCenter: 100,   xWidth: 280 },
      { zStart: -3160, drop: 20,  xCenter: -350,  xWidth: 300 },
      { zStart: -3230, drop: 10,  xCenter: 500,   xWidth: 250 },
      { zStart: -3300, drop: 25,  xCenter: -100,  xWidth: 320 },
      { zStart: -3370, drop: 15,  xCenter: 350,   xWidth: 250 },
      { zStart: -3440, drop: 18,  xCenter: -550,  xWidth: 280 },

      // Zone 7: Final runout (-3500 to -4200)
      { zStart: -3530, drop: 20,  xCenter: -400,  xWidth: 300 },
      { zStart: -3600, drop: 30,  xCenter: 200,   xWidth: 350 },
      { zStart: -3670, drop: 12,  xCenter: -150,  xWidth: 250 },
      { zStart: -3740, drop: 25,  xCenter: 550,   xWidth: 300 },
      { zStart: -3810, drop: 15,  xCenter: -500,  xWidth: 280 },
      { zStart: -3880, drop: 18,  xCenter: 50,    xWidth: 250 },
      { zStart: -3950, drop: 10,  xCenter: -300,  xWidth: 220 },
      { zStart: -4020, drop: 20,  xCenter: 350,   xWidth: 300 },
      { zStart: -4100, drop: 8,   xCenter: -200,  xWidth: 200 },
    ],

    // Hand-placed jumps spread across the full width
    jumps: [
      // Zone 1: Steep entry
      { z: -80,   x: -300,  feet: 25 },
      { z: -100,  x: 250,   feet: 20 },
      { z: -170,  x: -50,   feet: 30 },
      { z: -200,  x: 500,   feet: 20 },
      { z: -270,  x: -500,  feet: 25 },
      { z: -330,  x: 150,   feet: 20 },
      { z: -380,  x: -250,  feet: 25 },
      // Zone 2: Mellow glades
      { z: -440,  x: 400,   feet: 25 },
      { z: -490,  x: -350,  feet: 30 },
      { z: -540,  x: 50,    feet: 20 },
      { z: -590,  x: 550,   feet: 25 },
      { z: -650,  x: -450,  feet: 20 },
      { z: -710,  x: 200,   feet: 30 },
      { z: -770,  x: -150,  feet: 20 },
      { z: -830,  x: 350,   feet: 25 },
      { z: -880,  x: -550,  feet: 20 },
      // Zone 3: Steep chutes
      { z: -950,  x: 400,   feet: 30 },
      { z: -1000, x: -200,  feet: 25 },
      { z: -1060, x: 150,   feet: 35 },
      { z: -1120, x: -500,  feet: 25 },
      { z: -1180, x: 300,   feet: 30 },
      { z: -1250, x: -100,  feet: 25 },
      { z: -1310, x: 550,   feet: 20 },
      { z: -1370, x: -400,  feet: 30 },
      { z: -1430, x: 50,    feet: 25 },
      { z: -1490, x: -300,  feet: 20 },
      // Zone 4: Mellow trees
      { z: -1550, x: 250,   feet: 25 },
      { z: -1620, x: -350,  feet: 20 },
      { z: -1690, x: 450,   feet: 25 },
      { z: -1750, x: -50,   feet: 30 },
      { z: -1820, x: 350,   feet: 20 },
      { z: -1890, x: -500,  feet: 25 },
      { z: -1960, x: 100,   feet: 25 },
      { z: -2030, x: -350,  feet: 20 },
      { z: -2080, x: 500,   feet: 25 },
      // Zone 5: Steep drops
      { z: -2150, x: -200,  feet: 30 },
      { z: -2220, x: 400,   feet: 35 },
      { z: -2290, x: -450,  feet: 25 },
      { z: -2360, x: 150,   feet: 30 },
      { z: -2430, x: -100,  feet: 35 },
      { z: -2500, x: 550,   feet: 25 },
      { z: -2570, x: -350,  feet: 30 },
      { z: -2640, x: 250,   feet: 25 },
      { z: -2720, x: -500,  feet: 30 },
      { z: -2780, x: 50,    feet: 25 },
      // Zone 6: Mellow wooded
      { z: -2850, x: 400,   feet: 25 },
      { z: -2920, x: -250,  feet: 20 },
      { z: -2990, x: 300,   feet: 30 },
      { z: -3060, x: -500,  feet: 25 },
      { z: -3130, x: 100,   feet: 20 },
      { z: -3200, x: -150,  feet: 25 },
      { z: -3270, x: 500,   feet: 30 },
      { z: -3340, x: -400,  feet: 20 },
      { z: -3420, x: 200,   feet: 25 },
      { z: -3480, x: -300,  feet: 20 },
      // Zone 7: Final runout
      { z: -3550, x: 350,   feet: 25 },
      { z: -3630, x: -200,  feet: 30 },
      { z: -3700, x: 450,   feet: 20 },
      { z: -3780, x: -100,  feet: 25 },
      { z: -3860, x: 300,   feet: 30 },
      { z: -3940, x: -450,  feet: 20 },
      { z: -4020, x: 150,   feet: 25 },
      { z: -4100, x: -250,  feet: 20 },
    ],

    // Procedural natural kickers per chunk (wind lips, snow mounds, pillows)
    naturalKickerDensity: 6,
    naturalKickerSpread: 1500,
  },

  peak: {
    name: 'PEAK BACKCOUNTRY',
    slopeAngle: 0.40,             // base slope (overridden by slopeZones)
    chunkWidth: 2400,             // ~3x summit's 800
    chunkLength: 75,
    totalChunks: 56,
    seed: 256,
    bowlStrength: 8,              // gentle bowl sides — wide open terrain
    bowlWidth: 800,               // flat floor extends 800 units each side
    cliffs: [],                   // using partialCliffs instead
    treeLineZ: 0,                 // trees everywhere from the start
    rockDensity: 0.8,
    treeDensity: 60.0,            // dense forest
    checkpointInterval: 340,
    checkpointCount: 12,
    generateRadius: 1,            // one chunk at a time for performance

    // Variable slope zones — steepness changes down the mountain
    // Each zone: { endZ: where it ends (negative), slope: steepness }
    // Zones are in order from top (z=0) to bottom
    slopeZones: [
      { endZ: -500,  slope: 0.45 },   // steep entry — fast start
      { endZ: -1100, slope: 0.28 },   // park-like mellow section
      { endZ: -1600, slope: 0.55 },   // steep chutes
      { endZ: -2200, slope: 0.30 },   // mellow tree runs
      { endZ: -3200, slope: 0.50 },   // steep cliff section
      { endZ: -4200, slope: 0.35 },   // final runout
    ],

    // Partial-width cliffs — avoidable by riding around them
    // Mix of small 25-footers to massive 200-footers across the whole run
    partialCliffs: [
      // --- Zone 1: Steep entry (z 0 to -500) — warm-up drops ---
      { zStart: -120,  drop: 8,   xCenter: 80,   xWidth: 200 },
      { zStart: -200,  drop: 12,  xCenter: -150,  xWidth: 250 },
      { zStart: -280,  drop: 10,  xCenter: 250,  xWidth: 220 },
      { zStart: -350,  drop: 15,  xCenter: -50,  xWidth: 280 },
      { zStart: -440,  drop: 18,  xCenter: 180,  xWidth: 260 },

      // --- Zone 2: Mellow section (z -500 to -1100) — medium drops ---
      { zStart: -530,  drop: 22,  xCenter: -200, xWidth: 300 },
      { zStart: -600,  drop: 14,  xCenter: 350,  xWidth: 200 },
      { zStart: -680,  drop: 30,  xCenter: 50,   xWidth: 350 },
      { zStart: -760,  drop: 10,  xCenter: -400, xWidth: 180 },
      { zStart: -830,  drop: 35,  xCenter: 300,  xWidth: 400 },
      { zStart: -920,  drop: 18,  xCenter: -250, xWidth: 240 },
      { zStart: -1000, drop: 25,  xCenter: 150,  xWidth: 300 },
      { zStart: -1070, drop: 12,  xCenter: -350, xWidth: 200 },

      // --- Zone 3: Steep chutes (z -1100 to -1600) — big drops ---
      { zStart: -1140, drop: 45,  xCenter: -100, xWidth: 380 },
      { zStart: -1220, drop: 20,  xCenter: 400,  xWidth: 250 },
      { zStart: -1300, drop: 55,  xCenter: -250, xWidth: 400 },
      { zStart: -1380, drop: 15,  xCenter: 200,  xWidth: 220 },
      { zStart: -1450, drop: 65,  xCenter: 50,   xWidth: 450 },
      { zStart: -1550, drop: 30,  xCenter: -400, xWidth: 300 },

      // --- Zone 4: Mellow tree runs (z -1600 to -2200) — varied ---
      { zStart: -1650, drop: 40,  xCenter: 350,  xWidth: 320 },
      { zStart: -1730, drop: 12,  xCenter: -150, xWidth: 200 },
      { zStart: -1810, drop: 50,  xCenter: -300, xWidth: 380 },
      { zStart: -1900, drop: 18,  xCenter: 250,  xWidth: 240 },
      { zStart: -1980, drop: 35,  xCenter: 0,    xWidth: 300 },
      { zStart: -2060, drop: 22,  xCenter: -450, xWidth: 260 },
      { zStart: -2140, drop: 28,  xCenter: 400,  xWidth: 280 },

      // --- Zone 5: Steep cliff section (z -2200 to -3200) — massive drops ---
      { zStart: -2250, drop: 60,  xCenter: -200, xWidth: 400 },
      { zStart: -2330, drop: 25,  xCenter: 300,  xWidth: 250 },
      { zStart: -2420, drop: 80,  xCenter: 100,  xWidth: 500 },
      { zStart: -2520, drop: 15,  xCenter: -400, xWidth: 200 },
      { zStart: -2600, drop: 70,  xCenter: -150, xWidth: 450 },
      { zStart: -2700, drop: 35,  xCenter: 350,  xWidth: 300 },
      { zStart: -2780, drop: 90,  xCenter: 50,   xWidth: 500 },
      { zStart: -2880, drop: 20,  xCenter: -350, xWidth: 240 },
      { zStart: -2960, drop: 100, xCenter: 200,  xWidth: 550 },
      { zStart: -3060, drop: 40,  xCenter: -250, xWidth: 300 },
      { zStart: -3150, drop: 75,  xCenter: 0,    xWidth: 480 },

      // --- Zone 6: Final runout (z -3200 to -4200) — tapering off ---
      { zStart: -3280, drop: 50,  xCenter: 300,  xWidth: 350 },
      { zStart: -3360, drop: 30,  xCenter: -200, xWidth: 280 },
      { zStart: -3450, drop: 65,  xCenter: -50,  xWidth: 420 },
      { zStart: -3550, drop: 18,  xCenter: 400,  xWidth: 220 },
      { zStart: -3640, drop: 45,  xCenter: -300, xWidth: 350 },
      { zStart: -3730, drop: 55,  xCenter: 150,  xWidth: 400 },
      { zStart: -3820, drop: 12,  xCenter: -400, xWidth: 200 },
      { zStart: -3900, drop: 35,  xCenter: 250,  xWidth: 300 },
      { zStart: -3980, drop: 20,  xCenter: -100, xWidth: 250 },
      { zStart: -4060, drop: 10,  xCenter: 100,  xWidth: 200 },
      { zStart: -4130, drop: 8,   xCenter: -50,  xWidth: 180 },
    ],

    // Frozen rivers — gap type (jumpable V-channels) and basin type (wide icy flats)
    rivers: [
      { type: 'gap',   z: -700,  xCenter: 0,    gapWidth: 13, depth: 9,
        escapePath: [{ x: 30, z: -700 }, { x: 80, z: -720 }, { x: 120, z: -750 }, { x: 100, z: -800 }] },
      { type: 'basin', z: -1400, xCenter: -50,  basinWidth: 32, basinLength: 90, depth: 4.5,
        escapePath: [{ x: -50, z: -1400 }, { x: -120, z: -1420 }, { x: -180, z: -1450 }, { x: -200, z: -1500 }] },
      { type: 'gap',   z: -2000, xCenter: 100,  gapWidth: 14, depth: 10,
        escapePath: [{ x: 100, z: -2000 }, { x: 50, z: -2020 }, { x: -20, z: -2060 }, { x: -50, z: -2100 }] },
      { type: 'basin', z: -2900, xCenter: 200,  basinWidth: 35, basinLength: 80, depth: 5,
        escapePath: [{ x: 200, z: -2900 }, { x: 260, z: -2920 }, { x: 320, z: -2960 }, { x: 300, z: -3010 }] },
      { type: 'gap',   z: -3600, xCenter: -150, gapWidth: 12, depth: 8,
        escapePath: [{ x: -150, z: -3600 }, { x: -200, z: -3620 }, { x: -260, z: -3660 }, { x: -240, z: -3710 }] },
    ],
  },
};

export class BackcountryTerrain {
  constructor(scene, chairId) {
    this.scene = scene;
    this.chairId = chairId;
    this.config = CHAIRS[chairId];
    if (!this.config) throw new Error(`Unknown chair: ${chairId}`);

    this.chunks = [];
    this.chunkLength = this.config.chunkLength;
    this.chunkWidth = this.config.chunkWidth;
    this.slopeAngle = this.config.slopeAngle;
    this.chunksGenerated = 0;
    this.obstacles = [];
    this.ramps = [];       // no man-made ramps in backcountry
    this.checkpoints = [];
    this.nextCheckpointZ = -this.config.checkpointInterval;

    // Seeded RNG for deterministic placement
    this.rng = mulberry32(this.config.seed);

    // Materials
    this.snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xeaf0f6, roughness: 0.75, metalness: 0.02,
    });
    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a6672, roughness: 0.95, flatShading: true,
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
    this.cliffMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568, roughness: 0.9, flatShading: true,
    });
    this.iceMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccee, roughness: 0.15, metalness: 0.1,
      transparent: true, opacity: 0.7,
    });
    this.poleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600, roughness: 0.6,
    });

    // River zones — populated during chunk generation for collision detection
    this.riverZones = [];

    // Lazy chunk generation — keep generateRadius chunks around the player
    this.generateRadius = this.config.generateRadius || 3;
    const initialChunks = Math.min(this.generateRadius, this.config.totalChunks);
    for (let i = 0; i < initialChunks; i++) {
      this.generateChunk();
    }

    // Populate riverZones from config for collision detection in Player.js
    if (this.config.rivers) {
      for (const river of this.config.rivers) {
        if (river.type === 'gap') {
          this.riverZones.push({
            type: 'gap',
            z: river.z,
            xCenter: river.xCenter,
            halfGapZ: river.gapWidth / 2,
            halfWidthX: river.gapWidth * 3,
            depth: river.depth,
            lipHeight: this.computeHeight(river.xCenter, river.z + river.gapWidth / 2),
            escapePath: river.escapePath,
          });
        } else if (river.type === 'basin') {
          this.riverZones.push({
            type: 'basin',
            z: river.z,
            xCenter: river.xCenter,
            halfLenZ: river.basinLength / 2,
            halfWidthX: river.basinWidth / 2,
            depth: river.depth,
            escapePath: river.escapePath,
          });
        }
      }
    }
  }

  // ---- VARIABLE SLOPE ----
  // Piecewise integration of slopeZones to get cumulative height drop at globalZ
  integratedSlope(globalZ) {
    const zones = this.config.slopeZones;
    if (!zones) return globalZ * this.config.slopeAngle;

    let height = 0;
    let prevEnd = 0; // top of the mountain (z=0)
    const transitionLen = 50; // blend between zones over 50 units

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const zoneStart = prevEnd;
      const zoneEnd = zone.endZ;

      // If globalZ hasn't reached this zone yet, compute partial contribution
      if (globalZ >= zoneStart) {
        // Player is above this zone — no contribution
        prevEnd = zoneEnd;
        continue;
      }

      // How far into this zone does globalZ reach?
      const entryZ = Math.max(globalZ, zoneEnd);
      const dz = zoneStart - entryZ; // positive distance into zone

      // Get effective slope (blend with previous zone near boundary)
      let slope = zone.slope;
      if (i > 0 && dz < transitionLen) {
        const prevSlope = zones[i - 1].slope;
        const blend = dz / transitionLen;
        slope = prevSlope + (zone.slope - prevSlope) * (blend * blend * (3 - 2 * blend)); // smoothstep
      }

      height -= dz * slope;

      if (globalZ >= zoneEnd) {
        // globalZ is within this zone — done
        break;
      }

      prevEnd = zoneEnd;
    }

    return height;
  }

  // ---- HEIGHT FUNCTION ----
  // Deterministic — no randomness, purely mathematical
  computeHeight(x, globalZ) {
    const cfg = this.config;
    let height = 0;

    // Base slope — use variable zones if available, otherwise constant
    if (cfg.slopeZones) {
      height += this.integratedSlope(globalZ);
    } else {
      height += globalZ * cfg.slopeAngle;
    }

    // Very subtle terrain variation — smooth bowl, no bumps
    height += Math.sin(x * 0.005 + globalZ * 0.002) * 0.4;

    // Multi-octave terrain noise — natural rollers, bumps, and micro-terrain
    if (cfg.terrainNoise) {
      const tn = cfg.terrainNoise;
      // Large rollers perpendicular to slope — create natural air opportunities
      const rollerPhase = Math.sin(x * tn.rollerFreqX) * 2.0;
      const roller = Math.sin(globalZ * tn.rollerFreqZ + rollerPhase) * tn.rollerAmplitude;
      // Vary roller amplitude across width so it's not uniform
      const rollerMod = 0.5 + 0.5 * Math.sin(x * tn.rollerFreqX * 3.7 + globalZ * 0.003);
      height += roller * rollerMod;

      // Medium bumps — offset frequencies for organic feel
      const med1 = Math.sin(x * tn.mediumFreqX + 1.7) * Math.cos(globalZ * tn.mediumFreqZ + 0.9);
      const med2 = Math.cos(x * tn.mediumFreqX * 0.6 + 3.2) * Math.sin(globalZ * tn.mediumFreqZ * 1.4 + 2.1);
      height += (med1 + med2 * 0.6) * tn.mediumAmplitude;

      // Small terrain detail — crunchy surface variation
      const sm1 = Math.sin(x * tn.smallFreqX + 3.1) * Math.sin(globalZ * tn.smallFreqZ + 2.3);
      const sm2 = Math.cos(x * tn.smallFreqX * 1.3 + 0.5) * Math.cos(globalZ * tn.smallFreqZ * 0.8 + 1.7);
      height += (sm1 + sm2 * 0.5) * tn.smallAmplitude;
    }

    // Bowl shape — terrain curves up on the sides
    const distFromCenter = Math.abs(x);
    if (distFromCenter > cfg.bowlWidth) {
      const excess = (distFromCenter - cfg.bowlWidth) / (cfg.chunkWidth / 2 - cfg.bowlWidth);
      height += Math.pow(Math.min(excess, 1.0), 1.8) * cfg.bowlStrength;
    }

    // Cliff bands — near-vertical rock drops at specific Z ranges
    for (const cliff of cfg.cliffs) {
      if (globalZ < cliff.zStart && globalZ > cliff.zEnd) {
        const progress = (cliff.zStart - globalZ) / (cliff.zStart - cliff.zEnd);
        // Very steep sigmoid — nearly vertical drop
        const dropFactor = 1 / (1 + Math.exp(-25 * (progress - 0.5)));
        height -= cliff.drop * dropFactor;
      } else if (globalZ <= cliff.zEnd) {
        // Below the cliff — permanently lowered
        height -= cliff.drop;
      }
    }

    // Scattered cliff ledges — small droppable faces at various positions
    if (cfg.ledges) {
      for (const ledge of cfg.ledges) {
        const dx = x - ledge.x;
        const dz = globalZ - ledge.z;
        const halfW = ledge.w / 2;
        // Only affect terrain within the ledge's width band
        if (Math.abs(dx) < halfW && dz < 0 && dz > -8) {
          const xFade = 1 - Math.pow(Math.abs(dx) / halfW, 2); // smooth fade at edges
          const zProgress = -dz / 8;
          const dropFactor = 1 / (1 + Math.exp(-10 * (zProgress - 0.5)));
          height -= ledge.drop * dropFactor * xFade;
        } else if (Math.abs(dx) < halfW && dz <= -8) {
          const xFade = 1 - Math.pow(Math.abs(dx) / halfW, 2);
          height -= ledge.drop * xFade;
        }
      }
    }

    // Sub-bowls — concave pockets within the main bowl
    if (cfg.subBowls) {
      for (const sb of cfg.subBowls) {
        const dx = x - sb.x;
        const dz = globalZ - sb.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < sb.radius) {
          const t = 1 - dist / sb.radius;
          // Smooth parabolic depression
          height -= sb.depth * t * t;
        }
      }
    }

    // Pillow field — rounded snow mounds at two scales
    if (cfg.pillowField) {
      const pf = cfg.pillowField;
      const p1 = Math.sin(x * pf.frequency) * Math.cos(globalZ * pf.frequency * 1.3);
      const p2 = Math.cos(x * pf.frequency * 0.7 + 1.5) * Math.sin(globalZ * pf.frequency * 0.9 + 0.8);
      const pillow = Math.max(0, (p1 + p2) * 0.5) * pf.strength;
      const s1 = Math.sin(x * pf.secondaryFreq + 2.3) * Math.cos(globalZ * pf.secondaryFreq * 1.1 + 1.1);
      const secondary = (s1 * 0.5 + 0.5) * pf.secondaryStrength;
      height += pillow + secondary;
    }

    // Partial-width cliffs — only affect part of the terrain width
    if (cfg.partialCliffs) {
      for (const cliff of cfg.partialCliffs) {
        const cliffEnd = cliff.zStart - cliff.drop * 0.6; // length proportional to drop
        if (globalZ < cliff.zStart && globalZ > cliffEnd) {
          // Horizontal fade — only affects xCenter ± xWidth/2 with 80-unit smooth edges
          const dx = Math.abs(x - cliff.xCenter);
          const halfW = cliff.xWidth / 2;
          let xFade = 1;
          if (dx > halfW) {
            xFade = Math.max(0, 1 - (dx - halfW) / 80);
          }
          if (xFade > 0) {
            const progress = (cliff.zStart - globalZ) / (cliff.zStart - cliffEnd);
            const dropFactor = 1 / (1 + Math.exp(-25 * (progress - 0.5)));
            height -= cliff.drop * dropFactor * xFade;
          }
        } else if (globalZ <= cliffEnd) {
          const dx = Math.abs(x - cliff.xCenter);
          const halfW = cliff.xWidth / 2;
          let xFade = 1;
          if (dx > halfW) {
            xFade = Math.max(0, 1 - (dx - halfW) / 80);
          }
          if (xFade > 0) {
            height -= cliff.drop * xFade;
          }
        }
      }
    }

    // Frozen rivers — V-shaped gaps and wide basins
    if (cfg.rivers) {
      for (const river of cfg.rivers) {
        if (river.type === 'gap') {
          const dz = globalZ - river.z;
          const halfGap = river.gapWidth / 2;
          if (Math.abs(dz) < halfGap) {
            // V-shaped channel perpendicular to slope
            const dx = Math.abs(x - river.xCenter);
            if (dx < river.gapWidth * 3) { // river width in X is ~3x gap width
              const xFade = Math.max(0, 1 - dx / (river.gapWidth * 3));
              const vShape = 1 - Math.abs(dz) / halfGap; // 1 at center, 0 at edges
              height -= river.depth * vShape * xFade;
            }
          }
        } else if (river.type === 'basin') {
          const dz = globalZ - river.z;
          const halfLen = river.basinLength / 2;
          const halfW = river.basinWidth / 2;
          if (Math.abs(dz) < halfLen) {
            const dx = Math.abs(x - river.xCenter);
            if (dx < halfW) {
              // Smooth basin depression
              const zFade = 1 - Math.pow(Math.abs(dz) / halfLen, 2);
              const xFade = 1 - Math.pow(dx / halfW, 2);
              height -= river.depth * zFade * xFade;
            }
          }
        }
      }
    }

    // Runout zone — flatten at the bottom
    const totalLength = cfg.totalChunks * cfg.chunkLength;
    const runoutStart = -(totalLength - 400);
    if (globalZ < runoutStart) {
      const runoutProgress = Math.min((runoutStart - globalZ) / 300, 1.0);
      // Gradually reduce slope to near-flat
      const slopeReduction = cfg.slopeAngle * 0.7 * runoutProgress;
      height -= (globalZ - runoutStart) * slopeReduction;
    }

    // Soft terrain rise at far edges (invisible to player — just prevents falling off world)
    const edgeDist = cfg.chunkWidth / 2 - distFromCenter;
    if (edgeDist < 30) {
      height += Math.pow((30 - edgeDist) / 30, 2) * 12;
    }

    return height;
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

  // ---- CHUNK GENERATION ----
  generateChunk() {
    const zOffset = -this.chunksGenerated * this.chunkLength;
    // yOffset must match computeHeight at center (x=0) for correct mesh placement
    const yOffset = this.config.slopeZones
      ? -this.integratedSlope(zOffset)
      : -this.chunksGenerated * this.chunkLength * this.slopeAngle;

    const xSegs = Math.min(200, Math.ceil(this.chunkWidth / 4));
    const zSegs = Math.min(200, Math.ceil(this.chunkLength / 2.5));
    const geometry = new THREE.PlaneGeometry(this.chunkWidth, this.chunkLength, xSegs, zSegs);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const cfg = this.config;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const globalZ = zOffset + z;

      const globalHeight = this.computeHeight(x, globalZ);
      positions.setY(i, globalHeight - yOffset);

      // Snow color — slightly bluer in shadows (bowl sides), whiter on open faces
      const distFromCenter = Math.abs(x) / (this.chunkWidth / 2);
      const base = 0.93 + Math.sin(x * 0.08 + globalZ * 0.04) * 0.03;
      const shadowTint = distFromCenter > 0.5 ? 0.04 : 0;
      colors[i * 3] = base - shadowTint * 1.5;
      colors[i * 3 + 1] = base - shadowTint * 0.5;
      colors[i * 3 + 2] = base + shadowTint;

      // Pillow highlights — slightly brighter on mound tops
      if (cfg.pillowField) {
        const pf = cfg.pillowField;
        const p1 = Math.sin(x * pf.frequency) * Math.cos(globalZ * pf.frequency * 1.3);
        const p2 = Math.cos(x * pf.frequency * 0.7 + 1.5) * Math.sin(globalZ * pf.frequency * 0.9 + 0.8);
        const pillowIntensity = Math.max(0, (p1 + p2) * 0.5);
        const brighten = pillowIntensity * 0.04;
        colors[i * 3] = Math.min(1, colors[i * 3] + brighten);
        colors[i * 3 + 1] = Math.min(1, colors[i * 3 + 1] + brighten);
        colors[i * 3 + 2] = Math.min(1, colors[i * 3 + 2] + brighten * 0.5);
      }

      // Full-width cliff faces get dark rock color
      for (const cliff of cfg.cliffs) {
        if (globalZ < cliff.zStart && globalZ > cliff.zEnd) {
          const progress = (cliff.zStart - globalZ) / (cliff.zStart - cliff.zEnd);
          if (progress > 0.2 && progress < 0.8) {
            const rockBlend = 0.8;
            colors[i * 3] = base * (1 - rockBlend) + 0.28 * rockBlend;
            colors[i * 3 + 1] = base * (1 - rockBlend) + 0.30 * rockBlend;
            colors[i * 3 + 2] = base * (1 - rockBlend) + 0.33 * rockBlend;
          }
        }
      }

      // Partial cliff faces get dark rock color within their X range
      if (cfg.partialCliffs) {
        for (const cliff of cfg.partialCliffs) {
          const cliffEnd = cliff.zStart - cliff.drop * 0.6;
          if (globalZ < cliff.zStart && globalZ > cliffEnd) {
            const progress = (cliff.zStart - globalZ) / (cliff.zStart - cliffEnd);
            if (progress > 0.2 && progress < 0.8) {
              const dx = Math.abs(x - cliff.xCenter);
              const halfW = cliff.xWidth / 2;
              let xFade = 1;
              if (dx > halfW) xFade = Math.max(0, 1 - (dx - halfW) / 80);
              if (xFade > 0.1) {
                const rockBlend = 0.8 * xFade;
                colors[i * 3] = base * (1 - rockBlend) + 0.28 * rockBlend;
                colors[i * 3 + 1] = base * (1 - rockBlend) + 0.30 * rockBlend;
                colors[i * 3 + 2] = base * (1 - rockBlend) + 0.33 * rockBlend;
              }
            }
          }
        }
      }

      // River ice tint — blend toward blue in river zones
      if (cfg.rivers) {
        for (const river of cfg.rivers) {
          let inRiver = 0;
          if (river.type === 'gap') {
            const dz = globalZ - river.z;
            const halfGap = river.gapWidth / 2;
            if (Math.abs(dz) < halfGap) {
              const dx = Math.abs(x - river.xCenter);
              if (dx < river.gapWidth * 3) {
                inRiver = (1 - dx / (river.gapWidth * 3)) * (1 - Math.abs(dz) / halfGap);
              }
            }
          } else if (river.type === 'basin') {
            const dz = globalZ - river.z;
            const halfLen = river.basinLength / 2;
            const halfW = river.basinWidth / 2;
            if (Math.abs(dz) < halfLen && Math.abs(x - river.xCenter) < halfW) {
              const zF = 1 - Math.pow(Math.abs(dz) / halfLen, 2);
              const xF = 1 - Math.pow(Math.abs(x - river.xCenter) / halfW, 2);
              inRiver = zF * xF;
            }
          }
          if (inRiver > 0.05) {
            const iceBlend = inRiver * 0.6;
            colors[i * 3] = colors[i * 3] * (1 - iceBlend) + 0.53 * iceBlend;
            colors[i * 3 + 1] = colors[i * 3 + 1] * (1 - iceBlend) + 0.80 * iceBlend;
            colors[i * 3 + 2] = colors[i * 3 + 2] * (1 - iceBlend) + 0.93 * iceBlend;
          }
        }
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

    const chunk = { mesh, zOffset, yOffset, objects: [], chunkObstacles: [] };

    // ---- Place obstacles (deterministic via seeded RNG) ----
    this.placeCliffWalls(chunk, zOffset);
    this.placePartialCliffWalls(chunk, zOffset);
    this.placeRocks(chunk, zOffset);
    this.placeTrees(chunk, zOffset);
    this.placeRiverVisuals(chunk, zOffset);
    this.placeJumps(chunk, zOffset);
    this.placeNaturalKickers(chunk, zOffset);

    // ---- Checkpoints ----
    while (this.nextCheckpointZ > zOffset - this.chunkLength &&
           this.checkpoints.length < this.config.checkpointCount) {
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
      this.nextCheckpointZ -= this.config.checkpointInterval;
    }

    this.chunks.push(chunk);
    this.chunksGenerated++;
  }

  // ---- CLIFF WALL MESHES — 3D rock faces at cliff bands ----
  placeCliffWalls(chunk, zOffset) {
    const cfg = this.config;
    for (const cliff of cfg.cliffs) {
      const cliffMidZ = (cliff.zStart + cliff.zEnd) / 2;
      // Only place wall if this cliff falls within this chunk's Z range
      if (cliffMidZ > zOffset || cliffMidZ < zOffset - this.chunkLength) continue;

      // Build a rock wall spanning the rideable bowl width
      const wallWidth = cfg.bowlWidth * 2;
      const segments = 20;
      const segWidth = wallWidth / segments;

      for (let s = 0; s < segments; s++) {
        const segX = -wallWidth / 2 + segWidth * s + segWidth / 2;
        const segSeed = Math.abs(Math.sin(segX * 0.37 + cliff.zStart * 0.13));
        const segW = segWidth * (0.9 + segSeed * 0.2);

        // Compute top and bottom heights of the cliff face at this X position
        const topY = this.computeHeight(segX, cliff.zStart);
        const bottomY = this.computeHeight(segX, cliff.zEnd);
        // Wall sits below the snow line — only the exposed rock face
        const wallH = Math.max(topY - bottomY, cliff.drop * 0.2) * (0.35 + segSeed * 0.15);
        const centerY = bottomY + wallH / 2;

        const geo = new THREE.BoxGeometry(segW, wallH, 3);
        const pos = geo.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const vy = pos.getY(v);
          const vx = pos.getX(v);
          const vz = pos.getZ(v);
          if (vz > 0) {
            pos.setZ(v, vz + Math.sin(vx * 2.1 + vy * 1.7) * 0.6);
          }
          if (vy > 0) {
            pos.setY(v, vy + Math.sin(vx * 3.0) * 0.4);
          }
        }
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, this.cliffMaterial);
        mesh.position.set(segX, centerY, cliffMidZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        chunk.objects.push(mesh);
      }
    }
  }

  // ---- PARTIAL CLIFF WALLS — rock faces constrained to X range ----
  placePartialCliffWalls(chunk, zOffset) {
    const cfg = this.config;
    if (!cfg.partialCliffs) return;

    for (const cliff of cfg.partialCliffs) {
      const cliffEnd = cliff.zStart - cliff.drop * 0.6;
      const cliffMidZ = (cliff.zStart + cliffEnd) / 2;
      if (cliffMidZ > zOffset || cliffMidZ < zOffset - this.chunkLength) continue;

      const wallWidth = cliff.xWidth;
      const segments = Math.max(8, Math.ceil(wallWidth / 20));
      const segWidth = wallWidth / segments;

      for (let s = 0; s < segments; s++) {
        const segX = cliff.xCenter - wallWidth / 2 + segWidth * s + segWidth / 2;
        const segSeed = Math.abs(Math.sin(segX * 0.37 + cliff.zStart * 0.13));
        const segW = segWidth * (0.9 + segSeed * 0.2);

        const topY = this.computeHeight(segX, cliff.zStart);
        const bottomY = this.computeHeight(segX, cliffEnd);
        const wallH = Math.max(topY - bottomY, cliff.drop * 0.15) * (0.3 + segSeed * 0.2);
        if (wallH < 1) continue;
        const centerY = bottomY + wallH / 2;

        const geo = new THREE.BoxGeometry(segW, wallH, 3);
        const pos = geo.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const vy = pos.getY(v);
          const vx = pos.getX(v);
          const vz = pos.getZ(v);
          if (vz > 0) pos.setZ(v, vz + Math.sin(vx * 2.1 + vy * 1.7) * 0.6);
          if (vy > 0) pos.setY(v, vy + Math.sin(vx * 3.0) * 0.4);
        }
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, this.cliffMaterial);
        mesh.position.set(segX, centerY, cliffMidZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        chunk.objects.push(mesh);
      }
    }
  }

  // ---- RIVER VISUALS — ice plane meshes at river floors ----
  placeRiverVisuals(chunk, zOffset) {
    const cfg = this.config;
    if (!cfg.rivers) return;

    for (const river of cfg.rivers) {
      // Check if this river falls within this chunk's Z range
      if (river.type === 'gap') {
        if (river.z > zOffset || river.z < zOffset - this.chunkLength) continue;
        // Ice plane at bottom of V-channel
        const iceWidth = river.gapWidth * 5;
        const iceLength = river.gapWidth * 0.8;
        const geo = new THREE.PlaneGeometry(iceWidth, iceLength);
        geo.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(geo, this.iceMaterial);
        const iceY = this.computeHeight(river.xCenter, river.z) + 0.1;
        mesh.position.set(river.xCenter, iceY, river.z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        chunk.objects.push(mesh);
      } else if (river.type === 'basin') {
        const basinStart = river.z + river.basinLength / 2;
        const basinEnd = river.z - river.basinLength / 2;
        if (basinStart < zOffset - this.chunkLength || basinEnd > zOffset) continue;
        // Large ice plane covering basin floor
        const geo = new THREE.PlaneGeometry(river.basinWidth * 0.9, river.basinLength * 0.8);
        geo.rotateX(-Math.PI / 2);
        const mesh = new THREE.Mesh(geo, this.iceMaterial);
        const iceY = this.computeHeight(river.xCenter, river.z) + 0.1;
        mesh.position.set(river.xCenter, iceY, river.z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        chunk.objects.push(mesh);
      }
    }
  }

  // ---- JUMP PLACEMENT (fixed positions from config) ----
  placeJumps(chunk, zOffset) {
    const cfg = this.config;
    if (!cfg.jumps) return;

    for (const jump of cfg.jumps) {
      if (jump.z > zOffset || jump.z < zOffset - this.chunkLength) continue;

      const feet = jump.feet;
      const scale = feet / 30;
      const width = 4.0 * scale;
      const length = 5.0 * scale;
      const lipHeight = 2.0 * scale;
      const lipAngle = 0.45;

      const feature = this.createBackcountryJump(feet);

      // Embed in terrain — sample height across footprint
      const halfW = width / 2;
      const halfL = length / 2;
      let minY = Infinity;
      for (const sx of [-halfW, 0, halfW]) {
        for (const sz of [-halfL, 0, halfL]) {
          const h = this.computeHeight(jump.x + sx, jump.z + sz);
          if (h < minY) minY = h;
        }
      }
      minY -= 0.2;

      feature.position.set(jump.x, minY, jump.z);
      this.scene.add(feature);
      chunk.objects.push(feature);

      // Register as kicker for Player.js physics
      const rampData = {
        mesh: feature,
        position: new THREE.Vector3(jump.x, minY, jump.z),
        type: 'kicker',
        width,
        length,
        size: 'small',
        lipHeight,
        lipAngle,
        surfaceHeight: 0,
      };
      this.ramps.push(rampData);

      if (!chunk.chunkRamps) chunk.chunkRamps = [];
      chunk.chunkRamps.push(rampData);
    }
  }

  // ---- NATURAL KICKER PLACEMENT (procedural wind lips, snow mounds, pillows) ----
  placeNaturalKickers(chunk, zOffset) {
    const cfg = this.config;
    if (!cfg.naturalKickerDensity) return;

    const count = cfg.naturalKickerDensity;
    const spread = cfg.naturalKickerSpread || (cfg.bowlWidth * 1.4);

    for (let i = 0; i < count; i++) {
      const x = (this.rng() - 0.5) * spread;
      const z = (this.rng() - 0.5) * this.chunkLength;
      const globalZ = zOffset + z;

      // Skip if too close to center line
      if (Math.abs(x) < 5) continue;

      // Random size: 15-40 foot equivalent
      const feet = 15 + this.rng() * 25;
      const scale = feet / 30;
      const width = 4.5 * scale;
      const length = 5.5 * scale;
      const lipHeight = 2.2 * scale;
      const lipAngle = 0.38 + this.rng() * 0.18;

      // 65% natural mounds, 35% man-made kickers
      const isNatural = this.rng() > 0.35;
      const feature = isNatural
        ? this.createNaturalMound(feet)
        : this.createBackcountryJump(feet);

      // Embed in terrain
      const halfW = width / 2;
      const halfL = length / 2;
      let minY = Infinity;
      for (const sx of [-halfW, 0, halfW]) {
        for (const sz of [-halfL, 0, halfL]) {
          const h = this.computeHeight(x + sx, globalZ + sz);
          if (h < minY) minY = h;
        }
      }
      minY -= 0.3;

      feature.position.set(x, minY, globalZ);
      this.scene.add(feature);
      chunk.objects.push(feature);

      // Register as kicker ramp for player physics
      const rampData = {
        mesh: feature,
        position: new THREE.Vector3(x, minY, globalZ),
        type: 'kicker',
        width,
        length,
        size: 'small',
        lipHeight,
        lipAngle,
        surfaceHeight: 0,
      };
      this.ramps.push(rampData);
      if (!chunk.chunkRamps) chunk.chunkRamps = [];
      chunk.chunkRamps.push(rampData);
    }
  }

  // ---- ROCK PLACEMENT (deterministic) ----
  placeRocks(chunk, zOffset) {
    const count = Math.floor(12 * this.config.rockDensity * (this.chunkLength / 300));
    for (let i = 0; i < count; i++) {
      const x = (this.rng() - 0.5) * (this.config.bowlWidth * 1.8);
      const z = (this.rng() - 0.5) * this.chunkLength;
      const globalZ = zOffset + z;
      const y = this.computeHeight(x, globalZ);

      // Skip if too close to center line
      if (Math.abs(x) < 6) continue;

      const rock = this.createRock();
      rock.position.set(x, y, globalZ);
      this.scene.add(rock);
      chunk.objects.push(rock);
      const obs = { position: new THREE.Vector3(x, y, globalZ), radius: 2.0, type: 'rock' };
      this.obstacles.push(obs);
      chunk.chunkObstacles.push(obs);
    }
  }

  // ---- TREE PLACEMENT (deterministic, sparse at top, dense at bottom) ----
  placeTrees(chunk, zOffset) {
    const cfg = this.config;
    const chunkBottomZ = zOffset - this.chunkLength;
    if (chunkBottomZ > cfg.treeLineZ) return;

    const count = Math.floor(20 * cfg.treeDensity * (this.chunkLength / 300));
    // For wide terrain with dense trees, spread within bowl width not full chunk width
    const treeSpreadX = cfg.partialCliffs ? cfg.bowlWidth * 1.8 : cfg.chunkWidth * 0.8;
    for (let i = 0; i < count; i++) {
      const x = (this.rng() - 0.5) * treeSpreadX;
      const z = (this.rng() - 0.5) * this.chunkLength;
      const globalZ = zOffset + z;

      if (globalZ > cfg.treeLineZ) continue;

      // Sparse near top, dense near bottom (skip fade for peak — dense everywhere)
      if (!cfg.partialCliffs) {
        const belowTreeline = (cfg.treeLineZ - globalZ) / 600;
        if (this.rng() > Math.min(belowTreeline, 1.0)) continue;
      }

      // Trees prefer the sides of the bowl — fewer in center
      // Peak terrain has tight tree runs so allow trees much closer to center
      const absX = Math.abs(x);
      const centerClearance = cfg.partialCliffs ? 3 : 15;
      if (absX < centerClearance && this.rng() > 0.15) continue;

      // Skip trees inside river zones
      if (cfg.rivers) {
        let inRiver = false;
        for (const river of cfg.rivers) {
          if (river.type === 'gap') {
            if (Math.abs(globalZ - river.z) < river.gapWidth && Math.abs(x - river.xCenter) < river.gapWidth * 4) {
              inRiver = true; break;
            }
          } else if (river.type === 'basin') {
            if (Math.abs(globalZ - river.z) < river.basinLength / 2 + 5 && Math.abs(x - river.xCenter) < river.basinWidth / 2 + 5) {
              inRiver = true; break;
            }
          }
        }
        if (inRiver) continue;
      }

      const y = this.computeHeight(x, globalZ);

      const tree = this.createSnowPineTree();
      tree.position.set(x, y, globalZ);
      this.scene.add(tree);
      chunk.objects.push(tree);
      const obs = { position: new THREE.Vector3(x, y, globalZ), radius: 1.2, type: 'tree' };
      this.obstacles.push(obs);
      chunk.chunkObstacles.push(obs);
    }
  }

  // ---- OBJECT CREATION (same style as Terrain.js) ----

  createRock() {
    const group = new THREE.Group();
    const count = 1 + Math.floor(this.rng() * 3);
    for (let i = 0; i < count; i++) {
      const size = 1.0 + this.rng() * 2.0;
      const geo = new THREE.DodecahedronGeometry(size, 1);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        pos.setX(j, pos.getX(j) + (this.rng() - 0.5) * 0.4);
        pos.setY(j, pos.getY(j) * 0.5 + (this.rng() - 0.5) * 0.2);
        pos.setZ(j, pos.getZ(j) + (this.rng() - 0.5) * 0.4);
      }
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, this.rockMaterial);
      mesh.position.set((this.rng() - 0.5) * 2, 0, (this.rng() - 0.5) * 2);
      mesh.castShadow = true;
      group.add(mesh);
    }
    // Snow cap
    const snow = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.4),
      this.snowMaterial
    );
    snow.position.y = 0.5;
    group.add(snow);
    return group;
  }

  createPineTree() {
    const group = new THREE.Group();
    const scale = 0.7 + this.rng() * 0.8;
    const mat = this.rng() > 0.5 ? this.treeMaterial : this.darkTreeMaterial;

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
      cone.rotation.y = this.rng() * Math.PI;
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

  createSnowPineTree() {
    const group = new THREE.Group();
    const scale = 0.6 + this.rng() * 0.7;

    // Trunk — mostly buried in snow
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, 1.5 * scale, 5),
      this.trunkMaterial
    );
    trunk.position.y = 0.75 * scale;
    group.add(trunk);

    // Tree layers — alternating green and thick snow
    for (let i = 0; i < 5; i++) {
      const radius = (2.8 - i * 0.45) * scale;
      const height = (1.8 - i * 0.12) * scale;

      // Green cone (barely visible under snow)
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 6),
        this.darkTreeMaterial
      );
      cone.position.y = (2.0 + i * 1.2) * scale;
      cone.rotation.y = this.rng() * Math.PI;
      cone.castShadow = true;
      group.add(cone);

      // Heavy snow layer on every tier
      const snow = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.85, 0.5 * scale, 6),
        this.snowMaterial
      );
      snow.position.y = (2.4 + i * 1.2) * scale;
      snow.rotation.y = cone.rotation.y;
      group.add(snow);
    }

    // Snow cap on top
    const topSnow = new THREE.Mesh(
      new THREE.SphereGeometry(0.6 * scale, 5, 4, 0, Math.PI * 2, 0, Math.PI * 0.5),
      this.snowMaterial
    );
    topSnow.position.y = (7.5) * scale;
    group.add(topSnow);

    return group;
  }

  createBackcountryJump(feet) {
    const group = new THREE.Group();
    const scale = feet / 30;
    const rampHeight = 2.0 * scale;
    const rampLength = 5.0 * scale;
    const rampWidth = 4.0 * scale;
    const halfW = rampWidth / 2;

    const segments = 8;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = t * rampLength;
      const py = rampHeight * Math.pow(t, 0.7);
      shape.lineTo(px, py);
    }
    // Backside drops down smoothly — natural snow mound shape
    shape.lineTo(rampLength * 1.1, rampHeight * 0.6);
    shape.lineTo(rampLength * 1.2, 0);
    shape.lineTo(0, 0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: rampWidth, bevelEnabled: false,
    });
    geometry.rotateY(Math.PI / 2);
    geometry.translate(-halfW, 0, rampLength / 2);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.snowMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return group;
  }

  createNaturalMound(feet) {
    const group = new THREE.Group();
    const scale = feet / 30;
    const moundHeight = 1.8 * scale;
    const moundWidth = 4.0 * scale;
    const moundLength = 5.0 * scale;

    // Organic snow mound shape using extruded profile
    const segments = 10;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // Gradual ramp up — more natural than a man-made kicker
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Asymmetric profile: gentle rise, steeper lip
      const px = t * moundLength;
      const py = moundHeight * Math.sin(t * Math.PI * 0.55);
      shape.lineTo(px, py);
    }
    // Back side rolls off naturally
    shape.lineTo(moundLength * 1.15, moundHeight * 0.4);
    shape.lineTo(moundLength * 1.3, 0);
    shape.lineTo(0, 0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: moundWidth, bevelEnabled: false,
    });
    geometry.rotateY(Math.PI / 2);
    geometry.translate(-moundWidth / 2, 0, moundLength / 2);

    // Distort vertices for organic feel
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      // Wobble edges for natural snow shape
      pos.setX(i, vx + Math.sin(vz * 1.8 + vy * 2.5) * 0.2 * scale);
      pos.setZ(i, vz + Math.cos(vx * 2.1 + vy * 1.3) * 0.15 * scale);
    }
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.snowMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

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
      pole.castShadow = true;
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

    const finishMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3,
    });
    const finishMatDark = new THREE.MeshStandardMaterial({
      color: 0x111111,
    });

    for (const side of [-gateWidth / 2, gateWidth / 2]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, poleHeight, 8),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.2 })
      );
      pole.position.set(side, poleHeight / 2, 0);
      pole.castShadow = true;
      group.add(pole);

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.1, emissive: 0xffaa00, emissiveIntensity: 0.3 })
      );
      sphere.position.set(side, poleHeight + 0.4, 0);
      group.add(sphere);
    }

    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, gateWidth, 8),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.2 })
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.y = poleHeight;
    crossbar.castShadow = true;
    group.add(crossbar);

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
        tile.material.side = THREE.DoubleSide;
        group.add(tile);
      }
    }

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

  // ---- TERRAIN LIFECYCLE ----

  update(playerZ) {
    // Generate chunks ahead of the player (keep generateRadius ahead)
    const playerChunkIdx = Math.floor(-playerZ / this.chunkLength);
    const target = Math.min(playerChunkIdx + this.generateRadius + 1, this.config.totalChunks);
    while (this.chunksGenerated < target) {
      this.generateChunk();
    }

    // Remove chunks far behind the player
    while (
      this.chunks.length > 0 &&
      this.chunks[0].zOffset > playerZ + this.chunkLength * 2
    ) {
      const old = this.chunks.shift();
      this.scene.remove(old.mesh);
      old.mesh.geometry.dispose();
      for (const obj of old.objects) this.scene.remove(obj);
      // Clean up obstacles belonging to this chunk
      if (old.chunkObstacles && old.chunkObstacles.length > 0) {
        const toRemove = new Set(old.chunkObstacles);
        this.obstacles = this.obstacles.filter(o => !toRemove.has(o));
      }
      // Clean up ramps belonging to this chunk
      if (old.chunkRamps && old.chunkRamps.length > 0) {
        const toRemove = new Set(old.chunkRamps);
        this.ramps = this.ramps.filter(r => !toRemove.has(r));
      }
    }
  }

  // Clean up everything when switching back to park
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
