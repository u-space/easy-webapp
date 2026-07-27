import { useTokyo } from '@tokyo/store';
import { PositionEntity } from '@utm-entities/position';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { reactify } from 'svelte-preprocess-react';
import MapLayout from '../../../../commons/layouts/MapLayout';
import {
	useQueryOperations,
	useSelectedOperationAndVolume
} from '../../../core_service/operation/hooks';
import useQueryRfvs, { useSelectedRfv } from '../../../core_service/rfv/hooks';
import useQueryUvrs, { useSelectedUvr } from '../../../core_service/uvr/hooks';
import {
	useQueryPublicGeographicalZones,
	usePublicSelectedGeographicalZone
} from '../../../flight_request_service/geographical_zone/hooks';
import Contextual from '../../components/Contextual';
import Menu from '../../components/Menu';

import { IconName } from '@blueprintjs/core';
import { FlightRequestEntity } from '@flight-request-entities/flightRequest';
import PButton from '@pcomponents/PButton';
import { getCSSVariable } from '@pcomponents/utils';
import { TokyoPick } from '@tokyo/types';
import { Polygon } from 'geojson';
import { useAuthGetRole } from 'src/app/modules/auth/store';
import {
	useOwnedFlightRequests,
	usePublicSelectedFlightRequest,
	useQueryPublicFlightRequests,
	useSelectedFlightRequest
} from 'src/app/modules/flight_request_service/flight_request/hooks';
import styled from 'styled-components';
import env from '../../../../../vendor/environment/env';
import { setCSSVariable, useQueryString } from '../../../../utils';
import { usePositionStore } from '../../../core_service/position/store';
import LiveMapViewSvelte from './LiveMapView.svelte';
import {
	LiveMapFlightRequestZoneSelected,
	LiveMapGeographicalZoneSelected,
	LiveMapOperationSelected,
	LiveMapRfvSelected,
	LiveMapSelectableType,
	LiveMapSelected,
	LiveMapUvrSelected,
	LiveMapViewProps
} from './LiveMapViewProps';
import MasterLayout from 'src/app/commons/layouts/MasterLayout';

const LiveMapView = reactify(LiveMapViewSvelte);

const ExtraRealtimeMapButtons = styled.div`
	position: absolute;
	bottom: 1rem;
	left: 1rem;
	right: 3rem;
	display: flex;
	justify-content: flex-start;
	gap: 0.5rem;
`;

