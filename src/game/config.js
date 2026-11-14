import Phaser from 'phaser';
import Preloader from './scenes/Preloader';
import Overworld from './scenes/Overworld';

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 480,
    height: 270,
    pixelArt: true,              // crisp 16-bit scaling
    backgroundColor: '#1a0f0a',
    physics: { default: 'arcade', arcade: { debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [Preloader, Overworld],
  });
}