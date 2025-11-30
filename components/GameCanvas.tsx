import React, { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { GAME_HEIGHT, GAME_WIDTH, PLANETS, WALL_THICKNESS, DEAD_LINE_Y } from '../constants';
import { GameState, Particle, PlanetType } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  nextPlanetIndex: number;
  setNextPlanetIndex: (index: number) => void;
  onGameOver: () => void;
  onGameWin: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setScore,
  nextPlanetIndex,
  setNextPlanetIndex,
  onGameOver,
  onGameWin
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderLoopRef = useRef<number | null>(null);
  const mouseXRef = useRef<number>(GAME_WIDTH / 2);
  
  // Refs to hold latest props to avoid closure staleness in MatterJS events
  const latestProps = useRef({ nextPlanetIndex, setScore, onGameOver, onGameWin, setNextPlanetIndex });
  
  useEffect(() => {
    latestProps.current = { nextPlanetIndex, setScore, onGameOver, onGameWin, setNextPlanetIndex };
  }, [nextPlanetIndex, setScore, onGameOver, onGameWin, setNextPlanetIndex]);

  // Cooldown to prevent spamming drops
  const canDropRef = useRef<boolean>(true);
  
  // Tracking particles for effects
  const particlesRef = useRef<Particle[]>([]);

  // Sound effects (simulated with Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = (freq: number, type: OscillatorType, duration: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const initGame = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // cleanup previous if exists
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, false);
      Matter.Engine.clear(engineRef.current);
      if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current);
    }

    // Setup Matter JS
    const Engine = Matter.Engine,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Events = Matter.Events,
          World = Matter.World;

    const engine = Engine.create({
      enableSleeping: true
    });
    engineRef.current = engine;

    // Create Walls
    const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2, GAME_WIDTH, WALL_THICKNESS, { 
        isStatic: true, 
        render: { fillStyle: 'transparent' },
        label: 'Wall'
    });
    const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { 
        isStatic: true,
        render: { fillStyle: 'transparent' },
        label: 'Wall'
    });
    const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { 
        isStatic: true,
        render: { fillStyle: 'transparent' },
        label: 'Wall'
    });

    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Collision Event
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      const bodiesToRemove = new Set<string>();

      pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        const idA = parseInt(bodyA.label);
        const idB = parseInt(bodyB.label);

        if (!isNaN(idA) && !isNaN(idB) && idA === idB) {
            // MERGE!
            if (bodiesToRemove.has(bodyA.id.toString()) || bodiesToRemove.has(bodyB.id.toString())) return;

            bodiesToRemove.add(bodyA.id.toString());
            bodiesToRemove.add(bodyB.id.toString());
            
            World.remove(engine.world, [bodyA, bodyB]);

            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            const nextId = idA + 1;
            if (nextId < PLANETS.length) {
                const planetData = PLANETS[nextId];
                const newBody = Bodies.circle(midX, midY, planetData.radius, {
                    restitution: 0.2,
                    label: nextId.toString(),
                    render: { fillStyle: planetData.color },
                    plugin: { createdAt: Date.now() } // Mark creation time
                });
                World.add(engine.world, newBody);
                
                // Score
                latestProps.current.setScore(s => s + PLANETS[idA].score * 2);
                
                // Effects
                createParticles(midX, midY, planetData.color);
                playSound(200 + (nextId * 50), 'sine', 0.1);

                if (planetData.name === 'Black Hole') {
                   latestProps.current.setScore(s => s + 5000);
                   latestProps.current.onGameWin();
                   playSound(100, 'sawtooth', 0.5);
                }
            }
        }
      });
    });

    // Game Over Check
    let gameOverCheckTimer = 0;
    Events.on(engine, 'beforeUpdate', (e) => {
        gameOverCheckTimer += 1;
        if (gameOverCheckTimer > 10) { 
            gameOverCheckTimer = 0;
            const bodies = Composite.allBodies(engine.world);
            const now = Date.now();
            for (const body of bodies) {
                if (body.label !== 'Wall' && !body.isStatic) {
                    // Grace period of 1s for new bodies to fall
                    if (body.plugin && body.plugin.createdAt && (now - body.plugin.createdAt < 1000)) {
                        continue;
                    }

                    if (body.position.y < DEAD_LINE_Y && body.speed < 0.2) {
                        latestProps.current.onGameOver();
                        engine.enabled = false;
                        break;
                    }
                }
            }
        }
    });

    const runner = Runner.create();
    Runner.run(runner, engine);

    // --- DRAWING FUNCTION ---
    // This is separated so it can be reused or simply to keep render loop clean
    const drawPlanet = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, planet: PlanetType, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        
        // Draw Ring Back (Saturn) - Drawn before the planet body
        if (planet.hasRing) {
             ctx.save();
             ctx.rotate(angle + Math.PI / 4);
             ctx.beginPath();
             ctx.ellipse(0, 0, radius * 1.8, radius * 0.4, 0, 0, 2 * Math.PI);
             ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
             ctx.fill();
             ctx.lineWidth = radius * 0.15;
             ctx.strokeStyle = 'rgba(255, 255, 230, 0.6)';
             ctx.stroke();
             ctx.restore();
        }

        // --- PLANET BODY (Rotating textures) ---
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.clip(); // Clip all texture drawing to the circle

        // Base background
        ctx.fillStyle = planet.color;
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

        // Procedural Textures based on ID
        if (planet.id === 0) { // Dust
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.arc(radius*0.3, -radius*0.3, radius*0.4, 0, Math.PI*2);
            ctx.fill();
        } 
        else if (planet.id === 1 || planet.id === 2) { // Asteroid (Purple) / Moon
            // Craters
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            const craters = planet.id === 1 
                ? [{x: 0.2, y: -0.2, r: 0.3}, {x: -0.4, y: 0.3, r: 0.2}] 
                : [{x: 0, y: 0, r: 0.4}, {x: 0.5, y: -0.4, r: 0.2}, {x: -0.3, y: 0.4, r: 0.25}];
            
            craters.forEach(c => {
                ctx.beginPath();
                ctx.arc(c.x * radius, c.y * radius, c.r * radius, 0, Math.PI*2);
                ctx.fill();
            });
        }
        else if (planet.id === 3) { // Earth
            // Continents
            ctx.fillStyle = '#22c55e'; // Green
            ctx.beginPath();
            ctx.arc(-radius*0.4, -radius*0.4, radius*0.5, 0, Math.PI*2);
            ctx.arc(radius*0.5, radius*0.3, radius*0.4, 0, Math.PI*2);
            ctx.fill();
            // Clouds
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(0, -radius*0.5, radius*0.4, 0, Math.PI*2);
            ctx.arc(-radius*0.6, radius*0.2, radius*0.3, 0, Math.PI*2);
            ctx.fill();
        }
        else if (planet.id === 4) { // Saturn
             // Stripes
             ctx.fillStyle = 'rgba(255,255,255,0.1)';
             ctx.fillRect(-radius, -radius*0.2, radius*2, radius*0.4);
             ctx.fillStyle = 'rgba(0,0,0,0.1)';
             ctx.fillRect(-radius, radius*0.4, radius*2, radius*0.2);
        }
        else if (planet.id === 5) { // Gas Giant (Jupiter-like)
            // Stripes
            ctx.fillStyle = 'rgba(100,0,0,0.1)';
            ctx.fillRect(-radius, -radius*0.5, radius*2, radius*0.2);
            ctx.fillRect(-radius, radius*0.1, radius*2, radius*0.3);
            // Spot
            ctx.fillStyle = 'rgba(150,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(radius*0.3, radius*0.2, radius*0.25, radius*0.15, 0, 0, Math.PI*2);
            ctx.fill();
        }
        else if (planet.id === 6) { // Brown Dwarf
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(radius*0.3, radius*0.3, radius*0.6, 0, Math.PI*2);
            ctx.fill();
            ctx.filter = 'blur(2px)'; // Slight blur for gas
        }
        else if (planet.id === 7 || planet.id === 8 || planet.id === 9) { // Stars
             // Glowy center
             const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
             gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
             gradient.addColorStop(0.4, planet.color);
             gradient.addColorStop(1, planet.color);
             ctx.fillStyle = gradient;
             ctx.fillRect(-radius, -radius, radius*2, radius*2);
        }
        else if (planet.id === 10) { // Black Hole
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.85, 0, Math.PI*2);
            ctx.fill();
            
            ctx.strokeStyle = '#a855f7'; // Purple rim
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.85, 0, Math.PI*2);
            ctx.stroke();
        }

        // --- END ROTATING TEXTURE ---
        ctx.rotate(-angle);

        // --- LIGHTING OVERLAY (Fixed relative to screen) ---
        // Shadow (Light from Top-Left)
        const shadowGrad = ctx.createRadialGradient(-radius*0.3, -radius*0.3, radius*0.2, 0, 0, radius);
        shadowGrad.addColorStop(0, 'rgba(255,255,255,0.0)'); // Highlight spot
        shadowGrad.addColorStop(0.3, 'rgba(255,255,255,0.0)');
        shadowGrad.addColorStop(0.8, 'rgba(0,0,0,0.2)'); // Shadow start
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0.6)');   // Dark edge
        
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

        // Inner Bevel / Rim Light for shiny objects
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI*2);
        ctx.stroke();

        ctx.restore(); // Restore clip
        
        // --- EXTERNAL GLOWS (Outside clip) ---
        if (planet.id >= 7) { // Stars glow
            ctx.shadowBlur = planet.id === 10 ? 30 : 20;
            ctx.shadowColor = planet.color;
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.9, 0, Math.PI*2);
            ctx.fillStyle = planet.color; // tint
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.shadowBlur = 0;
        }

        // Label
        ctx.fillStyle = planet.textColor;
        ctx.font = `bold ${Math.max(10, radius * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(planet.label, 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore(); // Restore translation
    };

    const render = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !engineRef.current) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw Deadline (Red Line)
        ctx.beginPath();
        ctx.moveTo(0, DEAD_LINE_Y);
        ctx.lineTo(GAME_WIDTH, DEAD_LINE_Y);
        ctx.strokeStyle = '#ef4444'; // Red-500 for danger
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw Text "OVERFLOW" lightly
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.font = '10px sans-serif';
        ctx.fillText('DANGER LINE', 5, DEAD_LINE_Y - 5);

        // Draw "Next" Drop Preview
        if (canDropRef.current) {
            ctx.beginPath();
            ctx.moveTo(mouseXRef.current, 20);
            ctx.lineTo(mouseXRef.current, GAME_HEIGHT);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Access nextPlanetIndex via ref to get the current value in the closure
            const currentNextIndex = latestProps.current.nextPlanetIndex;
            const nextPlanet = PLANETS[currentNextIndex];
            if (nextPlanet) {
                drawPlanet(ctx, mouseXRef.current, 50, nextPlanet.radius, nextPlanet, 0);
            }
        }

        // Draw Bodies
        const bodies = Composite.allBodies(engineRef.current.world);
        bodies.forEach(body => {
            if (body.label === 'Wall') return;

            const planetId = parseInt(body.label);
            if (!isNaN(planetId)) {
                const planet = PLANETS[planetId];
                drawPlanet(ctx, body.position.x, body.position.y, planet.radius, planet, body.angle);
            }
        });

        // Draw Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            
            if (p.life <= 0) {
                particlesRef.current.splice(i, 1);
            } else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        renderLoopRef.current = requestAnimationFrame(render);
    };

    renderLoopRef.current = requestAnimationFrame(render);

    return () => {
        if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current);
        if (engineRef.current) {
             Matter.World.clear(engineRef.current.world, false);
             Matter.Engine.clear(engineRef.current);
        }
    };
  }, []); // Run only once on mount to initialize engine

  // Handle Drop
  const handleDrop = useCallback(() => {
    if (gameState !== GameState.PLAYING || !engineRef.current || !canDropRef.current) return;

    canDropRef.current = false;
    
    const x = Math.max(WALL_THICKNESS, Math.min(GAME_WIDTH - WALL_THICKNESS, mouseXRef.current));
    const planetData = PLANETS[nextPlanetIndex];

    const body = Matter.Bodies.circle(x, 50, planetData.radius, {
        restitution: 0.2,
        friction: 0.005,
        density: 0.002,
        label: nextPlanetIndex.toString(),
        plugin: { createdAt: Date.now() } // Used to prevent instant game over on spawn
    });

    Matter.World.add(engineRef.current.world, body);
    playSound(400, 'triangle', 0.1);

    const newNextIndex = Math.floor(Math.random() * 4);
    setNextPlanetIndex(newNextIndex);

    setTimeout(() => {
        canDropRef.current = true;
    }, 600);
  }, [gameState, nextPlanetIndex, setNextPlanetIndex]);

  // Input Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      
      const scaleX = GAME_WIDTH / rect.width;
      const relativeX = (clientX - rect.left) * scaleX;

      mouseXRef.current = Math.max(10, Math.min(GAME_WIDTH - 10, relativeX));
  };

  // Re-init when returning to MENU
  useEffect(() => {
      if (gameState === GameState.MENU) {
          initGame();
      }
  }, [gameState, initGame]);


  return (
    <div 
        ref={containerRef}
        className="relative w-full touch-none select-none flex justify-center cursor-crosshair"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onClick={handleDrop}
    >
      <canvas 
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="w-full h-auto"
        style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
      />
    </div>
  );
};

export default GameCanvas;