<script lang="ts">
	import * as d3 from 'd3';

	interface Props {
		data: Array<{
			anio: number;
			[key: string]: number;
		}>;
		keys: string[]; // List of categories to stack, e.g. ['Sentencia', 'Conciliación', ...]
		colors: { [key: string]: string }; // Map of category -> color
		title?: string;
		formatY?: (val: number) => string;
	}

	let {
		data,
		keys,
		colors,
		title = '',
		formatY = (v) => v.toLocaleString('es-AR')
	}: Props = $props();

	let width = $state(600);
	let height = $state(320);
	const padding = { top: 30, right: 30, bottom: 40, left: 65 };

	// Tooltip state
	let activeIndex = $state<number | null>(null);
	let tooltipData = $state<{
		anio: number;
		screenX: number;
		screenY: number;
		breakdown: Array<{ name: string; value: number; color: string }>;
		total: number;
	} | null>(null);

	// Sort data by year to make sure it's sequential
	const sortedData = $derived([...data].sort((a, b) => a.anio - b.anio));

	// Perform stacking calculation
	const stackedData = $derived.by(() => {
		const stack = d3.stack<any>().keys(keys);
		return stack(sortedData);
	});

	// Scales
	const xScale = $derived.by(() => {
		const anios = sortedData.map((d) => d.anio);
		const xDomain = d3.extent(anios) as [number, number];
		return d3.scaleLinear()
			.domain(xDomain[0] !== undefined ? xDomain : [2017, 2025])
			.range([padding.left, width - padding.right]);
	});

	const yScale = $derived.by(() => {
		// Max total resueltas is the max top of stack
		const maxVal = d3.max(sortedData, (d) => {
			return keys.reduce((sum, key) => sum + (d[key] || 0), 0);
		}) || 100;

		return d3.scaleLinear()
			.domain([0, maxVal * 1.05]) // 5% headroom
			.range([height - padding.bottom, padding.top]);
	});

	// Area generator
	const areaGenerator = $derived(
		d3.area<any>()
			.x((d) => xScale(d.data.anio))
			.y0((d) => yScale(d[0]))
			.y1((d) => yScale(d[1]))
			.curve(d3.curveMonotoneX)
	);

	const yTicks = $derived(yScale.ticks(5));
	const aniosList = $derived(sortedData.map((d) => d.anio));

	function handleMouseMove(event: MouseEvent) {
		const svgElement = event.currentTarget as SVGSVGElement;
		const rect = svgElement.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;

		if (aniosList.length === 0) return;

		// Find the closest year
		let closestIndex = 0;
		let minDiff = Math.abs(xScale(aniosList[0]) - mouseX);

		for (let i = 0; i < aniosList.length; i++) {
			const diff = Math.abs(xScale(aniosList[i]) - mouseX);
			if (diff < minDiff) {
				minDiff = diff;
				closestIndex = i;
			}
		}

		activeIndex = closestIndex;
		const activeYear = aniosList[closestIndex];
		const yearData = sortedData[closestIndex];

		if (yearData) {
			const breakdown = keys
				.map((key) => ({
					name: key,
					value: yearData[key] || 0,
					color: colors[key] || '#ccc'
				}))
				.reverse(); // Reverse so top elements appear first

			const total = keys.reduce((sum, key) => sum + (yearData[key] || 0), 0);
			const xPos = xScale(activeYear);

			tooltipData = {
				anio: activeYear,
				screenX: xPos,
				screenY: yScale(total / 2), // Position tooltip vertically centered
				breakdown,
				total
			};
		}
	}

	function handleMouseLeave() {
		activeIndex = null;
		tooltipData = null;
	}
</script>

<div class="flex flex-col w-full h-full relative" bind:clientWidth={width}>
	{#if title}
		<h5 class="text-sm font-bold text-brand-text mb-3 px-2">{title}</h5>
	{/if}

	<!-- Legend -->
	<div class="flex flex-wrap gap-x-4 gap-y-2 px-2 mb-3 text-xs">
		{#each keys as key}
			<div class="flex items-center gap-1.5">
				<span class="w-3 h-3 rounded border border-brand-border" style="background-color: {colors[key]}"></span>
				<span class="text-brand-text-muted">{key}</span>
			</div>
		{/each}
	</div>

	<!-- Chart Area -->
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
				<text
					x={padding.left - 10}
					y={yScale(tick) + 4}
					text-anchor="end"
					class="text-[10px] fill-brand-text-muted font-mono"
				>
					{formatY(tick)}
				</text>
			{/each}

			<!-- X Axis labels -->
			{#each aniosList as anio}
				<text
					x={xScale(anio)}
					y={height - padding.bottom + 20}
					text-anchor="middle"
					class="text-[10px] fill-brand-text-muted font-mono"
				>
					{anio}
				</text>
				<line
					x1={xScale(anio)}
					y1={height - padding.bottom}
					x2={xScale(anio)}
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

			<!-- Stacked Areas -->
			{#each stackedData as series}
				<path
					d={areaGenerator(series)}
					fill={colors[series.key] || '#ccc'}
					opacity="0.8"
					stroke="rgba(7, 10, 19, 0.4)"
					stroke-width="1.5"
					class="transition-all duration-300 hover:opacity-95"
				/>
			{/each}

			<!-- Guideline & Points on Hover -->
			{#if tooltipData}
				<line
					x1={tooltipData.screenX}
					y1={padding.top}
					x2={tooltipData.screenX}
					y2={height - padding.bottom}
					stroke="var(--color-brand-border)"
					stroke-width="1.5"
					stroke-dasharray="2 2"
				/>
				
				<!-- Render little stacked white dots at junctions -->
				{#each keys as key}
					{@const series = stackedData.find(s => s.key === key)}
					{#if series}
						{@const p = series[activeIndex || 0]}
						{#if p}
							<circle
								cx={xScale(p.data.anio)}
								cy={yScale(p[1])}
								r="3.5"
								fill="var(--color-brand-text)"
								stroke={colors[key]}
								stroke-width="1.5"
							/>
						{/if}
					{/if}
				{/each}
			{/if}
		</svg>

		<!-- Tooltip Panel -->
		{#if tooltipData}
			<div
				class="absolute z-50 glass-panel px-3 py-3 rounded-2xl border border-brand-border pointer-events-none shadow-2xl flex flex-col gap-2 min-w-[200px]"
				style="left: {tooltipData.screenX + 15}px; top: {height / 2}px; transform: translateY(-50%);"
			>
				<div class="flex justify-between items-center border-b border-brand-border pb-1.5">
					<span class="text-xs font-bold text-brand-text">Composición {tooltipData.anio}</span>
					<span class="text-[10px] font-mono text-brand-text-muted">Total: {formatY(tooltipData.total)}</span>
				</div>
				<div class="flex flex-col gap-1.5">
					{#each tooltipData.breakdown as cat}
						{#if cat.value > 0}
							<div class="flex items-center justify-between text-xs">
								<div class="flex items-center gap-1.5">
									<span class="w-2.5 h-2.5 rounded-sm" style="background-color: {cat.color}"></span>
									<span class="text-brand-text-muted">{cat.name}</span>
								</div>
								<span class="font-mono font-bold text-brand-text">
									{formatY(cat.value)}
									<span class="text-[10px] text-brand-text-muted font-normal ml-0.5">
										({((cat.value / tooltipData.total) * 100).toFixed(0)}%)
									</span>
								</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
