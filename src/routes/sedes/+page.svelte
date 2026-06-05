<script lang="ts">
	import { base } from '$app/paths';
	import { db } from '$lib/data/loader.svelte';
	import { calculateMetrics, aggregateRecords } from '$lib/data/metrics';
	import Filters from '$lib/components/Filters.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { TableRow } from '$lib/components/DataTable.svelte';
	import ScatterChart from '$lib/charts/ScatterChart.svelte';
	import type { ScatterPoint } from '$lib/charts/ScatterChart.svelte';
	import { TrendingUp, FileText, XSquare, AlertCircle } from '@lucide/svelte';

	// Year filter
	let selectedRange = $state<[number, number]>([2017, 2025]);
	let initialized = false;
	$effect(() => {
		if (!initialized && db.anios.length > 0) {
			selectedRange = [db.anios[0], db.anios[db.anios.length - 1]];
			initialized = true;
		}
	});

	// Aggregate data per seat for the selected year filter
	const seatRows = $derived.by(() => {
		const result: TableRow[] = [];

		for (const sede of db.sedes) {
			const seatRecords = db.records.filter((r) => {
				const matchesSede = r.sede === sede;
				const matchesYear = r.anio >= selectedRange[0] && r.anio <= selectedRange[1];
				return matchesSede && matchesYear;
			});

			if (seatRecords.length === 0) continue;

			// Aggregate records (if 'todos' we sum across years)
			const aggregated = aggregateRecords(seatRecords);
			const metrics = calculateMetrics(aggregated);

			result.push({
				id: sede,
				name: sede,
				ingresadas: aggregated.ingresadas,
				resueltas: aggregated.totalResueltas,
				tasaResolucion: metrics.tasaResolucion,
				tasaSentencia: metrics.tasaSentencia,
				tasaCaducidad: metrics.tasaCaducidad
			});
		}

		return result;
	});

	// Map seat rows for scatter chart
	const scatterPoints = $derived(
		seatRows.map((row) => ({
			x: row.ingresadas,
			y: row.tasaResolucion,
			size: row.resueltas,
			label: row.name,
			color: row.tasaResolucion >= 1.0 ? 'rgba(15, 81, 50, 0.7)' : 'rgba(67, 56, 202, 0.7)'
		}))
	);

	// Helper to extract rankings
	function getRankings(
		rows: TableRow[],
		key: 'tasaResolucion' | 'tasaSentencia' | 'tasaCaducidad',
		count = 5
	) {
		const sorted = [...rows].sort((a, b) => b[key] - a[key]);
		
		const top = sorted.slice(0, count);
		// Filter out items with 0 resolves to avoid skewed bottom lists
		const validForBottom = sorted.filter(r => r.resueltas > 0);
		const bottom = [...validForBottom].reverse().slice(0, count);

		return { top, bottom };
	}

	const rankResolucion = $derived(getRankings(seatRows, 'tasaResolucion'));
	const rankSentencia = $derived(getRankings(seatRows, 'tasaSentencia'));
	const rankCaducidad = $derived(getRankings(seatRows, 'tasaCaducidad'));

	const formatPercent = (v: number) => (v * 100).toFixed(1) + '%';
	const formatInt = (v: number) => v.toLocaleString('es-AR');
</script>

