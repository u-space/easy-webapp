import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useFlightRequestServiceAPI } from '../../../utils';
import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useFlightRequestStore } from './store';
import { FlightRequestEntity, FlightRequestState } from '@flight-request-entities/flightRequest';
import { AxiosError, AxiosResponse } from 'axios';

export function useSelectedFlightRequest() {
	const { id } = useParams() as { id: string | undefined };
	const {
		flightRequest: { getFlightRequest }
	} = useFlightRequestServiceAPI();

	const querySelectedFlightRequest = useQuery(
		['flightRequest', id],
		() => getFlightRequest(id ?? ''),
		{
			enabled: false
		}
	);
	const { refetch } = querySelectedFlightRequest;

	useEffect(() => {
		if (id) {
			refetch().then(() => {
				return;
			});
		}
	}, [id, refetch]);

	const flightRequest = querySelectedFlightRequest?.data?.data;

	return {
		flightRequest,
		selected: {
			flightRequest: id ?? null
		},
		query: querySelectedFlightRequest
	};
}

export function useQueryFlightRequests(all = false) {
	const {
		flightRequest: { getFlightRequests }
	} = useFlightRequestServiceAPI();

	const {
		pageTake,
		pageSkip,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText
	} = useFlightRequestStore(
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
			'flightRequest',
			all ? 99999 : pageTake,
			pageSkip,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText
		],
		() =>
			getFlightRequests(
				pageTake,
				pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText
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

	const {
		flightRequest: { updateFlightRequest }
	} = useFlightRequestServiceAPI();

	return useMutation<
		AxiosResponse<FlightRequestEntity>,
		AxiosError<{ message?: string }>,
		{ entity: FlightRequestEntity }
	>(
		async ({ entity: flightRequest }) => {
			return updateFlightRequest(flightRequest);
		},
		{
			onSuccess: () => {
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
