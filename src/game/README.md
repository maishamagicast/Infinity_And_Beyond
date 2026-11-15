# Phaser Game (Dev 1)

## How to mount the game (Dev 3)

```jsx
import { useEffect } from 'react';
import { createGame } from '../game/config';

export default function GameContainer() {
  useEffect(() => {
    const game = createGame('phaser-root');
    return () => game.destroy(true); // cleanup when the component unmounts
  }, []);

  return <div id="phaser-root" />;
}
```

## Events

| Event | Direction | Detail | When |
|---|---|---|---|
| `TRIGGER_TERMINAL` | Phaser -> React | `{ id: 'mer_a_spirit' }` | Player presses E next to hardware |
| `HARDWARE_RECOVERED` | React -> Phaser | `{ id }` | Hack solved, so the rover turns green (`HARDWARE_HACKED` also works) |
| scene `resume` | React -> Phaser | n/a | The app pauses the scene while the terminal is open and resumes it on close; Phaser unfreezes automatically (`TERMINAL_CLOSED` also works) |

### Listening (React)
```js
window.addEventListener('TRIGGER_TERMINAL', (e) => {
  console.log(e.detail.id);
});
```

### Sending (React)
```js
window.dispatchEvent(new Event('TERMINAL_CLOSED'));
window.dispatchEvent(new CustomEvent('HARDWARE_HACKED', { detail: { id: 'spirit' } }));
```


## Hardware ids
Ids sent in `TRIGGER_TERMINAL` match the keys under `surface_targets` in `src/data/hardware.json`:
`mer_a_spirit`, `mer_b_opportunity`, `viking_1_lander`.

Dev 3: look up the data with `hardware.surface_targets[e.detail.id]`.