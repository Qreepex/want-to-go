export interface AuthTokenPayload {
  userId: string;
  username: string;
}

export type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  county?: string;
  state?: string;
  region?: string;
  province?: string;
  country?: string;
};

export type UnifiedGeocodeResult = {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
};