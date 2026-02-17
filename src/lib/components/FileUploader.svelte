<!--
	FileUploader Component
	Secure file upload with drag & drop support
	Implements client-side validation
-->
<script lang="ts">
	import { validatePDFSecurity, sanitizeFilename } from '$lib/security/pdf-validator';
	import { pdfStore } from '$lib/stores/pdf.store';
	import { loadPDF, extractMetadata } from '$lib/services/pdf-processor';

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	const handleFile = async (file: File) => {
		pdfStore.setLoading(true);
		pdfStore.setError(null);

		try {
			// Security validation
			const securityCheck = await validatePDFSecurity(file);
			pdfStore.setSecurityCheck(securityCheck);

			if (!securityCheck.isValid) {
				pdfStore.setError(securityCheck.warnings.join(', '));
				pdfStore.setLoading(false);
				return;
			}

			// If suspicious content detected, warn user
			if (securityCheck.hasSuspiciousContent && securityCheck.warnings.length > 0) {
				const proceed = confirm(
					`⚠️ Avertissement de sécurité:\n\n${securityCheck.warnings.join('\n')}\n\nVoulez-vous continuer ?`
				);

				if (!proceed) {
					pdfStore.setLoading(false);
					pdfStore.reset();
					return;
				}
			}

			// Load PDF
			const arrayBuffer = await file.arrayBuffer();
			pdfStore.setArrayBuffer(arrayBuffer);

			const pdfDoc = await loadPDF(arrayBuffer);
			pdfStore.setPDFDocument(pdfDoc);

			// Extract metadata
			const metadata = await extractMetadata(pdfDoc);
			pdfStore.setMetadata(metadata);

			// Sanitize and store file
			const sanitizedFile = new File([file], sanitizeFilename(file.name), { type: file.type });
			pdfStore.setFile(sanitizedFile);

		} catch (error) {
			pdfStore.setError(
				error instanceof Error ? error.message : 'Erreur lors du chargement du fichier'
			);
		} finally {
			pdfStore.setLoading(false);
		}
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	};

	const handleFileInput = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFile(target.files[0]);
		}
	};

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		isDragging = true;
	};

	const handleDragLeave = () => {
		isDragging = false;
	};
</script>

<div class="file-uploader">
	<div
		class="upload-area"
		class:dragging={isDragging}
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		role="button"
		tabindex="0"
		onclick={() => fileInput.click()}
		onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
	>
		<div class="upload-icon">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
			</svg>
		</div>

		<h3>Glissez-déposez votre PDF ici</h3>
		<p>ou cliquez pour sélectionner un fichier</p>
		<p class="file-info">Maximum 100MB • PDF uniquement</p>
	</div>

	<input
		bind:this={fileInput}
		type="file"
		accept="application/pdf"
		onchange={handleFileInput}
		hidden
	/>
</div>

<style>
	.file-uploader {
		width: 100%;
	}

	.upload-area {
		border: 3px dashed #059669;
		border-radius: 1rem;
		padding: 3rem 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		background: #f0fdf4;
	}

	.upload-area:hover {
		border-color: #047857;
		background: #dcfce7;
		transform: scale(1.02);
	}

	.upload-area.dragging {
		border-color: #047857;
		background: #bbf7d0;
		transform: scale(1.05);
	}

	.upload-icon {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1.5rem;
		color: #059669;
	}

	.upload-area h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #065f46;
		margin-bottom: 0.5rem;
	}

	.upload-area p {
		color: #047857;
		margin-bottom: 0.25rem;
	}

	.file-info {
		font-size: 0.875rem;
		color: #059669;
		margin-top: 1rem;
	}
</style>
