import { Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { dateOptions } from '../util';
import { UtmEntity } from '../utm-entity';
import {
	OperationVolume,
	RequestOperationVolume,
	ResponseOperationVolume
} from './operation_volume';
import { NestedUser, ResponseNestedUser } from './user';
import { RequestOperationVehicle, ResponseBaseVehicle, UtmBaseVehicle } from './vehicle';

export const OPERATION_LOCALES_OPTIONS = {
	year: 'numeric' as const,
	month: 'numeric' as const,
	day: 'numeric' as const,
	hour: '2-digit' as const,
	minute: '2-digit' as const
};

export const OperationStateEnum = {
	PROPOSED: 'PROPOSED',
	ACCEPTED: 'ACCEPTED',
	NOT_ACCEPTED: 'NOT_ACCEPTED',
	PENDING: 'PENDING',
	ACTIVATED: 'ACTIVATED',
	ROGUE: 'ROGUE',
	CLOSED: 'CLOSED'
};
export const OperationState = Type.Enum(OperationStateEnum);

export type OperationState = Static<typeof OperationState>;

const ResponseOperationSubscriber = Type.Object({
	name: Type.String(),
	timeZone: Type.Optional(Type.String()),
	email: Type.Optional(Type.String()),
	whatsappMobile: Type.Optional(Type.String())
});

export type ResponseOperationSubscriber = Static<typeof ResponseOperationSubscriber>;

const RequestOperation = Type.Object(
	{
		gufi: Type.Optional(Type.String()), // Undefined when creating a new operation, defined when updating an existing operation
		name: Type.String(),
		contact: Type.String(),
		contact_phone: Type.String(),
		owner: Type.Optional(Type.String()), // Undefined when creating operation as pilot
		//creator: Type.String(),
		flight_comments: Type.Optional(Type.String()),
		operation_volumes: Type.Array(RequestOperationVolume),
		state: OperationState,
		submit_time: Type.Optional(Type.String()), // Undefined when creating a new operation, defined when updating an existing operation
		update_time: Type.Optional(Type.String()), // Undefined when creating a new operation, defined when updating an existing operation
		uas_registrations: Type.Array(RequestOperationVehicle),
		subscribers: Type.Optional(Type.Array(ResponseOperationSubscriber))
	},
	{ additionalProperties: false }
);

export type RequestOperation = Static<typeof RequestOperation>;

const ResponseBaseOperation = Type.Object({
	gufi: Type.String(),
	name: Type.String(),
	contact: Type.String(),
	contact_phone: Type.String(),
	operation_volumes: Type.Array(ResponseOperationVolume),
	state: OperationState,
	uas_registrations: Type.Array(ResponseBaseVehicle)
});

export type ResponseBaseOperation = Static<typeof ResponseBaseOperation>;

const ResponseOperation = Type.Composite([
	ResponseBaseOperation,
	Type.Object({
		gufi: Type.String(),
		submit_time: Type.String(),
		update_time: Type.String(),
		creator: ResponseNestedUser,
		owner: ResponseNestedUser,
		operation_volumes: Type.Array(ResponseOperationVolume),
		flight_comments: Type.Optional(Type.String()),
		subscribers: Type.Optional(Type.Array(ResponseOperationSubscriber))
	})
]);

export type ResponseOperation = Static<typeof ResponseOperation>;

export class BaseOperation {
	// Used for representing public information (i.e. citizen reporting service)
	gufi: string | null;
	name: string;
	operation_volumes: OperationVolume[];
	state: OperationState;
	contact: string; // TODO: backend should prioritize privacy of users, so this shouldn't be sent.
	contact_phone: string;
	uas_registrations: UtmBaseVehicle[];

	constructor(backendOperation?: ResponseBaseOperation) {
		if (backendOperation) {
			// if (!Value.Check(ResponseBaseOperation, backendOperation)) {
			// 	console.error(Array.from(Value.Errors(ResponseBaseOperation, backendOperation)));
			// 	throw new Error(`Backend operation does not match expected schema`);
			// }
			this.gufi = backendOperation.gufi;
			this.name = backendOperation.name;
			this.contact = backendOperation.contact;
			this.contact_phone = backendOperation.contact_phone;
			this.operation_volumes = backendOperation.operation_volumes.map(
				(operationVolume) => new OperationVolume(operationVolume)
			);
			this.state = backendOperation.state;
			this.uas_registrations = backendOperation.uas_registrations.map(
				(vehicle) => new UtmBaseVehicle(vehicle)
			);
		} else {
			// Should not be used directly, as BaseOperations should not be created from the frontend
			// Only by inheriting classes
			this.gufi = null;
			this.name = '';
			this.contact = '';
			this.contact_phone = '';
			this.operation_volumes = [];
			this.state = OperationState.PROPOSED;
			this.uas_registrations = [];
		}
	}

	get begin() {
		if (this.operation_volumes.length === 0) return null;
		return this.operation_volumes[0].effective_time_begin;
	}

	get end() {
		if (this.operation_volumes.length === 0) return null;
		return this.operation_volumes[this.operation_volumes.length - 1].effective_time_end;
	}
	asPrintableEntries() {
		const entries: { property: string; value: string; translatableValue: boolean }[] = [];

		entries.push({ property: 'name', value: this.name, translatableValue: false });
		entries.push({ property: 'state', value: this.state, translatableValue: true });
		entries.push({ property: 'contact', value: this.contact, translatableValue: true });
		entries.push({
			property: 'contact_phone',
			value: this.contact_phone,
			translatableValue: true
		});
		for (const vehicle of this.uas_registrations) {
			entries.push({
				property: 'vehicle',
				value: vehicle.displayName,
				translatableValue: false
			});
		}
		if (this.operation_volumes.length > 0) {
			entries.push({
				property: 'begin',
				value:
					this.operation_volumes[0].effective_time_begin?.toLocaleString(
						undefined,
						dateOptions
					) || '',
				translatableValue: false
			});
			entries.push({
				property: 'end',
				value:
					this.operation_volumes[
						this.operation_volumes.length - 1
					].effective_time_end?.toLocaleString(undefined, dateOptions) || '',
				translatableValue: false
			});
		}
		let max_altitude = 0;
		for (const volume of this.operation_volumes) {
			if (volume.max_altitude > max_altitude) max_altitude = volume.max_altitude;
		}
		entries.push({
			property: 'max_altitude',
			value: `${max_altitude}m`,
			translatableValue: false
		});

		if (this.gufi)
			entries.push({ property: 'gufi', value: this.gufi, translatableValue: false });

		return entries;
	}
}

export type OperationSubscriber = {
	name: string;
	timeZone?: string;
	email?: string;
	whatsappMobile?: string;
};

export class Operation
	extends BaseOperation
	implements UtmEntity<RequestOperation, { omitOwner: boolean }> {
	creator: NestedUser | null;
	owner: NestedUser | null;
	submit_time: Date | null;
	update_time: Date | null;
	flight_comments?: string;
	uas_registrations: UtmBaseVehicle[];
	subscribers?: OperationSubscriber[];

	constructor(backendOperation?: ResponseOperation) {
		super(backendOperation);
		if (backendOperation) {
			backendOperation.flight_comments = backendOperation?.flight_comments || ' ';

			// if (!Value.Check(ResponseOperation, backendOperation)) {
			// 	console.error(
			// 		ResponseOperation,
			// 		Array.from(Value.Errors(ResponseOperation, backendOperation))
			// 	);
			// 	throw new Error(`Backend operation does not match expected schema`);
			// }
			this.creator = new NestedUser(backendOperation.creator);
			this.owner = new NestedUser(backendOperation.owner);
			this.submit_time = new Date(backendOperation.submit_time);
			this.update_time = new Date(backendOperation.update_time);
			this.flight_comments = backendOperation.flight_comments;
			this.uas_registrations = backendOperation.uas_registrations.map(
				(vehicle) => new UtmBaseVehicle(vehicle)
			);
			this.subscribers = backendOperation.subscribers?.map((s) => {
				return {
					name: s.name,
					timeZone: s.timeZone,
					email: s.email,
					whatsappMobile: s.whatsappMobile
				};
			});
		} else {
			this.creator = null;
			this.owner = null;
			this.submit_time = null;
			this.update_time = null;
			this.flight_comments = ' ';
			this.uas_registrations = [];
		}
	}

	asBackendFormat(params: { omitOwner: boolean }): RequestOperation {
		const { omitOwner } = params;
		//if (!this.creator) throw new Error(`Operation creator is not set`);
		if (!omitOwner && !this.owner) throw new Error(`Operation owner is not set`);
		if (omitOwner) this.owner = null;
		// TODO: validate uas_registrations
		if (this.name.length === 0 /* || !/^[a-zA-Z0-9\s]+$/.test(this.name)*/)
			throw new Error('Operation name must be set and alphanumeric');

		// Validate operation volumes
		for (const volume of this.operation_volumes) {
			if (
				volume.operation_geography &&
				volume.operation_geography.coordinates[0].length <= 2
			) {
				throw new Error(
					'The drawn polygon does not have any points, and at least three are required'
				);
			}
			if (
				volume.effective_time_begin &&
				volume.effective_time_end &&
				volume.effective_time_begin >= volume.effective_time_end
			) {
				throw new Error(
					`Operation volume ${volume.ordinal} has its starting time after its ending time, which is invalid`
				);
			}
		}

		const requestOperation: RequestOperation = {
			name: this.name,
			contact: this.contact,
			contact_phone: this.contact_phone,
			state: this.state,
			//creator: this.creator.username,
			operation_volumes: this.operation_volumes.map((volume) => volume.asBackendFormat()),
			uas_registrations: [],
			subscribers: this.subscribers
		};

		if (this.gufi) requestOperation.gufi = this.gufi;
		if (this.owner) requestOperation.owner = this.owner.username;
		if (this.flight_comments) requestOperation.flight_comments = this.flight_comments;

		requestOperation.uas_registrations = this.uas_registrations.map((vehicle) => {
			return {
				uvin: vehicle.uvin
			};
		});

		if (!Value.Check(RequestOperation, requestOperation)) {
			throw new Error(
				Array.from(Value.Errors(RequestOperation, requestOperation))
					.map((error) => error.message)
					.join('\n')
			);
		}
		return requestOperation;
	}

	asPrintableEntries() {
		const entries = super.asPrintableEntries();
		if (this.creator)
			entries.push({
				property: 'creator',
				value: this.creator.username,
				translatableValue: false
			});
		if (this.owner)
			entries.push({
				property: 'owner',
				value: this.owner.username,
				translatableValue: false
			});
		if (this.submit_time)
			entries.push({
				property: 'submit_time',
				value: this.submit_time.toLocaleTimeString(),
				translatableValue: false
			});
		if (this.update_time)
			entries.push({
				property: 'update_time',
				value: this.update_time.toLocaleTimeString(),
				translatableValue: false
			});
		if (this.flight_comments)
			entries.push({
				property: 'flight_comments',
				value: this.flight_comments,
				translatableValue: false
			});
		return entries;
	}

	set(prop: keyof Operation, value: Operation[keyof Operation]) {
		if (prop === 'begin' || prop === 'end' || prop === 'displayName')
			throw new Error('Cannot set begin or end directly');
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this[prop] = value;
	}

	get displayName() {
		return this.name;
	}
}
