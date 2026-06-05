<script lang="ts">
	import * as d3 from 'd3';

	interface DataPoint {
		x: number;
		y: number;
		label?: string;
	}

	interface Series {
		name: string;
		data: DataPoint[];
		color: string;
	}

	interface Props {
		series: Series[];
		title?: string;
		formatY?: (val: number) => string;
		formatX?: (val: number) => string;
	}

	let {
		series,
		title = '',
		formatY = (v) => v.toLocaleString('es-AR'),
		formatX = (v) => v.toString()
	}: Props = $props();

	// Dimensions and padding
	let width = $state(600);
	let height = $state(320);
	const padding = { top: 30, right: 30, bottom: 40, left: 60 };

	// Tooltip state
	let activePoint = $state<{
		x: number;
		y: number;
		screenX: number;
		screenY: number;
		seriesName: string;
		color: string;
		dataPoint: DataPoint;
	} | null>(null);

	// Extract all X values to build grid
	const allXValues = $derived(
		Array.from(new Set(series.flatMap((s) => s.data.map((d) => d.x)))).sort((a, b) => a - b)
	);

	// Scales calculation
	const xScale = $derived.by(() => {
		const xDomain = d3.extent(allXValues) as [number, number];
		return d3.scaleLinear()
			.domain(xDomain[0] !== undefined ? xDomain : [2017, 2025])
			.range([padding.left, width - padding.right]);
	});

	const yScale = $derived.by(() => {
		const yMax = d3.max(series.flatMap((s) => s.data.map((d) => d.y))) || 100;
		// Add 10% headroom
		return d3.scaleLinear()
			.domain([0, yMax * 1.1])
			.range([height - padding.bottom, padding.top]);
	});

	// Y ticks for gridlines
	const yTicks = $derived(yScale.ticks(5));

	// Line generator
	const lineGenerator = $derived(
		d3.line<DataPoint>()
			.x((d) => xScale(d.x))
			.y((d) => yScale(d.y))
			.curve(d3.curveMonotoneX)
	);

	function handleMouseMove(event: MouseEvent) {
		const svgElement = event.currentTarget as SVGSVGElement;
		const rect = svgElement.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;

		// Find the closest X value in our dataset
		if (allXValues.length === 0) return;

		let closestX = allXValues[0];
		let minDiff = Math.abs(xScale(closestX) - mouseX);

		for (const x of allXValues) {
			const diff = Math.abs(xScale(x) - mouseX);
			if (diff < minDiff) {
				minDiff = diff;
				closestX = x;
			}
		}

		// Find the closest series point at that X value
		let closestPoint: typeof activePoint = null;
		let closestDist = Infinity;

		const mouseY = event.clientY - rect.top;

		for (const s of series) {
			const point = s.data.find((d) => d.x === closestX);
			if (!point) continue;

			const px = xScale(point.x);
			const py = yScale(point.y);
			const dist = Math.hypot(px - mouseX, py - mouseY);

			// We display the point closest to the mouse vertically at the closest X
			if (dist < closestDist) {
				closestDist = dist;
				closestPoint = {
					x: px,
					y: py,
					screenX: px + rect.left - window.scrollX,
					screenY: py + rect.top - window.scrollY,
					seriesName: s.name,
					color: s.color,
					dataPoint: point
				};
			}
		}

		// Only show tooltip if mouse is reasonably close to the point
		if (closestPoint && closestDist < 100) {
			activePoint = closestPoint;
		} else {
			activePoint = null;
		}
	}

	function handleMouseLeave() {
		activePoint = null;
	}
</script>

