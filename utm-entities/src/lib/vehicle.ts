/* eslint-disable @typescript-eslint/no-explicit-any */

import Axios, { AxiosResponse, AxiosResponseTransformer } from 'axios';
import Joi, { ValidationError } from 'joi';
import _ from 'lodash';
import { makeAutoObservable, observable } from 'mobx';
import env from '../../../src/vendor/environment/env';
import { buildParametersObject, saveExtraFields } from './_util';
import { ExtraFieldSchema, ExtraFields } from './extraFields';
import { EntityHasDisplayName } from './types';
import { UserEntity } from './user';
import { DocumentEntity } from './document';

export enum VehicleAuthorizationStatus {
	NOT_AUTHORIZED = 'NOT_AUTHORIZED',
	AUTHORIZED = 'AUTHORIZED',
	PENDING = 'PENDING'
}
export class VehicleEntity implements EntityHasDisplayName {
	uvin: string;
	date: Date;
	authorized: VehicleAuthorizationStatus;
	registeredBy: string;
	faaNumber: string;
	vehicleName: string;
	manufacturer: string;
	model: string;
	class: string;
	payload: any[];
	operators: any[];
	extra_fields: ExtraFields;
	_vehicleSchema: Joi.ObjectSchema;
	deletedAt: Date | null;
	owner_id: string;
	owner: UserEntity | null;
	remoteSensorValid: boolean;


	[key: string]: VehicleEntity[keyof VehicleEntity];

	constructor(
		vehicle: any,
		schema: ExtraFieldSchema,
		defaultOwner: string | null = null,
		defaultOperator: string | null = null
	) {
		this.uvin = vehicle?.uvin ?? '_temp';
		this.date = new Date(vehicle?.date);
		this.authorized = vehicle?.authorized ?? 'AUTHORIZED';
		this.registeredBy = vehicle?.registeredBy;
		this.faaNumber = vehicle?.faaNumber ?? 'FAANUMBER';
		this.vehicleName = vehicle?.vehicleName ?? '';
		this.manufacturer = vehicle?.manufacturer ?? '';
		this.model = vehicle?.model ?? '';
		this.class = vehicle?.class ?? 'MULTIROTOR';
		this.payload = vehicle?.payload ?? [];
		this.deletedAt = null;
		this.owner_id = vehicle?.owner?.username ?? defaultOwner ?? '';
		this.owner = vehicle?.owner ?? null;
		this.operators = observable(
			vehicle?.operators ?? (defaultOperator ? [defaultOperator] : [])
		);
		this.extra_fields = observable({
			documents: vehicle?.extra_fields?.documents ?? [],
			insurance: vehicle?.extra_fields?.insurance ?? undefined
		});
		this.remoteSensorValid = vehicle?.remoteSensorValid ?? false;
		this._vehicleSchema = Joi.object({
			uvin: Joi.string(),
			//date
			authorized: Joi.string(),
			//registeredBy
			faaNumber: Joi.string(),
			vehicleName: Joi.string(),
			manufacturer: Joi.string(),
			model: Joi.string(),
			class: Joi.string(),
			payload: Joi.array(),
			operators: Joi.array().items(Joi.any()),
			extra_fields: Joi.object(),
			_vehicleSchema: Joi.object(),
			owner: Joi.any().required().invalid(null),			// remoteSensorValid: Joi.boolean()
		}).custom((obj) => {
			for (const [key, value] of Object.entries(schema)) {
				const { type, required } = value;
				if (required && !obj.extra_fields[key]) {
					throw new Error(`${key} is required, but no value was supplied`);
				}
				if (type === 'Date' && !(obj.extra_fields[key] instanceof Date)) {
					throw new Error(
						`${key} should be a date, but ${obj.extra_fields[key]} was supplied`
					);
				}
			}
			return obj;
		});
		if (vehicle) {
			saveExtraFields(vehicle, schema, this);
		}
		makeAutoObservable(this);
	}

	verify(onSuccess: () => void, onError: (error: ValidationError) => void) {
		const result = this._vehicleSchema.validate(this, {
			abortEarly: false,
			allowUnknown: true
		});
		if (result.error) {
			onError(result.error);
		} else {
			onSuccess();
		}
	}

