export interface PlanetType {
  id: number;
  name: string;
  jpName: string; // Japanese name for the chart
  radius: number; // Logic radius in the physics world
  color: string;
  textColor: string;
  score: number;
  label: string;
  hasRing?: boolean; // For Saturn visualization
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}