<div class="flex flex-col w-full h-full relative" bind:clientWidth={width}>
	{#if title}
		<h5 class="text-sm font-bold text-brand-text mb-3 px-2">{title}</h5>
	{/if}

	<!-- Legend -->
	<div class="flex flex-wrap gap-4 px-2 mb-3 text-xs">
		{#each series as s}
			<div class="flex items-center gap-1.5">
				<span class="w-3 h-1 rounded" style="background-color: {s.color}"></span>
				<span class="text-brand-text-muted">{s.name}</span>
			</div>
		{/each}
	</div>

	<!-- SVG Chart -->
	<div class="relative flex-1 select-none">
		<svg
			{width}
			{height}
			class="overflow-visible cursor-crosshair"
			onmousemove={handleMouseMove}
			onmouseleave={handleMouseLeave}
		>
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
				<!-- Y labels -->
				<text
					x={padding.left - 10}
					y={yScale(tick) + 4}
					text-anchor="end"
					class="text-[10px] fill-brand-text-muted font-mono"
				>
					{formatY(tick)}
				</text>
			{/each}

			<!-- X labels (years) -->
			{#each allXValues as x}
				<text
					x={xScale(x)}
					y={height - padding.bottom + 20}
					text-anchor="middle"
					class="text-[10px] fill-brand-text-muted font-mono"
				>
					{formatX(x)}
				</text>
				<!-- Little axis ticks -->
				<line
					x1={xScale(x)}
					y1={height - padding.bottom}
					x2={xScale(x)}
					y2={height - padding.bottom + 5}
					stroke="var(--color-brand-border)"
					stroke-width="1"
				/>
			{/each}

			<!-- Baseline -->
			<line
				x1={padding.left}
				y1={height - padding.bottom}
				x2={width - padding.right}
				y2={height - padding.bottom}
				stroke="var(--color-brand-border)"
				stroke-width="1"
			/>

			<!-- Paths for each Series -->
			{#each series as s}
				{#if s.data.length > 0}
					<!-- Line Path -->
					<path
						d={lineGenerator(s.data)}
						fill="none"
						stroke={s.color}
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="transition-all duration-300"
					/>
					
					<!-- Glow effect path (subtle) -->
					<path
						d={lineGenerator(s.data)}
						fill="none"
						stroke={s.color}
						stroke-width="6"
						stroke-linecap="round"
						stroke-linejoin="round"
						opacity="0.15"
					/>

					<!-- Data Points -->
					{#each s.data as point}
						<circle
							cx={xScale(point.x)}
							cy={yScale(point.y)}
							r="4"
							fill="var(--color-brand-bg)"
							stroke={s.color}
							stroke-width="2"
							class="transition-all"
						/>
					{/each}
				{/if}
			{/each}

			<!-- Hover interaction guideline -->
			{#if activePoint}
				<line
					x1={activePoint.x}
					y1={padding.top}
					x2={activePoint.x}
					y2={height - padding.bottom}
					stroke="var(--color-brand-border)"
					stroke-width="1.5"
					stroke-dasharray="2 2"
				/>
				<circle
					cx={activePoint.x}
					cy={activePoint.y}
					r="6"
					fill={activePoint.color}
					stroke="var(--color-brand-bg)"
					stroke-width="2"
					class="shadow-sm"
				/>
			{/if}
		</svg>

		<!-- HTML Hover Tooltip (absolute position relative to body/viewport) -->
		{#if activePoint}
			<div
				class="absolute z-50 glass-panel px-3 py-2.5 rounded-xl border border-brand-border pointer-events-none shadow-xl flex flex-col gap-0.5 text-xs"
				style="left: {activePoint.x + 15}px; top: {activePoint.y - 45}px; transform: translateY(-50%);"
			>
				<span class="text-[10px] text-brand-text-muted font-bold tracking-wide uppercase">
					{formatX(activePoint.dataPoint.x)}
				</span>
				<div class="flex items-center gap-1.5 mt-0.5">
					<span class="w-2.5 h-2.5 rounded-full" style="background-color: {activePoint.color}"></span>
					<span class="text-brand-text font-semibold">{activePoint.seriesName}</span>
				</div>
				<span class="font-mono text-sm text-brand-text mt-1 font-bold">
					{formatY(activePoint.dataPoint.y)}
				</span>
			</div>
		{/if}
	</div>
</div>
