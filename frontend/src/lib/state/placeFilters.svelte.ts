class PlaceFiltersStore {
	listId = $state<string | null>(null);
	countryCode = $state<string | null>(null);
	continent = $state<string | null>(null);

	reset(): void {
		this.listId = null;
		this.countryCode = null;
		this.continent = null;
	}
}

export const placeFilters = new PlaceFiltersStore();
