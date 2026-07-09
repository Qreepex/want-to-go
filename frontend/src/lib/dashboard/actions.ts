import { loginUrl } from '$lib/api';
import { reverseGeocodeLocation } from '$lib/api/geo';
import {
	fetchListMembers,
	joinList,
	removeListMember,
	revokeShareLink,
	setShareLink
} from '$lib/api/lists';
import { clearPendingListJoin, getPendingListJoin } from '$lib/api/pendingListJoin';
import { createEmptyPlaceDraft, createPinnedSelection, createPlaceDraft } from '$lib/dashboard/helpers';
import { listManager } from '$lib/state/listManager.svelte';
import { listsStore } from '$lib/state/lists.svelte';
import { locationSearch } from '$lib/state/locationSearch.svelte';
import { placeEditor } from '$lib/state/placeEditor.svelte';
import { placeFilters } from '$lib/state/placeFilters.svelte';
import { placesStore } from '$lib/state/places.svelte';
import { placeViewer } from '$lib/state/placeViewer.svelte';
import { session } from '$lib/state/session.svelte';
import { statusStore } from '$lib/state/status.svelte';
import type { ListMember, ListRecord, PlaceRecord, PlaceSearchResult, ShareRole } from '$lib/types';

export async function initDashboard(): Promise<void> {
	try {
		await session.restore();
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to load dashboard');
		return;
	}

	if (!session.token) {
		return;
	}

	const pendingJoinToken = getPendingListJoin();

	if (pendingJoinToken) {
		clearPendingListJoin();

		try {
			const joined = await joinList(session.token, pendingJoinToken);
			statusStore.show(`Joined "${joined.listName}".`);
		} catch (error) {
			statusStore.show(error instanceof Error ? error.message : 'Unable to join list');
		}
	}

	await Promise.all([placesStore.load(session.token), listsStore.load(session.token)]);
}

export function beginLogin(): void {
	window.location.href = loginUrl();
}

export function signOut(): void {
	session.clear();
	placesStore.clear();
	listsStore.clear();
	placeEditor.close();
	locationSearch.reset();
	placeFilters.reset();
	statusStore.show('Signed out.');
}

function defaultWritableListId(): string {
	return listsStore.writableLists[0]?.id ?? '';
}

export function selectSearchResult(result: PlaceSearchResult): void {
	placeViewer.close();
	placeEditor.openForCreate(result, createPlaceDraft(result, defaultWritableListId()));
	locationSearch.query = result.displayName;
	locationSearch.results = [];
	statusStore.clear();
}

export async function pickMapLocation(selection: { latitude: number; longitude: number }): Promise<void> {
	placeViewer.close();
	statusStore.clear();

	let defaultName = 'New place';
	let countryCode: string | undefined;

	try {
		const location = await reverseGeocodeLocation(selection.latitude, selection.longitude);
		defaultName = location.name;
		countryCode = location.countryCode;
	} catch {
		defaultName = 'New place';
	}

	placeEditor.openForCreate(
		createPinnedSelection(selection.latitude, selection.longitude, defaultName, countryCode),
		{ ...createEmptyPlaceDraft(defaultWritableListId()), name: defaultName }
	);
}

export function startEdit(place: PlaceRecord): void {
	placeViewer.close();
	placeEditor.openForEdit(place);
	statusStore.clear();
}

export function closeEditor(): void {
	placeEditor.close();
}

export function viewPlace(place: PlaceRecord): void {
	placeEditor.close();
	void placeViewer.open(place);
}

export function closeViewer(): void {
	placeViewer.close();
}

export function editViewedPlace(): void {
	if (!placeViewer.place) {
		return;
	}

	startEdit(placeViewer.place);
}

export async function savePlace(): Promise<void> {
	if (!session.token) {
		beginLogin();
		return;
	}

	const payload = placeEditor.buildPayload();

	if (!payload) {
		statusStore.show('Choose a place and a list first.');
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

		if (placeViewer.place?.id === place.id) {
			placeViewer.close();
		}

		statusStore.show('Removed place.');
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to remove place');
	}
}

export function openListManager(): void {
	listManager.open();
}

export function closeListManager(): void {
	listManager.close();
}

export async function addList(name: string): Promise<void> {
	if (!session.token || !name.trim()) {
		return;
	}

	try {
		await listsStore.create(session.token, name.trim());
		statusStore.show('List created.');
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to create list');
	}
}

export async function renameExistingList(list: ListRecord, name: string): Promise<void> {
	if (!session.token || !name.trim() || name.trim() === list.name) {
		return;
	}

	try {
		await listsStore.rename(session.token, list.id, name.trim());
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to rename list');
	}
}

export async function removeList(list: ListRecord): Promise<void> {
	if (!session.token) {
		return;
	}

	try {
		await listsStore.remove(session.token, list.id);
		placeFilters.removeList(list.id);

		await placesStore.load(session.token);
		statusStore.show(`Deleted "${list.name}".`);
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to delete list');
	}
}

export async function shareList(list: ListRecord, role: ShareRole): Promise<void> {
	if (!session.token) {
		return;
	}

	try {
		await setShareLink(session.token, list.id, role);
		await listsStore.load(session.token);
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to create share link');
	}
}

export async function unshareList(list: ListRecord): Promise<void> {
	if (!session.token) {
		return;
	}

	try {
		await revokeShareLink(session.token, list.id);
		await listsStore.load(session.token);
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to revoke share link');
	}
}

export async function fetchMembers(list: ListRecord): Promise<ListMember[]> {
	if (!session.token) {
		return [];
	}

	return fetchListMembers(session.token, list.id);
}

export async function kickListMember(list: ListRecord, userId: string): Promise<void> {
	if (!session.token) {
		return;
	}

	try {
		await removeListMember(session.token, list.id, userId);
		statusStore.show('Removed member.');
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to remove member');
	}
}

export async function leaveList(list: ListRecord): Promise<void> {
	if (!session.token || !session.user) {
		return;
	}

	try {
		await removeListMember(session.token, list.id, session.user.id);
		await listsStore.load(session.token);
		await placesStore.load(session.token);
		statusStore.show(`Left "${list.name}".`);
	} catch (error) {
		statusStore.show(error instanceof Error ? error.message : 'Unable to leave list');
	}
}

export async function joinSharedList(joinToken: string): Promise<void> {
	if (!session.token) {
		throw new Error('You must be signed in to join a list');
	}

	const joined = await joinList(session.token, joinToken);
	await Promise.all([placesStore.load(session.token), listsStore.load(session.token)]);
	statusStore.show(`Joined "${joined.listName}".`);
}
