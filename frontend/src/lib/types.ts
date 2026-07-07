export interface UserProfile {
	id: string;
	username: string;
	createdAt: string;
}

export interface PlaceRecord {
	id: string;
	userId: string;
	name: string;
	latitude: number;
	longitude: number;
	description: string | null;
	imageUrls: string[] | null;
	socialUrls: string[] | null;
	createdAt: string;
}

export interface PlaceSearchResult {
	name: string;
	displayName: string;
	latitude: number;
	longitude: number;
}

export interface PlacePayload {
	name: string;
	latitude: number;
	longitude: number;
	description?: string | null;
	imageUrls?: string[] | null;
	socialUrls?: string[] | null;
}
