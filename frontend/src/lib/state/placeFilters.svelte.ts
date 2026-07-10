class PlaceFiltersStore {
	listIds = $state<string[]>([]);
	countryCodes = $state<string[]>([]);
	continents = $state<string[]>([]);
	tags = $state<string[]>([]);
	visited = $state<'want-to-go' | 'been'>('want-to-go');

	toggleTag(tag: string): void {
		this.tags = this.tags.includes(tag)
			? this.tags.filter((existing) => existing !== tag)
			: [...this.tags, tag];
	}

	removeList(listId: string): void {
		this.listIds = this.listIds.filter((existing) => existing !== listId);
	}

	reset(): void {
		this.listIds = [];
		this.countryCodes = [];
		this.continents = [];
		this.tags = [];
		this.visited = 'want-to-go';
	}
}

export const placeFilters = new PlaceFiltersStore();
