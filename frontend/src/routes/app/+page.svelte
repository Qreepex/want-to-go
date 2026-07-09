<script lang="ts">
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import ListManagerModal from '$lib/components/ListManagerModal.svelte';
	import Login from '$lib/components/Login.svelte';
	import FloatingStack from '$lib/components/layout/FloatingStack.svelte';
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import MapSearchPanel from '$lib/components/MapSearchPanel.svelte';
	import PlaceEditorPanel from '$lib/components/PlaceEditorPanel.svelte';
	import PlaceViewerPanel from '$lib/components/PlaceViewerPanel.svelte';
	import PlacesSidebar from '$lib/components/PlacesSidebar.svelte';
	import StatusToast from '$lib/components/StatusToast.svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';
	import { initDashboard, pickMapLocation, viewPlace } from '$lib/dashboard/actions';
	import { filterPlaces } from '$lib/dashboard/helpers';
	import { placeEditor } from '$lib/state/placeEditor.svelte';
	import { placeFilters } from '$lib/state/placeFilters.svelte';
	import { placesStore } from '$lib/state/places.svelte';
	import { placeViewer } from '$lib/state/placeViewer.svelte';
	import { session } from '$lib/state/session.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		void initDashboard();
	});
</script>

<svelte:head>
	<title>Want To Go</title>
	<meta
		name="description"
		content="A map-based travel bucket list with OAuth login, saved places, and geocoded search."
	/>
</svelte:head>

{#if !session.token}
	<Login />
{:else}
	<PageShell>
		{#snippet background()}
			<LeafletMap
				places={filterPlaces(placesStore.items, placeFilters)}
				selection={placeEditor.selection}
				focusPlace={placeViewer.place}
				onPick={pickMapLocation}
				onSelectPlace={viewPlace}
			/>
		{/snippet}

		<StatusToast />

		<FloatingStack side="left">
			<MapSearchPanel />
			<PlacesSidebar />
		</FloatingStack>

		<UserMenu />
		<PlaceEditorPanel />
		<PlaceViewerPanel />
		<ListManagerModal />
	</PageShell>
{/if}
