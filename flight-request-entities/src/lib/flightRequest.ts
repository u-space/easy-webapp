/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { UserEntity } from '@utm-entities/user';
import { Operation } from '@utm-entities/v2/model/operation';
import { OperationVolume, ResponseOperationVolume } from '@utm-entities/v2/model/operation_volume';
import { VehicleEntity } from '@utm-entities/vehicle';
import Axios, { AxiosResponseTransformer } from 'axios';
import Joi from 'joi';
import { makeAutoObservable } from 'mobx';
import { buildFilterAndOrderParametersObject } from './_util';
import { CoordinationEntity } from './coordination';
import { GeographicalZone } from './geographicalZone';
import { EntityHasDisplayName } from './types';

export enum FlightRequestState {
	REQUIRE_APPROVAL = 'REQUIRE_APPROVAL',
	PENDING = 'PENDING',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
	REJECTED = 'REJECTED',
	PREFLIGHT = 'PREFLIGHT'
}

export enum FlightCategory {
	OPEN = 'OPEN',
	STS_01 = 'STS_01',
	STS_02 = 'STS_02',
	A2 = 'A2',
	A3 = 'A3'
}

export class FlightRequestEntity implements EntityHasDisplayName {
	id?: string;
	name: string;
	volumes: Array<OperationVolume>;
	uavs: Array<VehicleEntity>;
	state?: FlightRequestState;
	operation?: Operation[];
	coordination?: CoordinationEntity[];
	operator?: UserEntity | string | null;
	creator?: UserEntity;
	flight_comments: string;
	urban_flight: boolean;
	parachute_model?: string;
	dji_blocked: boolean;
	dji_controller_number: string;
	dji_email: string;
	paid: boolean;
	createdAt: Date;
	flight_category: FlightCategory;
	geographicalZones?: GeographicalZone[] = [];
	bvlos: boolean;
	document1?: File;
	document2?: File;
	document1Update: boolean;
	document2Update: boolean;



	[key: string]: FlightRequestEntity[keyof FlightRequestEntity];

	constructor(existing: any = {}) {
		const {
			name = '',
			volumes = [],
			uavs = [],
			state = FlightRequestState.REQUIRE_APPROVAL,
			flight_comments = '',
			urban_flight = false,
			parachute_model = '',
			dji_blocked = false,
			dji_controller_number = '',
			dji_email = '',
			flight_category = FlightCategory.OPEN,
			operator,
			creator,
			operation,
			coordination,
			geographicalZones,
			id,
			paid,
			createdAt,
			bvlos,
			document1,
			document2
		} = existing;

		this.name = name;
		this.id = id;
		this.volumes = volumes
			? volumes.map((volume: ResponseOperationVolume) => new OperationVolume(volume))
			: [];
		this.uavs = uavs;
		this.state = state;
		this.operation = operation;
		this.coordination = coordination;
		this.operator = operator;
		this.flight_comments = flight_comments;
		this.urban_flight = urban_flight;
		this.parachute_model = parachute_model;
		this.dji_blocked = dji_blocked;
		this.dji_controller_number = dji_controller_number;
		this.dji_email = dji_email;
		this.flight_category = flight_category;
		this.geographicalZones = geographicalZones;
		this.creator = creator;
		this.paid = paid;
		this.createdAt = createdAt;
		this.bvlos = bvlos || false;
		this.document1 = document1;
		this.document2 = document2;
		this.document1Update = false;
		this.document2Update = false;

		makeAutoObservable(this);
	}

	get displayName() {
		return this.id || '(temp)';
	}

	setGeographicalZones(geographicalZones: GeographicalZone[]) {
		this.geographicalZones = geographicalZones;
	}

	setId(id: string) {
		this.id = id;
	}

	setVolumes(volumes: Array<OperationVolume>) {
		this.volumes = volumes;
	}

	setUavs(uavs: Array<VehicleEntity>) {
		this.uavs = uavs;
	}

	setState(state: FlightRequestState) {
		this.state = state;
	}

	setOperation(operation: Operation[]) {
		this.operation = operation;
	}

	setCoordination(coordination: CoordinationEntity[]) {
		this.coordination = coordination;
	}

	setOperator(operator: UserEntity | string | null) {
		this.operator = operator;
	}

	setFlightComments(flight_comments: string) {
		this.flight_comments = flight_comments;
	}

	setUrbanFlight(urban_flight: boolean) {
		this.urban_flight = urban_flight;
	}

	setBvlos(bvlos: boolean) {
		this.bvlos = bvlos;
	}

	setParachuteModel(parachute_model: string) {
		this.parachute_model = parachute_model;
	}

	setDjiBlocked(dji_blocked: boolean) {
		this.dji_blocked = dji_blocked;
	}

	setDjiControllerNumber(dji_controller_number: string) {
		this.dji_controller_number = dji_controller_number;
	}

	setDjiEmail(dji_email: string) {
		this.dji_email = dji_email;
	}

	setFlightCategory(flight_category: FlightCategory) {
		this.flight_category = flight_category;
	}

