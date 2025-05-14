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

export interface AstrologicalData {
  planets: Record<string, PlanetPosition>;
  aspects: Aspect[];
  houses: HouseCusp[];
  sun?: { sign: string; position: number };
  ascendant?: { sign: string; position: number };
  midheaven?: { sign: string; position: number };
  element_counts?: Record<string, number>;
  mode_counts?: Record<string, number>;
  calculation_error?: string;
  // ...add other fields as needed
}

export interface ChartData {
  name?: string;
  birth_datetime?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  astrological_data?: AstrologicalData;
}
