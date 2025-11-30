import React, { useEffect, useRef } from 'react';
import { PLANETS } from '../constants';
import { PlanetType } from '../types';

const PlanetIcon: React.FC<{ planet: PlanetType }> = ({ planet }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 50;
        const center = size / 2;
        // Scale down radius to fit icon
        const scale = Math.min(1, (size / 2 - 2) / planet.radius); 
        // Use a fixed visual radius for the chart, but relative to actual size logic
        const visualRadius = Math.min(20, Math.max(8, planet.radius * 0.25)) * 1.8; 

        ctx.clearRect(0, 0, size, size);
        ctx.translate(center, center);

        // --- DRAWING LOGIC (Mirrors GameCanvas.tsx roughly) ---
        const radius = visualRadius;

        // Ring Back
        if (planet.hasRing) {
             ctx.save();
             ctx.rotate(Math.PI / 6);
             ctx.beginPath();
             ctx.ellipse(0, 0, radius * 1.8, radius * 0.4, 0, 0, 2 * Math.PI);
             ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
             ctx.fill();
             ctx.strokeStyle = 'rgba(255, 255, 230, 0.6)';
             ctx.lineWidth = 2;
             ctx.stroke();
             ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.clip();

        // Base
        ctx.fillStyle = planet.color;
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

        // Textures
        if (planet.id === 0) { // Dust
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.arc(radius*0.3, -radius*0.3, radius*0.4, 0, Math.PI*2);
            ctx.fill();
        } else if (planet.id === 1 || planet.id === 2) { // Asteroid/Moon
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
             const craters = planet.id === 1 
                ? [{x: 0.2, y: -0.2, r: 0.3}, {x: -0.4, y: 0.3, r: 0.2}] 
                : [{x: 0, y: 0, r: 0.4}, {x: 0.5, y: -0.4, r: 0.2}, {x: -0.3, y: 0.4, r: 0.25}];
             craters.forEach(c => {
                ctx.beginPath();
                ctx.arc(c.x * radius, c.y * radius, c.r * radius, 0, Math.PI*2);
                ctx.fill();
            });
        } else if (planet.id === 3) { // Earth
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(-radius*0.4, -radius*0.4, radius*0.5, 0, Math.PI*2);
            ctx.arc(radius*0.5, radius*0.3, radius*0.4, 0, Math.PI*2);
            ctx.fill();
        } else if (planet.id === 4 || planet.id === 5) { // Gas
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(-radius, -radius*0.2, radius*2, radius*0.4);
            if(planet.id === 5) {
                 ctx.fillStyle = 'rgba(150,0,0,0.2)';
                 ctx.beginPath();
                 ctx.ellipse(radius*0.3, radius*0.2, radius*0.25, radius*0.15, 0, 0, Math.PI*2);
                 ctx.fill();
            }
        } else if (planet.id >= 7) { // Stars
             const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
             gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
             gradient.addColorStop(1, planet.color);
             ctx.fillStyle = gradient;
             ctx.fillRect(-radius, -radius, radius*2, radius*2);
        }

        // Shadow
        const shadowGrad = ctx.createRadialGradient(-radius*0.3, -radius*0.3, radius*0.2, 0, 0, radius);
        shadowGrad.addColorStop(0, 'rgba(255,255,255,0)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(-radius, -radius, radius*2, radius*2);

        // Rim
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI*2);
        ctx.stroke();

        ctx.restore();

        // Glow (outer)
        if (planet.id >= 7) {
             ctx.shadowBlur = 10;
             ctx.shadowColor = planet.color;
             ctx.beginPath();
             ctx.arc(0, 0, radius * 0.9, 0, Math.PI*2);
             ctx.fillStyle = 'transparent';
             ctx.fill();
             ctx.shadowBlur = 0;
        }

        // Label
        if (planet.id < 7) { // Only show label on non-glowing ones in icon due to size
            ctx.fillStyle = planet.textColor;
            ctx.font = `bold ${Math.max(8, radius * 0.4)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 2;
            ctx.fillText(planet.label, 0, 0);
        }

    }, [planet]);

    return <canvas ref={canvasRef} width={50} height={50} className="w-10 h-10" />;
}

const EvolutionChart: React.FC = () => {
  return (
    <div className="w-full max-w-lg mt-8 p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex items-center gap-2 mb-6 text-blue-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <h2 className="text-xl font-bold">進化の系譜 (Evolution)</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PLANETS.map((planet) => (
          <div 
            key={planet.id} 
            className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors"
          >
            {/* Planet Icon Preview */}
            <div className="flex-shrink-0 flex items-center justify-center">
                <PlanetIcon planet={planet} />
            </div>

            {/* Info */}
            <div className="flex flex-col">
                <span className="font-bold text-slate-100 text-sm leading-tight">
                    {planet.jpName}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                    Rank {planet.id + 1}
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvolutionChart;