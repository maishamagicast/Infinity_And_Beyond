import Phaser from 'phaser';
import Player from '../entities/Player';
import Hardware from '../entities/Hardware';

const INTERACT_DISTANCE = 32;


// Each entry is one piece of hackable hardware.
// The id must match the id in hardware.json (ask Dev 4 for the real ones).
const HARDWARE = [
  { id: 'spirit',      x: 400, y: 250, texture: 'rover_spirit' },
  { id: 'opportunity', x: 700, y: 400, texture: 'rover_spirit' },
  { id: 'curiosity',   x: 200, y: 450, texture: 'rover_spirit' },
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

    this.prompt = this.add.text(0, 0, '[E] HACK', {
      fontFamily: 'monospace', fontSize: '8px', color: '#00ff66',
    }).setOrigin(0.5).setVisible(false);

    this.eKey = this.input.keyboard.addKey('E');

    // Pause input while the terminal is open
    this.onClose = () => this.setInputEnabled(true);
    window.addEventListener('TERMINAL_CLOSED', this.onClose);
    this.events.once('shutdown', () =>
      window.removeEventListener('TERMINAL_CLOSED', this.onClose));
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