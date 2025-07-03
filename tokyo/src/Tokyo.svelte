<script lang="ts">
	import type { Layer } from '@deck.gl/core/typed';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import TokyoGenericMapElement from '@tokyo/TokyoGenericMapElement.svelte';
	import { geolocatorTokyoConverter } from '@tokyo/converters/geolocator';
	import CButton from '@tokyo/gui/CButton.svelte';
	import CGeocoder from '@tokyo/gui/CGeocoder.svelte';
	import CModal from '@tokyo/gui/CModal.svelte';
	import { CTooltipPosition } from '@tokyo/gui/CTooltip';
	import type { Polygon } from 'geojson';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { deckAction } from './deck/action';
	import { CSize } from './gui/CSizeWrapper';
	import { logDebug } from './logger';
	import {
		tokyoFlyToPosition,
		tokyoInternalsDestroyHandler,
		tokyoInternalsUpdateHandler,
		tokyoViewState
	} from './store';
	import type {
		DeckActionParams,
		EditHandlers,
		EditParams,
		PickHandler,
		TokyoDispatchedEvent,
		TokyoProps
	} from './types';
	import { BackgroundMode } from './types';

	/* Component props */
	export let editOptions: TokyoProps['editOptions'];
	export let mapOptions: TokyoProps['mapOptions'] = { isPickEnabled: true, is3D: true };
	export let controlsOptions: TokyoProps['controlsOptions'] = {
		zoom: {
			enabled: true
		},
		geocoder: {
			enabled: false
		},
		geolocator: {
			enabled: true
		},
		backgroundModeSwitch: {
			enabled: true
		}
	};
	export let t: TokyoProps['t'] = (key: string) => key; // Support for i18n, should be app-provided

	const dispatch = createEventDispatcher<TokyoDispatchedEvent>();

	// State management via controls
	let backgroundMode: BackgroundMode = BackgroundMode.Streets;
	$: backgroundModeSwitchText =
		backgroundMode === BackgroundMode.Streets
			? t('ui:View satellite map')
			: t('ui:View street map');
	$: backgroundModeSwitchIcon =
		backgroundMode === BackgroundMode.Streets
			? 'globe-hemisphere-west-duotone'
			: 'globe-duotone';

	function handleBackgroundModeSwitchClick() {
		if (backgroundMode === BackgroundMode.Streets) {
			backgroundMode = BackgroundMode.Satellite;
		} else {
			backgroundMode = BackgroundMode.Streets;
		}
	}

	function flyToGeolocation() {
		if (geolocation) {
			const { latitude, longitude } = geolocation.coords;
			$tokyoFlyToPosition = {
				...$tokyoFlyToPosition,
				latitude,
				longitude,
				zoom: 16
			};
		} else {
			geolocationNotEnabledOrError = true;
		}
	}

	function handleGeolocateClick() {
		if (!geolocationWatch) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					geolocation = position;
					flyToGeolocation();
					geolocationWatch = navigator.geolocation.watchPosition(
						(position) => (geolocation = position)
					);
				},
				() => {
					geolocationNotEnabledOrError = true;
				}
			);
		} else {
			flyToGeolocation();
		}
	}

	function zoomIn() {
		$tokyoFlyToPosition = {
			...$tokyoViewState,
			duration: 100,
			zoom: $tokyoViewState.zoom + 1
		};
	}

	function resetMapRotation() {
		$tokyoFlyToPosition = {
			...$tokyoViewState,
			bearing: 0,
			pitch: 0
		};
	}

	function zoomOut() {
		$tokyoFlyToPosition = {
			...$tokyoViewState,
			duration: 100,
			zoom: $tokyoViewState.zoom - 1
		};
	}

	// Geolocator logic
	let geolocation = null;
	let geolocationWatch = null;
	let geolocationNotEnabledOrError = false;

	onDestroy(() => {
		if (geolocationWatch) navigator.geolocation.clearWatch(geolocationWatch);
	});

	// Geocoder visibility state
	let isGeocoderModalVisible = false;

	// Layer management
	let allLayersMap = new Map();
	let pickedLayersMap = new Map();
	let visibleLayersMap = new Map();

	$: {
		if (pickedLayersMap.size > 0) {
			const newVisibleLayersMap = new Map();
			for (const layer of allLayersMap.values()) {
				if (pickedLayersMap.get(layer.id)) {
					newVisibleLayersMap.set(layer.id, layer.clone());
				} else {
					newVisibleLayersMap.set(layer.id, layer.clone({ opacity: 0.1 }));
				}
			}
			visibleLayersMap = newVisibleLayersMap;
		} else {
			visibleLayersMap = allLayersMap;
		}
	}

	let visibleLayersArray = [];
	$: {
		// Calculating the visible layers array from the map, sort by priority
		let lowPriorityLayers = [];
		let normalPriorityLayers = [];
		let highPriorityLayers = [];
		for (const layer of visibleLayersMap.values()) {
			if (layer.id.split('|')[0] === 'operation') {
				normalPriorityLayers.push(layer);
			} else if (layer.id === 'Geolocator' || layer.id.split('|')[0] === 'vehicle') {
				highPriorityLayers.push(layer);
			} else {
				lowPriorityLayers.push(layer);
			}
		}
		visibleLayersArray = [...lowPriorityLayers, ...normalPriorityLayers, ...highPriorityLayers];
	}

	function updateHandler(layer: Layer) {
		allLayersMap = allLayersMap.set(layer.id, layer);
	}

	function destroyHandler(id: string) {
		console.log('destroy', id, allLayersMap);
		allLayersMap.delete(id);
		allLayersMap = allLayersMap;
		console.log('destroyed', id, allLayersMap);
	}

	onMount(() => {
		$tokyoInternalsUpdateHandler = updateHandler;
		$tokyoInternalsDestroyHandler = destroyHandler;
	});

	onDestroy(() => {
		$tokyoInternalsUpdateHandler = null;
		$tokyoInternalsDestroyHandler = null;
	});

	// Deck handlers
	export const pick: PickHandler = (pickings) => {
		dispatch('pick', pickings);
		const newPickedLayers = new Map();
		pickings.forEach((picking) => {
			newPickedLayers.set(picking.layerId, picking);
		});
		pickedLayersMap = newPickedLayers;
	};

	// Edit mode
	let editPolygons: Polygon[] = []; // Currently being edited polygons
	$: {
		if (editOptions && editOptions.polygons) {
			editPolygons = editOptions.polygons;
		}
	}
	let editIndexSelected: number | null = null; // Currently selected polygon index
	const editHandlers: EditHandlers = {
		edit: (polygons) => {
			logDebug('edit', polygons);
			editPolygons = polygons;
			dispatch('edit', polygons);
		},
		select: (index) => {
			logDebug('select', index);
			editIndexSelected = index;
			dispatch('select', index);
		}
	};

	let editParams: EditParams;
	$: editParams = {
		...editOptions,
		polygons: editPolygons,
		handlers: editHandlers,
		indexSelected: editIndexSelected
	};

	$: deckActionParams = {
		position: $tokyoFlyToPosition,
		mapParams: {
			backgroundMode,
			isPickEnabled: mapOptions.isPickEnabled,
			is3D: mapOptions.is3D
		},
		layers: visibleLayersArray,
		handlers: { pick },
		editParams
	} as DeckActionParams;

	const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
	<!-- TODO: remove this when we have a global query client -->
	<div id="tokyo-container" on:contextmenu={(evt) => evt.preventDefault()}>
		<canvas id="tokyo-map" use:deckAction={deckActionParams} on:hover> </canvas>
		<div id="tokyo-controls">
			{#if controlsOptions.backgroundModeSwitch.enabled}
				<CButton
					icon={backgroundModeSwitchIcon}
					size={CSize.EXTRA_LARGE}
					tooltip={{ text: backgroundModeSwitchText, position: CTooltipPosition.Left }}
					on:click={handleBackgroundModeSwitchClick}
				/>
			{/if}
			{#if controlsOptions.geolocator.enabled}
				<CButton
					size={CSize.EXTRA_LARGE}
					icon="crosshair-duotone"
					tooltip={{ text: t('ui:Geolocate'), position: CTooltipPosition.Left }}
					on:click={handleGeolocateClick}
				/>
			{/if}
			<slot name="extra_controls" />
			{#if controlsOptions.zoom.enabled}
				<div id="tokyo-zoom">
					<CButton
						size={CSize.EXTRA_SMALL}
						icon="plus-bold"
						tooltip={{ text: t('ui:Zoom in'), position: CTooltipPosition.Left }}
						on:click={zoomIn}
					/>
					<CButton
						size={CSize.EXTRA_SMALL}
						icon="compass"
						tooltip={{
							text: t('ui:Reset map rotation'),
							position: CTooltipPosition.Left
						}}
						on:click={resetMapRotation}
					/>
					<CButton
						size={CSize.EXTRA_SMALL}
						icon="minus-bold"
						tooltip={{ text: t('ui:Zoom out'), position: CTooltipPosition.Left }}
						on:click={zoomOut}
					/>
				</div>
			{/if}
		</div>
		<div id="tokyo-geocoder">
			{#if controlsOptions.geocoder.enabled && controlsOptions.geocoder.geoapifyApiKey}
				<CGeocoder
					geaopifyApiKey={controlsOptions.geocoder.geoapifyApiKey}
					on:select={() => (isGeocoderModalVisible = false)}
				/>
			{/if}
		</div>
	</div>
	{#if geolocationNotEnabledOrError}
		<CModal title={t('ui:Geolocation')} on:close={() => (geolocationNotEnabledOrError = false)}>
			<p>{t('ui:Geolocation not enabled or error')}</p>
		</CModal>
	{/if}
	<div id="no-render">
		{#if geolocation}
			<TokyoGenericMapElement
				getLayer={geolocatorTokyoConverter.getConverter(geolocation)}
				id={geolocatorTokyoConverter.getId(geolocation)}
			/>
		{/if}
		<slot />
	</div>
</QueryClientProvider>

<style lang="scss">
	$gap: 0.3rem;

	#tokyo-container {
		position: relative;
		width: 100%;
		height: 100%;

		& :global(.deck-tooltip) {
			& :global(h1) {
				font-size: 1rem;
				color: var(--primary-900);
			}

			& :global(h2) {
				font-size: 0.8rem;
				color: var(--primary-800);
			}

			& :global(p) {
				color: var(--primary-700);

				& :global(.tooltip-property) {
					font-weight: 900;
				}
			}
		}
	}

	#tokyo-map {
		left: 0;
		top: 0;
		width: 100%;
	}

	#no-render {
		display: none;
	}

	#tokyo-controls {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: flex-start;
		gap: $gap;
		top: $gap;
		bottom: $gap;
		right: $gap;
		z-index: var(--z-index-controls);
		max-width: 1px;
	}

	#tokyo-geocoder {
		position: absolute;
		left: calc($gap * 2);
		top: calc($gap + 25px);
		width: 200px;
		z-index: 20;
		height: 35px;
	}

	#tokyo-zoom {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		margin-top: auto;
		gap: 0.5rem;
		margin-bottom: $gap;
		right: 0;
	}
</style>
