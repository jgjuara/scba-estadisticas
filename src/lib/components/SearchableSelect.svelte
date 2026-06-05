<script lang="ts">
	import { Search, ChevronDown, Check } from '@lucide/svelte';
	import { onMount } from 'svelte';

	interface Props {
		options: string[];
		selected: string;
		placeholder?: string;
	}

	let { options = [], selected = $bindable(), placeholder = 'Seleccionar sede...' }: Props = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let selectElement = $state<HTMLElement | null>(null);

	const filteredOptions = $derived(
		options.filter((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function selectOption(opt: string) {
		selected = opt;
		isOpen = false;
		searchQuery = '';
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
		<span class={selected ? 'text-brand-text font-bold' : 'text-brand-text-muted/65 font-medium'}>
			{selected || placeholder}
		</span>
		<ChevronDown class="w-4 h-4 text-brand-text-muted" />
	</button>

	{#if isOpen}
		<div class="absolute z-50 w-full mt-1.5 bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[250px] font-sans">
			<!-- Search box -->
			<div class="relative p-2 border-b border-brand-border bg-stone-50/50">
				<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-muted" />
				<input
					type="text"
					placeholder="Buscar sede..."
					bind:value={searchQuery}
					class="w-full pl-8 pr-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs text-brand-text focus:outline-none focus:border-brand-indigo transition"
					autoFocus
				/>
			</div>

			<!-- Options -->
			<div class="overflow-y-auto flex-1 divide-y divide-stone-100 max-h-[180px]">
				<!-- Empty Option to reset -->
				<button
					type="button"
					onclick={() => selectOption('')}
					class="w-full text-left px-4 py-2 text-xs text-brand-text-muted hover:bg-brand-indigo/5 hover:text-brand-indigo transition flex items-center justify-between font-medium"
				>
					<span>-- Seleccionar sede --</span>
					{#if !selected}
						<Check class="w-3.5 h-3.5 text-brand-indigo" />
					{/if}
				</button>

				{#if filteredOptions.length === 0}
					<div class="px-4 py-3 text-xs text-brand-text-muted text-center font-medium">
						No se encontraron resultados
					</div>
				{:else}
					{#each filteredOptions as opt}
						<button
							type="button"
							onclick={() => selectOption(opt)}
							class="w-full text-left px-4 py-2 text-xs text-brand-text hover:bg-brand-indigo/5 hover:text-brand-indigo transition flex items-center justify-between"
						>
							<span class={selected === opt ? 'font-bold text-brand-indigo' : 'font-medium'}>{opt}</span>
							{#if selected === opt}
								<Check class="w-3.5 h-3.5 text-brand-indigo" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
