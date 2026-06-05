<script lang="ts">
	import * as d3 from 'd3';

	export interface ScatterPoint {
		x: number;
		y: number;
		size: number;
		label: string;
		color?: string;
	}

	interface Props {
		data: ScatterPoint[];
		title?: string;
		xLabel?: string;
		yLabel?: string;
		formatX?: (val: number) => string;
		formatY?: (val: number) => string;
		formatSize?: (val: number) => string;
	}

	let {
		data,
		title = '',
		xLabel = '',
		yLabel = '',
		formatX = (v) => v.toLocaleString('es-AR'),
		formatY = (v) => v.toLocaleString('es-AR'),
		formatSize = (v) => v.toLocaleString('es-AR')
	}: Props = $props();

	let width = $state(600);
	let height = $state(340);
	const padding = { top: 30, right: 30, bottom: 45, left: 65 };

	// Tooltip state
	let activePoint = $state<{
		screenX: number;
		screenY: number;
		point: ScatterPoint;
	} | null>(null);

	// Scales
	const xScale = $derived.by(() => {
		const xExtent = d3.extent(data, (d) => d.x) as [number, number];
		const minVal = xExtent[0] !== undefined ? xExtent[0] : 0;
		const maxVal = xExtent[1] !== undefined ? xExtent[1] : 100;
		
		// Buffer 5%
		const buffer = (maxVal - minVal) * 0.05 || 1;
		return d3.scaleLinear()
			.domain([Math.max(0, minVal - buffer), maxVal + buffer])
			.range([padding.left, width - padding.right]);
	});

	const yScale = $derived.by(() => {
		const yExtent = d3.extent(data, (d) => d.y) as [number, number];
		const minVal = yExtent[0] !== undefined ? yExtent[0] : 0;
		const maxVal = yExtent[1] !== undefined ? yExtent[1] : 100;

		const buffer = (maxVal - minVal) * 0.05 || 1;
		return d3.scaleLinear()
			.domain([Math.max(0, minVal - buffer), maxVal + buffer])
			.range([height - padding.bottom, padding.top]);
	});

	// Size scale (scaleSqrt maps area to value)
	const sizeScale = $derived.by(() => {
		const maxSize = d3.max(data, (d) => d.size) || 1000;
		return d3.scaleSqrt()
			.domain([0, maxSize])
			.range([4, 24]); // Circle radius range
	});

	// Ticks
	const xTicks = $derived(xScale.ticks(5));
	const yTicks = $derived(yScale.ticks(5));

	function handlePointHover(event: MouseEvent, point: ScatterPoint) {
		const svgElement = (event.currentTarget as SVGCircleElement).parentElement as any;
		const rect = svgElement.getBoundingClientRect();
		
		const px = xScale(point.x);
		const py = yScale(point.y);

		activePoint = {
			screenX: px,
			screenY: py,
			point
		};
	}

	function handlePointLeave() {
		activePoint = null;
	}
</script>

