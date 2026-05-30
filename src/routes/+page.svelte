<script lang="ts">
	import FileUploader from '$lib/components/FileUploader.svelte';
	import InteractivePDFEditor from '$lib/components/InteractivePDFEditor.svelte';
	import TextEditor from '$lib/components/TextEditor.svelte';
	import Header from '$lib/components/Header.svelte';
	import { pdfStore, hasFile, hasSuspiciousContent } from '$lib/stores/pdf.store';

	const resetApp = () => {
		pdfStore.reset();
	};
</script>

<div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
	<Header />

	<main class="flex-1 w-full max-w-7xl mx-auto px-6 py-8">

		<!-- Error alert -->
		{#if $pdfStore.error}
			<div class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6">
				<svg class="w-5 h-5 text-red-500 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
				</svg>
				<div>
					<strong class="block font-semibold text-sm mb-0.5">Erreur</strong>
					<p class="text-sm">{$pdfStore.error}</p>
				</div>
			</div>
		{/if}

		<!-- Loading -->
		{#if $pdfStore.isLoading}
			<div class="flex flex-col items-center justify-center min-h-96 gap-4">
				<div class="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
				<p class="text-sm text-gray-500 font-medium">Chargement sécurisé du PDF...</p>
			</div>
		{/if}

		{#if !$hasFile}
			<!-- Upload state -->
			<div class="max-w-3xl mx-auto">
				<FileUploader />

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
					{#each [
						{ title: '100% Sécurisé', desc: 'Protection contre les PDF malveillants avec validation multi-couches', path: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
						{ title: '100% Local', desc: 'Traitement côté client — aucune donnée envoyée à un serveur', path: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
						{ title: 'Rapide & Léger', desc: 'Interface moderne et réactive avec Svelte', path: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' }
					] as feature}
						<div class="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 hover:shadow-md transition-all duration-200">
							<svg class="w-9 h-9 mx-auto mb-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d={feature.path} />
							</svg>
							<h3 class="text-base font-semibold text-gray-900 mb-1">{feature.title}</h3>
							<p class="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
						</div>
					{/each}
				</div>
			</div>

		{:else}
			<!-- Editor state -->
			<div class="flex flex-col gap-4">

				<!-- File bar -->
				<div class="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
					<div class="flex items-center gap-3">
						<svg class="w-5 h-5 text-blue-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
						</svg>
						<span class="font-semibold text-gray-900 text-sm">{$pdfStore.file?.name}</span>
						{#if $hasSuspiciousContent}
							<span class="flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg px-3 py-1 text-xs font-semibold">
								<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
								</svg>
								Contenu suspect détecté
							</span>
						{/if}
					</div>
					<button onclick={resetApp} class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
						<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
						Fermer
					</button>
				</div>

				<!-- Editor layout -->
				<div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
					<div class="min-h-[600px]">
						<InteractivePDFEditor />
					</div>

					<div class="flex flex-col gap-4">
						<TextEditor />

						{#if $pdfStore.metadata}
							<div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
								<h4 class="text-sm font-semibold text-gray-900 pb-3 mb-3 border-b border-gray-100 tracking-tight">Informations du PDF</h4>
								<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
									<dt class="text-sm text-gray-500 font-medium">Pages</dt>
									<dd class="text-sm text-gray-900 m-0">{$pdfStore.metadata.pageCount}</dd>

									{#if $pdfStore.metadata.title}
										<dt class="text-sm text-gray-500 font-medium">Titre</dt>
										<dd class="text-sm text-gray-900 m-0">{$pdfStore.metadata.title}</dd>
									{/if}

									{#if $pdfStore.metadata.author}
										<dt class="text-sm text-gray-500 font-medium">Auteur</dt>
										<dd class="text-sm text-gray-900 m-0">{$pdfStore.metadata.author}</dd>
									{/if}

									{#if $pdfStore.securityCheck}
										<dt class="text-sm text-gray-500 font-medium">Taille</dt>
										<dd class="text-sm text-gray-900 m-0">{($pdfStore.securityCheck.fileSize / 1024 / 1024).toFixed(2)} MB</dd>
									{/if}
								</dl>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style>
