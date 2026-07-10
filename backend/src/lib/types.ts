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
  country_code?: string;
};

export type UnifiedGeocodeResult = {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  // Every result a provider hands back is required to resolve a country -
  // providers filter/reject results that can't, so callers never have to
  // handle a missing country code.
  countryCode: string;
};
