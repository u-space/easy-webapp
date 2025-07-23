/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	default as A,
	default as Axios,
	AxiosError,
	AxiosResponse,
	AxiosResponseTransformer
} from 'axios';
//import { observable } from 'mobx';
import Joi, { ValidationError } from 'joi';
import _ from 'lodash';
import { makeAutoObservable } from 'mobx';
import { DocumentEntity } from './document';

import env from '../../../src/vendor/environment/env';
import { buildParametersObject } from './_util';
import { ExtraFields, ExtraFieldSchema } from './extraFields';
import { EntityHasDisplayName } from './types';

const RolesType = Joi.string().valid(
	'admin',
	'monitor',
	'pilot',
	'coa',
	'remote_sensor',
	'air_trafic'
);

export class UserEntity implements EntityHasDisplayName {
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string | null;
	role: string;
	extra_fields: ExtraFields;
	disabled: boolean;
	id: string;
	_userSchema: Joi.ObjectSchema;
	_password_verification: string;
	status: string;
	deletedAt: Date | null;
	updatedAt: Date | null;
	createdAt: Date | null;
	settings: unknown;
	verified: boolean;
	extra_fields_json: string;
	canOperate: boolean;

	[key: string]: any;

	constructor(user: any, schema: ExtraFieldSchema) {
		this.username = (user && user.username) ?? '';
		this.firstName = (user && user.firstName) ?? '';
		this.lastName = (user && user.lastName) ?? '';
		this.email = (user && user.email) ?? '';
		this.password = null;
		this.role = (user && user.role) ?? 'pilot';
		this.extra_fields = {};
		this._password_verification = '';
		this.status = (user && user.status) ?? 'unknown';
		this.deletedAt = (user && user.deletedAt) ?? null;
		this.settings = null;
		this.disabled = (user && user.disabled) ?? false;
		this.verified = user ? (user.verified !== undefined ? user.verified : true) : false;
		this.id = (user && user.id) ?? '';
		this.extra_fields_json = (user && user.extra_fields_json) ?? '';
		this.canOperate = (user && user.canOperate) ?? false;
		this._userSchema = Joi.object({
			//username: Joi.string(),
			firstName: Joi.string(),
			lastName: Joi.string(),
			email: Joi.string().email({ tlds: false }),
			//password: Joi.string().min(8),
			role: RolesType,
			extra_fields: Joi.object(),
			userSchema: Joi.object()
		})
			.custom((obj) => {
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
			})
			.custom((obj) => {
				if (obj.password && obj.password !== obj._password_verification)
					throw new Error('The passwords do not match');
				return obj;
			});
		for (const prop in user) {
			if (
				prop !== 'VolumesOfInterest' &&
				prop !== 'strExtraFields' &&
				prop !== 'password' &&
				prop !== 'asBackendFormat' &&
				prop !== 'asConcatString' &&
				prop !== 'asNiceString' &&
				prop !== 'displayName' &&
				prop !== 'fullName'
			) {
				this[prop] = user[prop];
				if (prop === 'extra_fields') {
					for (const subprop in user.extra_fields) {
						if (subprop !== 'documents') {
							const value = user.extra_fields[subprop];
							if (schema && schema[subprop]?.type === 'Date') {
								this.extra_fields[subprop] = new Date(value);
							} else {
								this.extra_fields[subprop] = value;
							}
						}
					}
					if (user.extra_fields?.documents) {
						this.extra_fields.documents = user.extra_fields.documents.map(
							(doc: any) => {
								return new DocumentEntity(doc);
							}
						);
					}
				}
			}
		}
		if (user?.role) this.role = user.role.toLowerCase();
		this.updatedAt = user && user.updatedAt ? new Date(user.updatedAt) : null;
		this.createdAt = user && user.createdAt ? new Date(user.createdAt) : null;
		makeAutoObservable(this);
	}

	get fullName() {
		return `${this.firstName} ${this.lastName}`;
	}

	canCreateOperations() {
		if (this.role === 'admin') {
			return true;
		} else {
			let canCreate = false;
			if (this.extra_fields.documents && this.extra_fields.documents instanceof Array) {
				this.extra_fields.documents.forEach((doc: DocumentEntity) => {
					if (doc.tag === 'pilotLicense' && doc.valid) {
						canCreate = true;
					}
				});
			}
			return canCreate;
		}
	}

