class ListManagerStore {
	isOpen = $state(false);

	open(): void {
		this.isOpen = true;
	}

	close(): void {
		this.isOpen = false;
	}
}

export const listManager = new ListManagerStore();
