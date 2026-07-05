export interface Player {
  name: string;
  position?: string;
  shirtNumber?: number;
}

export interface PlayerStat {
  name: string;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
}