	verify(onSuccess: () => void, onError: (error: ValidationError) => void) {
		const result = this._userSchema.validate(this, {
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
		const errors = [];
		const validation = this._userSchema.validate(this, {
			abortEarly: false,
			allowUnknown: true
		});
		if (validation.error) {

			if (validation.error.details) {
				validation.error.details.forEach((element) => errors.push(element.message));
			}
			errors.push(validation.error);
		}
		return errors;
	}

	isBasic(prop: string) {
		return (
			_.indexOf(['username', 'firstName', 'lastName', 'email', 'role', 'canOperate'], prop) >=
			0
		);
	}

	get displayName() {
		return this.username;
	}

	get asConcatString() {
		return `${this.firstName} ${this.lastName} ${this.email} ${this.role}`;
	}

	get asNiceString() {
		if (this.lastName && this.firstName && this.email) {
			// Normal string for real, complete users
			return `${this.lastName.toUpperCase()}, ${this.firstName} (${this.username}) [${this.email
				}]`;
		} else {
			// Short nicefi'd string for incomplete, users not from backend
			return this.username;
		}
	}

	get asBackendFormat() {
		const user: any = _.cloneDeep(this);

		for (const prop in user) {
			if (prop.startsWith('_')) {
				delete user[prop]; // Dont submit internal data to backend
			}
		}
		delete user.deletedAt;
		delete user.updatedAt;
		return user;
	}
}

export const transformUser = (schema: ExtraFieldSchema) => (user: any) => {
	return new UserEntity(user, schema);
};
export const transformUsers = (schema: ExtraFieldSchema) => (data: any) => {
	return {
		user: data.users.map((user: any) => transformUser(schema)(user)),
		count: data.count
	};
};

export const transformExistsUser = () => (data: any) => {
	return data.exists;
};

/* API Calls */

export interface ChangeUserConfirmationStatusBody {
	username: string;
	verified: boolean;
}

export interface ChangeUserCanOperateStatusBody {
	username: string;
	canOperate: boolean;
}

export type ChangeUserConfirmationStatusResponse = AxiosResponse<
	void,
	ChangeUserConfirmationStatusError
>;
export type ChangeUserConfirmationStatusError = AxiosError<{ message: string }>;

export function getUserAPIClient(api: string, token: string | null, schema: ExtraFieldSchema) {
	const axiosInstance = A.create({
		baseURL: api,
		timeout: env.tiemeout || 50000,
		headers: {
			'Content-Type': 'application/json'
		}
	});

	return {
		getUsers: (
			take: number,
			skip: number,
			orderBy: string,
			order: string,
			filterBy: string,
			filter?: string,
			status?: string
		) => {
			return axiosInstance.get('user', {
				params: {
					...buildParametersObject(take, skip, orderBy, order, filterBy, filter),
					status: status !== 'all' ? status : undefined
				},
				headers: { auth: token },
				transformResponse: (
					Axios.defaults.transformResponse as AxiosResponseTransformer[]
				).concat(transformUsers(schema))
			});
		},
		getUser: (username: string): Promise<AxiosResponse<UserEntity, any>> => {
			return axiosInstance.get(`user/${username}`, {
				headers: { auth: token },
				transformResponse: (
					Axios.defaults.transformResponse as AxiosResponseTransformer[]
				).concat(transformUser(schema))
			});
		},
		userExists: (username: string): Promise<AxiosResponse<boolean, any>> => {
			return axiosInstance.get(`/user/exists/${username}`, {
				headers: { auth: token },
				transformResponse: (
					Axios.defaults.transformResponse as AxiosResponseTransformer[]
				).concat(transformExistsUser())
			});
		},
		verifyUser: (username: string, validationToken: string) => {
			return axiosInstance.post('user/updateStatus', {
				username: username,
				verified: true,
				token: validationToken
			});
		},
		changeUserConfirmationStatus: (username: string, verified: boolean) => {
			return axiosInstance.post<
				void,
				ChangeUserConfirmationStatusResponse,
				ChangeUserConfirmationStatusBody
			>(
				'user/updateUserStatus',
				{ username, verified: verified },
				{ headers: { auth: token } }
			);
		},
		updateCanOperate: (username: string, canOperate: boolean) => {
			return axiosInstance.post<
				void,
				ChangeUserConfirmationStatusResponse,
				ChangeUserCanOperateStatusBody
			>('user/updateCanOperate', { username, canOperate }, { headers: { auth: token } });
		},
		updateUserPassword: (username: string, password: string) => {
			const response = axiosInstance.put(
				`user/password/${username}`,
				{ password },
				{ headers: { auth: token } }
			);
			return response;
		},
		updateUserPasswordToken: (email: string, password: string, token: string) => {
			const response = axiosInstance.post(
				`auth/reset-password`,
				{ email, password, format: 'json', token }
				// { headers: { auth: token } }
			);
			return response;
		},
		deleteUser: (username: string) => {
			return axiosInstance.delete(`user/${username}`, { headers: { auth: token } });
		},
		saveUser: (_user: any, isAdmin: boolean, isCreating = false) => {
			// If no token, you're self-registering
			const user = _.cloneDeep(_user);
			if (!_user.username) {
				user.username = _user.email;
			}
			const errors = _user.validate();
			if (errors.length > 0) return Promise.reject(errors);
			for (const prop in user) {
				if (prop[0] === '_') {
					delete user[prop]; // Dont submit internal data to backend
				}
			}
			if (!isAdmin) delete user.role;
			if (!isCreating) delete user.password;
			delete user.extra_fields_json;
			delete user.deletedAt;
			delete user.createdAt;
			delete user.updatedAt;
			delete user.settings;
			delete user.verified;
			delete user.status;
			delete user.disabled;
			delete user.id;
			const data: any = {};

			for (const key in user) {
				if (key !== 'extra_fields') {
					let value = user[key];
					if (key === 'firstName' || key === 'lastName') {
						value =
							value.length > 0
								? `${value.charAt().toUpperCase()}${value.substring(1)}`
								: value;
					}
					data[key] = value;
				}
			}
			const extraFields: { [key: string]: any } = {};
			for (const key in user.extra_fields) {
				const schemaItem = schema[key];
				if (!schemaItem) continue;

				if (key.indexOf('_file_path') === -1 && key !== 'documents') {
					const type = schemaItem.type;

					if (type === 'String') {
						extraFields[key] = user.extra_fields[key];
					} else if (type === 'Number') {
						extraFields[key] = user.extra_fields[key];
					}
					else if (type === 'Bool') {
						if (typeof user.extra_fields[key] === 'boolean') {
							extraFields[key] = user.extra_fields[key];
						} else {
							extraFields[key] = user.extra_fields[key] === 'true';
						}
					}
					else if (type === 'Date') {
						extraFields[key] = user.extra_fields[key].toISOString();
					}
				}
			}

			data.extra_fields = extraFields;

			if (isCreating) {
				const isLoggedIn = token !== null;

				return axiosInstance.post(
					isLoggedIn ? 'user' : 'user/register',
					isLoggedIn ? data : { ...data, role: undefined, canOperate: undefined },
					{
						headers: { 'Content-Type': 'application/json', ...{ auth: token } }
					}
				);
			} else {
				return axiosInstance.put('user', data, {
					headers: { 'Content-Type': 'application/json', ...{ auth: token } }
				});
			}
		}
	};
}

/*function parseDocument(document, docSchema) {
	const docType = document.type;
	const docSchemaType = docSchema[docType];
	const fileMetadata = {
		type: docType,
		valid_until: new Date(document.valid_until).toISOString(),
		extra_fields: {}
	};
	if (document.id) fileMetadata.id = document.id;
	const extra = document.extra_fields;
	for (const key in extra) {
		const type = docSchemaType[key]?.type;
		if (type === 'Date') {
			fileMetadata.extra_fields[key] = new Date(extra[key]).toISOString();
		} else {
			fileMetadata.extra_fields[key] = extra[key];
		}
	}
	return fileMetadata;
}*/
