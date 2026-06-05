<script lang="ts">
	import { base } from '$app/paths';
	import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from '@lucide/svelte';

	export interface TableRow {
		id: string; // Seat name used for route routing
		name: string;
		ingresadas: number;
		resueltas: number;
		tasaResolucion: number;
		tasaSentencia: number;
		tasaCaducidad: number;
	}

	interface Props {
		data: TableRow[];
	}

	let { data }: Props = $props();

	// Search and sorting states
	let search = $state('');
	let sortBy = $state<keyof TableRow>('name');
	let sortDir = $state<'asc' | 'desc'>('asc');
	
	// Pagination state
	let currentPage = $state(1);
	let itemsPerPage = $state(10);

	// Derived states
	const filteredData = $derived.by(() => {
		const query = search.toLowerCase().trim();
		let result = [...data];

		if (query) {
			result = result.filter((row) => row.name.toLowerCase().includes(query));
		}

		result.sort((a, b) => {
			let valA = a[sortBy];
			let valB = b[sortBy];

			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}

			// Numbers
			valA = valA as number;
			valB = valB as number;
			return sortDir === 'asc' ? valA - valB : valB - valA;
		});

		return result;
	});

	const paginatedData = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredData.slice(start, start + itemsPerPage);
	});

	const totalPages = $derived(Math.ceil(filteredData.length / itemsPerPage));

	function handleSort(column: keyof TableRow) {
		if (sortBy === column) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDir = 'desc'; // Default to desc for metrics
			if (column === 'name') sortDir = 'asc';
		}
		currentPage = 1;
	}

	// Reset page on search
	$effect(() => {
		if (search !== undefined) {
			currentPage = 1;
		}
	});

	function formatPercent(val: number): string {
		return (val * 100).toFixed(1) + '%';
	}

	function formatInt(val: number): string {
		return val.toLocaleString('es-AR');
	}
</script>

