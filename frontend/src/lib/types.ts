export interface UserProfile {
	id: string;
	username: string;
	createdAt: string;
}

export interface PlaceRecord {
	id: string;
	userId: string;
	listId: string;
	name: string;
	latitude: number;
	longitude: number;
	description: string | null;
	countryCode: string | null;
	imageUrls: string[] | null;
	socialUrls: string[] | null;
	tags: string[];
	visits: VisitRecord[];
	createdAt: string;
}

export interface VisitRecord {
	id: string;
	placeId: string;
	visitedAt: string;
	notes: string | null;
	createdAt: string;
}

export interface VisitWithPlace extends VisitRecord {
	place: Pick<PlaceRecord, 'id' | 'name' | 'countryCode' | 'latitude' | 'longitude' | 'imageUrls'>;
}

export interface VisitPayload {
	placeId: string;
	visitedAt: string;
	notes?: string | null;
}

export interface PlaceSearchResult {
	name: string;
	displayName: string;
	latitude: number;
	longitude: number;
	countryCode?: string;
}

export interface PlacePayload {
	name: string;
	latitude: number;
	longitude: number;
	listId: string;
	description?: string | null;
	countryCode?: string | null;
	imageUrls?: string[] | null;
	socialUrls?: string[] | null;
	tags?: string[];
}

export type ListRole = 'owner' | 'view' | 'add' | 'edit';
export type ShareRole = 'view' | 'add' | 'edit';

export interface ListRecord {
	id: string;
	name: string;
	role: ListRole;
	ownerId: string;
	shareToken: string | null;
	shareRole: ShareRole | null;
	createdAt: string;
}

export interface ListMember {
	userId: string;
	username: string;
	role: ShareRole;
	createdAt: string;
}
