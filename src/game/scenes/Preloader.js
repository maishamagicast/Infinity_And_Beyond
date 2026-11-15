import Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
  constructor() { super('Preloader'); }

  preload() {
    // Swap these in when Dev 4 delivers:
    // this.load.image('astronaut', 'assets/sprites/astronaut.png');
    // this.load.image('rover_spirit', 'assets/sprites/rover_spirit.png');
    // this.load.image('terrain_tiles', 'assets/tilemaps/terrain_tiles.png');
    // this.load.tilemapTiledJSON('mars', 'assets/tilemaps/mars_surface.json');
  }

  create() {
    // Placeholder astronaut: white body with a blue visor facing right
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff).fillRect(0, 0, 12, 16);
    g.fillStyle(0x3399ff).fillRect(7, 3, 5, 5);
    g.generateTexture('astronaut', 12, 16);
    g.destroy();
    this.makeBox('rover_spirit', 24, 16, 0xffaa00);
    this.makeBox('rock', 16, 16, 0x5a3b2a);
    this.scene.start('Overworld');
  }

  makeBox(key, w, h, color) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color).fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}