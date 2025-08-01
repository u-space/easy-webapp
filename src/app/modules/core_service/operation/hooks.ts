import { UpdateEntityParams } from '@utm-entities/types';
import { GetOperationsResponse } from '@utm-entities/v2/api/operation';
import { BaseOperation, Operation } from '@utm-entities/v2/model/operation';
import { AxiosError } from 'axios';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { shallow } from 'zustand/shallow';
import { useCoreServiceAPI, useQueryString } from '../../../utils';
import { useAuthIsPilot, useAuthStore } from '../../auth/store';
import { useOperationStore } from './store';

export function useQueryOperation(gufi: string, enabled: boolean) {
	const {
		operation: { getOperation }
	} = useCoreServiceAPI();

	return useQuery<Operation>(['operation', gufi], () => getOperation(gufi), {
		enabled
	});
}
export function useQueryOperations(all = false) {
	const role = useAuthStore((state) => state.role);
	const {
		states,
		pageTake,
		pageSkip,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText,
		historicalFromDate,
		historicalToDate,
		hiddenOperations
	} = useOperationStore(
		(state) => ({
			states: state.getStates(),
			pageTake: state.pageTake,
			pageSkip: state.pageSkip,
			sortingProperty: state.sortingProperty,
			sortingOrder: state.sortingOrder,
			filterProperty: state.filterProperty,
			filterMatchingText: state.filterMatchingText,
			historicalFromDate: state.historicalFromDate,
			historicalToDate: state.historicalToDate,
			hiddenOperations: state.hiddenOperations
		}),
		shallow
	);

	const {
		operation: { getOperations }
	} = useCoreServiceAPI();

	const query = useQuery<
		GetOperationsResponse<Operation> | GetOperationsResponse<BaseOperation>,
		Error
	>(
		[
			'operations',
			states,
			pageTake,
			pageSkip,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText,
			historicalFromDate,
			historicalToDate
		],
		() =>
			getOperations<Operation>(
				role,
				states,
				all ? 99999 : pageTake,
				all ? 0 : pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText,
				all ? undefined : historicalFromDate ? historicalFromDate : undefined,
				all ? undefined : historicalToDate ? historicalToDate : undefined
			).then((response) => {
				if (all) {
					// TODO: this is temporal, backend should not return these ones
					return {
						...response,
						ops: response.ops.flatMap((op) => {
							if (op.end && op.end > new Date()) {
								return [op];
							} else {
								return [];
							}
						})
					};
				} else {
					return response;
				}
			}),
		{ keepPreviousData: true }
	);

	const {
		isLoading: isLoadingOperations,
		isSuccess: isSuccessOperations,
		isError: isErrorOperations,
		data,
		error: errorOperations,
		isPreviousData: isPreviousDataOperations
	} = query;

	const operations = useMemo(() => {
		if (data?.ops) {
			return data.ops;
		} else {
			return [];
		}
	}, [data]);

	const count = useMemo(() => {
		if (data?.count) {
			return data.count;
		} else {
			return -1;
		}
	}, [data]);

	const shownOperations = useMemo(() => {
		if (all) {
			return operations.filter((op) => !hiddenOperations.includes(op.gufi ?? ''));
		} else {
			return operations;
		}
	}, [all, hiddenOperations, hiddenOperations.length, operations]);

	return {
		operations,
		shownOperations,
		count,
		/* DEPRECATED: prefer count */
		countOperations: count,
		/* DEPRECATED: prefer isLoading */
		isLoadingOperations,
		/* DEPRECATED: prefer isSuccess */
		isSuccessOperations,
		/* DEPRECATED: prefer isError */
		isErrorOperations,
		/* DEPRECATED: prefer error */
		errorOperations,
		/* DEPRECATED: prefer isPreviousData */
		isPreviousDataOperations,
		...query
	};
}

