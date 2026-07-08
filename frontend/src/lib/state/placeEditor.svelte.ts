import {
	buildPlacePayload,
	createEmptyPlaceDraft,
	createPlaceDraft,
	type MapSelection,
	type PlaceDraft
} from '$lib/dashboard/helpers';
import type { PlacePayload, PlaceRecord } from '$lib/types';

class PlaceEditorStore {
	mode = $state<'create' | 'edit'>('create');
	selection = $state<MapSelection | null>(null);
	editingPlace = $state<PlaceRecord | null>(null);
	draft = $state<PlaceDraft>(createEmptyPlaceDraft());
	isSaving = $state(false);

	openForCreate(selection: MapSelection, draft: PlaceDraft = createEmptyPlaceDraft()): void {
		this.mode = 'create';
		this.selection = selection;
		this.editingPlace = null;
		this.draft = draft;
	}

	openForEdit(place: PlaceRecord): void {
		this.mode = 'edit';
		this.selection = {
			name: place.name,
			displayName: place.name,
			latitude: place.latitude,
			longitude: place.longitude
		};
		this.editingPlace = place;
		this.draft = createPlaceDraft(place);
	}

	close(): void {
		this.mode = 'create';
		this.selection = null;
		this.editingPlace = null;
		this.draft = createEmptyPlaceDraft();
	}

	isEditing(placeId: string): boolean {
		return this.editingPlace?.id === placeId;
	}

	matchesSelection(place: Pick<PlaceRecord, 'name' | 'latitude' | 'longitude'>): boolean {
		return (
			this.selection?.name === place.name &&
			this.selection.latitude === place.latitude &&
			this.selection.longitude === place.longitude
		);
	}

	buildPayload(): PlacePayload | null {
		return buildPlacePayload(this.selection, this.draft);
	}
}

export const placeEditor = new PlaceEditorStore();
