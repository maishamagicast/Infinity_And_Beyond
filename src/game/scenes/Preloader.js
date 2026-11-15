import Phaser from 'phaser';

// Pixel helper: draw one "pixel" at scale S
function px(g, color, x, y, s = 2) {
  g.fillStyle(color, 1);
  g.fillRect(x * s, y * s, s, s);
}

export default class Preloader extends Phaser.Scene {
  constructor() { super('Preloader'); }

  preload() {
    // If real sprites exist later, uncomment:
    // this.load.spritesheet('astronaut', 'assets/sprites/astronaut.png', { frameWidth: 16, frameHeight: 24 });
    // this.load.image('rover_spirit', 'assets/sprites/rover_spirit.png');
  }

  create() {
    this.makeAstronaut();
    this.makeRover();
    this.makeRock();
    this.makeTerrain();
    this.scene.start('Overworld');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ASTRONAUT — white EVA suit with blue visor, backpack, boots
  // 16×24 pixel grid, scale 2 → 32×48 texture
  // ─────────────────────────────────────────────────────────────────────────
  makeAstronaut() {
    const S = 2; // scale: 1 pixel-art pixel = 2 screen pixels
    const W = 16, H = 24;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const W1 = 0xffffff; // white suit
    const W2 = 0xe8e8e8; // suit shading
    const W3 = 0xd0d0d0; // darker shade
    const BV = 0x3399ff; // blue visor
    const BK = 0x0a1a2e; // visor dark interior
    const BL = 0x334455; // black/dark joints
    const GY = 0x888888; // grey gloves / boots
    const DK = 0x444444; // dark boot soles
    const RD = 0xdd2222; // badge accent
    const GN = 0x44cc66; // oxygen connector green

    // ── HEAD (rounded helmet) ──
    // Helmet dome
    for (let hx = 4; hx <= 11; hx++) px(g, W1, hx, 0, S);
    for (let hx = 3; hx <= 12; hx++) px(g, W1, hx, 1, S);
    for (let hx = 2; hx <= 13; hx++) { px(g, W1, hx, 2, S); px(g, W1, hx, 3, S); }
    // Visor opening (rows 2-4, cols 4-11)
    for (let vx = 4; vx <= 11; vx++) {
      px(g, BV, vx, 2, S);
      px(g, BV, vx, 3, S);
    }
    // Visor interior shadow
    for (let vx = 5; vx <= 10; vx++) px(g, BK, vx, 3, S);
    // Visor glare highlight
    px(g, 0xaaddff, 4, 2, S); px(g, 0xaaddff, 5, 2, S);
    // Helmet rim row 4
    for (let hx = 2; hx <= 13; hx++) px(g, W1, hx, 4, S);
    // Helmet side strips
    px(g, W2, 2, 2, S); px(g, W2, 2, 3, S);
    px(g, W2, 13, 2, S); px(g, W2, 13, 3, S);

    // ── NECK CONNECTOR ──
    for (let nx = 5; nx <= 10; nx++) px(g, W3, nx, 5, S);
    px(g, GY, 6, 5, S); px(g, GY, 9, 5, S);

    // ── TORSO ──
    // Main body rows 6-13
    for (let ty = 6; ty <= 13; ty++) {
      for (let tx = 3; tx <= 12; tx++) px(g, W1, tx, ty, S);
    }
    // Torso shading left
    for (let ty = 6; ty <= 13; ty++) {
      px(g, W2, 3, ty, S); px(g, W2, 4, ty, S);
    }
    // Torso shading right
    for (let ty = 6; ty <= 13; ty++) {
      px(g, W2, 11, ty, S); px(g, W2, 12, ty, S);
    }
    // Chest patch / badge
    px(g, RD, 7, 7, S); px(g, RD, 8, 7, S);
    px(g, RD, 7, 8, S); px(g, RD, 8, 8, S);
    // Oxygen connector left side
    px(g, GN, 3, 9, S); px(g, GN, 3, 10, S);
    // Control panel strip on chest
    for (let cx = 6; cx <= 9; cx++) px(g, 0x224466, cx, 11, S);
    px(g, 0x44aaff, 6, 11, S);
    px(g, 0xffaa00, 8, 11, S);

    // ── BACKPACK (PLSS) right side ──
    for (let by = 7; by <= 13; by++) {
      px(g, W3, 13, by, S);
      px(g, W2, 14, by, S);
    }
    px(g, GY, 14, 10, S);

    // ── ARMS ──
    // Left arm
    for (let ay = 6; ay <= 11; ay++) px(g, W1, 1, ay, S);
    px(g, W2, 1, 7, S); px(g, W2, 1, 8, S);
    // Left glove
    px(g, GY, 1, 12, S); px(g, GY, 2, 12, S);
    px(g, GY, 0, 11, S); px(g, GY, 0, 12, S);
    // Right arm
    for (let ay = 6; ay <= 11; ay++) px(g, W1, 14, ay, S);
    px(g, W2, 14, 7, S); px(g, W2, 14, 8, S);
    // Right glove
    px(g, GY, 14, 12, S); px(g, GY, 15, 12, S);
    px(g, GY, 15, 11, S);

    // ── LOWER TORSO / HIPS ──
    for (let tx = 4; tx <= 11; tx++) px(g, W2, tx, 14, S);
    for (let tx = 4; tx <= 11; tx++) px(g, W3, tx, 15, S);
    // Hip joints
    px(g, BL, 4, 14, S); px(g, BL, 11, 14, S);

    // ── LEGS ──
    // Left leg rows 16-20
    for (let ly = 16; ly <= 20; ly++) {
      for (let lx = 3; lx <= 7; lx++) px(g, W1, lx, ly, S);
    }
    px(g, W2, 3, 16, S); px(g, W2, 3, 17, S);
    px(g, W2, 7, 16, S);
    // Right leg rows 16-20
    for (let ly = 16; ly <= 20; ly++) {
      for (let lx = 8; lx <= 12; lx++) px(g, W1, lx, ly, S);
    }
    px(g, W2, 12, 16, S); px(g, W2, 12, 17, S);
    // Knee joints
    for (let kx = 3; kx <= 7; kx++) px(g, W3, kx, 19, S);
    for (let kx = 8; kx <= 12; kx++) px(g, W3, kx, 19, S);

    // ── BOOTS ──
    for (let bx = 2; bx <= 7; bx++) px(g, GY, bx, 21, S);
    for (let bx = 2; bx <= 7; bx++) px(g, GY, bx, 22, S);
    for (let bx = 2; bx <= 7; bx++) px(g, DK, bx, 23, S);
    px(g, DK, 1, 23, S); px(g, DK, 8, 23, S);

    for (let bx = 8; bx <= 13; bx++) px(g, GY, bx, 21, S);
    for (let bx = 8; bx <= 13; bx++) px(g, GY, bx, 22, S);
    for (let bx = 8; bx <= 13; bx++) px(g, DK, bx, 23, S);
    px(g, DK, 7, 23, S); px(g, DK, 14, 23, S);

    g.generateTexture('astronaut', W * S, H * S);
    g.destroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROVER — Spirit/Opportunity style: boxy body, solar panels, 6 wheels, antenna
  // 48×32 pixel grid, scale 2 → 96×64 texture
  // ─────────────────────────────────────────────────────────────────────────
  makeRover() {
    const S = 2;
    const W = 48, H = 32;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Colours matching the reference image
    const BO = 0xc8a87a; // body/deck tan
    const BD = 0xa08a62; // body dark
    const BK = 0x2a2318; // black outlines / wheel
    const SP = 0x2d4a6b; // solar panel blue-grey
    const SL = 0x3d6490; // solar panel lighter
    const SA = 0xd4b98e; // solar panel frame
    const WH = 0x3a3028; // wheel dark
    const WR = 0x5a4830; // wheel rim
    const AN = 0x888888; // antenna grey
    const LT = 0xffeecc; // instrument light
    const RD = 0x883322; // dark rust shadow

    // ── WHEELS (3 on each side, rows 20-31) ──
    const wheelXL = [2, 11, 20];    // left wheel centers x
    const wheelXR = [27, 36, 45];   // right wheel centers x
    const wheelY  = 24;             // wheel center y

    const drawWheel = (cx, cy) => {
      // Outer circle approximation
      const pts = [
        [0,-3],[1,-3],[2,-2],[3,-1],[3,0],[3,1],[2,2],[1,3],[0,3],
        [-1,3],[-2,2],[-3,1],[-3,0],[-3,-1],[-2,-2],[-1,-3]
      ];
      pts.forEach(([dx, dy]) => px(g, WH, cx + dx, cy + dy, S));
      // Fill
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          if (Math.abs(dx) + Math.abs(dy) <= 3) px(g, WR, cx + dx, cy + dy, S);
      // Hub
      px(g, BK, cx, cy, S);
      px(g, AN, cx-1, cy, S); px(g, AN, cx+1, cy, S);
      px(g, AN, cx, cy-1, S); px(g, AN, cx, cy+1, S);
    };

    wheelXL.forEach(x => drawWheel(x, wheelY));
    wheelXR.forEach(x => drawWheel(x, wheelY));

    // Wheel struts connecting to body
    wheelXL.forEach(x => {
      px(g, BD, x, wheelY - 3, S);
      px(g, BD, x, wheelY - 4, S);
      px(g, BD, x, wheelY - 5, S);
    });
    wheelXR.forEach(x => {
      px(g, BD, x, wheelY - 3, S);
      px(g, BD, x, wheelY - 4, S);
      px(g, BD, x, wheelY - 5, S);
    });

    // ── BODY / CHASSIS (rows 8-19, cols 4-43) ──
    for (let ry = 8; ry <= 19; ry++) {
      for (let rx = 4; rx <= 43; rx++) {
        px(g, BO, rx, ry, S);
      }
    }
    // Body outline
    for (let rx = 4; rx <= 43; rx++) {
      px(g, BK, rx, 8, S);
      px(g, BK, rx, 19, S);
    }
    for (let ry = 8; ry <= 19; ry++) {
      px(g, BK, 4, ry, S);
      px(g, BK, 43, ry, S);
    }
    // Body shading left
    for (let ry = 9; ry <= 18; ry++) {
      px(g, BD, 5, ry, S);
      px(g, BD, 6, ry, S);
    }
    // Body shading right
    for (let ry = 9; ry <= 18; ry++) {
      px(g, BD, 41, ry, S);
      px(g, BD, 42, ry, S);
    }
    // Body top highlight
    for (let rx = 7; rx <= 40; rx++) px(g, SA, rx, 9, S);
    // Electronics bay / body detail strips
    for (let rx = 8; rx <= 20; rx++) {
      px(g, BD, rx, 14, S);
      px(g, BD, rx, 15, S);
    }
    px(g, LT, 10, 14, S); px(g, LT, 10, 15, S);
    px(g, LT, 15, 14, S); px(g, LT, 15, 15, S);
    // Warm electronics box right
    for (let rx = 28; rx <= 38; rx++) px(g, RD, rx, 14, S);
    px(g, BK, 29, 14, S); px(g, BK, 36, 14, S);

    // ── SOLAR PANELS (left and right wings, rows 2-9, sticking out) ──
    // Left panel
    for (let py = 3; py <= 10; py++) {
      for (let px2 = 0; px2 <= 10; px2++) {
        px(g, SP, px2, py, S);
      }
    }
    // Left panel frame
    for (let fr = 3; fr <= 10; fr++) px(g, SA, 0, fr, S);
    for (let fc = 0; fc <= 10; fc++) { px(g, SA, fc, 3, S); px(g, SA, fc, 10, S); }
    // Solar cell lines on left panel
    for (let sy = 4; sy <= 9; sy += 2) {
      for (let sx = 1; sx <= 9; sx++) px(g, SL, sx, sy, S);
    }
    for (let sx = 3; sx <= 9; sx += 3) {
      for (let sy = 3; sy <= 10; sy++) px(g, BK, sx, sy, S);
    }

    // Right panel
    for (let py = 3; py <= 10; py++) {
      for (let px2 = 37; px2 <= 47; px2++) {
        px(g, SP, px2, py, S);
      }
    }
    for (let fr = 3; fr <= 10; fr++) px(g, SA, 47, fr, S);
    for (let fc = 37; fc <= 47; fc++) { px(g, SA, fc, 3, S); px(g, SA, fc, 10, S); }
    for (let sy = 4; sy <= 9; sy += 2) {
      for (let sx = 38; sx <= 46; sx++) px(g, SL, sx, sy, S);
    }
    for (let sx = 40; sx <= 46; sx += 3) {
      for (let sy = 3; sy <= 10; sy++) px(g, BK, sx, sy, S);
    }

    // ── ANTENNA / CAMERA MAST (top center) ──
    // Mast column
    for (let ay = 0; ay <= 7; ay++) px(g, AN, 23, ay, S);
    for (let ay = 0; ay <= 7; ay++) px(g, AN, 24, ay, S);
    // Pan-cam head
    px(g, BD, 21, 0, S); px(g, BD, 22, 0, S);
    px(g, BD, 25, 0, S); px(g, BD, 26, 0, S);
    px(g, LT, 21, 1, S); // left camera eye
    px(g, LT, 25, 1, S); // right camera eye
    // RTG / arm right side
    for (let ry = 10; ry <= 15; ry++) px(g, BD, 44, ry, S);
    px(g, BK, 44, 10, S); px(g, BK, 44, 15, S);
    px(g, LT, 44, 12, S);

    // ── Wheel connection bars ──
    for (let cy = 18; cy <= 20; cy++) {
      px(g, BD, 2, cy, S); px(g, BD, 11, cy, S);
      px(g, BD, 20, cy, S);
    }
    for (let cy = 18; cy <= 20; cy++) {
      px(g, BD, 27, cy, S); px(g, BD, 36, cy, S);
      px(g, BD, 45, cy, S);
    }

    g.generateTexture('rover_spirit', W * S, H * S);
    g.destroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROCK — irregular boulder, warm brown/rust tones
  // 20×16 pixel grid, scale 2 → 40×32 texture
  // ─────────────────────────────────────────────────────────────────────────
  makeRock() {
    const S = 2;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const R1 = 0x7a4a2e; // base rust
    const R2 = 0x5c3520; // darker crevice
    const R3 = 0xa06040; // mid tone
    const HI = 0xc08060; // highlight
    const DK = 0x3a1f10; // deep shadow

    // Silhouette (irregular blob)
    const shape = [
      [4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],
      [2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],
      [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[13,4],[14,4],[15,4],[16,4],[17,4],
      [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5],[17,5],[18,5],
      [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],[17,6],[18,6],
      [1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],[18,7],
      [1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],
      [2,9],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
      [3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
      [5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],
      [7,12],[8,12],[9,12],[10,12],[11,12],
    ];

    shape.forEach(([x, y]) => px(g, R1, x, y, S));
    // Dark crevice lines
    [[5,2],[6,2],[9,3],[10,4],[4,6],[5,6],[12,7],[13,7],[8,9],[9,10]].forEach(([x,y]) => px(g, R2, x, y, S));
    // Highlights top-left
    [[5,0],[6,0],[7,0],[4,1],[5,1],[6,1],[3,2],[4,2],[5,2]].forEach(([x,y]) => px(g, HI, x, y, S));
    // Mid tones
    [[8,3],[9,3],[10,3],[7,5],[8,5],[14,5],[15,5],[11,8],[12,8]].forEach(([x,y]) => px(g, R3, x, y, S));
    // Deep shadow bottom
    [[6,11],[7,11],[8,11],[9,11],[10,11],[7,12],[8,12],[9,12]].forEach(([x,y]) => px(g, DK, x, y, S));

    g.generateTexture('rock', 20 * S, 13 * S);
    g.destroy();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TERRAIN TILES — 32×32 tile in 3 Martian variants
  // ─────────────────────────────────────────────────────────────────────────
  makeTerrain() {
    const TS = 32; // tile size
    const palettes = [
      { base: 0xc2663a, mid: 0xb05530, edge: 0x8c3c20, hi: 0xd4845a, key: 'tile_mars_a' },
      { base: 0xa84e28, mid: 0x904020, edge: 0x6e2e14, hi: 0xc06038, key: 'tile_mars_b' },
      { base: 0xd4845a, mid: 0xc0704a, edge: 0xa05032, hi: 0xe0a07a, key: 'tile_mars_c' },
    ];

    palettes.forEach(({ base, mid, edge, hi, key }) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(base, 1);
      g.fillRect(0, 0, TS, TS);

      // Noise-like detail via deterministic dots
      const dots = [
        [3,3,mid],[7,5,hi],[12,2,mid],[18,8,edge],[24,3,mid],[28,6,hi],
        [5,10,edge],[10,14,mid],[16,11,hi],[22,13,edge],[29,10,mid],
        [2,18,hi],[8,20,mid],[14,17,edge],[20,22,mid],[26,19,hi],[30,21,edge],
        [4,27,mid],[9,25,hi],[15,29,edge],[21,26,mid],[27,28,hi],[31,24,edge],
        [1,8,edge],[6,24,mid],[13,6,hi],[19,30,edge],[25,15,mid],
      ];
      dots.forEach(([x, y, c]) => {
        g.fillStyle(c, 1);
        g.fillRect(x, y, 2, 2);
      });

      // Edge darkening (simulate raised tile border depth)
      g.fillStyle(edge, 0.4);
      g.fillRect(0, 0, TS, 2);
      g.fillRect(0, TS - 2, TS, 2);
      g.fillRect(0, 0, 2, TS);
      g.fillRect(TS - 2, 0, 2, TS);

      g.generateTexture(key, TS, TS);
      g.destroy();
    });

    // Dark soil patch (under rover crater area)
    const gd = this.make.graphics({ x: 0, y: 0, add: false });
    gd.fillStyle(0x6a2e14, 1);
    gd.fillRect(0, 0, TS, TS);
    gd.fillStyle(0x4e200e, 1);
    gd.fillRect(4, 4, TS - 8, TS - 8);
    gd.generateTexture('tile_dark', TS, TS);
    gd.destroy();
  }
}
