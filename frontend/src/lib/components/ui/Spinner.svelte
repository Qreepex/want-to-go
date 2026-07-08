<script lang="ts">
	let { class: className = '' } = $props<{ class?: string }>();
</script>

<div
	class="h-8 w-8 animate-spin rounded-full border-2 border-(--border-strong) border-t-(--accent) {className}"
	role="status"
	aria-label="Loading"
></div>
