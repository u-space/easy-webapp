import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useCoreServiceAPI, useQueryString } from '../../../utils';
import {
	GetVehicleInsuranceSimulationFlySafeParams,
	VehicleAuthorizationStatus,
	VehicleEntity
} from '@utm-entities/vehicle';
import { useVehicleStore } from './store';
import { shallow } from 'zustand/shallow';
import { useAuthIsPilot, useAuthStore } from '../../auth/store';
import { AxiosError, AxiosResponse } from 'axios';
import { DocumentEntity } from '@utm-entities/document';
import { NotificationType, useNotificationStore } from '../../notification/store';
import { useEffect, useMemo } from 'react';
import { usePositionStore } from '../position/store';

/* Hooks */

export function useQueryVehicle(uvin: VehicleEntity['uvin']) {
	const {
		vehicle: { getVehicle }
	} = useCoreServiceAPI();

	const query = useQuery(['vehicle'], () => getVehicle(uvin), { enabled: false });

	const { isSuccess: isSuccessVehicle, data: response } = query;

	const data = isSuccessVehicle ? response.data : null;
	const vehicle = data ? data : null;

	return {
		...query,
		vehicle
	};
}

// export function useQueryPendingVehiclesCount() {
// 	const {
// 		vehicle: { getVehicles }
// 	} = useCoreServiceAPI();

// 	const { sortingProperty, sortingOrder } = useVehicleStore(
// 		(state) => ({ sortingProperty: state.sortingProperty, sortingOrder: state.sortingOrder }),
// 		shallow
// 	);

// 	const query = useQuery(
// 		['vehicles_pending_vehicles_count', sortingProperty, sortingOrder],
// 		() =>
// 			getVehicles(
// 				1,
// 				0,
// 				sortingProperty,
// 				sortingOrder,
// 				'authorized',
// 				VehicleAuthorizationStatus.PENDING
// 			),
// 		{ keepPreviousData: true }
// 	);

// 	const { isSuccess: isSuccessVehicles, data: response } = query;

// 	return isSuccessVehicles ? response.data.count : -1;
// }

export function useGetVehiclesByOperator(username: string) {
	const {
		vehicle: { getVehiclesByOperator }
	} = useCoreServiceAPI();
	const query = useQuery(
		[`short_vehicles_op_${username}`],
		() => getVehiclesByOperator(username, 200, 0),
		{
			retry: false,
			enabled: !!username,
			retryDelay: 0,
			refetchInterval: false,
			refetchIntervalInBackground: false,
			refetchOnWindowFocus: false,
		}
	); // TODO: Do show an error in case isErrorVehicles
	const data = (!query.isError) ? query.data?.data.vehicles : [];
	return { ...query, data };
}
export function useSelectedVehicle() {
	const queryString = useQueryString();
	const idVehicle = queryString.get('uvin');
	const idOperation = queryString.get('gufi');

	const {
		vehicle: { getVehicle }
	} = useCoreServiceAPI();

	const query = useQuery(['vehicle', idVehicle], () => getVehicle(idVehicle || ''), {
		enabled: false
	});

	useEffect(() => {
		if (idVehicle) {
			query.refetch().then();
		}
	}, [idVehicle, query]);

	const selected = useMemo(
		() => ({ gufi: idOperation, uvin: idVehicle }),
		[idOperation, idVehicle]
	);

	const vehicle = useMemo(() => {
		if (query.data?.data) {
			return query.data.data;
		} else {
			return null;
		}
	}, [query]);

	const positions = usePositionStore((state) => state.positions);
	const latestPosition = useMemo(() => {
		if (positions && positions.has(idOperation || '')) {
			const positionsOfOperation = positions.get(idOperation || '');
			if (!positionsOfOperation) return undefined;
			return positionsOfOperation[positionsOfOperation.length - 1];
		} else {
			return undefined;
		}
	}, [idOperation]);

	return { vehicle, latestPosition, selected, query };
}

