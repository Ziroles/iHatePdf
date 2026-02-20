<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<header class="bg-white border-b border-gray-200 shadow-sm">
	<div class="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
		<a href={resolve('/')} class="flex items-center gap-4 no-underline">
			<svg class="w-8 h-8 text-blue-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
			</svg>
			<div>
				<h1 class="text-xl font-semibold tracking-tight text-gray-900 leading-none">iHatePDF</h1>
				<p class="text-sm text-gray-500 mt-0.5">Éditeur PDF sécurisé et local - vos données restent privées</p>
			</div>
		</a>
	</div>
</header>
