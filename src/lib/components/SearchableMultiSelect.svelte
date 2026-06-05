<script lang="ts">
	import { Search, ChevronDown, Check } from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface Props {
		options: string[];
		selected: string[];
		placeholder?: string;
		maxSelected?: number;
	}

	let {
		options = [],
		selected = $bindable([]),
		placeholder = 'Seleccionar sedes...',
		maxSelected = 6
	}: Props = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let selectElement = $state<HTMLElement | null>(null);

	const filteredOptions = $derived(
		options.filter((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function toggleOption(opt: string) {
		if (selected.includes(opt)) {
			// Enforce minimum 1 selection to avoid empty charts
			if (selected.length > 1) {
				selected = selected.filter((s) => s !== opt);
			}
		} else {
			if (selected.length < maxSelected) {
				selected = [...selected, opt];
			}
		}
	}

	onMount(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (selectElement && !selectElement.contains(e.target as Node)) {
				isOpen = false;
			}
		};
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="relative w-full sm:max-w-xs" bind:this={selectElement}>
	<button
		type="button"
		onclick={() => {
			isOpen = !isOpen;
			if (isOpen) {
				searchQuery = '';
			}
		}}
		class="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-brand-text hover:bg-stone-50/50 transition cursor-pointer select-none focus:outline-none focus:border-brand-indigo font-sans"
	>
		<span class={selected.length > 0 ? 'text-brand-text font-bold' : 'text-brand-text-muted/65 font-medium'}>
			{#if selected.length === 0}
				{placeholder}
			{:else}
				{selected.length} {selected.length === 1 ? 'sede seleccionada' : 'sedes seleccionadas'}
			{/if}
		</span>
		<ChevronDown class="w-4 h-4 text-brand-text-muted" />
	</button>

	{#if isOpen}
		<div class="absolute z-50 w-full mt-1.5 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[280px] font-sans animate-in fade-in slide-in-from-top-1 duration-100">
			<!-- Search box -->
			<div class="relative p-2 border-b border-brand-border bg-stone-50/50">
				<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-muted" />
				<input
					type="text"
					placeholder="Buscar sede..."
					bind:value={searchQuery}
					class="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs text-brand-text focus:outline-none focus:border-brand-indigo transition"
					autofocus
				/>
			</div>

			<!-- Info and Limit status -->
			<div class="px-4 py-1.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[10px] text-brand-text-muted font-semibold uppercase tracking-wider">
				<span>Seleccionadas: {selected.length}/{maxSelected}</span>
				{#if selected.length >= maxSelected}
					<span class="text-brand-warning">Límite alcanzado</span>
				{/if}
			</div>

			<!-- Options -->
			<div class="overflow-y-auto flex-1 divide-y divide-stone-100 max-h-[180px]">
				{#if filteredOptions.length === 0}
					<div class="px-4 py-3 text-xs text-brand-text-muted text-center font-medium">
						No se encontraron resultados
					</div>
				{:else}
					{#each filteredOptions as opt}
						{@const isSelected = selected.includes(opt)}
						{@const isMaxReached = selected.length >= maxSelected}
						{@const isDisabled = !isSelected && isMaxReached}
						<button
							type="button"
							onclick={() => {
								if (!isDisabled) {
									toggleOption(opt);
								}
							}}
							disabled={isDisabled}
							class="w-full text-left px-4 py-2 text-xs transition flex items-center justify-between {isDisabled ? 'text-stone-300 bg-stone-50/50 cursor-not-allowed font-medium' : 'text-brand-text hover:bg-brand-indigo/5 hover:text-brand-indigo cursor-pointer font-medium'}"
						>
							<span class={isSelected ? 'font-bold text-brand-indigo' : ''}>{opt}</span>
							{#if isSelected}
								<Check class="w-3.5 h-3.5 text-brand-indigo" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
