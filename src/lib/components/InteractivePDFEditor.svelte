<!--
	Interactive PDF Editor Component
	Allows clicking on text to edit it in place
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { pdfStore, pageCount } from '$lib/stores/pdf.store';
	import { renderPDFPage } from '$lib/services/pdf-renderer';
	import { extractTextWithPositions, type TextItem } from '$lib/services/pdf-text-extractor';
	import type { PDFEditOperation } from '$lib/types/pdf.types';

	let canvas: HTMLCanvasElement;
	let textLayer: HTMLDivElement;
	let scale = $state(1.5);
	let isRendering = $state(false);
	let textItems = $state<TextItem[]>([]);
	let selectedText: TextItem | null = $state(null);
	let editingText = $state('');
	let showEditModal = $state(false);
	let eraserColor = $state('#ffffff');
	let pageHeight = $state(0); // Store PDF page height for coordinate conversion

	const renderCurrentPage = async () => {
		if (!$pdfStore.arrayBuffer || !canvas) return;

		isRendering = true;
		textItems = [];

		try {
			// Render PDF to canvas
			await renderPDFPage($pdfStore.arrayBuffer, $pdfStore.currentPage, canvas, scale);

			// Extract text with positions (in PDF coordinates - bottom-up)
			const result = await extractTextWithPositions($pdfStore.arrayBuffer, $pdfStore.currentPage);

			// Store page height for coordinate conversion
			pageHeight = result.pageHeight;

			// Convert to canvas coordinates (top-down) for display
			textItems = result.items.map(item => ({
				...item,
				y: result.pageHeight - item.y // Convert to top-down for canvas display
			}));

		} catch (error) {
			pdfStore.setError(
				error instanceof Error ? error.message : 'Erreur lors du rendu'
			);
		} finally {
			isRendering = false;
		}
	};

	/** Sample the canvas background color around a text item (NOT on the text itself) */
	const sampleBackgroundColor = (item: TextItem): string => {
		if (!canvas) return '#ffffff';
		const ctx = canvas.getContext('2d');
		if (!ctx) return '#ffffff';

		const top    = Math.round((item.y - item.fontSize * 0.85) * scale);
		const bottom = Math.round((item.y + item.fontSize * 0.3)  * scale);
		const left   = Math.round(item.x * scale);
		const right  = Math.round((item.x + item.width) * scale);
		const lineH  = bottom - top;

		const samples: [number, number, number][] = [];

		const addPixel = (x: number, y: number) => {
			const cx = Math.max(0, Math.min(Math.round(x), canvas.width  - 1));
			const cy = Math.max(0, Math.min(Math.round(y), canvas.height - 1));
			const d = ctx.getImageData(cx, cy, 1, 1).data;
			samples.push([d[0], d[1], d[2]]);
		};

		// 1. Strips well outside the bounding box (2× line height away)
		const gap = lineH * 2;
		const step = Math.max(2, Math.round((right - left) / 16));
		for (let x = left; x <= right; x += step) {
			addPixel(x, top  - gap);
			addPixel(x, bottom + gap);
		}

		// 2. Scan the interior of the text row column by column,
		//    collect only LIGHT pixels (likely background between glyphs)
		for (let x = left; x <= right; x += step) {
			const cx = Math.max(0, Math.min(Math.round(x), canvas.width - 1));
			// scan vertically inside the row, collect each pixel
			for (let y = top; y <= bottom; y++) {
				const cy = Math.max(0, Math.min(y, canvas.height - 1));
				const d = ctx.getImageData(cx, cy, 1, 1).data;
				const brightness = (d[0] + d[1] + d[2]) / 3;
				// Only keep bright pixels (background, not ink)
				if (brightness > 160) samples.push([d[0], d[1], d[2]]);
			}
		}

		if (samples.length === 0) return '#ffffff';

		// Most-frequent color bucket (group by 8)
		const bucket = (v: number) => Math.round(v / 8) * 8;
		const freq = new Map<string, { count: number; r: number; g: number; b: number }>();
		for (const [r, g, b] of samples) {
			const key = `${bucket(r)},${bucket(g)},${bucket(b)}`;
			const prev = freq.get(key);
			if (prev) { prev.count++; }
			else { freq.set(key, { count: 1, r, g, b }); }
		}
		const best = [...freq.values()].sort((a, b) => b.count - a.count)[0];
		const hex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
		const sampled = `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;

		// Safety: if sampled color is too dark (likely text color, not background), fallback to white
		const brightness = (best.r * 299 + best.g * 587 + best.b * 114) / 1000;
		if (brightness < 80) return '#ffffff';

		return sampled;
	};

	const selectText = (item: TextItem) => {
		selectedText = item;
		editingText = item.text;
		eraserColor = sampleBackgroundColor(item);
		showEditModal = true;
	};

	const saveEdit = () => {
		if (!selectedText || !editingText.trim()) return;

		// Convert canvas coordinates back to PDF coordinates (bottom-up)
		const pdfY = pageHeight - selectedText.y;

		const operation: PDFEditOperation = {
			type: 'text-edit',
			pageNumber: $pdfStore.currentPage,
			originalText: selectedText.text,
			newText: editingText,
			position: { x: selectedText.x, y: pdfY },
			fontSize: selectedText.fontSize,
			eraserColor
		};

		pdfStore.addEditOperation(operation);

		// Update the displayed text for live preview
		const currentSelectedText = selectedText; // Capture for null safety
		if (currentSelectedText) {
			const index = textItems.findIndex(item =>
				item.text === currentSelectedText.text &&
				item.x === currentSelectedText.x &&
				item.y === currentSelectedText.y
			);

			if (index !== -1) {
				// Update the text item with new text and mark as modified
				textItems[index] = {
					...textItems[index],
					text: editingText
				};
			}
		}

		closeModal();
	};

	const closeModal = () => {
		showEditModal = false;
		selectedText = null;
		editingText = '';
		eraserColor = '#ffffff';
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
		if ($pdfStore.arrayBuffer && canvas) {
			renderCurrentPage();
		}
	});
</script>

<div class="pdf-editor">
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

		<div class="pdf-wrapper">
			<canvas bind:this={canvas}></canvas>

			<!-- Modification overlay layer - shows how the PDF will look -->
			<div class="modification-overlay">
				{#each $pdfStore.editOperations as operation}
					{#if operation.pageNumber === $pdfStore.currentPage && operation.position}
						{@const fontSize = operation.fontSize || 12}
						{@const displayY = pageHeight - operation.position.y}
						{@const opH = fontSize} <!-- height = fontSize (PDF.js height ≈ fontSize for most fonts) -->
						{@const estimatedWidth = Math.max(
							(operation.originalText?.length || 0) * fontSize * 0.6,
							operation.newText.length * fontSize * 0.6
						)}

						<!-- Rectangle covering original text with chosen color -->
						<div
							class="text-eraser"
							style="
								left: {operation.position.x * scale}px;
								top: {(displayY - opH) * scale}px;
								width: {(estimatedWidth + 4) * scale}px;
								height: {opH * scale}px;
								background: {operation.eraserColor ?? '#ffffff'};
							"
						></div>

						<!-- New text overlay -->
						{#if operation.type !== 'text-delete'}
							<div
								class="text-overlay"
								style="
									left: {operation.position.x * scale}px;
									top: {(displayY - opH) * scale}px;
									font-size: {fontSize * scale}px;
									line-height: 1;
								"
							>
								{operation.newText}
							</div>
						{/if}
					{/if}
				{/each}
			</div>

			<!-- Interactive text layer for editing -->
			<div class="text-layer" bind:this={textLayer}>
				{#each textItems as item}
					{@const itemH = (item.height > 0 ? item.height : item.fontSize) * scale}
					{@const itemTop = (item.y - (item.height > 0 ? item.height : item.fontSize * 0.85)) * scale}
					<button
						class="text-item"
						style="
							left: {item.x * scale}px;
							top: {itemTop}px;
							width: {item.width * scale}px;
							height: {itemH}px;
							font-size: {item.fontSize * scale}px;
						"
						onclick={() => selectText(item)}
						title="Cliquez pour éditer ce texte"
					>
						<span class="text-content">{item.text}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Edit Modal -->
{#if showEditModal && selectedText}
	<div class="modal-overlay" onclick={closeModal} role="presentation">
		<div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>Éditer le texte</h3>
				<button class="close-btn" onclick={closeModal} aria-label="Fermer">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label for="original-text">Texte original :</label>
					<input
						type="text"
						id="original-text"
						value={selectedText.text}
						disabled
						class="input-disabled"
					/>
				</div>

				<div class="form-group">
					<label for="new-text">Nouveau texte :</label>
					<input
						type="text"
						id="new-text"
						bind:value={editingText}
						class="input-text"
					/>
				</div>

				<div class="form-group">
					<label for="eraser-color">Couleur de masquage :</label>
					<div class="color-picker-row">
						<input
							type="color"
							id="eraser-color"
							bind:value={eraserColor}
							class="input-color"
						/>
						<span class="color-hint">
							Détectée automatiquement depuis le fond — ajustez si nécessaire
						</span>
					</div>
				</div>

				<div class="info-text">
					<svg class="info-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
					</svg>
					<p>Le texte original sera remplacé par le nouveau texte. Cliquez sur "Enregistrer le PDF" pour finaliser.</p>
				</div>
			</div>

			<div class="modal-footer">
				<button onclick={closeModal} class="btn btn-secondary">
					Annuler
				</button>
				<button onclick={saveEdit} class="btn btn-primary">
					Appliquer
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pdf-editor {
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

	.pdf-wrapper {
		position: relative;
		display: inline-block;
		line-height: 0; /* remove any inline gap below canvas */
	}

	canvas {
		display: block;
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
	}

	.text-layer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.modification-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 2;
	}

	.text-eraser {
		position: absolute;
		background: white;
		pointer-events: none;
		box-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
	}

	.text-overlay {
		position: absolute;
		color: #000000;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
		font-weight: 400;
		pointer-events: none;
		white-space: nowrap;
		transform-origin: left top;
		letter-spacing: -0.01em;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.text-item {
		position: absolute;
		background: transparent;
		border: 2px solid transparent;
		padding: 0;
		margin: 0;
		cursor: pointer;
		transition: all 0.2s;
		pointer-events: auto;
		color: transparent;
		overflow: hidden;
		font-family: inherit;
		line-height: 1;
		z-index: 3;
	}

	.text-item:hover {
		background: rgba(5, 150, 105, 0.15);
		border-color: #059669;
		box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
	}

	.text-content {
		opacity: 0;

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

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 1rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 2px solid #d1fae5;
	}

	.modal-header h3 {
		margin: 0;
		color: #065f46;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: #6b7280;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #059669;
	}

	.close-btn svg {
		width: 1.5rem;
		height: 1.5rem;
	}

	.modal-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 600;
		color: #047857;
		font-size: 0.875rem;
	}

	.input-text,
	.input-disabled {
		padding: 0.75rem;
		border: 2px solid #d1fae5;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-family: inherit;
	}

	.color-picker-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.input-color {
		width: 2.75rem;
		height: 2.75rem;
		border: 2px solid #d1fae5;
		border-radius: 0.5rem;
		cursor: pointer;
		padding: 0.1rem;
		background: white;
	}

	.color-hint {
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.input-text:focus {
		outline: none;
		border-color: #059669;
	}

	.input-disabled {
		background: #f3f4f6;
		color: #6b7280;
		cursor: not-allowed;
	}

	.info-text {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #f0fdf4;
		border-radius: 0.5rem;
		border: 1px solid #d1fae5;
	}

	.info-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #059669;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.info-text p {
		margin: 0;
		font-size: 0.875rem;
		color: #047857;
		line-height: 1.5;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 2px solid #d1fae5;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	.btn-primary {
		background: #059669;
		color: white;
	}

	.btn-primary:hover {
		background: #047857;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgb(5 150 105 / 0.3);
	}
</style>
