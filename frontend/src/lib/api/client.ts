const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export function getBackendUrl(): string {
	return apiBaseUrl;
}

export async function apiRequest<T>(
	path: string,
	token: string | null,
	init: RequestInit = {}
): Promise<T> {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		...init,
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {}),
			...(init.headers ?? {})
		}
	});

	if (!response.ok) {
		const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
		throw new Error(errorBody?.error ?? `Request failed with status ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}
