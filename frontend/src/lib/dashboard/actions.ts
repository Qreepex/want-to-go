import { goto } from '$app/navigation';
import { reverseGeocodeLocation } from '$lib/api/geo';
import { createPinnedSelection, createPlaceDraft } from '$lib/dashboard/helpers';
import { locationSearch } from '$lib/state/locationSearch.svelte';
import { placeEditor } from '$lib/state/placeEditor.svelte';
import { placesStore } from '$lib/state/places.svelte';
import { session } from '$lib/state/session.svelte';
import { statusStore } from '$lib/state/status.svelte';
import type { PlaceRecord, PlaceSearchResult } from '$lib/types';

export async function initDashboard(): Promise<void> {
	try {
		await session.restore();
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to load dashboard');
		return;
	}

	if (session.token) {
		await placesStore.load(session.token);
	}
}

export function beginLogin(): void {
	goto('/auth/login');
}

export function signOut(): void {
	session.clear();
	placesStore.clear();
	placeEditor.close();
	locationSearch.reset();
	statusStore.show('Signed out.');
}

export function selectSearchResult(result: PlaceSearchResult): void {
	placeEditor.openForCreate(result, createPlaceDraft(result));
	locationSearch.query = result.displayName;
	locationSearch.results = [];
	statusStore.clear();
}

export async function pickMapLocation(selection: { latitude: number; longitude: number }): Promise<void> {
	statusStore.clear();

	let defaultName = 'New place';

	try {
		const location = await reverseGeocodeLocation(selection.latitude, selection.longitude);
		defaultName = location.name;
	} catch {
		defaultName = 'New place';
	}

	placeEditor.openForCreate(
		createPinnedSelection(selection.latitude, selection.longitude, defaultName),
		{ name: defaultName, description: '', imageUrls: '', socialUrls: '' }
	);
}

export function startEdit(place: PlaceRecord): void {
	placeEditor.openForEdit(place);
	statusStore.clear();
}

export function closeEditor(): void {
	placeEditor.close();
}

export async function savePlace(): Promise<void> {
	if (!session.token) {
		beginLogin();
		return;
	}

	const payload = placeEditor.buildPayload();

	if (!payload) {
		statusStore.show('Choose a place on the map or from search first.');
		return;
	}

	placeEditor.isSaving = true;
	statusStore.clear();

	try {
		if (placeEditor.mode === 'edit' && placeEditor.editingPlace) {
			await placesStore.update(session.token, placeEditor.editingPlace.id, payload);
		} else {
			await placesStore.create(session.token, payload);
		}

		placeEditor.close();
		statusStore.show('Saved to your list.');
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to save place');
	} finally {
		placeEditor.isSaving = false;
	}
}

export async function removePlace(place: PlaceRecord): Promise<void> {
	if (!session.token) {
		return;
	}

	statusStore.clear();

	try {
		await placesStore.remove(session.token, place.id);

		if (placeEditor.matchesSelection(place) || placeEditor.isEditing(place.id)) {
			placeEditor.close();
		}

		statusStore.show('Removed place.');
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to remove place');
	}
}
