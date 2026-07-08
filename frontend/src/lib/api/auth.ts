import type { UserProfile } from '$lib/types';
import { apiRequest, getBackendUrl } from './client';

export function loginUrl(): string {
	return `${getBackendUrl()}/auth/login`;
}

export async function fetchCurrentUser(token: string): Promise<UserProfile> {
	const result = await apiRequest<{ user: UserProfile }>('/auth/me', token);
	return result.user;
}
