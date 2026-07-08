const tokenStorageKey = 'want-to-go.auth-token';

export function getStoredToken(): string | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	return localStorage.getItem(tokenStorageKey);
}

export function setStoredToken(token: string): void {
	localStorage.setItem(tokenStorageKey, token);
}

export function clearStoredToken(): void {
	localStorage.removeItem(tokenStorageKey);
}
