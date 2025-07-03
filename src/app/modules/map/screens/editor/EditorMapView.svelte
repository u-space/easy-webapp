<svelte:options immutable={true} />

<script lang="ts">
	import Tokyo from '@tokyo/Tokyo.svelte';
	import TokyoGenericMapElement from '@tokyo/TokyoGenericMapElement.svelte';
	import {
		GeographicalZoneDrawingProps,
		geographicalZoneTokyoConverter
	} from '@tokyo/converters/fra/geographicalZone';
	import { flightRequestTokyoConverter } from '@tokyo/converters/fra/flightRequest';

	import { EditorMapViewProps } from './EditorMapViewProps';
	import { uvrTokyoConverter } from '@tokyo/converters/core/uvrDrawer';

	export let editOptions: EditorMapViewProps['editOptions'];
	export let controlsOptions: EditorMapViewProps['controlsOptions'] = {
		zoom: {
			enabled: true
		},
		geocoder: {
			enabled: true
		},
		geolocator: {
			enabled: false
		},
		backgroundModeSwitch: {
			enabled: true
		}
	};
	export let geographicalZones: EditorMapViewProps['geographicalZones'];
	export let flightRequests: EditorMapViewProps['flightRequests'];
	export let uvrs: EditorMapViewProps['uvrs'] = [];

	const alphas: GeographicalZoneDrawingProps = {
		lineAlpha: 255,
		fillAlpha: 15,
		threeDimensional: false
	};
</script>

<Tokyo
	{editOptions}
	mapOptions={{ isPickEnabled: false }}
	{controlsOptions}
	on:edit
	on:select
	on:pick
>
	{#each geographicalZones as geographicalZone (geographicalZone.id)}
		<TokyoGenericMapElement
			id={geographicalZoneTokyoConverter.getId(geographicalZone)}
			getLayer={geographicalZoneTokyoConverter.getConverter(geographicalZone, alphas)}
		/>
	{/each}

	{#each flightRequests as flightRequest (flightRequest.id)}
		<TokyoGenericMapElement
			id={flightRequestTokyoConverter.getId(flightRequest)}
			getLayer={flightRequestTokyoConverter.getConverter(flightRequest)}
		/>
	{/each}

	{#if uvrs}
		{#each uvrs as uvr (uvr.message_id)}
			<TokyoGenericMapElement
				id={uvrTokyoConverter.getId(uvr)}
				getLayer={uvrTokyoConverter.getConverter(uvr)}
			/>
		{/each}
	{/if}
</Tokyo>
