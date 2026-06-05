<script lang="ts">
	import { Calendar } from '@lucide/svelte';

	interface Props {
		years: number[];
		selectedRange: [number, number];
	}

	let { years = [], selectedRange = $bindable() }: Props = $props();

	let containerElement: HTMLDivElement;
	let activeDrag: 'start' | 'end' | null = $state(null);

	const totalSteps = $derived(years.length > 1 ? years.length - 1 : 1);

	// Helper to find the index of a year in the years array
	const getIdx = (year: number) => {
		if (years.length === 0) return 0;
		const idx = years.indexOf(year);
		if (idx !== -1) return idx;
		if (year <= years[0]) return 0;
		if (year >= years[years.length - 1]) return years.length - 1;
		
		let closestIdx = 0;
		let minDiff = Math.abs(years[0] - year);
		for (let i = 1; i < years.length; i++) {
			const diff = Math.abs(years[i] - year);
			if (diff < minDiff) {
				minDiff = diff;
				closestIdx = i;
			}
		}
		return closestIdx;
	};

	let startIdx = $derived(getIdx(selectedRange[0]));
	let endIdx = $derived(getIdx(selectedRange[1]));

	// Compute percentages for the visual track
	const leftPercent = $derived(totalSteps > 0 ? (startIdx / totalSteps) * 100 : 0);
	const rightPercent = $derived(totalSteps > 0 ? 100 - (endIdx / totalSteps) * 100 : 0);

	function updateFromPosition(clientX: number, target: 'start' | 'end') {
		if (!containerElement || years.length === 0) return;
		const rect = containerElement.getBoundingClientRect();
		const width = rect.width;
		const x = Math.max(0, Math.min(clientX - rect.left, width));
		const percent = x / width;
		const stepIndex = Math.round(percent * totalSteps);
		
		let currentTarget = target;
		if (target === 'end' && stepIndex < startIdx) {
			currentTarget = 'start';
			activeDrag = 'start';
		} else if (target === 'start' && stepIndex > endIdx) {
			currentTarget = 'end';
			activeDrag = 'end';
		}

		if (currentTarget === 'start') {
			const newStart = Math.min(stepIndex, endIdx);
			selectedRange[0] = years[newStart];
		} else {
			const newEnd = Math.max(stepIndex, startIdx);
			selectedRange[1] = years[newEnd];
		}
	}

	function handleMouseDown(e: MouseEvent, target: 'start' | 'end') {
		activeDrag = target;
		e.preventDefault();
		
		const onMouseMove = (moveEvent: MouseEvent) => {
			if (activeDrag) {
				updateFromPosition(moveEvent.clientX, activeDrag);
			}
		};

		const onMouseUp = () => {
			activeDrag = null;
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function handleTouchStart(e: TouchEvent, target: 'start' | 'end') {
		activeDrag = target;
		
		const onTouchMove = (moveEvent: TouchEvent) => {
			if (activeDrag && moveEvent.touches.length > 0) {
				updateFromPosition(moveEvent.touches[0].clientX, activeDrag);
			}
		};

		const onTouchEnd = () => {
			activeDrag = null;
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', onTouchEnd);
		};

		window.addEventListener('touchmove', onTouchMove);
		window.addEventListener('touchend', onTouchEnd);
	}

	function handleTrackClick(e: MouseEvent) {
		if (!containerElement || years.length === 0) return;
		if ((e.target as HTMLElement).closest('.slider-handle')) return;

		const rect = containerElement.getBoundingClientRect();
		const width = rect.width;
		const x = Math.max(0, Math.min(e.clientX - rect.left, width));
		const percent = x / width;
		const stepIndex = Math.round(percent * totalSteps);

		const distToStart = Math.abs(stepIndex - startIdx);
		const distToEnd = Math.abs(stepIndex - endIdx);

		if (distToStart < distToEnd) {
			selectedRange[0] = years[Math.min(stepIndex, endIdx)];
		} else if (distToStart > distToEnd) {
			selectedRange[1] = years[Math.max(stepIndex, startIdx)];
		} else {
			if (stepIndex < startIdx) {
				selectedRange[0] = years[stepIndex];
			} else {
				selectedRange[1] = years[stepIndex];
			}
		}
	}
</script>

<div class="glass-panel p-5 rounded-2xl border border-brand-border flex flex-col md:flex-row gap-6 items-center justify-between w-full">
	<div class="flex items-center gap-3 w-full md:w-auto">
		<div class="p-2 bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo rounded-xl">
			<Calendar class="w-4 h-4" />
		</div>
		<div>
			<h4 class="text-sm font-bold text-brand-text">Filtro Temporal</h4>
			<p class="text-xs text-brand-text-muted">Ajusta el rango de años para el análisis</p>
		</div>
	</div>

	<!-- Slider Container -->
	<div class="flex flex-col gap-3 w-full md:max-w-md flex-1 px-2">
		<!-- Selected Range Badge -->
		<div class="flex justify-between items-center text-xs">
			<span class="text-brand-text-muted font-medium">Rango seleccionado:</span>
			<span class="font-bold text-brand-indigo font-mono bg-brand-indigo/10 px-2 py-0.5 rounded-lg border border-brand-indigo/20">
				{#if selectedRange[0] === selectedRange[1]}
					{selectedRange[0]}
				{:else}
					{selectedRange[0]} - {selectedRange[1]}
				{/if}
			</span>
		</div>

		<!-- Slider Widget -->
		<div class="relative py-4 select-none">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div 
				bind:this={containerElement}
				onclick={handleTrackClick}
				class="relative h-2 w-full bg-stone-200 rounded-full cursor-pointer"
			>
				<!-- Active range fill -->
				<div 
					class="absolute h-full bg-brand-indigo rounded-full transition-all duration-75"
					style="left: {leftPercent}%; right: {rightPercent}%;"
				></div>

				<!-- Step markers (ticks) -->
				{#each years as year, idx}
					{@const tickPercent = totalSteps > 0 ? (idx / totalSteps) * 100 : 0}
					{@const isActive = idx >= startIdx && idx <= endIdx}
					<div 
						class="absolute w-1.5 h-1.5 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 transition-colors {isActive ? 'bg-brand-indigo' : 'bg-stone-400'}"
						style="left: {tickPercent}%;"
					></div>
				{/each}

				<!-- Left Handle -->
				<button
					type="button"
					onmousedown={(e) => handleMouseDown(e, 'start')}
					ontouchstart={(e) => handleTouchStart(e, 'start')}
					class="slider-handle absolute w-5 h-5 rounded-full bg-white border-2 border-brand-indigo shadow-md -translate-y-1/2 -translate-x-1/2 top-1/2 cursor-grab active:cursor-grabbing focus:outline-none hover:scale-110 transition-transform flex items-center justify-center"
					style="left: {leftPercent}%; z-index: {activeDrag === 'start' ? 30 : 20};"
					aria-label="Año de inicio"
				>
					<span class="w-1.5 h-1.5 bg-brand-indigo rounded-full"></span>
				</button>

				<!-- Right Handle -->
				<button
					type="button"
					onmousedown={(e) => handleMouseDown(e, 'end')}
					ontouchstart={(e) => handleTouchStart(e, 'end')}
					class="slider-handle absolute w-5 h-5 rounded-full bg-white border-2 border-brand-indigo shadow-md -translate-y-1/2 -translate-x-1/2 top-1/2 cursor-grab active:cursor-grabbing focus:outline-none hover:scale-110 transition-transform flex items-center justify-center"
					style="left: {100 - rightPercent}%; z-index: {activeDrag === 'end' ? 30 : 20};"
					aria-label="Año de fin"
				>
					<span class="w-1.5 h-1.5 bg-brand-indigo rounded-full"></span>
				</button>
			</div>

			<!-- Labels under the track -->
			<div class="relative w-full h-4 mt-2">
				{#each years as year, idx}
					{@const labelPercent = totalSteps > 0 ? (idx / totalSteps) * 100 : 0}
					{@const isSelected = idx === startIdx || idx === endIdx}
					<span 
						class="absolute -translate-x-1/2 text-[10px] font-mono transition-all {isSelected ? 'text-brand-indigo font-bold scale-110' : 'text-brand-text-muted opacity-60'}"
						style="left: {labelPercent}%;"
					>
						{year}
					</span>
				{/each}
			</div>
		</div>
	</div>
</div>
