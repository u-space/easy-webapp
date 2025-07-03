<script lang="ts">
	import CInput from '@tokyo/gui/CInput.svelte';
	import { getAutocomplete, getSearch } from '@tokyo/gui/CGeocoder';
	import { createQuery } from '@tanstack/svelte-query';
	import CButton from '@tokyo/gui/CButton.svelte';
	import { tokyoFlyToPosition } from '@tokyo/store';
	import { createEventDispatcher } from 'svelte';
	import { CSize } from './CSizeWrapper';

	const dispatch = createEventDispatcher();

	export let geaopifyApiKey;

	let searchText = '';
	let currentSearchText = '';

	const queryAutocomplete = createQuery({
		queryKey: ['geocoder-autocomplete'],
		queryFn: () => getAutocomplete(geaopifyApiKey)(searchText),
		enabled: false,
		retry: false
	});

	let autocompleteTimeout = null;

	const querySearch = createQuery({
		queryKey: ['geocoder-search'],
		queryFn: () => getSearch(geaopifyApiKey)(searchText),
		enabled: false,
		retry: false
	});

	$: {
		if (searchText.length >= 3 && currentSearchText !== searchText) {
			if (autocompleteTimeout) {
				clearTimeout(autocompleteTimeout);
			}
			autocompleteTimeout = setTimeout(() => {
				$queryAutocomplete.refetch();
			}, 500);
			currentSearchText = searchText;
		}
	}
</script>

<CInput size={CSize.EXTRA_LARGE} bind:value={searchText} />
{#if searchText.length >= 3 && $queryAutocomplete.isSuccess}
	<div id="results">
		{#each $queryAutocomplete.data.data as place}
			<div class="place">
				<CButton
					icon="map-pin-fill"
					size={CSize.EXTRA_SMALL}
					on:click={() => {
						$tokyoFlyToPosition = {
							...$tokyoFlyToPosition,
							latitude: place.lat,
							longitude: place.lon
						};
						dispatch('select', place);
					}}
				/>
				<p>{place.formatted}</p>
			</div>
		{/each}
	</div>
{/if}

<style lang="scss">
	@import './mixins.scss';

	#results {
		background-color: var(--mirai-100);
		margin-top: 0.25rem;
		padding: 0.25rem;
		border-radius: 0.25rem;
		@include box-shadow-1;

		& .place {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: 1em;
			padding: 0.25rem 0;

			&:not(:last-child) {
				border-bottom: 1px solid var(--mirai-200);
			}

			& p {
				margin: 0;
			}
		}
	}
</style>
