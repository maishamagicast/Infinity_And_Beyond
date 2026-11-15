import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * SurfaceScreen — walk-around step after terminal ping succeeds
 * Allows astronaut to walk to the lost rover, hook it up, and tow it back to the spaceship!
 * Props:
 *   destination: { name, sky, ground, stars }
 *   roverName:   string — name of the craft that was pinged
 *   onDone():    called when player brings rover back to ship and boards
 */
export default function SurfaceScreen({ destination, roverName, onDone }) {
  const canvasRef = useRef(null);
  const keysRef   = useRef({});
  const stateRef  = useRef(null);   // shared mutable physics state
  const doneRef   = useRef(false);
  const rafRef    = useRef(null);

  const destinationName = destination?.name  || 'the planet';
  const craftName       = roverName          || 'Rover';
  const skyColor        = destination?.sky   || '#241410';
  const groundColor     = destination?.ground || '#b5472f';
  const showStars       = Boolean(destination?.stars);

  // ---- state ----
  const [banner, setBanner]       = useState(null);
  const [phase, setPhase]         = useState('find_rover'); // 'find_rover' | 'near_rover' | 'towing' | 'near_ship_with_rover' | 'near_ship_empty'
  const [isTowing, setIsTowing]   = useState(false);

  const triggerDone = useCallback(() => {
    if (!doneRef.current) {
      doneRef.current = true;
      if (typeof onDone === 'function') onDone();
    }
  }, [onDone]);

  // Hook up rover
  const handleHookUp = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.isTowing = true;
    }
    setIsTowing(true);
    setPhase('towing');
  }, []);

  // Board ship with rover
  const handleBoard = useCallback(() => {
    setBanner(`${craftName} safely secured in the cargo hold! Lifting off... 🚀`);
    setTimeout(triggerDone, 2000);
  }, [craftName, triggerDone]);

  // ---- keyboard ----
  useEffect(() => {
    const down = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
           'KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;

      // 'E' key interaction
      if (e.code === 'KeyE') {
        if (!stateRef.current?.isTowing && phase === 'near_rover') {
          handleHookUp();
        } else if (stateRef.current?.isTowing && phase === 'near_ship_with_rover') {
          handleBoard();
        }
      }
    };
    const up = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, [phase, handleHookUp, handleBoard]);

  // ---- main canvas loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const onResize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      if (stateRef.current) {
        stateRef.current.shipX  = W * 0.12;
        stateRef.current.shipY  = H * 0.52;
        if (!stateRef.current.isTowing) {
          stateRef.current.roverX = W * 0.78;
          stateRef.current.roverY = H * 0.42;
        }
      }
    };
    window.addEventListener('resize', onResize);

    const rng = (seed) => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; };
    const rand = rng(42);
    const rocks = Array.from({ length: 18 }, () => ({
      x: rand() * 0.9 + 0.05,
      y: rand() * 0.55 + 0.15,
      r: rand() * 14 + 7,
      shade: `hsl(${rand()*20+8},${rand()*20+40}%,${rand()*15+22}%)`
    }));
    const craters = Array.from({ length: 6 }, () => ({
      x: rand() * 0.85 + 0.075,
      y: rand() * 0.5  + 0.2,
      rx: rand() * 20 + 12,
      ry: rand() * 10 + 6
    }));
    const starDots = showStars ? Array.from({ length: 50 }, () => ({
      x: rand(), y: rand() * 0.42, r: rand() < 0.3 ? 1.5 : 1
    })) : [];

    // ---- mutable physics state ----
    const st = {
      x: W * 0.22, y: H * 0.58,   // astronaut
      vx: 0, vy: 0,
      dir: 1,
      frame: 0, frameTick: 0,
      footprints: [],
      shipX:  W * 0.12, shipY:  H * 0.52,
      roverX: W * 0.78, roverY: H * 0.42,
      isTowing: false,
      tick: 0
    };
    stateRef.current = st;

    let lastTime = performance.now();

    const SPEED = 220; // px/s
    const RADIUS_ROVER = 80;
    const RADIUS_SHIP  = 75;
    const GROUND_Y_FRAC = 0.72;

    function drawBackground() {
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, W, H);

      starDots.forEach(s => {
        ctx.fillStyle = '#f1dcc0';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const gy = H * GROUND_Y_FRAC;
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, gy, W, H - gy);

      ctx.strokeStyle = '#6d5a4e';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();

      ctx.strokeStyle = 'rgba(255,180,100,0.08)';
      ctx.lineWidth = 1;
      const gs = 48;
      for (let gx = 0; gx < W; gx += gs) {
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy2 = gy; gy2 < H; gy2 += gs) {
        ctx.beginPath(); ctx.moveTo(0, gy2); ctx.lineTo(W, gy2); ctx.stroke();
      }

      craters.forEach(c => {
        ctx.fillStyle = 'rgba(40,10,5,0.55)';
        ctx.beginPath();
        ctx.ellipse(c.x * W, c.y * H, c.rx, c.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = groundColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      rocks.forEach(rock => {
        const rx = rock.x * W, ry = rock.y * H;
        ctx.fillStyle = 'rgba(30,8,3,0.5)';
        ctx.beginPath();
        ctx.ellipse(rx + 4, ry + 5, rock.r * 1.1, rock.r * 0.6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rock.shade;
        ctx.beginPath();
        ctx.arc(rx, ry, rock.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,0.08)`;
        ctx.beginPath();
        ctx.arc(rx - rock.r * 0.25, ry - rock.r * 0.25, rock.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawFootprints() {
      const now = performance.now();
      st.footprints = st.footprints.filter(f => now - f.t < 18000);
      st.footprints.forEach(f => {
        const age   = (now - f.t) / 18000;
        const alpha = Math.max(0, 0.55 - age * 0.55);
        ctx.fillStyle = `rgba(50,12,4,${alpha})`;
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, 3.5, 2, f.angle, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Tow Cable between Astronaut and Rover
    function drawTowCable() {
      if (!st.isTowing) return;

      ctx.save();
      // Glowing tether line
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);

      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      // Slight cable sag
      const midX = (st.x + st.roverX) / 2;
      const midY = (st.y + st.roverY) / 2 + 12;
      ctx.quadraticCurveTo(midX, midY, st.roverX, st.roverY);
      ctx.stroke();

      // Connector hooks
      ctx.fillStyle = '#7dff9a';
      ctx.beginPath(); ctx.arc(st.x, st.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(st.roverX, st.roverY, 4, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }

    // Landed Spaceship (Styled after mothership design: Navy blue hull, gold trim, ruby canopy)
    function drawShip(x, y, readyToBoard) {
      ctx.save();
      ctx.translate(x, y);

      // Shadow
      ctx.fillStyle = 'rgba(15,20,30,0.65)';
      ctx.beginPath(); ctx.ellipse(0, 30, 48, 18, 0, 0, Math.PI * 2); ctx.fill();

      // Boarding ramp
      ctx.fillStyle = readyToBoard ? '#2a3b5c' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(15, 12); ctx.lineTo(50, 28); ctx.lineTo(40, 35); ctx.lineTo(10, 20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = readyToBoard ? '#7dff9a' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Wing outriggers with yellow/gold trim
      ctx.fillStyle = '#172554';
      // Left swept wing
      ctx.beginPath();
      ctx.moveTo(-16, 5); ctx.lineTo(-44, 22); ctx.lineTo(-38, 28); ctx.lineTo(-12, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();

      // Right swept wing
      ctx.beginPath();
      ctx.moveTo(16, 5); ctx.lineTo(44, 22); ctx.lineTo(38, 28); ctx.lineTo(12, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();

      // Landing struts
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-20, 10); ctx.lineTo(-32, 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 20, 10); ctx.lineTo( 32, 32); ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-38, 30, 14, 5);
      ctx.fillRect( 24, 30, 14, 5);

      // Central Mothership Hull (Deep Navy Blue)
      const hullGrad = ctx.createLinearGradient(-24, -45, 24, 20);
      hullGrad.addColorStop(0, '#1e293b');
      hullGrad.addColorStop(0.5, '#1e3a8a');
      hullGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = hullGrad;

      ctx.beginPath();
      ctx.moveTo(-22, 12);
      ctx.lineTo(-20, -32);
      ctx.lineTo(0, -48);
      ctx.lineTo(20, -32);
      ctx.lineTo(22, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();

      // Red / Ruby Cockpit Canopy
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, -22, 9, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 1.5; ctx.stroke();
      // Canopy specular gleam
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(-3, -28, 6, 4);

      // Red wing thruster nodes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(-26, 14, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( 26, 14, 3.5, 0, Math.PI * 2); ctx.fill();

      // Beacon pulse
      const beaconColor = readyToBoard ? '#7dff9a' : '#ffb347';
      ctx.fillStyle = beaconColor;
      ctx.beginPath(); ctx.arc(0, -48, 3.5, 0, Math.PI * 2); ctx.fill();
      if (Math.floor(st.tick / 18) % 2 === 0) {
        ctx.strokeStyle = beaconColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -48, 8, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.fillStyle = '#f1dcc0';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(readyToBoard ? '[CARGO READY]' : '[MOTHERSHIP]', 0, -56);

      ctx.restore();
    }

    // Mars Rover
    function drawRover(x, y, towing) {
      ctx.save();
      ctx.translate(x, y);

      // Shadow
      ctx.fillStyle = 'rgba(20,5,2,0.65)';
      ctx.beginPath(); ctx.ellipse(0, 44, 55, 22, 0, 0, Math.PI * 2); ctx.fill();

      // 6 Wheels
      const wheels = [[-38,20],[-38,36],[-12,44],[12,44],[38,36],[38,20]];
      wheels.forEach(([wx, wy]) => {
        ctx.fillStyle = '#1e1613';
        ctx.beginPath(); ctx.ellipse(wx, wy, 7, 10, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3a2e2a'; ctx.lineWidth = 1.5; ctx.stroke();
      });

      // Chassis
      ctx.fillStyle = '#c4a58c';
      ctx.beginPath();
      ctx.moveTo(-30, 10); ctx.lineTo(30, 10);
      ctx.lineTo(38, 32);  ctx.lineTo(-38, 32); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6d5a4e'; ctx.lineWidth = 2; ctx.stroke();

      // Solar panels
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(-55, -5, 22, 24);
      ctx.fillRect( 33, -5, 22, 24);
      ctx.strokeStyle = '#2a5a8a'; ctx.lineWidth = 1; ctx.stroke();

      // Pancam mast
      ctx.strokeStyle = '#6d5a4e'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -32); ctx.stroke();
      ctx.fillStyle = '#f1dcc0';
      ctx.fillRect(-10, -38, 20, 10);
      ctx.fillStyle = '#1e1613';
      ctx.fillRect(-8, -36, 5, 5);
      ctx.fillRect(3, -36, 5, 5);

      // Antenna
      ctx.fillStyle = '#c4a58c';
      ctx.beginPath(); ctx.ellipse(26, -16, 10, 14, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f1dcc0'; ctx.lineWidth = 1; ctx.stroke();

      // Signal wave rings
      const pulse = (st.tick % 40) / 40;
      ctx.strokeStyle = 'rgba(125,255,154,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(26, -16, 14 + pulse * 14, -1.2, 0.3); ctx.stroke();

      // Targeting bracket
      const BW = 118, BH = 92, bx = -59, by = -50;
      ctx.strokeStyle = towing ? '#ffb347' : '#7dff9a';
      ctx.lineWidth = 2;
      const BL = 18;
      ctx.beginPath(); ctx.moveTo(bx, by+BL); ctx.lineTo(bx, by); ctx.lineTo(bx+BL, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx+BW-BL, by); ctx.lineTo(bx+BW, by); ctx.lineTo(bx+BW, by+BL); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by+BH-BL); ctx.lineTo(bx, by+BH); ctx.lineTo(bx+BL, by+BH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx+BW-BL, by+BH); ctx.lineTo(bx+BW, by+BH); ctx.lineTo(bx+BW, by+BH-BL); ctx.stroke();

      // Label
      ctx.fillStyle = towing ? '#ffb347' : '#7dff9a';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        towing ? `[TOWING ${craftName.toUpperCase()}]` : `${craftName.toUpperCase()} [ONLINE]`,
        0,
        by - 8
      );

      ctx.restore();
    }

    // Astronaut
    function drawAstronaut(x, y, moving, dir, frame) {
      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = 'rgba(30,8,3,0.55)';
      ctx.beginPath(); ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2); ctx.fill();

      // Backpack
      ctx.fillStyle = '#c4a58c';
      ctx.fillRect(-11, -16, 22, 20);
      ctx.fillStyle = '#6d5a4e';
      ctx.fillRect(-9, -14, 18, 6);

      // Suit
      ctx.fillStyle = '#f1dcc0';
      ctx.beginPath(); ctx.ellipse(0, -2, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c4a58c'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.fillStyle = '#b5472f';
      ctx.fillRect(4, -5, 4, 4);

      // Helmet & Visor
      ctx.fillStyle = '#f1dcc0';
      ctx.beginPath(); ctx.arc(0, -17, 10, 0, Math.PI * 2); ctx.fill();
      ctx.stroke();

      const vx = dir > 0 ? 2 : -2;
      ctx.fillStyle = '#0b1a12';
      ctx.beginPath(); ctx.ellipse(vx, -17, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(vx + 1, -19, 3, 2);

      // Legs / Boots
      const bob = moving ? Math.sin(frame * Math.PI / 2) * 4 : 0;
      ctx.fillStyle = '#c4a58c';
      ctx.fillRect(-8,  8 + bob, 6, 9);
      ctx.fillRect( 2,  8 - bob, 6, 9);

      ctx.fillStyle = '#6d5a4e';
      ctx.fillRect(-9,  16 + bob, 8, 3);
      ctx.fillRect( 1,  16 - bob, 8, 3);

      ctx.restore();
    }

    // ---- render loop ----
    const render = (now) => {
      const dt  = Math.min(0.05, (now - lastTime) / 1000);
      lastTime  = now;
      st.tick  += 1;

      // movement
      const K = keysRef.current;
      let dx = 0, dy = 0;
      if (K['ArrowLeft']  || K['KeyA']) dx -= 1;
      if (K['ArrowRight'] || K['KeyD']) dx += 1;
      if (K['ArrowUp']    || K['KeyW']) dy -= 1;
      if (K['ArrowDown']  || K['KeyS']) dy += 1;

      const moving = (dx !== 0 || dy !== 0);
      if (moving) {
        const len = Math.hypot(dx, dy);
        dx = (dx / len) * SPEED * dt;
        dy = (dy / len) * SPEED * dt;
        if (dx !== 0) st.dir = dx > 0 ? 1 : -1;

        st.x = Math.max(W * 0.05, Math.min(W * 0.95, st.x + dx));
        st.y = Math.max(H * 0.25, Math.min(H * GROUND_Y_FRAC - 10, st.y + dy));

        st.frameTick += 1;
        if (st.frameTick % 8 === 0) st.frame = (st.frame + 1) % 4;

        if (st.frameTick % 12 === 0) {
          st.footprints.push({
            x: st.x + (Math.random() * 6 - 3),
            y: st.y + 14 + (Math.random() * 4),
            angle: Math.random() * 0.4 - 0.2,
            t: now
          });
        }
      }

      // Physics: Towing the rover behind the astronaut
      if (st.isTowing) {
        const targetFollowDist = 75;
        const rdx = st.roverX - st.x;
        const rdy = st.roverY - st.y;
        const curDist = Math.hypot(rdx, rdy);

        if (curDist > targetFollowDist) {
          const pull = (curDist - targetFollowDist) * 0.12;
          st.roverX -= (rdx / curDist) * pull;
          st.roverY -= (rdy / curDist) * pull;
        }
      }

      // Proximity checks
      const dRover = Math.hypot(st.x - st.roverX, st.y - st.roverY);
      const dShip  = Math.hypot(st.x - st.shipX,  st.y - st.shipY);

      // Draw all layers
      ctx.clearRect(0, 0, W, H);
      drawBackground();
      drawFootprints();
      drawTowCable();
      drawShip(st.shipX, st.shipY, st.isTowing);
      drawRover(st.roverX, st.roverY, st.isTowing);
      drawAstronaut(st.x, st.y, moving, st.dir, st.frame);

      // Update Phase
      if (st.isTowing) {
        if (dShip < RADIUS_SHIP) {
          setPhase('near_ship_with_rover');
        } else {
          setPhase('towing');
        }
      } else {
        if (dRover < RADIUS_ROVER) {
          setPhase('near_rover');
        } else if (dShip < RADIUS_SHIP) {
          setPhase('near_ship_empty');
        } else {
          setPhase('find_rover');
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [skyColor, groundColor, showStars, craftName]);

  // Click on canvas to move
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const tx = (e.clientX - rect.left) * scaleX;
    const ty = (e.clientY - rect.top)  * scaleY;

    const st = stateRef.current;
    const dx = tx - st.x, dy = ty - st.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 10) {
      const step = Math.min(dist, 100);
      st.x = Math.max(canvas.width  * 0.05, Math.min(canvas.width  * 0.95, st.x + (dx / dist) * step));
      st.y = Math.max(canvas.height * 0.25, Math.min(canvas.height * 0.72 - 10, st.y + (dy / dist) * step));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-tech">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
        onClick={handleCanvasClick}
        aria-label="Planet surface exploration"
      />

      {/* CRT scanlines */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />

      {/* HUD Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-3 pointer-events-none">
        <div className="bg-panel/90 border border-edge px-3 py-1.5 rounded shadow pointer-events-auto">
          <span className="font-pixel text-[9px] text-phosphor uppercase tracking-wider crt-text-phosphor">
            SURFACE EVA // {destinationName}
          </span>
        </div>

        {/* Dynamic Objective Banner */}
        <div className="bg-panel/90 border border-edge px-4 py-2 rounded shadow max-w-md text-right pointer-events-auto">
          {phase === 'near_rover' ? (
            <span className="font-pixel text-[9px] text-amber crt-text-amber animate-pulse">
              You found {craftName}! Tap button or press [E] to hook it up.
            </span>
          ) : phase === 'towing' ? (
            <span className="font-pixel text-[9px] text-phosphor crt-text-phosphor">
              🔗 {craftName.toUpperCase()} IN TOW! Walk back to your ship to board.
            </span>
          ) : phase === 'near_ship_with_rover' ? (
            <span className="font-pixel text-[9px] text-phosphor crt-text-phosphor animate-bounce">
              Back at the ship! Tap button or press [E] to load into cargo bay!
            </span>
          ) : phase === 'near_ship_empty' ? (
            <span className="font-pixel text-[9px] text-dim">
              The {craftName} is still out on the surface! Walk over to hook it up.
            </span>
          ) : (
            <span className="font-pixel text-[9px] text-bone">
              OBJECTIVE: Walk to {craftName} and tow it back to your ship.
            </span>
          )}
        </div>
      </header>

      {/* On-screen D-pad */}
      <div className="absolute bottom-24 left-4 z-20 flex flex-col items-center gap-1" aria-label="Movement controls">
        <button
          type="button"
          onPointerDown={() => { keysRef.current['ArrowUp'] = true; }}
          onPointerUp={()   => { keysRef.current['ArrowUp'] = false; }}
          onPointerLeave={()=> { keysRef.current['ArrowUp'] = false; }}
          className="w-12 h-12 bg-panel/90 border-2 border-edge hover:border-phosphor text-bone font-pixel text-xs rounded flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-phosphor touch-none"
          aria-label="Move up"
        >▲</button>
        <div className="flex gap-1">
          <button
            type="button"
            onPointerDown={() => { keysRef.current['ArrowLeft'] = true; }}
            onPointerUp={()   => { keysRef.current['ArrowLeft'] = false; }}
            onPointerLeave={()=> { keysRef.current['ArrowLeft'] = false; }}
            className="w-12 h-12 bg-panel/90 border-2 border-edge hover:border-phosphor text-bone font-pixel text-xs rounded flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-phosphor touch-none"
            aria-label="Move left"
          >◄</button>
          <button
            type="button"
            onPointerDown={() => { keysRef.current['ArrowDown'] = true; }}
            onPointerUp={()   => { keysRef.current['ArrowDown'] = false; }}
            onPointerLeave={()=> { keysRef.current['ArrowDown'] = false; }}
            className="w-12 h-12 bg-panel/90 border-2 border-edge hover:border-phosphor text-bone font-pixel text-xs rounded flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-phosphor touch-none"
            aria-label="Move down"
          >▼</button>
          <button
            type="button"
            onPointerDown={() => { keysRef.current['ArrowRight'] = true; }}
            onPointerUp={()   => { keysRef.current['ArrowRight'] = false; }}
            onPointerLeave={()=> { keysRef.current['ArrowRight'] = false; }}
            className="w-12 h-12 bg-panel/90 border-2 border-edge hover:border-phosphor text-bone font-pixel text-xs rounded flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-phosphor touch-none"
            aria-label="Move right"
          >►</button>
        </div>
      </div>

      {/* Action Prompt 1: Hook up rover when nearby */}
      {phase === 'near_rover' && !isTowing && !banner && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <button
            type="button"
            onClick={handleHookUp}
            className="font-pixel text-xs md:text-sm bg-amber hover:bg-bone text-void border-3 border-void px-6 py-4 rounded-xl shadow-[0_0_30px_#ffb347] cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber uppercase tracking-wider transition transform hover:scale-105"
            aria-label={`Hook up ${craftName} and tow to ship`}
          >
            🔗 Hook up {craftName} & Tow to Ship [E]
          </button>
        </div>
      )}

      {/* Action Prompt 2: Load rover into ship cargo bay & liftoff */}
      {phase === 'near_ship_with_rover' && !banner && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <button
            type="button"
            onClick={handleBoard}
            className="font-pixel text-xs md:text-sm bg-phosphor hover:bg-amber text-void border-3 border-bone px-8 py-5 rounded-xl shadow-[0_0_35px_#7dff9a] cursor-pointer focus:outline-none focus:ring-4 focus:ring-phosphor uppercase tracking-wider transition transform hover:scale-105"
            aria-label="Load rover into cargo bay and liftoff"
          >
            🚀 Load {craftName} into Cargo Bay & Liftoff! [E]
          </button>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-24 right-4 z-20 bg-panel/85 border border-edge px-3 py-2 rounded text-right">
        <p className="font-pixel text-[8px] text-dim leading-5">
          WASD / ARROWS to walk<br />
          Click to step to spot<br />
          [E] or tap button to interact
        </p>
      </div>

      {/* Mission Banner Overlay */}
      {banner && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-void/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-screen border-4 border-phosphor p-8 rounded-2xl max-w-lg text-center shadow-2xl crt-screen space-y-3">
            <p className="font-pixel text-sm md:text-base text-phosphor crt-text-phosphor leading-relaxed">
              {banner}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
