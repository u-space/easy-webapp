<script lang="ts">
	import { isDeckMounted } from './deck/action';
	import type { Layer } from '@deck.gl/core/typed';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import {
		tokyoInternalsDestroyHandler,
		tokyoInternalsUpdateHandler,
		tokyoViewState
	} from './store';

	const dispatch = createEventDispatcher();

	export let getLayer: () => Layer;
	export let id: string; // Tokyo ID, not Domain ID.

	let loaded = false;

	function render() {
		if (
			$isDeckMounted && // Wait for deck to load
			$tokyoInternalsUpdateHandler &&
			$tokyoViewState // Wait for the first view state to be computed, so we can fly to any geometry
		) {
			$tokyoInternalsUpdateHandler(getLayer());
			if (!loaded) {
				dispatch('load');
				loaded = true;
			}
		}
	}

	onMount(render);
	$: {
		if (getLayer && $tokyoInternalsUpdateHandler) {
			// This check mostly helps on making this statement reactive
			render();
		}
	}

	onDestroy(() => {
		if ($tokyoInternalsDestroyHandler) {
			$tokyoInternalsDestroyHandler(id);
		}
	});
</script>
