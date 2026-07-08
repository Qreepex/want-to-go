import { searchLocations } from '$lib/api/geo';
import type { PlaceSearchResult } from '$lib/types';
import { statusStore } from './status.svelte';

const debounceMs = 350;

class LocationSearchStore {
	query = $state('');
	results = $state<PlaceSearchResult[]>([]);
	isSearching = $state(false);

	private debounceHandle: ReturnType<typeof setTimeout> | undefined;
	private runId = 0;

	/** Updates the query and (re)schedules a debounced search. */
	setQuery(value: string): void {
		this.query = value;
		clearTimeout(this.debounceHandle);

		const trimmed = value.trim();
		if (!trimmed) {
			this.results = [];
			this.isSearching = false;
			return;
		}

		const currentRun = ++this.runId;
		this.debounceHandle = setTimeout(() => void this.run(trimmed, currentRun), debounceMs);
	}

	reset(): void {
		clearTimeout(this.debounceHandle);
		this.runId += 1;
		this.query = '';
		this.results = [];
		this.isSearching = false;
	}

	private async run(query: string, runId: number): Promise<void> {
		this.isSearching = true;

		try {
			const results = await searchLocations(query);
			if (runId === this.runId) {
				this.results = results;
			}
		} catch (error) {
			if (runId === this.runId) {
				statusStore.show(error instanceof Error ? error.message : 'Search failed');
			}
		} finally {
			if (runId === this.runId) {
				this.isSearching = false;
			}
		}
	}
}

export const locationSearch = new LocationSearchStore();
