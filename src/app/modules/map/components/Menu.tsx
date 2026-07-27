import { Checkbox } from '@blueprintjs/core';
import { CoordinationEntity } from '@flight-request-entities/coordination';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import CardGroup from '../../../commons/layouts/dashboard/menu/CardGroup';
import { getFeatureOption } from '../../../utils';
import { useAuthIsAdmin, useAuthStore } from '../../auth/store';
import {
	useQueryOperations,
	useSelectedOperationAndVolume
} from '../../core_service/operation/hooks';
import { useSelectedRfv } from '../../core_service/rfv/hooks';
import { useSelectedUvr } from '../../core_service/uvr/hooks';
import { useSelectedVehicle } from '../../core_service/vehicle/hooks';
import { usePublicSelectedFlightRequest, useSelectedFlightRequest } from '../../flight_request_service/flight_request/hooks';
import {
	useSelectedGeographicalZone,
	usePublicSelectedGeographicalZone
} from '../../flight_request_service/geographical_zone/hooks';
import GenericEntityDetails from './GenericEntityDetails';
import OperationDetails from './OperationDetails';
import OperationListAndStateFilters from './OperationListAndStateFilters';
import VehicleDetails from './VehicleDetails';

const Menu = ({
	isShowingGeographicalZones,
	setShowingGeographicalZonesFlag,
	isShowingUvrs,
	setShowingUvrsFlag
}: {
	isShowingGeographicalZones: boolean;
	setShowingGeographicalZonesFlag: (flag: boolean) => void;
	isShowingUvrs: boolean;
	setShowingUvrsFlag: (flag: boolean) => void;
}) => {
	const { t } = useTranslation();
	const history = useHistory();
	const isAdmin = useAuthIsAdmin();
	const username = useAuthStore((state) => state.username);

	const queryOperations = useQueryOperations();
	const { operation, selected: operationSelection } = useSelectedOperationAndVolume();
	const { gz, selected: gzSelection, query: querySelectedGz } = useSelectedGeographicalZone();
	const {
		gz: publicGz,
		selected: publicGzSelection,
		query: querySelectedPublicGz
	} = usePublicSelectedGeographicalZone();
	const {
		vehicle,
		latestPosition,
		selected: vehicleSelection,
		query: querySelectedVehicle
	} = useSelectedVehicle();
	const { rfv, selected: rfvSelection, query: querySelectedRfv } = useSelectedRfv();
	const { uvr, selected: uvrSelection, query: querySelectedUvr } = useSelectedUvr();
	const { flightRequest, selected: frSelection, query: querySelectedFr } = useSelectedFlightRequest();
	const { flightRequest: publicFlightRequest, selected: publicFrSelection, query: querySelectedPublicFr } = usePublicSelectedFlightRequest();

	if (operationSelection.gufi && operation) {
		// Show details of selected operation
		return (
			<OperationDetails
				{...queryOperations}
				operation={operation}
				canEdit={
					(isAdmin ||
						(operation?.owner?.username === username &&
							operation?.state !== 'CLOSED')) &&
					operation?.operation_volumes?.length === 1
				}
			/>
		);
	} else if (gzSelection.geographicalZone && gz) {
		// Show details of selected geographical zone
		return (
			<GenericEntityDetails
				route={gzSelection.prev ? `${gzSelection.prev}?is-previous=true` : '/map'}
				isLoading={querySelectedGz.isLoading}
				isSuccess={querySelectedGz.isSuccess}
				isError={querySelectedGz.isError}
				entity={{ ...gz, minimun_coordination_days: gz.coordinator.minimun_coordination_days }}
				baseLabelKey={'gz'}
				label={t('Prohibited and restricted zone')}
				canEdit={false}
			/>
		);
	} else if (rfvSelection.rfv) {
		return (
			<GenericEntityDetails
				route={'/map'}
				isLoading={querySelectedRfv.isLoading}
				isSuccess={querySelectedRfv.isSuccess}
				isError={querySelectedRfv.isError}
				entity={rfv}
				baseLabelKey={'rfv'}
				label={t('Restricted Flight Volume')}
				canEdit={false}
				extra={null}
			/>
		);
	} else if (uvrSelection.uvr) {
		return (
			<GenericEntityDetails
				route={'/map'}
				isLoading={querySelectedUvr.isLoading}
				isSuccess={querySelectedUvr.isSuccess}
				isError={querySelectedUvr.isError}
				entity={_.omit(uvr, ['permitted_uas', 'required_support', 'id', 'cause'])}
				translatableProps={['type']}
				baseLabelKey={'uvr'}
				label={t('UAS Volume Reservation')}
				canEdit={false}
				extra={null}

			/>
		);
	} else if (vehicleSelection.gufi) {
		// Show details of selected vehicle and latest positio
		return (
			<VehicleDetails
				vehicle={vehicle}
				latestPosition={latestPosition}
				isLoading={querySelectedVehicle.isLoading}
				isSuccess={querySelectedVehicle.isSuccess}
				isError={querySelectedVehicle.isError}
			/>
		);

	} else if (frSelection.flightRequest && flightRequest) {
		// Show details of selected flight request
		const visibleFields: any = {}
		visibleFields.id = flightRequest.id;
		visibleFields.name = flightRequest.name;
		visibleFields.effective_time_begin = (new Date(flightRequest.volumes[0].effective_time_begin)).toLocaleString()
		visibleFields.effective_time_end = (new Date(flightRequest.volumes[0].effective_time_end)).toLocaleString()
		const vehicles: string[] = flightRequest.uavs.map((v: any) => {
			return `${v.vehicleName}/${v.extra_fields.plate}`
		});
		visibleFields.vehicles = vehicles.join('\n');

		visibleFields.coordinations = flightRequest.coordination.map((coordination: CoordinationEntity) => {
			return {
				reference: coordination.reference === "" ? t('Geographical zone') : coordination.reference,
				coordinatorName: coordination.coordinator?.infrastructure ? coordination.coordinator?.infrastructure : null,
				telephone: coordination.coordinator?.telephone ? coordination.coordinator?.telephone : null,
			}
		})
		return (
			<GenericEntityDetails
				route={'/map'}
				isLoading={querySelectedFr.isLoading}
				isSuccess={querySelectedFr.isSuccess}
				isError={querySelectedFr.isError}
				entity={visibleFields}
				baseLabelKey={'flight-request'}
				label={t('Flight Request')}
				canEdit={false}
				extra={null}
			/>
		);

	}
	else if (publicFrSelection.flightRequest && publicFlightRequest) {
		// Show details of selected flight request
		const visibleFields: any = {}
		visibleFields.id = publicFlightRequest.id;
		visibleFields.name = publicFlightRequest.name;
		visibleFields.effective_time_begin = (new Date(publicFlightRequest.volumes[0].effective_time_begin)).toLocaleString()
		visibleFields.effective_time_end = (new Date(publicFlightRequest.volumes[0].effective_time_end)).toLocaleString()
		const vehicles: string[] = publicFlightRequest.uavs.map((v: any) => {
			return `${v.uvin}`
		});
		visibleFields.vehicles = vehicles.join('\n');

		return (
			<GenericEntityDetails
				route={'/map'}
				isLoading={querySelectedPublicFr.isLoading}
				isSuccess={querySelectedPublicFr.isSuccess}
				isError={querySelectedPublicFr.isError}
				entity={visibleFields}
				baseLabelKey={'flight-request'}
				label={t('Flight Request')}
				canEdit={false}
				extra={null}
			/>
		);

	} else if (publicGzSelection.geographicalZone && publicGz) {
		// Show details of the selected geographical zone on the public map.
		// publicGz is the unauthenticated getById result: only safe fields +
		// minimun_coordination_days (no coordinator object). geography is skipped
		// by GenericEntityDetails, which renders only string/number/Date.
		return (
			<GenericEntityDetails
				route={publicGzSelection.prev ? `${publicGzSelection.prev}?is-previous=true` : '/map'}
				isLoading={querySelectedPublicGz.isLoading}
				isSuccess={querySelectedPublicGz.isSuccess}
				isError={querySelectedPublicGz.isError}
				entity={publicGz}
				baseLabelKey={'gz'}
				label={t('Prohibited and restricted zone')}
				canEdit={false}
			/>
		);
	} else {
		// Main screen
		return (
			<>
				{!getFeatureOption('RealtimeMap', 'hideOperationsControls') && (
					<OperationListAndStateFilters />
				)}
				<CardGroup header="Non-realtime information">
					<Checkbox
						labelElement={<span>{t('Show geographical zones')}</span>}
						checked={isShowingGeographicalZones}
						onChange={() =>
							setShowingGeographicalZonesFlag(!isShowingGeographicalZones)
						}
					/>
					<Checkbox
						labelElement={<span>{t('Show NOTAMs')}</span>}
						checked={isShowingUvrs}
						onChange={() => setShowingUvrsFlag(!isShowingUvrs)}
					/>
				</CardGroup>
			</>
		);
	}
};

export default Menu;