	set(
		property: keyof FlightRequestEntity,
		value: FlightRequestEntity[keyof FlightRequestEntity]
	) {
		if (property === 'displayName') return;
		if (property === 'document1') {
			this.document1Update = true;
		}
		if (property === 'document2') {
			this.document2Update = true;
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this[property] = value;
	}

	get asBackendFormat() {
		const result = {
			...this,
			operator: {
				username:
					typeof this.operator === 'string' ? this.operator : this.operator?.username
			},
			volumes: this.volumes.map((_volume) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const volume = _volume.asBackendFormat() as any;
				// TODO: Remove this conversions when operation backend is fixed and does not expect strings for numbers
				volume.min_altitude = Number(volume.min_altitude);
				volume.max_altitude = Number(volume.max_altitude);
				volume.ordinal = Number(volume.ordinal);
				return volume;
			})
		};
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		delete result.createdAt;
		return result;
	}
}

export const APICoordinatorSchema = Joi.object({
	id: Joi.string(),
	liaison: Joi.string().required(),
	type: Joi.string().required(),
	telephone: Joi.string().optional().allow(''),
	email: Joi.string().optional().allow(''),
	minimun_coordination_days: Joi.number().required(),
	price: Joi.number(),
	discount_Multiple_Dates: Joi.number(),
	geographical_zone: Joi.string(),
	manual_coordinator_procedure: Joi.object().allow(null),
	automatic_coordinator_procedure: Joi.object().allow(null)
});

// API

const transformFlightRequests = (data: any) => {
	return {
		count: data.count,
		flightRequests: data.flightRequests.map((flightRequest: any) => {
			return new FlightRequestEntity(flightRequest);
		})
	};
};

export const getFlightRequestAPIClient = (api: string, token: string | null) => {
	const axiosInstance = Axios.create({
		baseURL: api,
		timeout: 1200000,
		headers: { 'Content-Type': 'application/json' }
	});

	return {
		async saveFlightRequest(flightRequest: FlightRequestEntity): Promise<FlightRequestEntity> {
			const { data } = await axiosInstance.post(
				'/flightRequest',
				flightRequest.asBackendFormat,
				{
					headers: { auth: token }
				}
			);
			return data;
		},
		async saveFlightRequestPostPayment(sessionId: string) {
			return axiosInstance.post(
				'/flightRequest/finalize',
				{ sessionId },
				{
					headers: { auth: token }
				}
			);
		},
		async updateFlightRequest(flightRequest: FlightRequestEntity) {
			// Api ask us to delete the state bacause state change has separated endpoint
			const body = flightRequest.asBackendFormat;
			//check date integrity, if not return error
			for (const volume of body.volumes) {
				if (volume.effective_time_begin != undefined && volume.effective_time_end != undefined) {
					if (new Date() > volume.effective_time_begin) {
						throw new Error('The start date must be greater than today');
					}
					if (volume.effective_time_begin > volume.effective_time_end) {
						throw new Error('The start date must be less than the end date');
					}
				}
				else {
					throw new Error('Invalid data entered');
				}

			}
			// delete body.state;
			const { data } = await axiosInstance.put(`/flightRequest/${body.id}`, body, {
				headers: { auth: token }
			});
			return data;
		},
		async setFlightRequestState(flightRequestId: string, state: FlightRequestState) {
			const { data } = await axiosInstance.patch(
				`/flightRequest/${flightRequestId}/changeState`,
				{ state },
				{
					headers: { auth: token }
				}
			);
			return data;
		},
		async updateFlightRequestDocument(flightRequestId: string, flightRequest: FlightRequestEntity) {
			const formData = new FormData();

			if (flightRequest.document1) {
				console.log('flightRequest.document1', flightRequest.document1);
				formData.append('document1', flightRequest.document1);
				formData.append('document1_name', flightRequest.document1.name);
			}
			if (flightRequest.document2) {
				console.log('flightRequest.document2', flightRequest.document2);
				formData.append('document2', flightRequest.document2);
				formData.append('document2_name', flightRequest.document2.name);
			}

			const { data } = await axiosInstance.post(
				`/flightRequest/${flightRequestId}/document`,
				formData,
				{
					headers: { "Content-Type": "multipart/form-data", auth: token }
				}
			);
			return data;
		},
		getFlightRequest(id: string) {
			return axiosInstance.get(`flightRequest/${id}`, {
				headers: { auth: token },
				transformResponse: Axios.defaults.transformResponse as AxiosResponseTransformer[]
			});
		},
		getFlightRequests(
			take: number,
			skip: number,
			orderBy?: string,
			order?: string,
			filterBy?: string,
			filter?: string,
			filterState?: string,
			validDate?: boolean
		) {
			return axiosInstance.get('flightRequest', {
				params: {
					...buildFilterAndOrderParametersObject(
						take,
						skip,
						orderBy,
						order,
						filterBy,
						filter
					),
					filterState: filterState,
					validDate
				},
				headers: { auth: token },
				transformResponse: (
					Axios.defaults.transformResponse as AxiosResponseTransformer[]
				).concat(transformFlightRequests)
			});
		}
	};
};
