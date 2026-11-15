import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'astronaut');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);
    // Physics body smaller than sprite for better feel
    this.body.setSize(16, 20).setOffset(8, 24);

    this.speed = 85;
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');

    // Shadow ellipse beneath player
    this.shadow = scene.add.ellipse(x, y + 20, 20, 6, 0x000000, 0.35).setDepth(9);

    // Walking bob tracker
    this._bobT = 0;
    this._moving = false;
  }

  update() {
    const k = this.keys;
    const dx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const dy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);

    this.setVelocity(dx * this.speed, dy * this.speed);
    if (dx !== 0 || dy !== 0) {
      this.body.velocity.normalize().scale(this.speed);
    }

    // Flip sprite to face walking direction
    if (dx < 0) this.setFlipX(true);
    else if (dx > 0) this.setFlipX(false);

    // Walking bob — subtle vertical oscillation
    this._moving = dx !== 0 || dy !== 0;
    if (this._moving) {
      this._bobT += 0.18;
      this.setY(this.y + Math.sin(this._bobT) * 0.4);
    } else {
      this._bobT = 0;
    }

    // Shadow follows player
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 22);
      this.shadow.setAlpha(this._moving ? 0.25 : 0.38);
    }
  }

  destroy(fromScene) {
    if (this.shadow) this.shadow.destroy();
    super.destroy(fromScene);
  }
}
