export interface WalkableZone {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
}

export interface SolidBound {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export const WALKABLE_ZONES: WalkableZone[] = [
  { id: 'sand-main', minX: -20, maxX: 20, minZ: -20, maxZ: 20, y: 0 },
  { id: 'dock-lvl-0', minX: -2.2, maxX: 2.2, minZ: 2.8, maxZ: 4.8, y: 0.08 },
  { id: 'dock-lvl-1', minX: -2.2, maxX: 2.2, minZ: 0.4, maxZ: 2.8, y: 0.32 },
  { id: 'dock-lvl-2', minX: -2.2, maxX: 2.2, minZ: -1.8, maxZ: 0.4, y: 0.62 },
  { id: 'dock-lvl-3', minX: -2.2, maxX: 2.2, minZ: -4.2, maxZ: -1.8, y: 0.96 },
  { id: 'dock-lvl-4', minX: -2.2, maxX: 2.2, minZ: -6.6, maxZ: -4.2, y: 1.22 },
  { id: 'cabin-platform', minX: -3.5, maxX: 3.5, minZ: -9.8, maxZ: -6.6, y: 1.22 }
];

export const SOLID_BOUNDS: SolidBound[] = [
  { id: 'perimeter-north', minX: -20, maxX: 20, minY: -1, maxY: 7, minZ: -20.5, maxZ: -19.6 },
  { id: 'perimeter-south', minX: -20, maxX: 20, minY: -1, maxY: 7, minZ: 19.6, maxZ: 20.5 },
  { id: 'perimeter-west', minX: -20.5, maxX: -19.6, minY: -1, maxY: 7, minZ: -20, maxZ: 20 },
  { id: 'perimeter-east', minX: 19.6, maxX: 20.5, minY: -1, maxY: 7, minZ: -20, maxZ: 20 },
  { id: 'cabin-front-wall', minX: -3.9, maxX: 3.9, minY: 1.0, maxY: 4.8, minZ: -10.3, maxZ: -9.6 },
  { id: 'cabin-left-wall', minX: -3.9, maxX: -3.2, minY: 1.0, maxY: 4.8, minZ: -10.3, maxZ: -6.2 },
  { id: 'cabin-right-wall', minX: 3.2, maxX: 3.9, minY: 1.0, maxY: 4.8, minZ: -10.3, maxZ: -6.2 },
  { id: 'cabin-back-wall', minX: -3.9, maxX: 3.9, minY: 1.0, maxY: 4.8, minZ: -6.2, maxZ: -5.6 },
  { id: 'tocadiscos-table', minX: 1.0, maxX: 3.0, minY: 0, maxY: 2.2, minZ: -3.2, maxZ: -1.2 },
  { id: 'house-right', minX: 6.0, maxX: 11.2, minY: 0, maxY: 5.2, minZ: -0.8, maxZ: 4.8 },
  { id: 'rocks-west', minX: -7.5, maxX: -5.2, minY: -0.2, maxY: 2.3, minZ: 1.2, maxZ: 3.5 },
  // Paredes laterales del muelle: evitan caer por los lados en la parte elevada
  { id: 'dock-wall-left',  minX: -3.2, maxX: -2.1, minY: -1, maxY: 5, minZ: -10.4, maxZ: -1.8 },
  { id: 'dock-wall-right', minX:  2.1, maxX:  3.2, minY: -1, maxY: 5, minZ: -10.4, maxZ: -1.8 },
];