<div class="flex flex-col w-full h-full relative" bind:clientWidth={width}>
	{#if title}
		<h5 class="text-sm font-bold text-brand-text mb-3 px-2">{title}</h5>
	{/if}

	<!-- Scatter SVG -->
	<div class="relative flex-1 select-none">
		<svg {width} {height} class="overflow-visible">
			<!-- Gridlines Horizontal -->
			{#each yTicks as tick}
				<line
					x1={padding.left}
					y1={yScale(tick)}
					x2={width - padding.right}
					y2={yScale(tick)}
					stroke="var(--color-brand-border)"
					stroke-width="1"
					stroke-dasharray="3 3"
				/>
				<text
					x={padding.left - 10}
					y={yScale(tick) + 4}
					text-anchor="end"
					class="text-[10px] fill-brand-text-muted font-mono"
				>
					{formatY(tick)}
				</text>
			{/each}

			<!-- Gridlines Vertical & X labels -->
			{#each xTicks as tick}
				<line
					x1={xScale(tick)}
					y1={padding.top}
					x2={xScale(tick)}
					y2={height - padding.bottom}
					stroke="var(--color-brand-border)"
					stroke-width="1"
					stroke-dasharray="3 3"
				/>
				<text
					x={xScale(tick)}
					y={height - padding.bottom + 20}
					text-anchor="middle"
					class="text-[10px] fill-brand-text-muted font-mono"
				>
					{formatX(tick)}
				</text>
			{/each}

			<!-- Axes Labels -->
			{#if xLabel}
				<text
					x={(width - padding.left - padding.right) / 2 + padding.left}
					y={height - 5}
					text-anchor="middle"
					class="text-[10px] font-bold fill-brand-text-muted uppercase tracking-wider"
				>
					{xLabel}
				</text>
			{/if}

			{#if yLabel}
				<text
					transform="rotate(-90)"
					x={-((height - padding.top - padding.bottom) / 2 + padding.top)}
					y={15}
					text-anchor="middle"
					class="text-[10px] font-bold fill-brand-text-muted uppercase tracking-wider"
				>
					{yLabel}
				</text>
			{/if}

			<!-- Baseline and vertical line -->
			<line
				x1={padding.left}
				y1={height - padding.bottom}
				x2={width - padding.right}
				y2={height - padding.bottom}
				stroke="var(--color-brand-border)"
				stroke-width="1"
			/>
			<line
				x1={padding.left}
				y1={padding.top}
				x2={padding.left}
				y2={height - padding.bottom}
				stroke="var(--color-brand-border)"
				stroke-width="1"
			/>

			<!-- Scatter Dots -->
			{#each data as d}
				{@const radius = sizeScale(d.size)}
				<circle
					cx={xScale(d.x)}
					cy={yScale(d.y)}
					r={radius}
					fill={d.color || 'var(--color-brand-indigo)'}
					opacity="0.65"
					stroke="var(--color-brand-text)"
					stroke-width="1.5"
					class="transition-all duration-200 cursor-pointer hover:opacity-100"
					onmouseenter={(e) => handlePointHover(e, d)}
					onmouseleave={handlePointLeave}
				/>
			{/each}

			<!-- Highlight circle for active element -->
			{#if activePoint}
				<circle
					cx={activePoint.screenX}
					cy={activePoint.screenY}
					r={sizeScale(activePoint.point.size) + 2}
					fill="none"
					stroke="var(--color-brand-text)"
					stroke-width="2"
					stroke-dasharray="2 2"
					class="pointer-events-none"
				/>
			{/if}
		</svg>

		<!-- Tooltip markup -->
		{#if activePoint}
			<div
				class="absolute z-50 glass-panel px-3 py-3 rounded-2xl border border-brand-border pointer-events-none shadow-2xl flex flex-col gap-1 min-w-[220px]"
				style="left: {activePoint.screenX + 15}px; top: {activePoint.screenY - 15}px; transform: translateY(-50%);"
			>
				<span class="text-xs font-bold text-brand-text border-b border-brand-border pb-1 mb-1 block">
					{activePoint.point.label}
				</span>
				
				<div class="flex items-center justify-between text-xs">
					<span class="text-brand-text-muted">{xLabel || 'Eje X'}:</span>
					<span class="font-mono font-bold text-brand-text">{formatX(activePoint.point.x)}</span>
				</div>
				
				<div class="flex items-center justify-between text-xs">
					<span class="text-brand-text-muted">{yLabel || 'Eje Y'}:</span>
					<span class="font-mono font-bold text-brand-text">{formatY(activePoint.point.y)}</span>
				</div>
				
				<div class="flex items-center justify-between text-xs border-t border-brand-border pt-1 mt-1">
					<span class="text-brand-text-muted font-semibold">Resueltas (Volumen):</span>
					<span class="font-mono font-bold text-brand-text">{formatSize(activePoint.point.size)}</span>
				</div>
			</div>
		{/if}
	</div>
</div>
