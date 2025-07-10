<script lang="ts">
	import CButton from '@tokyo/gui/CButton.svelte';
	import type { VehicleEntity } from '@utm-entities/vehicle';
	import { CSize } from '@tokyo/gui/CSizeWrapper';
	import { VehicleAuthorizationStatus } from '@utm-entities/vehicle';
	import { CButtonVariant } from '@tokyo/gui/CButton';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ select: VehicleEntity[] }>(); // Temporal until parents are all Svelte (for prop binding)

	export let vehicles: VehicleEntity[] = []; // TODO: Use vehicle v2
	export let selected: VehicleEntity[] = [];

	const isAuthorized = (v: VehicleEntity) => {
		return v.authorized === VehicleAuthorizationStatus.AUTHORIZED;
	};

	const hasValidRemoteSensor = (data: VehicleEntity) => {
		return true;
		// const doucments = data.extra_fields.documents as DocumentEntity[];
		// const filterDocuments = doucments.filter((doc, i) => {
		// 	return doc.tag === 'remote_sensor_id' && doc.valid;
		// });
		// return filterDocuments.length > 0;
		// return data.remoteSensorValid;
	};

	function onSelectHandler(vehicle: VehicleEntity) {
		return () => {
			if (selected.indexOf(vehicle) !== -1) {
				selected = selected.filter((v) => v !== vehicle);
			} else {
				selected = [...selected, vehicle];
			}
			dispatch('select', selected);
		};
	}
</script>

<div class="vehicle-selector">
	<slot></slot>
	{#each vehicles as vehicle (vehicle.uvin)}
		<!-- this display name is temporal as we are not using v2 vehicle -->
		{@const manufacturerModel = `${vehicle.manufacturer} ${vehicle.model}`}
		{@const fullName = `${vehicle.vehicleName}: ${manufacturerModel}`}

		<CButton
			fill
			disabled={!isAuthorized(vehicle) || !hasValidRemoteSensor(vehicle)}
			variant={selected.indexOf(vehicle) !== -1
				? CButtonVariant.PRIMARY
				: CButtonVariant.SECONDARY}
			aria-label={selected.indexOf(vehicle) !== -1
				? `Deselect vehicle ${vehicle.vehicleName}`
				: `Select vehicle ${vehicle.vehicleName}`}
			size={CSize.SMALL}
			on:click={onSelectHandler(vehicle)}
			justifyContent="flex-start"
		>
			<span title={fullName}>{fullName}</span>
		</CButton>
	{/each}
</div>

<style lang="scss">
	.vehicle-selector {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: 0.5rem;

		color: var(--white-100);

		overflow: hidden;
	}
</style>
