<!--
	TextEditor Component
	Allows adding text to PDF pages
	Simplified interface for MVP
-->
<script lang="ts">
	import { pdfStore } from '$lib/stores/pdf.store';
	import { loadPDF, editPDFText, savePDF, downloadPDF } from '$lib/services/pdf-processor';
	import type { PDFEditOperation } from '$lib/types/pdf.types';

	let newText = $state('');
	let xPosition = $state(100);
	let yPosition = $state(100);
	let fontSize = $state(12);
	let isSaving = $state(false);

	const addText = () => {
		if (!newText.trim()) {
			alert('Veuillez entrer du texte');
			return;
		}

		const operation: PDFEditOperation = {
			type: 'text-add',
			pageNumber: $pdfStore.currentPage,
			newText: newText,
			position: { x: xPosition, y: yPosition },
			fontSize: fontSize
		};

		pdfStore.addEditOperation(operation);

		// Reset form
		newText = '';
		alert('Texte ajouté ! Cliquez sur "Enregistrer" pour finaliser les modifications.');
	};

	const saveChanges = async () => {
		if (!$pdfStore.arrayBuffer || $pdfStore.editOperations.length === 0) {
			alert('Aucune modification à enregistrer');
			return;
		}

		isSaving = true;

		try {
			// IMPORTANT: Reload PDF from arrayBuffer to get a fresh document
			// pdf-lib requires a fresh document for each edit operation
			const freshDoc = await loadPDF($pdfStore.arrayBuffer);

			// Apply all edit operations to the fresh document
			const editedDoc = await editPDFText(freshDoc, $pdfStore.editOperations);

			// Save to bytes
			const pdfBytes = await savePDF(editedDoc);

			// Download
			const filename = $pdfStore.file?.name.replace('.pdf', '_edited.pdf') || 'edited.pdf';
			downloadPDF(pdfBytes, filename);

			alert('PDF modifié téléchargé avec succès !');

			// Clear operations
			pdfStore.clearEditOperations();

		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
			alert(
				`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
			);
		} finally {
			isSaving = false;
		}
	};

	const cancelEdits = () => {
		if (confirm('Annuler toutes les modifications ?')) {
			pdfStore.clearEditOperations();
			newText = '';
		}
	};
</script>

<div class="text-editor">
	<div class="editor-header">
		<h3>Modifications en cours</h3>
		<div class="operation-count">
			{$pdfStore.editOperations.length} modification(s)
		</div>
	</div>

	<div class="editor-info">
		<svg class="info-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
		</svg>
		<p>Cliquez sur n'importe quel texte dans le PDF pour le modifier. Les modifications s'affichent <strong>directement sur le document</strong> pour prévisualisation. Cliquez sur "Enregistrer" pour les appliquer définitivement.</p>
	</div>

	<div class="editor-actions">
		<button
			onclick={saveChanges}
			disabled={$pdfStore.editOperations.length === 0 || isSaving}
			class="btn btn-success"
		>
			<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
			</svg>
			{isSaving ? 'Enregistrement...' : 'Enregistrer le PDF'}
		</button>

		<button
			onclick={cancelEdits}
			disabled={$pdfStore.editOperations.length === 0}
			class="btn btn-danger"
		>
			<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
			Annuler
		</button>
	</div>

	{#if $pdfStore.editOperations.length > 0}
		<div class="operations-list">
			<h4>Modifications en attente:</h4>
			<ul>
				{#each $pdfStore.editOperations as op, i}
					<li class="operation-item">
						<div class="operation-info">
							<span class="operation-badge">Page {op.pageNumber}</span>
							<div class="operation-details">
								{#if op.type === 'text-edit'}
									<span class="text-old">"{op.originalText}"</span>
									<svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
									</svg>
									<span class="text-new">"{op.newText}"</span>
								{:else if op.type === 'text-add'}
									<span class="text-new">+ "{op.newText}"</span>
								{:else if op.type === 'text-delete'}
									<span class="text-old">- "{op.originalText || op.newText}"</span>
								{/if}
							</div>
						</div>
						<span class="operation-position">({op.position?.x.toFixed(0)}, {op.position?.y.toFixed(0)})</span>
					</li>
				{/each}
			</ul>
			<div class="preview-note">
				<svg class="info-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				<p><strong>Aperçu en temps réel :</strong> Vos modifications sont visibles directement sur le PDF ci-contre. Le document final ressemblera exactement à ce que vous voyez.</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.text-editor {
		background: white;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #d1fae5;
	}

	.editor-header h3 {
		color: #065f46;
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
	}

	.operation-count {
		background: #059669;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.editor-info {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #f0fdf4;
		border-radius: 0.5rem;
		border: 1px solid #d1fae5;
		margin-bottom: 1.5rem;
	}

	.info-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #059669;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.editor-info p {
		margin: 0;
		font-size: 0.875rem;
		color: #047857;
		line-height: 1.5;
	}


	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}


	.btn-success {
		background: #10b981;
		color: white;
		flex: 1;
	}

	.btn-success:hover:not(:disabled) {
		background: #059669;
		transform: scale(1.05);
	}

	.btn-danger {
		background: #ef4444;
		color: white;
		flex: 1;
	}

	.btn-danger:hover:not(:disabled) {
		background: #dc2626;
		transform: scale(1.05);
	}

	.editor-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 2px solid #d1fae5;
	}

	.operations-list {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f0fdf4;
		border-radius: 0.5rem;
		border: 2px solid #22c55e;
	}

	.operations-list h4 {
		color: #065f46;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.operations-list ul {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.operation-item {
		padding: 0.75rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #d1fae5;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.operation-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.operation-badge {
		background: #059669;
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		flex-shrink: 0;
	}

	.operation-details {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.text-old {
		color: #dc2626;
		text-decoration: line-through;
		font-size: 0.875rem;
		word-break: break-word;
	}

	.text-new {
		color: #16a34a;
		font-weight: 600;
		font-size: 0.875rem;
		word-break: break-word;
	}

	.arrow-icon {
		width: 1rem;
		height: 1rem;
		color: #6b7280;
		flex-shrink: 0;
	}

	.operation-position {
		font-size: 0.75rem;
		color: #6b7280;
		font-family: monospace;
	}

	.preview-note {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: white;
		border-radius: 0.5rem;
		border: 1px solid #d1fae5;
	}

	.preview-note .info-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: #059669;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.preview-note p {
		margin: 0;
		font-size: 0.75rem;
		color: #047857;
		line-height: 1.5;
	}
</style>
