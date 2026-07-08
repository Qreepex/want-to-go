import { fetchCurrentUser } from '$lib/api/auth';
import { clearStoredToken, getStoredToken } from '$lib/api/token';
import type { UserProfile } from '$lib/types';

class SessionStore {
	token = $state<string | null>(null);
	user = $state<UserProfile | null>(null);
	isLoading = $state(false);

	/** Restores a previously stored token and fetches the owning user. */
	async restore(): Promise<void> {
		const storedToken = getStoredToken();

		if (!storedToken) {
			return;
		}

		this.token = storedToken;
		this.isLoading = true;

		try {
			this.user = await fetchCurrentUser(storedToken);
		} catch (error) {
			this.clear();
			throw error;
		} finally {
			this.isLoading = false;
		}
	}

	clear(): void {
		clearStoredToken();
		this.token = null;
		this.user = null;
	}
}

export const session = new SessionStore();
