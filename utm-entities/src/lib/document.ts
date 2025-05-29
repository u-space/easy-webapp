import env from '../../../src/vendor/environment/env';

import Axios from 'axios';
import { makeAutoObservable } from 'mobx';

export class DocumentEntity {
	downloadFileUrl?: string;
	file?: File;
	extra_fields: Record<string, any>;
	id: string;
	name: string;
	observations: string;
	tag: string;
	type: string | null;
	upload_time: Date;
	valid_until: Date;
	valid: boolean;
	// frontend use only
	isBeingAdded?: boolean;
	notifications?: object;
	referenced_entity_id?: string;
	referenced_entity_type?: string;

	constructor(document: any) {
		this.extra_fields = {};
		this.id = 'TEMPORAL';
		this.name = '';
		this.observations = '';
		this.tag = '';
		this.type = null;
		this.upload_time = new Date();
		this.valid_until = new Date();
		this.valid = false;
		this.isBeingAdded = false;
		this.notifications = {};

		if (document) {
			for (const prop in document) {
				if (this.hasOwnProperty(prop)) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					this[prop] = document[prop];
				}
			}
			try {
				if (document.extra_fields && typeof document.extra_fields === 'string') this.extra_fields = JSON.parse(document.extra_fields);
			} catch (e) {
				console.log(e)
			}
		}

		makeAutoObservable(this);
	}

	get isLocal() {
		return !this.downloadFileUrl;
	}

	get hasSomethingToShow() {
		return !!this.downloadFileUrl || !!this.file;
	}
}

export enum DocumentEntityType {
	USER = 'user',
	VEHICLE = 'vehicle'
}

export const getDocumentAPIClient = (api: string, token: string | null) => {
	const axiosInstance = Axios.create({
		baseURL: api,
		timeout: env.tiemeout || 100000,
		headers: { 'Content-Type': 'application/json' }
	});
	return {
		async saveDocument(
			entityType: DocumentEntityType,
			entityId: string,
			document: DocumentEntity
		) {
			const headers = { 'Content-Type': 'multipart/form-data', auth: token };
			const formData = new FormData();
			if (document.file) formData.append('file', document.file as File);
			for (const prop in document) {
				if (prop === 'file') continue;
				if (prop === 'extra_fields') continue;
				if (prop === 'type') continue;
				if (prop === 'upload_time') continue;
				if (prop === 'whatever') continue;
				if (prop === 'isBeingAdded') continue;
				if (prop === 'notifications') continue;
				formData.append(prop, (document as any)[prop]);
			}
			formData.append('extra_fields_str', JSON.stringify(document.extra_fields));
			formData.append('notifications', JSON.stringify(document.notifications));
			formData.delete('downloadFileUrl');
			formData.delete('name');
			if (document.id.indexOf('TEMP_') === 0) {
				formData.delete('id');
				const response = await axiosInstance.post(
					`/${entityType}/${entityId}/document`,
					formData,
					{
						headers
					}
				);
				return response.data;
			} else {
				const response = await axiosInstance.patch(
					`${entityType}/${entityId}/document`,
					formData,
					{
						headers
					}
				);
				return response.data;
			}
		},
		async updateDocumentValidation(id: string, valid: boolean) {
			const headers = {
				'Content-Type': 'application/json',
				auth: `${token}`
			};

			return axiosInstance.patch<DocumentEntity>(
				`/document/${id}/${(!valid && 'in') || ''}validate`,
				{},
				{ headers }
			);
		},
		async deleteDocument(id: string) {
			const headers = {
				'Content-Type': 'application/json',
				auth: `${token}`
			};

			return axiosInstance.delete<any>(
				`/document/${id}`,
				{ headers }
			);
		},
		async saveDocumentObservation(
			id: string,
			body: { observation: string; userToNotify: string }
		) {
			const headers = {
				'Content-Type': 'application/json',
				auth: `${token}`
			};
			return axiosInstance
				.post<void>(`/document/${id}/observation`, body, { headers })
				.then((res) => {
					alert(
						'Se ha notificado al usuario sobre las observaciones agregadas a su documento'
					);
					return res;
				});
		},
		async getDocumentAvailableTags(entityType: string) {
			const headers = {
				'Content-Type': 'application/json',
				auth: `${token}`
			};
			const response = await axiosInstance.get<string[]>(`/${entityType}/document/tags`, {
				headers
			});
			return response.data;
		},

		async getDocumentSchemas(entityType: string) {
			const headers = {
				'Content-Type': 'application/json',
				auth: `${token}`
			};
			const response = await axiosInstance.get(`/${entityType}/document/schema`, {
				headers
			});
			return response.data;
		},
		async getDocumentTagSchema(entityType: string, tag: string) {
			const headers = {
				'Content-Type': 'application/json',
				auth: `${token}`
			};
			const response = await axiosInstance.get(
				`${entityType}/document/schema/${tag}`,
				{
					headers
				}
			);
			return response.data;
		}
	};
};
