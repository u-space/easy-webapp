import { FlightRequestEntity, FlightRequestState } from '@flight-request-entities/flightRequest';
import { AxiosError, AxiosResponse } from 'axios';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { shallow } from 'zustand/shallow';
import { useFlightRequestServiceAPI, usePublicFlightRequestServiceAPI, useQueryString } from '../../../utils';
import { useAuthStore } from '../../auth/store';
import { useFlightRequestStore } from './store';

export function useSelectedFlightRequest() {
	const queryString = useQueryString();
	const id = queryString.get('flight-request');

	const {
		flightRequest: { getFlightRequest }
	} = useFlightRequestServiceAPI();

	const querySelectedFlightRequest = useQuery(
		['flightRequest', id],
		() => getFlightRequest(id ?? ''),
		{
			enabled: false,
		}
	);

	useEffect(() => {
		if (id) {
			querySelectedFlightRequest.refetch();
		}
	}, [id]);

	const flightRequest = querySelectedFlightRequest?.data?.data;

	return {
		flightRequest,
		selected: {
			flightRequest: id ?? null
		},
		query: querySelectedFlightRequest
	};
}

export function usePublicSelectedFlightRequest() {
	const queryString = useQueryString();
	const id = queryString.get('flight-request');

	const {
		flightRequest: { getFlightRequest }
	} = usePublicFlightRequestServiceAPI();

	const querySelectedFlightRequest = useQuery(
		['publicFlightRequest', id],
		() => getFlightRequest(id ?? ''),
		{
			enabled: false,
		}
	);

	useEffect(() => {
		if (id) {
			querySelectedFlightRequest.refetch();
		}
	}, [id]);

	const flightRequest = querySelectedFlightRequest?.data?.data;

	return {
		flightRequest,
		selected: {
			flightRequest: id ?? null
		},
		query: querySelectedFlightRequest
	};
}

export interface IUseQueryFlightRequests {
	// data: AxiosResponse<FlightRequestEntity[]> ;
	flightRequests: FlightRequestEntity[];
	count: number;
}

export function useOwnedFlightRequests(): IUseQueryFlightRequests & any {
	const {
		flightRequest: { getFlightRequests }
	} = useFlightRequestServiceAPI();

	const { role, email } = useAuthStore(
		(state) => ({
			role: state.role,
			email: state.email
		}),
		shallow
	);

	const query = useQuery(['flightRequest'], () =>
		getFlightRequests(
			9999,
			0,
			undefined,
			undefined,
			'operator',
			email,
			FlightRequestState.COMPLETED,
			true,
		)
	);
	const { data: response } = query;

	const data = query.isSuccess && response ? response.data : null;
	const flightRequests = data ? data.flightRequests : [];
	const count = data ? data.count : 0;

	return {
		...query,
		flightRequests,
		count
	};
}

export function useQueryFlightRequests(all = false): IUseQueryFlightRequests & any {
	const {
		flightRequest: { getFlightRequests }
	} = useFlightRequestServiceAPI();

	const {
		pageTake,
		pageSkip,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText,
		filterState
	} = useFlightRequestStore(
		(state) => ({
			pageTake: state.pageTake,
			pageSkip: state.pageSkip,
			sortingProperty: state.sortingProperty,
			sortingOrder: state.sortingOrder,
			filterProperty: state.filterProperty,
			filterMatchingText: state.filterMatchingText,
			filterState: state.filterState
		}),
		shallow
	);

	const query = useQuery(
		[
			'flightRequest',
			all ? 99999 : pageTake,
			pageSkip,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText,
			filterState
		],
		() =>
			getFlightRequests(
				pageTake,
				pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText,
				filterState,
				false
			)
	);
	const { data: response } = query;

	const data = query.isSuccess && response ? response.data : null;
	const flightRequests = data ? data.flightRequests : [];
	const count = data ? data.count : 0;

	return {
		...query,
		flightRequests,
		count
	};
}

export function useQueryPublicFlightRequests(all = false): IUseQueryFlightRequests & any {
	const {
		flightRequest: { getFlightRequests }
	} = usePublicFlightRequestServiceAPI();

	const {
		pageTake,
		pageSkip,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText,
		filterState
	} = useFlightRequestStore(
		(state) => ({
			pageTake: state.pageTake,
			pageSkip: state.pageSkip,
			sortingProperty: state.sortingProperty,
			sortingOrder: state.sortingOrder,
			filterProperty: state.filterProperty,
			filterMatchingText: state.filterMatchingText,
			filterState: state.filterState
		}),
		shallow
	);

	const query = useQuery(
		[
			'publicFlightRequests',
			all ? 99999 : pageTake,
			pageSkip,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText,
		],
		() =>
			getFlightRequests(
				pageTake,
				pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText,
				'COMPLETED',
				true
			)
	);
	const { data: response } = query;

	const data = query.isSuccess && response ? response.data : null;
	const flightRequests = data ? data.flightRequests : [];
	const count = data ? data.count : 0;

	return {
		...query,
		flightRequests,
		count
	};
}

export function useUpdateFlightRequest() {
	const queryClient = useQueryClient();
	const { mutate } = useMutateFlightRequestDocuments();

	const {
		flightRequest: { updateFlightRequest }
	} = useFlightRequestServiceAPI();

	return useMutation<AxiosResponse<FlightRequestEntity>, AxiosError<{ message?: string }>,
		{ entity: FlightRequestEntity }
	>(
		async ({ entity: flightRequestEntity }) => {
			if (flightRequestEntity.id) {
				await mutate({ id: flightRequestEntity.id, flightRequest: flightRequestEntity });
			}
			return updateFlightRequest(flightRequestEntity);
		},
		{
			onSuccess: ({ data }) => {
				// Invalidate and refetch
				queryClient.invalidateQueries('flightRequest').then(() => {
					return;
				});
			}
		}
	);
}

export function useUpdateFlightRequestState() {
	const queryClient = useQueryClient();

	const {
		flightRequest: { setFlightRequestState }
	} = useFlightRequestServiceAPI();
	return useMutation<
		AxiosResponse<void>,
		AxiosError<{ message?: string }>,
		{ id: string; state: FlightRequestState }
	>(
		async ({ id, state }) => {
			return setFlightRequestState(id, state);
		},
		{
			onSuccess: () => {
				// Invalidate and refetch
				queryClient.invalidateQueries('flightRequest').then(() => {
					return;
				});
				window.location.href = `${window.location.href}`;
			}
		}
	);
}

export function useMutateFlightRequestDocuments() {
	const queryClient = useQueryClient();

	const {
		flightRequest: { updateFlightRequestDocument }
	} = useFlightRequestServiceAPI();

	return useMutation<
		AxiosResponse<void>,
		AxiosError<{ message?: string }>,
		{ id: string; flightRequest: FlightRequestEntity }
	>(
		async ({ id, flightRequest }) => {
			return updateFlightRequestDocument(id, flightRequest);
		},
		{
			onSuccess: () => {
				// Invalidate and refetch
				queryClient.invalidateQueries('flightRequest').then(() => {
					return;
				});
				// window.location.href = `${window.location.href}`;
			}
		}
	);
}
