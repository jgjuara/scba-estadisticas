<script lang="ts">
	import { base } from '$app/paths';
	import * as d3 from 'd3';

	interface HeatmapData {
		sede: string;
		anio: number;
		value: number; // The metric value to encode as color (e.g. tasaCaducidad)
	}

	interface Props {
		data: HeatmapData[];
		sedes: string[];
		anios: number[];
		title?: string;
		formatValue?: (val: number) => string;
	}

	let {
		data,
		sedes,
		anios,
		title = '',
		formatValue = (v) => (v * 100).toFixed(1) + '%'
	}: Props = $props();

	let width = $state(600);
	const rowHeight = 22; // Height per seat row
	const padding = { top: 35, right: 30, bottom: 35, left: 160 };
	
	// Dynamic height based on number of seats
	const height = $derived(sedes.length * rowHeight + padding.top + padding.bottom);

	// Tooltip state
	let activeCell = $state<{
		screenX: number;
		screenY: number;
		sede: string;
		anio: number;
		value: number;
	} | null>(null);

	// Band Scales
	const xScale = $derived(
		d3.scaleBand<number>()
			.domain(anios)
			.range([padding.left, width - padding.right])
			.padding(0.06)
	);

	const yScale = $derived(
		d3.scaleBand<string>()
			.domain(sedes)
			.range([padding.top, height - padding.bottom])
			.padding(0.08)
	);

	// Custom color scale for caducidad rate
	// Slate (neutral low) -> Amber (moderate) -> Rose (high) -> Dark Red (extreme)
	const colorScale = $derived(
		d3.scaleLinear<string>()
			.domain([0, 0.05, 0.15, 0.35])
			.range(['#eae7e1', '#f59e0b', '#f43f5e', '#9f1239'])
	);

	// Map data for fast lookup
	const dataMap = $derived.by(() => {
		const map = new Map<string, number>();
		for (const d of data) {
			map.set(`${d.sede}|${d.anio}`, d.value);
		}
		return map;
	});

	function handleCellHover(event: MouseEvent, sede: string, anio: number, value: number) {
		const cellElement = event.currentTarget as SVGRectElement;
		const rect = cellElement.getBoundingClientRect();
		const parentRect = cellElement.parentElement?.getBoundingClientRect();

		if (parentRect) {
			const px = xScale(anio)! + xScale.bandwidth() / 2;
			const py = yScale(sede)! + yScale.bandwidth() / 2;

			activeCell = {
				screenX: px,
				screenY: py,
				sede,
				anio,
				value
			};
		}
	}

	function handleCellLeave() {
		activeCell = null;
	}
</script>

<div class="flex flex-col w-full h-full relative" bind:clientWidth={width}>
	{#if title}
		<h5 class="text-sm font-bold text-brand-text mb-4 px-2">{title}</h5>
	{/if}

	<!-- Heatmap Container with vertical scroll if too high -->
	<div class="relative overflow-x-auto select-none rounded-2xl border border-brand-border bg-brand-card p-3">
		<svg {width} {height} class="overflow-visible">
			<!-- Y Axis: Seat Labels -->
			{#each sedes as sede}
				<text
					x={padding.left - 12}
					y={yScale(sede)! + yScale.bandwidth() / 2 + 3.5}
					text-anchor="end"
					class="text-[10px] font-medium fill-brand-text-muted hover:fill-brand-text transition cursor-pointer"
				>
					<a href="{base}/sede?id={encodeURIComponent(sede)}">
						{sede.length > 22 ? sede.substring(0, 20) + '...' : sede}
					</a>
				</text>
			{/each}

			<!-- X Axis: Years at top -->
			{#each anios as anio}
				<text
					x={xScale(anio)! + xScale.bandwidth() / 2}
					y={padding.top - 12}
					text-anchor="middle"
					class="text-xs font-bold fill-brand-text-muted font-mono"
				>
					{anio}
				</text>
			{/each}

			<!-- Heatmap Rectangles Grid -->
			{#each sedes as sede}
				{#each anios as anio}
					{@const val = dataMap.get(`${sede}|${anio}`) ?? 0}
					{@const color = colorScale(val)}
					<rect
						x={xScale(anio)}
						y={yScale(sede)}
						width={xScale.bandwidth()}
						height={yScale.bandwidth()}
						rx="3"
						fill={color}
						class="transition-all duration-150 cursor-pointer hover:stroke-brand-text hover:stroke-2 hover:scale-[1.03]"
						style="transform-origin: {xScale(anio)! + xScale.bandwidth()/2}px {yScale(sede)! + yScale.bandwidth()/2}px"
						onmouseenter={(e) => handleCellHover(e, sede, anio, val)}
						onmouseleave={handleCellLeave}
					/>
				{/each}
			{/each}

			<!-- Highlight border for active cell -->
			{#if activeCell}
				<rect
					x={xScale(activeCell.anio)}
					y={yScale(activeCell.sede)}
					width={xScale.bandwidth()}
					height={yScale.bandwidth()}
					rx="3"
					fill="none"
					stroke="var(--color-brand-text)"
					stroke-width="2"
					class="pointer-events-none"
				/>
			{/if}
		</svg>

		<!-- Tooltip Markup -->
		{#if activeCell}
			<div
				class="absolute z-50 glass-panel px-3 py-2.5 rounded-xl border border-brand-border pointer-events-none shadow-2xl flex flex-col gap-0.5 text-xs"
				style="left: {activeCell.screenX + 15}px; top: {activeCell.screenY}px; transform: translateY(-50%);"
			>
				<span class="text-[10px] text-brand-text-muted font-bold tracking-wide uppercase">
					{activeCell.sede}
				</span>
				<div class="flex items-center gap-1.5 mt-0.5 justify-between">
					<span class="text-brand-text-muted">Año {activeCell.anio}:</span>
					<span class="font-mono font-bold text-brand-danger">
						{formatValue(activeCell.value)}
					</span>
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Color Legend bar at the bottom -->
	<div class="flex items-center justify-end gap-3 mt-4 text-[10px] text-brand-text-muted px-2">
		<span>Tasa de Caducidad:</span>
		<div class="flex items-center gap-1.5 font-mono">
			<span>0%</span>
			<div
				class="w-32 h-2.5 rounded border border-brand-border"
				style="background: linear-gradient(to right, #eae7e1 0%, #f59e0b 25%, #f43f5e 65%, #9f1239 100%)"
			></div>
			<span>35%+</span>
		</div>
	</div>
</div>