<div class="space-y-4">
	<!-- Controls Bar -->
	<div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
		<!-- Search Field -->
		<div class="relative w-full sm:max-w-xs">
			<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
			<input
				type="text"
				placeholder="Buscar sede..."
				bind:value={search}
				class="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-brand-border text-brand-text placeholder-brand-text-muted/65 focus:outline-none focus:border-brand-indigo transition"
			/>
		</div>

		<!-- Items Per Page selector -->
		<div class="flex items-center gap-2 self-end sm:self-auto text-xs text-brand-text-muted">
			<span>Filas por página:</span>
			<select
				bind:value={itemsPerPage}
				class="bg-white border border-brand-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand-indigo"
			>
				<option value={10}>10</option>
				<option value={15}>15</option>
				<option value={20}>20</option>
				<option value={data.length}>Todas ({data.length})</option>
			</select>
		</div>
	</div>

	<!-- Table Container -->
	<div class="overflow-x-auto rounded-2xl border border-brand-border bg-brand-card">
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="border-b border-brand-border bg-stone-100 text-xs font-semibold uppercase tracking-wider text-brand-text-muted select-none">
					<!-- Header Sede -->
					<th
						onclick={() => handleSort('name')}
						class="px-6 py-4 cursor-pointer hover:bg-stone-200/60 hover:text-brand-text transition"
					>
						<div class="flex items-center gap-2">
							<span>Sede</span>
							{#if sortBy === 'name'}
								{#if sortDir === 'asc'}<ArrowUp class="w-3.5 h-3.5 text-brand-indigo" />{:else}<ArrowDown class="w-3.5 h-3.5 text-brand-indigo" />{/if}
							{:else}
								<ArrowUpDown class="w-3.5 h-3.5 opacity-30" />
							{/if}
						</div>
					</th>

					<!-- Header Ingresadas -->
					<th
						onclick={() => handleSort('ingresadas')}
						class="px-6 py-4 cursor-pointer text-right hover:bg-stone-200/60 hover:text-brand-text transition"
					>
						<div class="flex items-center gap-2 justify-end">
							<span>Ingresadas</span>
							{#if sortBy === 'ingresadas'}
								{#if sortDir === 'asc'}<ArrowUp class="w-3.5 h-3.5 text-brand-indigo" />{:else}<ArrowDown class="w-3.5 h-3.5 text-brand-indigo" />{/if}
							{:else}
								<ArrowUpDown class="w-3.5 h-3.5 opacity-30" />
							{/if}
						</div>
					</th>

					<!-- Header Resueltas -->
					<th
						onclick={() => handleSort('resueltas')}
						class="px-6 py-4 cursor-pointer text-right hover:bg-stone-200/60 hover:text-brand-text transition"
					>
						<div class="flex items-center gap-2 justify-end">
							<span>Resueltas</span>
							{#if sortBy === 'resueltas'}
								{#if sortDir === 'asc'}<ArrowUp class="w-3.5 h-3.5 text-brand-indigo" />{:else}<ArrowDown class="w-3.5 h-3.5 text-brand-indigo" />{/if}
							{:else}
								<ArrowUpDown class="w-3.5 h-3.5 opacity-30" />
							{/if}
						</div>
					</th>

					<!-- Header Tasa Resolución -->
					<th
						onclick={() => handleSort('tasaResolucion')}
						class="px-6 py-4 cursor-pointer text-right hover:bg-stone-200/60 hover:text-brand-text transition"
					>
						<div class="flex items-center gap-2 justify-end">
							<span>Tasa Resol.</span>
							{#if sortBy === 'tasaResolucion'}
								{#if sortDir === 'asc'}<ArrowUp class="w-3.5 h-3.5 text-brand-indigo" />{:else}<ArrowDown class="w-3.5 h-3.5 text-brand-indigo" />{/if}
							{:else}
								<ArrowUpDown class="w-3.5 h-3.5 opacity-30" />
							{/if}
						</div>
					</th>

					<!-- Header Tasa Sentencia -->
					<th
						onclick={() => handleSort('tasaSentencia')}
						class="px-6 py-4 cursor-pointer text-right hover:bg-stone-200/60 hover:text-brand-text transition"
					>
						<div class="flex items-center gap-2 justify-end">
							<span>Tasa Sent.</span>
							{#if sortBy === 'tasaSentencia'}
								{#if sortDir === 'asc'}<ArrowUp class="w-3.5 h-3.5 text-brand-indigo" />{:else}<ArrowDown class="w-3.5 h-3.5 text-brand-indigo" />{/if}
							{:else}
								<ArrowUpDown class="w-3.5 h-3.5 opacity-30" />
							{/if}
						</div>
					</th>

					<!-- Header Tasa Caducidad -->
					<th
						onclick={() => handleSort('tasaCaducidad')}
						class="px-6 py-4 cursor-pointer text-right hover:bg-stone-200/60 hover:text-brand-text transition"
					>
						<div class="flex items-center gap-2 justify-end">
							<span>Tasa Caducidad</span>
							{#if sortBy === 'tasaCaducidad'}
								{#if sortDir === 'asc'}<ArrowUp class="w-3.5 h-3.5 text-brand-indigo" />{:else}<ArrowDown class="w-3.5 h-3.5 text-brand-indigo" />{/if}
							{:else}
								<ArrowUpDown class="w-3.5 h-3.5 opacity-30" />
							{/if}
						</div>
					</th>
				</tr>
			</thead>
			
			<tbody class="text-sm divide-y divide-brand-border">
				{#if paginatedData.length === 0}
					<tr>
						<td colspan="6" class="px-6 py-12 text-center text-brand-text-muted">
							No se encontraron sedes coincidentes con la búsqueda.
						</td>
					</tr>
				{:else}
					{#each paginatedData as row}
						<tr class="hover:bg-stone-50 transition group">
							<!-- Sede -->
							<td class="px-6 py-4 font-medium text-brand-text">
								<a
									href="{base}/sede?id={encodeURIComponent(row.id)}"
									class="hover:text-brand-indigo transition flex flex-col"
								>
									<span>{row.name}</span>
									<span class="text-[10px] text-brand-text-muted font-normal mt-0.5 opacity-0 group-hover:opacity-100 transition duration-150">
										Ver análisis detallado →
									</span>
								</a>
							</td>

							<!-- Ingresadas -->
							<td class="px-6 py-4 text-right font-mono text-brand-text-muted">
								{formatInt(row.ingresadas)}
							</td>

							<!-- Resueltas -->
							<td class="px-6 py-4 text-right font-mono text-brand-text-muted">
								{formatInt(row.resueltas)}
							</td>

							<!-- Tasa Resolución -->
							<td class="px-6 py-4 text-right font-mono">
								<span class="px-2.5 py-1 rounded-full text-xs font-semibold {row.tasaResolucion >= 1.0 ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'}">
									{formatPercent(row.tasaResolucion)}
								</span>
							</td>

							<!-- Tasa Sentencia -->
							<td class="px-6 py-4 text-right font-mono text-brand-text-muted">
								{formatPercent(row.tasaSentencia)}
							</td>

							<!-- Tasa Caducidad -->
							<td class="px-6 py-4 text-right font-mono">
								<span class="px-2.5 py-1 rounded-full text-xs font-semibold {row.tasaCaducidad > 0.15 ? 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20' : row.tasaCaducidad > 0.05 ? 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20' : 'bg-stone-100 text-brand-text-muted border border-brand-border'}">
									{formatPercent(row.tasaCaducidad)}
								</span>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<!-- Pagination controls -->
	{#if totalPages > 1}
		<div class="flex items-center justify-between px-2 text-xs text-brand-text-muted">
			<div>
				Mostrando del {((currentPage - 1) * itemsPerPage) + 1} al {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} sedes
			</div>
			
			<div class="flex items-center gap-1">
				<button
					onclick={() => currentPage = Math.max(1, currentPage - 1)}
					disabled={currentPage === 1}
					class="p-2 rounded-lg border border-brand-border bg-white disabled:opacity-30 disabled:pointer-events-none hover:bg-stone-50 transition focus:outline-none"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>
				
				{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
					<button
						onclick={() => currentPage = page}
						class="w-8 h-8 rounded-lg border font-semibold transition focus:outline-none {currentPage === page ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo' : 'border-brand-border bg-white hover:bg-stone-50 text-brand-text-muted'}"
					>
						{page}
					</button>
				{/each}

				<button
					onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
					disabled={currentPage === totalPages}
					class="p-2 rounded-lg border border-brand-border bg-white disabled:opacity-30 disabled:pointer-events-none hover:bg-stone-50 transition focus:outline-none"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</div>
	{/if}
</div>
