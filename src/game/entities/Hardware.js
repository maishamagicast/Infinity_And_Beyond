import Phaser from 'phaser';

export default class Hardware extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, id) {
    super(scene, x, y, texture);
    this.hardwareId = id;               // must match the id in hardware.json
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body
  }
}