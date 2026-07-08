import { createPlace, deletePlace, fetchPlaces, updatePlace } from '$lib/api/places';
import type { PlacePayload, PlaceRecord } from '$lib/types';

class PlacesStore {
	items = $state<PlaceRecord[]>([]);
	isLoading = $state(false);

	async load(token: string): Promise<void> {
		this.isLoading = true;

		try {
			this.items = await fetchPlaces(token);
		} finally {
			this.isLoading = false;
		}
	}

	async create(token: string, payload: PlacePayload): Promise<void> {
		this.isLoading = true;

		try {
			await createPlace(token, payload);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	async update(token: string, placeId: string, payload: PlacePayload): Promise<void> {
		this.isLoading = true;

		try {
			await updatePlace(token, placeId, payload);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	async remove(token: string, placeId: string): Promise<void> {
		this.isLoading = true;

		try {
			await deletePlace(token, placeId);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	clear(): void {
		this.items = [];
	}
}

export const placesStore = new PlacesStore();