<div class="space-y-8">
	<!-- Top Bar -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl font-bold text-brand-text tracking-tight">Análisis de Sedes Judiciales</h2>
			<p class="text-xs text-brand-text-muted mt-1">Indicadores promedio para el periodo seleccionado.</p>
		</div>
		
		<!-- Filters -->
		<Filters years={db.anios} bind:selectedRange />
	</div>

	<!-- Scatter plot section -->
	<div class="grid grid-cols-1 gap-6">
		<div class="glass-panel p-6 rounded-3xl border border-brand-border h-[430px] flex flex-col justify-between">
			<ScatterChart
				data={scatterPoints}
				title="Dispersión de Desempeño: Causas Ingresadas vs Tasa de Resolución"
				xLabel="Causas Ingresadas"
				yLabel="Tasa de Resolución"
				formatY={formatPercent}
			/>
		</div>
	</div>

	<!-- Data Table Section -->
	<div class="space-y-4">
		<div>
			<h3 class="text-lg font-bold text-brand-text">Tabla Comparativa General</h3>
			<p class="text-xs text-brand-text-muted mt-1">Haz clic en los encabezados para ordenar o busca una sede específica.</p>
		</div>

		<DataTable data={seatRows} />
	</div>

	<!-- Rankings Grid -->
	<div class="space-y-6 pt-4 border-t border-brand-border">
		<div>
			<h3 class="text-lg font-bold text-brand-text">Rankings de Desempeño y Caducidad</h3>
			<p class="text-xs text-brand-text-muted mt-1">Sedes con mayor (Top) y menor (Bottom) efectividad en sus respectivos flujos. Muestra de las 5 principales.</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Tasa de Resolución Ranking -->
			<div class="glass-panel p-5 rounded-2xl border border-brand-border flex flex-col gap-4">
				<div class="flex items-center gap-2 border-b border-brand-border pb-3">
					<TrendingUp class="w-5 h-5 text-brand-indigo" />
					<h4 class="text-sm font-bold text-brand-text">Tasa de Resolución</h4>
				</div>

				<div class="space-y-4">
					<!-- Top 5 -->
					<div>
						<h5 class="text-xs font-bold text-brand-success uppercase tracking-wider mb-2">Top 5</h5>
						<div class="space-y-1.5">
							{#each rankResolucion.top as item, i}
								<div class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-brand-border">
									<span class="truncate max-w-[130px] text-brand-text-muted">
										<a href="{base}/sede?id={encodeURIComponent(item.id)}" class="hover:text-brand-indigo transition font-medium font-sans">
											{i + 1}. {item.name}
										</a>
									</span>
									<span class="font-mono font-bold text-brand-success">{formatPercent(item.tasaResolucion)}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- Bottom 5 -->
					<div>
						<h5 class="text-xs font-bold text-brand-danger uppercase tracking-wider mb-2 font-sans">Bottom 5</h5>
						<div class="space-y-1.5">
							{#each rankResolucion.bottom as item, i}
								<div class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-brand-border">
									<span class="truncate max-w-[130px] text-brand-text-muted">
										<a href="{base}/sede?id={encodeURIComponent(item.id)}" class="hover:text-brand-indigo transition font-medium font-sans">
											{i + 1}. {item.name}
										</a>
									</span>
									<span class="font-mono font-bold text-brand-danger">{formatPercent(item.tasaResolucion)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Tasa de Sentencia Ranking -->
			<div class="glass-panel p-5 rounded-2xl border border-brand-border flex flex-col gap-4">
				<div class="flex items-center gap-2 border-b border-brand-border pb-3">
					<FileText class="w-5 h-5 text-brand-success" />
					<h4 class="text-sm font-bold text-brand-text">Tasa de Sentencia</h4>
				</div>

				<div class="space-y-4">
					<!-- Top 5 -->
					<div>
						<h5 class="text-xs font-bold text-brand-success uppercase tracking-wider mb-2">Top 5</h5>
						<div class="space-y-1.5">
							{#each rankSentencia.top as item, i}
								<div class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-brand-border">
									<span class="truncate max-w-[130px] text-brand-text-muted">
										<a href="{base}/sede?id={encodeURIComponent(item.id)}" class="hover:text-brand-indigo transition font-medium font-sans">
											{i + 1}. {item.name}
										</a>
									</span>
									<span class="font-mono font-bold text-brand-success">{formatPercent(item.tasaSentencia)}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- Bottom 5 -->
					<div>
						<h5 class="text-xs font-bold text-brand-danger uppercase tracking-wider mb-2 font-sans">Bottom 5</h5>
						<div class="space-y-1.5">
							{#each rankSentencia.bottom as item, i}
								<div class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-brand-border">
									<span class="truncate max-w-[130px] text-brand-text-muted">
										<a href="{base}/sede?id={encodeURIComponent(item.id)}" class="hover:text-brand-indigo transition font-medium font-sans">
											{i + 1}. {item.name}
										</a>
									</span>
									<span class="font-mono font-bold text-brand-danger">{formatPercent(item.tasaSentencia)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Tasa de Caducidad Ranking -->
			<div class="glass-panel p-5 rounded-2xl border border-brand-border flex flex-col gap-4">
				<div class="flex items-center gap-2 border-b border-brand-border pb-3">
					<XSquare class="w-5 h-5 text-brand-danger" />
					<h4 class="text-sm font-bold text-brand-text">Tasa de Caducidad</h4>
				</div>

				<div class="space-y-4">
					<!-- Top 5 (Peor caducidad, es decir, mayor tasa) -->
					<div>
						<h5 class="text-xs font-bold text-brand-danger uppercase tracking-wider mb-2">Mayor Caducidad</h5>
						<div class="space-y-1.5">
							{#each rankCaducidad.top as item, i}
								<div class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-brand-danger/20 border-dashed">
									<span class="truncate max-w-[130px] text-brand-text-muted">
										<a href="{base}/sede?id={encodeURIComponent(item.id)}" class="hover:text-brand-indigo transition font-medium font-sans">
											{i + 1}. {item.name}
										</a>
									</span>
									<span class="font-mono font-bold text-brand-danger">{formatPercent(item.tasaCaducidad)}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- Bottom 5 (Menor caducidad, menor tasa) -->
					<div>
						<h5 class="text-xs font-bold text-brand-success uppercase tracking-wider mb-2 font-sans">Menor Caducidad</h5>
						<div class="space-y-1.5">
							{#each rankCaducidad.bottom as item, i}
								<div class="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-brand-success/20 border-dashed">
									<span class="truncate max-w-[130px] text-brand-text-muted">
										<a href="{base}/sede?id={encodeURIComponent(item.id)}" class="hover:text-brand-indigo transition font-medium font-sans">
											{i + 1}. {item.name}
										</a>
									</span>
									<span class="font-mono font-bold text-brand-success">{formatPercent(item.tasaCaducidad)}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
