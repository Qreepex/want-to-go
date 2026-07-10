import type { VisitPayload, VisitRecord, VisitWithPlace } from '$lib/types';
import { apiRequest } from './client';

export async function fetchVisits(token: string): Promise<VisitWithPlace[]> {
	const result = await apiRequest<{ visits: VisitWithPlace[] }>('/visits', token);
	return result.visits;
}

export async function createVisit(token: string, payload: VisitPayload): Promise<VisitRecord> {
	const result = await apiRequest<{ visit: VisitRecord }>('/visits', token, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
	return result.visit;
}

export async function updateVisit(
	token: string,
	visitId: string,
	payload: Partial<Pick<VisitPayload, 'visitedAt' | 'notes'>>
): Promise<VisitRecord> {
	const result = await apiRequest<{ visit: VisitRecord }>(`/visits/${visitId}`, token, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
	return result.visit;
}

export async function deleteVisit(token: string, visitId: string): Promise<void> {
	await apiRequest<void>(`/visits/${visitId}`, token, {
		method: 'DELETE'
	});
}
