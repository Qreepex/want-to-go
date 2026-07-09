import { createList, deleteList, fetchLists, renameList } from '$lib/api/lists';
import type { ListRecord } from '$lib/types';

class ListsStore {
	items = $state<ListRecord[]>([]);
	isLoading = $state(false);

	get writableLists(): ListRecord[] {
		return this.items.filter((list) => list.role !== 'view');
	}

	async load(token: string): Promise<void> {
		this.isLoading = true;

		try {
			this.items = await fetchLists(token);
		} finally {
			this.isLoading = false;
		}
	}

	async create(token: string, name: string): Promise<void> {
		this.isLoading = true;

		try {
			await createList(token, name);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	async rename(token: string, listId: string, name: string): Promise<void> {
		this.isLoading = true;

		try {
			await renameList(token, listId, name);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	async remove(token: string, listId: string): Promise<void> {
		this.isLoading = true;

		try {
			await deleteList(token, listId);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	clear(): void {
		this.items = [];
	}
}

export const listsStore = new ListsStore();