export function useQueryOperationsCounts() {
	const token = useAuthStore((state) => state.token);
	const role = useAuthStore((state) => state.role);
	const { sortingProperty, sortingOrder, filterProperty, historicalFromDate, historicalToDate } =
		useOperationStore(
			(state) => ({
				sortingProperty: state.sortingProperty,
				sortingOrder: state.sortingOrder,
				filterProperty: state.filterProperty,
				historicalFromDate: state.historicalFromDate,
				historicalToDate: state.historicalToDate
			}),
			shallow
		);
	const {
		operation: { getOperations }
	} = useCoreServiceAPI();

	const { isSuccess: isSuccessPendingOperations, data: responsePending } = useQuery<
		GetOperationsResponse<Operation> | GetOperationsResponse<BaseOperation>,
		Error
	>(
		[
			'operations_count_pending',
			sortingProperty,
			sortingOrder,
			filterProperty,
			historicalFromDate,
			historicalToDate
		],
		() =>
			getOperations<Operation>(
				role,
				['PENDING'],
				0,
				0,
				sortingProperty,
				sortingOrder,
				filterProperty,
				''
			),
		{ keepPreviousData: true }
	);

	const countPending = isSuccessPendingOperations && responsePending ? responsePending.count : -1;

	const { isSuccess: isSuccessActivatedOperations, data: responseActivated } = useQuery<
		GetOperationsResponse<Operation>,
		Error
	>(
		[
			'operations_count_activated',
			sortingProperty,
			sortingOrder,
			filterProperty,
			historicalFromDate,
			historicalToDate
		],
		() =>
			getOperations<Operation>(
				role,
				['ACTIVATED'],
				0,
				0,
				sortingProperty,
				sortingOrder,
				filterProperty,
				''
			),
		{ keepPreviousData: true }
	);

	const countActivated =
		isSuccessActivatedOperations && responseActivated ? responseActivated.count : -1;

	const { isSuccess: isSuccessRogueOperations, data: responseRogue } = useQuery<
		GetOperationsResponse<Operation>,
		Error
	>(
		[
			'operations_count_rogue',
			sortingProperty,
			sortingOrder,
			filterProperty,
			historicalFromDate,
			historicalToDate
		],
		() =>
			getOperations<Operation>(
				role,
				['ROGUE'],
				0,
				0,
				sortingProperty,
				sortingOrder,
				filterProperty,
				''
			),
		{ keepPreviousData: true }
	);

	const countRogue = isSuccessRogueOperations && responseRogue ? responseRogue.count : -1;

	return {
		countPending,
		countActivated,
		countRogue
	};
}

export function useSaveOperation(onSuccess?: () => void, onError?: (error: Error) => void) {

	const queryClient = useQueryClient();
	const {
		operation: { saveOperation }
	} = useCoreServiceAPI();

	const isPilot = useAuthIsPilot();

	return useMutation<Operation, AxiosError<{ message?: string }>, UpdateEntityParams<Operation>>(
		({ entity }) => saveOperation(entity, isPilot),
		{
			onSuccess: () => {
				// Invalidate and refetch
				queryClient.invalidateQueries('operations').then(
					onSuccess
						? onSuccess
						: () => {
							return;
						}
				);
			},
			onError: (error) => {
				if (onError) {
					onError(error);
				}
			}
		}
	);
}

export function useSelectedOperationAndVolume() {
	const queryString = useQueryString();
	const token = useAuthStore((state) => state.token);

	const {
		operation: { getOperation }
	} = useCoreServiceAPI();

	const idOperation = queryString.get('operation');
	const idVolume = queryString.get('volume');

	const querySelectedOperation = useQuery(
		['operation', idOperation],
		() => getOperation(idOperation || ''),
		{
			enabled: false
		}
	);

	useEffect(() => {
		if (idOperation) {
			querySelectedOperation.refetch();
		}
	}, [idOperation]);

	const operation = querySelectedOperation?.data;
	const volume = useMemo(() => {
		return operation ? _.cloneDeep(operation.operation_volumes[Number(idVolume)]) : undefined;
	}, [idVolume, operation]);

	const selected = useMemo(
		() => ({ gufi: idOperation, volume: idVolume }),
		[idOperation, idVolume]
	);

	return { operation, volume, selected };
}

export function useDeleteOperation() {
	const queryClient = useQueryClient();

	const {
		operation: { deleteOperation }
	} = useCoreServiceAPI();
	return useMutation<void, AxiosError<{ message?: string }>, Operation>(
		(operation) => deleteOperation(operation.gufi || ''),
		{
			onSuccess: () => {
				// Invalidate and refetch
				queryClient.invalidateQueries('operations');
			}
		}
	);
}
