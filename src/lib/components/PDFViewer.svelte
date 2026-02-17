<!--
	PDFViewer Component
	Displays PDF pages with navigation
	Uses secure rendering via PDF.js
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { pdfStore, pageCount } from '$lib/stores/pdf.store';
	import { renderPDFPage } from '$lib/services/pdf-renderer';

	let canvas: HTMLCanvasElement;
	let scale = $state(1.5);
	let isRendering = $state(false);
	let hasRendered = $state(false);

	const renderCurrentPage = async () => {
		if (!$pdfStore.arrayBuffer || !canvas) return;

		isRendering = true;
		try {
			await renderPDFPage($pdfStore.arrayBuffer, $pdfStore.currentPage, canvas, scale);
			hasRendered = true;
		} catch (error) {
			pdfStore.setError(
				error instanceof Error ? error.message : 'Erreur lors du rendu'
			);
		} finally {
			isRendering = false;
		}
	};

	const nextPage = () => {
		if ($pdfStore.currentPage < $pageCount) {
			pdfStore.setCurrentPage($pdfStore.currentPage + 1);
			renderCurrentPage();
		}
	};

	const prevPage = () => {
		if ($pdfStore.currentPage > 1) {
			pdfStore.setCurrentPage($pdfStore.currentPage - 1);
			renderCurrentPage();
		}
	};

	const zoomIn = () => {
		scale = Math.min(scale + 0.25, 3);
		renderCurrentPage();
	};

	const zoomOut = () => {
		scale = Math.max(scale - 0.25, 0.5);
		renderCurrentPage();
	};

	onMount(() => {
		if ($pdfStore.arrayBuffer && canvas && !hasRendered) {
			renderCurrentPage();
		}
	});
</script>

<div class="pdf-viewer">
	<div class="viewer-toolbar">
		<div class="toolbar-section">
			<button onclick={zoomOut} disabled={scale <= 0.5} class="toolbar-btn" aria-label="Dézoomer">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
				</svg>
			</button>

			<span class="zoom-level">{Math.round(scale * 100)}%</span>

			<button onclick={zoomIn} disabled={scale >= 3} class="toolbar-btn" aria-label="Zoomer">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
				</svg>
			</button>
		</div>

		<div class="toolbar-section page-controls">
			<button onclick={prevPage} disabled={$pdfStore.currentPage <= 1} class="toolbar-btn" aria-label="Page précédente">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
			</button>

			<span class="page-info">
				Page {$pdfStore.currentPage} / {$pageCount}
			</span>

			<button onclick={nextPage} disabled={$pdfStore.currentPage >= $pageCount} class="toolbar-btn" aria-label="Page suivante">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
			</button>
		</div>
	</div>

	<div class="canvas-container">
		{#if isRendering}
			<div class="loading-overlay">
				<div class="spinner"></div>
			</div>
		{/if}
		<canvas bind:this={canvas}></canvas>
	</div>
</div>

<style>
	.pdf-viewer {
		width: 100%;
		background: white;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.viewer-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f0fdf4;
		border-bottom: 2px solid #059669;
	}

	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toolbar-btn {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: #059669;
		color: white;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toolbar-btn:hover:not(:disabled) {
		background: #047857;
		transform: scale(1.1);
	}

	.toolbar-btn:disabled {
		background: #d1d5db;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.toolbar-btn svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	.zoom-level,
	.page-info {
		font-weight: 600;
		color: #065f46;
		min-width: 4rem;
		text-align: center;
	}

	.canvas-container {
		position: relative;
		overflow: auto;
		max-height: 70vh;
		display: flex;
		justify-content: center;
		padding: 2rem;
		background: #f9fafb;
	}

	canvas {
		max-width: 100%;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.spinner {
		width: 3rem;
		height: 3rem;
		border: 4px solid #d1fae5;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
