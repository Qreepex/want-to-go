import type { ListMember, ListRecord, ShareRole } from '$lib/types';
import { apiRequest } from './client';

export async function fetchLists(token: string): Promise<ListRecord[]> {
	const result = await apiRequest<{ lists: ListRecord[] }>('/lists', token);
	return result.lists;
}

export async function createList(token: string, name: string): Promise<ListRecord> {
	const result = await apiRequest<{ list: ListRecord }>('/lists', token, {
		method: 'POST',
		body: JSON.stringify({ name })
	});
	return result.list;
}

export async function renameList(token: string, listId: string, name: string): Promise<ListRecord> {
	const result = await apiRequest<{ list: ListRecord }>(`/lists/${listId}`, token, {
		method: 'PATCH',
		body: JSON.stringify({ name })
	});
	return result.list;
}

export async function deleteList(token: string, listId: string): Promise<void> {
	await apiRequest<void>(`/lists/${listId}`, token, { method: 'DELETE' });
}

export async function fetchListMembers(token: string, listId: string): Promise<ListMember[]> {
	const result = await apiRequest<{ members: ListMember[] }>(`/lists/${listId}/members`, token);
	return result.members;
}

export async function removeListMember(
	token: string,
	listId: string,
	userId: string
): Promise<void> {
	await apiRequest<void>(`/lists/${listId}/members/${userId}`, token, { method: 'DELETE' });
}

export async function setShareLink(
	token: string,
	listId: string,
	role: ShareRole
): Promise<ListRecord> {
	const result = await apiRequest<{ list: ListRecord }>(`/lists/${listId}/share`, token, {
		method: 'POST',
		body: JSON.stringify({ role })
	});
	return result.list;
}

export async function revokeShareLink(token: string, listId: string): Promise<ListRecord> {
	const result = await apiRequest<{ list: ListRecord }>(`/lists/${listId}/share`, token, {
		method: 'DELETE'
	});
	return result.list;
}

export async function joinList(
	token: string,
	joinToken: string
): Promise<{ listId: string; listName: string }> {
	return apiRequest<{ listId: string; listName: string }>(`/lists/join/${joinToken}`, token, {
		method: 'POST'
	});
}
