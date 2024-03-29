import Axios, { AxiosResponse, AxiosResponseTransformer } from 'axios';
import { AdesRole, FilteringParameters } from '../../_util';
import {
	BaseOperation,
	Operation,
	ResponseBaseOperation,
	ResponseOperation
} from '../model/operation';
import { extractDataFromResponse } from './utils';

// Types

interface GetOperationsSpecificParameters {
	states?: string;
	fromDate?: Date;
	toDate?: Date;
}

export interface GetOperationsResponse<ResponseType> {
	ops: ResponseType[];
	count: number;
}

export const transformBaseOperations = (
	data: GetOperationsResponse<ResponseBaseOperation>
): GetOperationsResponse<BaseOperation> => {
	return {
		ops: data.ops.map(transformBaseOperation),
		count: data.count
	};
};

export const transformBaseOperation = (data: ResponseBaseOperation) => new BaseOperation(data);

export const transformOperations = (data: GetOperationsResponse<ResponseOperation>) => {
	return {
		ops: data.ops.map(transformOperation),
		count: data.count
	};
};

export const transformOperation = (data: ResponseOperation) => new Operation(data);

// API Calls

export interface OperationAPI {
	getOperations<T>(
		role: string,
		states: string[],
		take?: number,
		skip?: number,
		orderBy?: string,
		order?: string,
		filterBy?: string,
		filter?: string,
		fromDate?: Date,
		toDate?: Date
	): Promise<GetOperationsResponse<T>>;
	getOperation(gufi: string): Promise<Operation>;
	saveOperation(operation: Operation, isPilot: boolean): Promise<Operation>;
	deleteOperation(gufi: string): Promise<void>;
}

export function getOperationAPIClient(api: string, token: string | null): OperationAPI {
	const axiosInstance = Axios.create({
		baseURL: api,
		timeout: 60000, // TODO: remove this, added for the screenshot
		headers: { 'Content-Type': 'application/json' }
	});

	function getOperations<T>(
		role: string,
		_states: string[],
		take: number,
		skip: number,
		orderBy: string,
		order: string,
		filterBy: string,
		filter?: string,
		fromDate?: Date,
		toDate?: Date
	) {
		const parameters: FilteringParameters & GetOperationsSpecificParameters = {};
		if (take) parameters.take = take;
		if (skip) parameters.skip = skip;
		if (orderBy) parameters.orderBy = orderBy;
		if (orderBy && order) parameters.order = order;
		if (filter && filterBy) parameters.filterBy = filterBy;
		if (filter) parameters.filter = filter;
		if (_states) parameters.states = JSON.stringify(_states);
		if (fromDate) parameters.fromDate = fromDate;
		if (toDate) parameters.toDate = toDate;

		if (role === AdesRole.ADMIN || role === AdesRole.MONITOR) {
			return axiosInstance
				.get<GetOperationsResponse<T>>('operation', {
					params: parameters,
					headers: { auth: token },
					transformResponse: (
						Axios.defaults.transformResponse as AxiosResponseTransformer[]
					).concat(transformOperations)
				})
				.then(extractDataFromResponse);
		} else if (role === AdesRole.PILOT) {
			return axiosInstance
				.get<GetOperationsResponse<T>>('operation/owner', {
					params: parameters,
					headers: { auth: token },
					transformResponse: (
						Axios.defaults.transformResponse as AxiosResponseTransformer[]
					).concat(transformOperations)
				})
				.then(extractDataFromResponse);
		} else {
			return axiosInstance
				.get<GetOperationsResponse<T>>('operation', {
					params: parameters,
					transformResponse: (
						Axios.defaults.transformResponse as AxiosResponseTransformer[]
					).concat(transformBaseOperations)
				})
				.then(extractDataFromResponse);
		}
	}

	return {
		saveOperation(operation: Operation, isPilot = false) {
			if (isPilot && operation.state === 'CLOSED')
				throw new Error("You can't edit a closed operation");

			return axiosInstance
				.post('operation', operation.asBackendFormat({ omitOwner: isPilot }), {
					headers: { auth: token }
				})
				.then(extractDataFromResponse);
		},
		getOperations,
		getOperation(gufi: string) {
			return axiosInstance
				.get(`operation/${gufi}`, {
					headers: { auth: token },
					transformResponse: (
						Axios.defaults.transformResponse as AxiosResponseTransformer[]
					).concat(transformOperation)
				})
				.then(extractDataFromResponse);
		},
		deleteOperation(gufi: string) {
			return axiosInstance
				.delete(`/operation/${gufi}`, { headers: { auth: token } })
				.then(extractDataFromResponse);
		}
	};
}
