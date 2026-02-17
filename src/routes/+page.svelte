<script lang="ts">
	import FileUploader from '$lib/components/FileUploader.svelte';
	import InteractivePDFEditor from '$lib/components/InteractivePDFEditor.svelte';
	import TextEditor from '$lib/components/TextEditor.svelte';
	import { pdfStore, hasFile, hasSuspiciousContent } from '$lib/stores/pdf.store';

	const resetApp = () => {

			pdfStore.reset();

	};
</script>

<div class="app-container">
	<!-- Header -->
	<header class="app-header">
		<div class="header-content">
			<h1 class="app-title">
				<svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>
				iHatePDF
			</h1>
			<p class="app-subtitle">
				Éditeur PDF sécurisé et local - Vos données restent privées
			</p>
		</div>
	</header>

	<!-- Main Content -->
	<main class="app-main">
		{#if $pdfStore.error}
			<div class="alert alert-error">
				<svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
				</svg>
				<div>
					<strong>Erreur</strong>
					<p>{$pdfStore.error}</p>
				</div>
			</div>
		{/if}

		{#if $pdfStore.isLoading}
			<div class="loading-screen">
				<div class="spinner-large"></div>
				<p>Chargement sécurisé du PDF...</p>
			</div>
		{/if}

		{#if !$hasFile}
			<!-- Upload State -->
			<div class="upload-section">
				<FileUploader />

				<div class="features-grid">
					<div class="feature-card">
						<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
						</svg>
						<h3>100% Sécurisé</h3>
						<p>Protection contre les PDF malveillants avec validation multi-couches</p>
					</div>

					<div class="feature-card">
						<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
						</svg>
						<h3>100% Local</h3>
						<p>Traitement côté client — aucune donnée envoyée à un serveur</p>
					</div>

					<div class="feature-card">
						<svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
						</svg>
						<h3>Rapide et Léger</h3>
						<p>Interface moderne et réactive avec Svelte</p>
					</div>


				</div>
			</div>
		{:else}
			<!-- Editor State -->
			<div class="editor-layout">
				<div class="editor-header-bar">
					<div class="file-info">
						<svg class="file-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
						</svg>
						<span class="file-name">{$pdfStore.file?.name}</span>
						{#if $hasSuspiciousContent}
							<span class="warning-badge">
								<svg class="badge-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
								</svg>
								Contenu suspect détecté
							</span>
						{/if}
					</div>
					<button onclick={resetApp} class="btn-close btn-danger">
						<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
						Fermer
					</button>
				</div>

				<div class="editor-content">
					<div class="viewer-section">
						<InteractivePDFEditor />
					</div>

					<div class="editor-section">
						<TextEditor />

						{#if $pdfStore.metadata}
							<div class="metadata-card">
								<h4>Informations du PDF</h4>
								<dl>
									<dt>Pages:</dt>
									<dd>{$pdfStore.metadata.pageCount}</dd>

									{#if $pdfStore.metadata.title}
										<dt>Titre:</dt>
										<dd>{$pdfStore.metadata.title}</dd>
									{/if}

									{#if $pdfStore.metadata.author}
										<dt>Auteur:</dt>
										<dd>{$pdfStore.metadata.author}</dd>
									{/if}

									{#if $pdfStore.securityCheck}
										<dt>Taille:</dt>
										<dd>{($pdfStore.securityCheck.fileSize / 1024 / 1024).toFixed(2)} MB</dd>
									{/if}
								</dl>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="app-footer">
		<p>Application 100% sécurisée et locale | Propulsée par Svelte + PDF.js + pdf-lib</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		background: #f8f9fa;
		min-height: 100vh;
		color: #1a1a1a;
	}

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		background: #ffffff;
		border-bottom: 1px solid #e5e7eb;
		padding: 1.5rem 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
	}

	.app-title {
		font-size: 1.75rem;
		font-weight: 600;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #1a1a1a;
		letter-spacing: -0.025em;
	}

	.logo-icon {
		width: 2rem;
		height: 2rem;
		stroke-width: 2;
		color: #3b82f6;
	}

	.app-subtitle {
		margin: 0.375rem 0 0 0;
		font-size: 0.9375rem;
		color: #6b7280;
		font-weight: 400;
	}

	.app-main {
		flex: 1;
		max-width: 1400px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem;
	}

	.upload-section {
		max-width: 900px;
		margin: 0 auto;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.25rem;
		margin-top: 2.5rem;
	}

	.feature-card {
		background: #ffffff;
		padding: 1.75rem;
		border-radius: 0.75rem;
		border: 1px solid #e5e7eb;
		text-align: center;
		transition: all 0.2s ease;
	}

	.feature-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
	}

	.feature-icon {
		width: 2.5rem;
		height: 2.5rem;
		margin: 0 auto 1rem;
		color: #3b82f6;
		stroke-width: 1.5;
	}

	.feature-card h3 {
		color: #1a1a1a;
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.0125em;
	}

	.feature-card p {
		color: #6b7280;
		margin: 0;
		line-height: 1.6;
		font-size: 0.9375rem;
	}

	.editor-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.editor-header-bar {
		background: #ffffff;
		padding: 1rem 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.file-icon {
		width: 1.5rem;
		height: 1.5rem;
		color: #3b82f6;
		flex-shrink: 0;
	}

	.file-name {
		font-weight: 600;
		color: #1a1a1a;
		font-size: 1rem;
		letter-spacing: -0.0125em;
	}

	.warning-badge {
		background: #fef3c7;
		color: #92400e;
		padding: 0.375rem 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid #fde68a;
	}

	.badge-icon {
		width: 1rem;
		height: 1rem;
	}

	.btn-close {
		background: #ffffff;
		color: #6b7280;
		border: 1px solid #e5e7eb;
		padding: 0.625rem 1.125rem;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
	}

	.btn-icon {
		width: 1.125rem;
		height: 1.125rem;
	}

	.btn-close:hover {
		background: #f3f4f6;
		border-color: #d1d5db;
		color: #1a1a1a;
	}

	.editor-content {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 1.5rem;
	}

	@media (max-width: 1024px) {
		.editor-content {
			grid-template-columns: 1fr;
		}
	}

	.viewer-section {
		min-height: 600px;
	}

	.editor-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.metadata-card {
		background: #ffffff;
		padding: 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.metadata-card h4 {
		color: #1a1a1a;
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
		letter-spacing: -0.0125em;
	}

	.metadata-card dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.625rem 1rem;
		margin: 0;
	}

	.metadata-card dt {
		font-weight: 500;
		color: #6b7280;
		font-size: 0.9375rem;
	}

	.metadata-card dd {
		margin: 0;
		color: #1a1a1a;
		font-size: 0.9375rem;
	}

	.alert {
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		border: 1px solid;
	}

	.alert-icon {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		margin-top: 0.125rem;
	}

	.alert-error {
		background: #fef2f2;
		border-color: #fecaca;
		color: #991b1b;
	}

	.alert-error .alert-icon {
		color: #ef4444;
	}

	.alert strong {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.alert p {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		gap: 1.5rem;
	}

	.spinner-large {
		width: 3rem;
		height: 3rem;
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-screen p {
		color: #6b7280;
		font-weight: 500;
		font-size: 1rem;
	}

	.app-footer {
		background: #ffffff;
		color: #6b7280;
		text-align: center;
		padding: 1.5rem;
		margin-top: auto;
		border-top: 1px solid #e5e7eb;
	}

	.app-footer p {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 400;
	}
    .btn-danger {
        background: #ef4444;
        color: white;

    }
</style>