export function useQueryVehicles(all = false) {
	const {
		vehicle: { getVehicles }
	} = useCoreServiceAPI();

	const {
		pageTake,
		pageSkip,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText
	} = useVehicleStore(
		(state) => ({
			pageTake: state.pageTake,
			pageSkip: state.pageSkip,
			sortingProperty: state.sortingProperty,
			sortingOrder: state.sortingOrder,
			filterProperty: state.filterProperty,
			filterMatchingText: state.filterMatchingText
		}),
		shallow
	);

	const query = useQuery(
		[
			'vehicles',
			pageTake,
			pageSkip,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText
		],
		() =>
			getVehicles(
				all ? 99999 : pageTake,
				all ? 0 : pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText
			),
		{ keepPreviousData: true }
	);

	const {
		isLoading: isLoadingVehicles,
		isSuccess: isSuccessVehicles,
		isError: isErrorVehicles,
		data: response,
		error: errorVehicles,
		isPreviousData: isPreviousDataVehicles
	} = query;

	const data = isSuccessVehicles ? response.data : null;
	const vehicles = data ? data.vehicles : [];
	const count = data ? data.count : 0;

	return {
		...query,
		vehicles,
		count,
		/* DEPRECATED */
		isLoadingVehicles,
		/* DEPRECATED */
		isSuccessVehicles,
		/* DEPRECATED */
		isErrorVehicles,
		/* DEPRECATED */
		errorVehicles,
		/* DEPRECATED */
		isPreviousDataVehicles,
		/* DEPRECATED */
		extra: query
	};
}

export function useUpdateVehicle() {
	const queryClient = useQueryClient();
	const {
		multi: { saveVehicleAndDocuments }
	} = useCoreServiceAPI();
	const isPilot = useAuthIsPilot();

	return useMutation<
		AxiosResponse<VehicleEntity>,
		AxiosError,
		{ entity: VehicleEntity; documents: Map<string, DocumentEntity>; isCreating: boolean }
	>(
		({ entity: vehicle, documents, isCreating }) =>
			saveVehicleAndDocuments(vehicle, documents, isPilot, isCreating),
		{
			onSuccess: () => {
				// Invalidate and refetch
				queryClient.invalidateQueries('vehicles').then(() => {
					return;
				});
			}
		}
	);
}

export function useUpdateVehicleAuthorization() {
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const {
		vehicle: { updateVehicleAuthorization }
	} = useCoreServiceAPI();

	const addNotification = useNotificationStore((state) => state.add);

	return useMutation<
		AxiosResponse<VehicleEntity>,
		AxiosError,
		{ uvin: VehicleEntity['uvin']; status: VehicleAuthorizationStatus }
	>(({ uvin, status }) => updateVehicleAuthorization(uvin, status), {
		onSuccess: (response) => {
			// Invalidate and refetch
			queryClient.invalidateQueries('vehicles').then(() => {
				return;
			});
			const data = response.data;
			let text = '';
			if (data.authorized) {
				switch (data.authorized) {
					case 'NOT_AUTHORIZED':
						text = t('The vehicle x has been deauthorized correctly', {
							x: data.vehicleName
						});
						break;
					case 'AUTHORIZED':
						text = t('The vehicle x has been authorized correctly', {
							x: data.vehicleName
						});
						break;
					case 'PENDING':
						text = t('The vehicle x is now pending authorization', {
							x: data.vehicleName
						});
						break;
				}
			}
			addNotification({
				type: NotificationType.INFO,
				body: text,
				link: `/vehicles?id=${data.uvin}`
			});
		}
	});
}

export function useGetVehicleInsuranceSimulation() {
	const {
		vehicle: { getVehicleInsuranceSimulation }
	} = useCoreServiceAPI();
	return useMutation<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		AxiosResponse<{ data: { data: { premium_total: number } } }>,
		AxiosError,
		{ vehicle: VehicleEntity; params: GetVehicleInsuranceSimulationFlySafeParams }
	>(({ vehicle, params }) => getVehicleInsuranceSimulation(vehicle, params), {
		onSuccess: (response) => {
			const data = response.data;
		}
	});
}
