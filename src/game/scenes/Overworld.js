import Phaser from 'phaser';
import Player from '../entities/Player';
import Hardware from '../entities/Hardware';

const INTERACT_DISTANCE = 32;


// Each entry is one piece of hackable hardware.
// The id must match the id in hardware.json (ask Dev 4 for the real ones).
const HARDWARE = [
  { id: 'mer_a_spirit',      x: 400, y: 250, texture: 'rover_spirit' },
  { id: 'mer_b_opportunity', x: 700, y: 400, texture: 'rover_spirit' },
  { id: 'viking_1_lander',   x: 200, y: 450, texture: 'rover_spirit' },
];

export default class Overworld extends Phaser.Scene {
  constructor() { super('Overworld'); }

  create() {
    const W = 960, H = 540;
    this.physics.world.setBounds(0, 0, W, H);
    this.add.rectangle(0, 0, W, H, 0x8a4b2d).setOrigin(0);   // placeholder ground

    this.player = new Player(this, 100, 100);

    // ids must match hardware.json (coordinate with Dev 4)
    this.hardware = this.physics.add.staticGroup();
    HARDWARE.forEach(d => {
    this.hardware.add(new Hardware(this, d.x, d.y, d.texture, d.id));
});
    
    // Rocks: solid obstacles
    this.rocks = this.physics.add.staticGroup();
    [[200, 150], [300, 330], [550, 120], [650, 300], [800, 200]].forEach(([x, y]) => {
    this.rocks.create(x, y, 'rock');
    });
    this.physics.add.collider(this.player, this.rocks);

    this.cameras.main.setBounds(0, 0, W, H).startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(1.5);

    this.prompt = this.add.text(0, 0, '[E] HACK', {
    fontFamily: 'monospace', fontSize: '8px', color: '#00ff66',
    }).setOrigin(0.5).setVisible(false);

    
    // Make the prompt pulse so it draws the eye
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.eKey = this.input.keyboard.addKey('E');


    // Intro message that fades away
    const intro = this.add.text(240, 70, 'Find the abandoned hardware.\nWalk close and press E to hack it.', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#00ff66',
      align: 'center',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    this.tweens.add({
      targets: intro,
      alpha: 0,
      delay: 4000,
      duration: 1000,
      onComplete: () => intro.destroy(),
    });

    // Pause input while the terminal is open
    this.onClose = () => this.setInputEnabled(true);
    window.addEventListener('TERMINAL_CLOSED', this.onClose);

    // Turn a rover green when it has been hacked
    this.onHacked = (e) => {
    const rover = this.hardware.getChildren().find(h => h.hardwareId === e.detail.id);
    if (rover) rover.setTint(0x00ff66);
    };
    window.addEventListener('HARDWARE_HACKED', this.onHacked);

    // Clean up the listeners when the scene shuts down
    this.events.once('shutdown', () => {
    window.removeEventListener('TERMINAL_CLOSED', this.onClose);
    window.removeEventListener('HARDWARE_HACKED', this.onHacked);
    });
  }

  update() {
    if (!this.player.keys.W.enabled) return;   // input paused
    this.player.update();

    const near = this.findNearbyHardware();
    this.prompt.setVisible(!!near);
    if (near) {
    this.prompt.setPosition(near.x, near.y - 16);
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.openTerminal(near.hardwareId);
    }
  }

  findNearbyHardware() {
    return this.hardware.getChildren().find(h =>
    Phaser.Math.Distance.Between(this.player.x, this.player.y, h.x, h.y) < INTERACT_DISTANCE);
  }

  openTerminal(id) {
    this.setInputEnabled(false);
    window.dispatchEvent(new CustomEvent('TRIGGER_TERMINAL', { detail: { id } }));
  }

  setInputEnabled(on) {
    Object.values(this.player.keys).forEach(k => (k.enabled = on));
    this.eKey.enabled = on;
    if (!on) this.player.setVelocity(0, 0);
    // Stop Phaser from swallowing keys the terminal needs
    on ? this.input.keyboard.enableGlobalCapture() : this.input.keyboard.disableGlobalCapture();
  }
}