	validate() {
		// console.log('Validating vehicle', this);
		const errors = [];
		const validation = this._vehicleSchema.validate(this, {
			abortEarly: false,
			allowUnknown: true
		});
		if (validation.error) {
			//TODO: Hacer que esto ande bien, y cada error aparezca en la lista y no solamente el privado, con su buena traduccion
			//if (validation.error?.details) {
			//errors.push(validation.error.details.map((err) => err.message));
			//} else {
			errors.push(validation.error);
			//}
		}
		return errors;
	}

	isBasic(prop: string) {
		return (
			_.indexOf(
				[
					'uvin',
					'faaNumber',
					'vehicleName',
					'manufacturer',
					'model',
					'class',
					'owner_id',
					'operators'
				],
				prop
			) >= 0
		);
	}

	get displayName() {
		return this.vehicleName;
	}

	get licensePlate() {
		return this.extra_fields?.caa_registration ?? `${this.manufacturer} ${this.model}`;
	}

	get asNiceString() {
		const serialNumber = this.extra_fields?.serial_number ?? undefined;
		const res = `${this.vehicleName} (${this.licensePlate}) `;
		if (serialNumber && this.licensePlate) {
			return `${res}[${serialNumber}]`;
		} else if (this.licensePlate) {
			return res;
		} else {
			return `${this.vehicleName}`;
		}
	}

	get isAuthorized() {
		return this.authorized === VehicleAuthorizationStatus.AUTHORIZED;
	}

	get asBackendFormat() {
		const vehicle: Partial<VehicleEntity> & { [key: string]: any } = _.cloneDeep(this);

		for (const prop in vehicle) {
			if (prop[0] === '_') {
				delete vehicle[prop]; // Dont submit internal data to backend
			}
		}

		vehicle.operators = vehicle.operators?.map((operator) => {
			if (typeof operator === 'string') {
				return operator;
			} else {
				return operator.username;
			}
		});

		delete vehicle.date;
		//if (vehicle.authorized) delete vehicle.authorized; // TODO: Only if pilot!
		delete vehicle.registeredBy;
		delete vehicle.deletedAt;

		return vehicle;
	}
}



export const vehicleFullAuthorized = (vehicle: VehicleEntity) => {
	const a = vehicle.authorized === VehicleAuthorizationStatus.AUTHORIZED;
	const doucments = vehicle.extra_fields ? vehicle.extra_fields.documents as DocumentEntity[] : [];
	const filterDocuments = doucments.filter((doc, i) => {
		return doc.tag === 'remote_sensor_id' && doc.valid;
	});
	const a2 = filterDocuments.length > 0;

	return a && a2;
};

interface PaginatedVehicles {
	vehicles: VehicleEntity[];
	count: number;
}

export const transformVehicles = (schema: ExtraFieldSchema) => (data: any): PaginatedVehicles => {
	return {
		vehicles: data.vehicles.map((vehicle: any) => new VehicleEntity(vehicle, schema)),
		count: data.count
	};
};

export const transformVehicle = (schema: ExtraFieldSchema) => (vehicle: any) => {
	return new VehicleEntity(vehicle, schema);
};

