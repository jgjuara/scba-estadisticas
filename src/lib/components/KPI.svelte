<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		trend?: {
			value: number | string;
			direction: 'up' | 'down' | 'neutral';
			label?: string;
		};
		icon?: Component;
		variant?: 'indigo' | 'success' | 'danger' | 'warning' | 'default';
	}

	let {
		title,
		value,
		subtitle = '',
		trend,
		icon: Icon,
		variant = 'default'
	}: Props = $props();

	const variantClasses = {
		indigo: 'border-brand-indigo/20 shadow-[0_4px_20px_-10px_rgba(99,102,241,0.15)]',
		success: 'border-brand-success/20 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.15)]',
		danger: 'border-brand-danger/20 shadow-[0_4px_20px_-10px_rgba(244,63,94,0.15)]',
		warning: 'border-brand-warning/20 shadow-[0_4px_20px_-10px_rgba(245,158,11,0.15)]',
		default: 'border-brand-border'
	};

	const iconWrapperClasses = {
		indigo: 'bg-brand-indigo/10 text-brand-indigo',
		success: 'bg-brand-success/10 text-brand-success',
		danger: 'bg-brand-danger/10 text-brand-danger',
		warning: 'bg-brand-warning/10 text-brand-warning',
		default: 'bg-brand-muted/10 text-brand-text-muted'
	};

	const trendColorClasses = {
		up: 'text-brand-success',
		down: 'text-brand-danger',
		neutral: 'text-brand-text-muted'
	};
</script>

<div class="glass-panel-interactive p-6 rounded-2xl border flex flex-col justify-between {variantClasses[variant]}">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
				{title}
			</p>
			<h3 class="text-3xl font-bold mt-2 text-brand-text leading-none tracking-tight">
				{value}
			</h3>
		</div>
		{#if Icon}
			<div class="p-3 rounded-xl border border-brand-border {iconWrapperClasses[variant]}">
				<Icon class="w-5 h-5" />
			</div>
		{/if}
	</div>

	{#if trend || subtitle}
		<div class="mt-4 flex items-center gap-2 text-sm">
			{#if trend}
				<span class="font-semibold {trendColorClasses[trend.direction]}">
					{trend.value}
				</span>
				{#if trend.label}
					<span class="text-brand-text-muted text-xs">
						{trend.label}
					</span>
				{/if}
			{:else if subtitle}
				<span class="text-brand-text-muted text-xs leading-normal">
					{subtitle}
				</span>
			{/if}
		</div>
	{/if}
</div>
