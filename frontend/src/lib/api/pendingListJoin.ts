const pendingListJoinStorageKey = 'want-to-go.pending-list-join';

export function getPendingListJoin(): string | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	return localStorage.getItem(pendingListJoinStorageKey);
}

export function setPendingListJoin(token: string): void {
	localStorage.setItem(pendingListJoinStorageKey, token);
}

export function clearPendingListJoin(): void {
	localStorage.removeItem(pendingListJoinStorageKey);
}
