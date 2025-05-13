// src/types/astrologyTypes.ts

export interface PlanetPosition {
  name: string;
  sign: string;
  longitude: number;
  deg_within_sign: number;
  retrograde?: boolean;
  dignity?: string; // Planetary dignity (e.g., Rulership, Exaltation, etc.)
}

export interface Aspect {
  p1_name: string;
  p2_name: string;
  aspect_name: string;
  orb: number;
}

export interface HouseCusp {
  house_number: number;
  sign: string;
  absolute_position: number;
}

export interface ChartData {
  name?: string;
  planets?: Record<string, PlanetPosition>;
  aspects?: Aspect[];
  houses?: HouseCusp[];
}
