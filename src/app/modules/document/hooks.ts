import Axios, { AxiosError, AxiosResponse } from 'axios';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useAuthStore } from '../auth/store';
import { getWebConsoleLogger } from '../../../utils';
import { useCoreServiceAPI } from '../../utils';
import { DocumentEntity } from '@utm-entities/document';

export interface UseUpdateDocumentValidationParams {
	docId: string;
	valid: boolean;
}

export const useUpdateDocumentValidation = () => {
	const queryClient = useQueryClient();

	const {
		document: { updateDocumentValidation }
	} = useCoreServiceAPI();

	return useMutation<
		AxiosResponse<DocumentEntity>,
		AxiosError,
		UseUpdateDocumentValidationParams
	>((params) => updateDocumentValidation(params.docId, params.valid), {
		onSuccess: () => {
			window.location.href = `${window.location.href}`;

			// queryClient.invalidateQueries(['users']).then(() => {
			// 	return;
			// });
			// queryClient.invalidateQueries(['vehicles']).then(() => {
			// 	return;
			// });
		},
		onError: (error) => {
			getWebConsoleLogger().getBackendError(error);
		}
	});
};

export interface UseDeleteDocumentParams {
	docId: string;
}

export const useDeleteDocument = () => {
	const queryClient = useQueryClient();

	const {
		document: { deleteDocument }
	} = useCoreServiceAPI();

	return useMutation<
		AxiosResponse<any>,
		AxiosError,
		UseDeleteDocumentParams
	>((params) => deleteDocument(params.docId), {
		onSuccess: () => {
			window.location.href = `${window.location.href}`;
		},
		onError: (error) => {
			getWebConsoleLogger().getBackendError(error);
		}
	});
};

export interface UseUpdateDocumentObservationParams {
	docId: string;
	body: {
		observation: string;
		userToNotify: string;
	};
}

export const useUpdateDocumentObservation = () => {
	const queryClient = useQueryClient();

	const {
		document: { saveDocumentObservation }
	} = useCoreServiceAPI();

	return useMutation<AxiosResponse<void>, AxiosError, UseUpdateDocumentObservationParams>(
		(params) => saveDocumentObservation(params.docId, params.body),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['users', 'vehicles']);
			},
			onError: (error) => {
				getWebConsoleLogger().getBackendError(error);
			}
		}
	);
};

export const useDocumentAvailableTags = (entityType: string) => {
	const {
		document: { getDocumentAvailableTags }
	} = useCoreServiceAPI();
	return useQuery(['tags'], () => getDocumentAvailableTags(entityType));
};

export const useDocumentSchemas = (entityType: string) => {
	const {
		document: { getDocumentSchemas }
	} = useCoreServiceAPI();
	return useQuery([`${entityType}-schemas`], () => getDocumentSchemas(entityType));
};

export const useDocumentTagSchema = (entityType: string, tag: string) => {
	const {
		document: { getDocumentTagSchema }
	} = useCoreServiceAPI();
	return useQuery(['tagSchema', tag], () => getDocumentTagSchema(entityType, tag));
};