/* API Calls */
export interface GetVehicleInsuranceSimulationFlySafeParams {
	drone_purchase_year: number;
	capital: number;
	usage: string;
	consents_data_management: boolean;
	consents_precontractual: boolean;
	consents_contractual: boolean;
}
export function getVehicleAPIClient(api: string, token: string | null, schema: ExtraFieldSchema) {
	const axiosInstance = Axios.create({
		baseURL: api,
		timeout: env.tiemeout || 50000,
		headers: { 'Content-Type': 'application/json' }
	});

	return {
		getVehicles: (
			take: number,
			skip: number,
			orderBy: string,
			order: string,
			filterBy: string,
			filter?: string
		) => {
			//TODO add show only pending on state
			let showOnlyPending = 'false';
			if (filterBy === 'authorized' && filter === 'PENDING') {
				showOnlyPending = 'true';
			}
			return axiosInstance.get('vehicle', {
				params: { ...buildParametersObject(take, skip, orderBy, order, filterBy, filter), showOnlyPending },
				headers: { auth: token },
				transformResponse: (
					Axios.defaults.transformResponse as AxiosResponseTransformer[]
				).concat(transformVehicles(schema))
			});
		},
		getVehicle: (uvin: string) => {
			return axiosInstance.get(`/vehicle/${uvin}`, {
				headers: { auth: token },
				transformResponse: (
					Axios.defaults.transformResponse as AxiosResponseTransformer[]
				).concat(transformVehicle(schema))
			});
		},
		getVehiclesByOperator: (
			username: string,
			take: number,
			skip: number,
			filterBy?: string,
			filter?: string
		): Promise<AxiosResponse<PaginatedVehicles>> => {
			return axiosInstance.get('vehicle/operator', {
				params: {
					username,
					...buildParametersObject(take, skip, undefined, undefined, filterBy, filter)
				},
				headers: { auth: token },
				transformResponse: (
					Axios.defaults.transformResponse as AxiosResponseTransformer[]
				).concat(transformVehicles(schema))
			});
		},
		getInsuranceSimulatorByVehicle: (
			vehicle: VehicleEntity,
			params: {
				drone_purchase_year: string;
				capital: string;
				usage: string;
				consent_data_management: boolean;
				consent_precontractual: boolean;
				consent_contractual: boolean;
			}
		) => {
			const {
				drone_purchase_year,
				capital,
				usage,
				consent_data_management,
				consent_precontractual,
				consent_contractual
			} = params;
			return axiosInstance.post(
				'/flysafe/simulate/drone',
				{
					uvin: vehicle.uvin,
					drone_purchase_year,
					capital,
					usage,
					consent_data_management,
					consent_precontractual,
					consent_contractual
				},
				{
					headers: { auth: token }
				}
			);
		},
		getVehicleInsuranceSimulation(
			vehicle: VehicleEntity,
			params: GetVehicleInsuranceSimulationFlySafeParams
		) {
			const {
				drone_purchase_year,
				capital,
				usage,
				consents_data_management,
				consents_precontractual,
				consents_contractual
			} = params;
			return axiosInstance.post(
				'/flysafe/simulate/drone',
				{
					uvin: vehicle.uvin,
					drone_purchase_year,
					capital,
					usage,
					consents_data_management,
					consents_precontractual,
					consents_contractual
				},
				{
					headers: { auth: token }
				}
			);
		},
		saveVehicle: (_vehicle: VehicleEntity, isPilot: boolean, isCreating: boolean) => {
			const errors = _vehicle.validate();
			if (errors.length > 0) return Promise.reject(errors);
			const vehicle: any = _vehicle.asBackendFormat;

			if (isCreating) {
				delete vehicle.authorized;
				delete vehicle.owner;
			} else {
				vehicle.owner = vehicle.owner?.username || '';
			}

			if (isPilot) {
				delete vehicle.owner_id;
				delete vehicle.owner;
				delete vehicle.authorized;
			}

			if (vehicle.uvin === '_temp') delete vehicle.uvin;

			const data: { [key: string]: any } = {};

			for (const key in vehicle) {
				if (key !== 'extra_fields') {
					data[key] = vehicle[key];
				}
			}
			const extraFields: { [key: string]: any } = {};
			for (const key in vehicle.extra_fields) {
				if (
					key.indexOf('_file_path') === -1 &&
					key !== 'documents' &&
					key !== 'insurance'
				) {
					const schemaItem = schema[key];
					if (!schemaItem) continue;

					const type = schemaItem.type;
					if (type === 'String' || type === 'Bool' || type === 'Number') {
						extraFields[key] = vehicle.extra_fields[key];
					} else if (type === 'Date') {
						extraFields[key] = (vehicle.extra_fields[key] as Date).toISOString();
					}
				}
			}

			data.extra_fields = extraFields;

			return axiosInstance.post('vehicle', data, {
				headers: { 'Content-Type': 'application/json', ...{ auth: token } }
			});
		},
		updateVehicleAuthorization(uvin: VehicleEntity['uvin'], status: string) {
			const data = {
				uvin,
				status
			};

			return axiosInstance.post('vehicle/authorize', data, {
				headers: { auth: token }
			});
		}
	};
}
