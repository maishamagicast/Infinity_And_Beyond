import Phaser from 'phaser';
import Player from '../entities/Player';
import Hardware from '../entities/Hardware';

const INTERACT_DISTANCE = 48;

// Hardware placement matching hardware.json surface_targets
const HARDWARE = [
  { id: 'mer_a_spirit',      x: 480, y: 220, texture: 'rover_spirit' },
  { id: 'mer_b_opportunity', x: 740, y: 390, texture: 'rover_spirit' },
  { id: 'viking_1_lander',   x: 200, y: 430, texture: 'rover_spirit' },
];

// Rock cluster positions spread across the world
const ROCKS = [
  [130, 160], [220, 180], [310, 310], [380, 380],
  [520, 140], [600, 280], [700, 180], [820, 240],
  [150, 360], [260, 460], [650, 440], [870, 160],
  [420, 480], [570, 380], [760, 310], [100, 480],
  [930, 420], [300, 150], [680, 460], [810, 380],
];

export default class Overworld extends Phaser.Scene {
  constructor() { super('Overworld'); }

  create() {
    const W = 1024, H = 576;
    this.physics.world.setBounds(0, 0, W, H);

    // ── TILED TERRAIN BASE ──────────────────────────────────────────────
    this.drawTerrain(W, H);

    // ── HARDWARE (rovers / landers) ─────────────────────────────────────
    this.hardware = this.physics.add.staticGroup();
    HARDWARE.forEach(d => {
      this.hardware.add(new Hardware(this, d.x, d.y, d.texture, d.id));
    });

    // ── ROCK OBSTACLES ──────────────────────────────────────────────────
    this.rocks = this.physics.add.staticGroup();
    ROCKS.forEach(([x, y]) => {
      const r = this.rocks.create(x, y, 'rock');
      r.setScale(Phaser.Math.FloatBetween(0.7, 1.3));
      r.refreshBody();
    });

    // ── PLAYER ──────────────────────────────────────────────────────────
    this.player = new Player(this, 120, 120);
    this.physics.add.collider(this.player, this.rocks);

    // ── CAMERA ──────────────────────────────────────────────────────────
    this.cameras.main
      .setBounds(0, 0, W, H)
      .startFollow(this.player, true, 0.08, 0.08)
      .setRoundPixels(true)
      .setZoom(1.6);

    // ── [E] HACK PROMPT ─────────────────────────────────────────────────
    this.prompt = this.add.text(0, 0, '[E] HACK', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#00ff66',
      backgroundColor: '#00000099',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setVisible(false).setDepth(20);

    this.tweens.add({
      targets: this.prompt,
      alpha: 0.3,
      duration: 450,
      yoyo: true,
      repeat: -1,
    });

    // ── INTRO FADE TEXT ─────────────────────────────────────────────────
    const intro = this.add.text(W / 2, 60,
      'Locate the abandoned hardware.\nWalk close and press E to hack.',
      {
        fontFamily: 'monospace', fontSize: '10px', color: '#7dff9a',
        align: 'center', backgroundColor: '#000000bb',
        padding: { x: 10, y: 6 },
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(30);

    this.tweens.add({
      targets: intro, alpha: 0,
      delay: 4000, duration: 1200,
      onComplete: () => intro.destroy(),
    });

    // ── TERMINAL EVENT LISTENERS ─────────────────────────────────────────
    this.eKey = this.input.keyboard.addKey('E');
    this.onClose = () => this.setInputEnabled(true);
    window.addEventListener('TERMINAL_CLOSED', this.onClose);

    this.onHacked = (e) => {
      const rover = this.hardware.getChildren().find(h => h.hardwareId === e.detail.id);
      if (rover) {
        rover.setTint(0x00ff66);
        this.addHackedFX(rover.x, rover.y);
      }
    };
    window.addEventListener('HARDWARE_HACKED', this.onHacked);

    this.events.once('shutdown', () => {
      window.removeEventListener('TERMINAL_CLOSED', this.onClose);
      window.removeEventListener('HARDWARE_HACKED', this.onHacked);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Procedural tile terrain — matches multi-tone Mars look from reference
  // ─────────────────────────────────────────────────────────────────────────
  drawTerrain(W, H) {
    const TS = 32;
    const cols = Math.ceil(W / TS) + 1;
    const rows = Math.ceil(H / TS) + 1;

    // Simple deterministic pseudo-random based on tile position
    const pick = (tx, ty) => {
      const v = ((tx * 1234 + ty * 5678) ^ (tx * 7 + ty * 13)) & 0xffff;
      if (v % 7 === 0) return 'tile_dark';
      if (v % 3 === 0) return 'tile_mars_b';
      if (v % 5 === 0) return 'tile_mars_c';
      return 'tile_mars_a';
    };

    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const key = pick(tx, ty);
        this.add.image(tx * TS + TS / 2, ty * TS + TS / 2, key)
          .setDepth(0);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Particle-like "hacked" flash effect
  // ─────────────────────────────────────────────────────────────────────────
  addHackedFX(x, y) {
    const txt = this.add.text(x, y - 32, '✓ HACKED', {
      fontFamily: 'monospace', fontSize: '8px', color: '#00ff66',
      backgroundColor: '#000000bb', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: txt, y: y - 60, alpha: 0,
      duration: 1800, ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  update() {
    if (!this.player.keys.W.enabled) return; // paused

    this.player.update();

    const near = this.findNearbyHardware();
    this.prompt.setVisible(!!near);
    if (near) {
      this.prompt.setPosition(near.x, near.y - near.displayHeight * 0.5 - 6);
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.openTerminal(near.hardwareId);
    }
  }

  findNearbyHardware() {
    return this.hardware.getChildren().find(h =>
      Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y) < INTERACT_DISTANCE
    );
  }

  openTerminal(id) {
    this.setInputEnabled(false);
    window.dispatchEvent(new CustomEvent('TRIGGER_TERMINAL', { detail: { id } }));
  }

  setInputEnabled(on) {
    Object.values(this.player.keys).forEach(k => (k.enabled = on));
    this.eKey.enabled = on;
    if (!on) this.player.setVelocity(0, 0);
    on
      ? this.input.keyboard.enableGlobalCapture()
      : this.input.keyboard.disableGlobalCapture();
  }
}