const LivePublicMap = () => {
	const { t } = useTranslation();
	const history = useHistory();
	const queryOperations = useQueryOperations(true);
	const queryGeographicalZones = useQueryPublicGeographicalZones();
	const queryRfvs = useQueryRfvs(true);
	const queryUvrs = useQueryUvrs(true);
	const isLoading =
		queryOperations.isLoading ||
		queryGeographicalZones.isLoading ||
		queryGeographicalZones.isFetching ||
		queryRfvs.isLoadingRfvs ||
		queryUvrs.isLoadingUvrs;

	const tokyo = useTokyo();
	const { volume, operation, selected: operationSelection } = useSelectedOperationAndVolume();
	const { gz } = usePublicSelectedGeographicalZone();
	const { rfv, selected: rfvSelection } = useSelectedRfv();
	const { uvr, selected: uvrSelection } = useSelectedUvr();
	const { flightRequest, selected: frSelection } = usePublicSelectedFlightRequest();
	const role = useAuthGetRole();

	const frQuery = useQueryPublicFlightRequests(true);
	const flightRequests: FlightRequestEntity[] = frQuery.flightRequests;
	const queryString = useQueryString();
	const isPrevious = queryString.get('is-previous');

	const selected: LiveMapSelected = useMemo(() => {
		if (operation) {
			return {
				type: LiveMapSelectableType.OPERATION,
				gufi: operation.gufi as string,
				volume: Number(operationSelection.volume)
			} as LiveMapOperationSelected;
		}
		else
			if (gz) {
				return {
					type: LiveMapSelectableType.GEOGRAPHICAL_ZONE,
					id: gz.id
				} as LiveMapGeographicalZoneSelected;
			}
			else
			if (flightRequest) {
				return {
					type: LiveMapSelectableType.FLIGHT_REQUEST,
					id: flightRequest.id
				} as LiveMapFlightRequestZoneSelected;
			}
			else if (rfv) {
				return {
					type: LiveMapSelectableType.RFV,
					id: rfv.id
				} as LiveMapRfvSelected;
			} else if (uvr) {
				return {
					type: LiveMapSelectableType.UVR,
					message_id: uvr.message_id,
					id: uvr.message_id
				} as LiveMapUvrSelected;
			} else {
				return null;
			}
	}, [
		gz,
		operationSelection, operation,
		rfv, uvr, flightRequest]);
	const positions = usePositionStore((state) => state.positions);
	const [isShowingGeographicalZones, setShowingGeographicalZonesFlag] = useState(true);
	const [isShowingUvrs, setShowingUvrsFlag] = useState(true);

	const redirectToPicked = useCallback(
		(pick: TokyoPick) => {
			const prev = history.location.pathname;
			history.push(
				pick.volume !== undefined
					? `/map?${pick.type}=${pick.id}&volume=${pick.volume}&prev=${prev}`
					: `/map?${pick.type}=${pick.id}&prev=${prev}`
			);
		},
		[history]
	);

	const redirectToCreateOperation = useCallback(() => {
		history.push('/editor/operation');
	}, [])

	useEffect(() => {
		if (volume) {
			tokyo.flyToCenterOfGeometry(volume.operation_geography as Polygon); // This is a operation fetched from the backend
		}
	}, [volume]);

	useEffect(() => {
		if (gz) {
			tokyo.flyToCenterOfGeometry(gz.geography);
		}
	}, [gz]);

	useEffect(() => {
		if (flightRequest && flightRequest.volumes && flightRequest.volumes[0].operation_geography) {
			tokyo.flyToCenterOfGeometry(flightRequest.volumes[0].operation_geography);
		}
	}, [flightRequest]);

	useEffect(() => {
		if (uvr) {
			tokyo.flyToCenterOfGeometry(uvr.geography);
		}
	}, [uvr]);

	useEffect(() => {
		if (rfv) {
			tokyo.flyToCenterOfGeometry(rfv.geography);
		}
	}, [rfv]);

	useEffect(() => {
		if (!selected) {
			setCSSVariable('side-width', '0px');
		} else {
			setCSSVariable('side-width', getCSSVariable('side-width-default'));
		}
		return () => {
			setCSSVariable('side-width', getCSSVariable('side-width-default'));
		};
	}, [selected]);

	const operations = useMemo(() => {
		const operations = queryOperations.shownOperations;
		if (operation) {
			if (!operations.find((op) => op.gufi === operation.gufi)) {
				operations.push(operation);
			}
		}
		return operations;
	}, [queryOperations.shownOperations, operation]);

	const onVehicleClick = (vehicle: PositionEntity[]) => {
		return () => {
			history.push(`/map?uvin=${vehicle[0].uvin}&gufi=${vehicle[0].gufi}`);
			return true;
		};
	};
	const liveMapViewProps: LiveMapViewProps = {
		operations: queryOperations.operations, // operations: operations,
		geographicalZones: isShowingGeographicalZones ? queryGeographicalZones.items : [],
		rfvs: queryRfvs.rfvs,
		uvrs: isShowingUvrs ? queryUvrs.uvrs : uvr ? [uvr] : [],
		vehiclePositions: positions || new Map(),
		flightRequests: flightRequests,
		t,
		controlsOptions: {
			geocoder: {
				enabled: true,
				geoapifyApiKey: env.API_keys.geoapify
			}
		},
		handlers: {
			vehicleClick: onVehicleClick
		},
		selected,
		role,
		redirectToCreateOperation
	};

	return (
		<MasterLayout>
			<MapLayout
				// isLoading={{ main: isLoading }}
				menu={
					<>
						<Menu
							setShowingGeographicalZonesFlag={setShowingGeographicalZonesFlag}
							isShowingGeographicalZones={isShowingGeographicalZones}
							setShowingUvrsFlag={setShowingUvrsFlag}
							isShowingUvrs={isShowingUvrs}
						/>
						<Contextual />
					</>
				}
			>
				<LiveMapView
					{...liveMapViewProps}
					onPicked={(e) => redirectToPicked((e as CustomEvent<TokyoPick>).detail)}
				/>
				{env.tenant.extras.realtime_map_buttons && (
					<ExtraRealtimeMapButtons>
						{env.tenant.extras.realtime_map_buttons.map((button) => (
							<PButton
								key={button.label}
								icon={(button.icon as IconName) || undefined}
								onClick={() => {
									history.push(button.path);
								}}
							>
								{t(button.label)}
							</PButton>
						))}
					</ExtraRealtimeMapButtons>
				)}
			</MapLayout>
		</MasterLayout>
	);
};

export default LivePublicMap;
