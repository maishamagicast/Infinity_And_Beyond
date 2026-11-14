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
| `TRIGGER_TERMINAL` | Phaser -> React | `{ id: 'spirit' }` | Player presses E next to hardware |
| `TERMINAL_CLOSED` | React -> Phaser | none | Terminal closes, so movement resumes |
| `HARDWARE_HACKED` | React -> Phaser | `{ id: 'spirit' }` | Hack succeeded, so the rover turns green |

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
Current ids: `spirit`, `opportunity`, `curiosity`.
These must match the ids in `src/data/hardware.json`.