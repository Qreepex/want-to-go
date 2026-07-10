import { createVisit, deleteVisit, fetchVisits } from '$lib/api/visits';
import type { VisitPayload, VisitWithPlace } from '$lib/types';

class VisitsStore {
	items = $state<VisitWithPlace[]>([]);
	isLoading = $state(false);

	async load(token: string): Promise<void> {
		this.isLoading = true;

		try {
			this.items = await fetchVisits(token);
		} finally {
			this.isLoading = false;
		}
	}

	async create(token: string, payload: VisitPayload): Promise<void> {
		this.isLoading = true;

		try {
			await createVisit(token, payload);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	async remove(token: string, visitId: string): Promise<void> {
		this.isLoading = true;

		try {
			await deleteVisit(token, visitId);
			await this.load(token);
		} finally {
			this.isLoading = false;
		}
	}

	clear(): void {
		this.items = [];
	}
}

export const visitsStore = new VisitsStore();
