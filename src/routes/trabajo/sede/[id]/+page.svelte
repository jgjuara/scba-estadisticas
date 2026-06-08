<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	onMount(() => {
		const id = $page.params.id;
		if (id) {
			goto(`${base}/trabajo/sede?id=${encodeURIComponent(id)}`, { replaceState: true });
		} else {
			goto(`${base}/trabajo/sede`, { replaceState: true });
		}
	});
</script>

<div class="flex flex-col items-center justify-center min-h-[350px] font-sans">
	<p class="text-xs text-brand-text-muted">Redirigiendo al detalle de sede...</p>
</div>
