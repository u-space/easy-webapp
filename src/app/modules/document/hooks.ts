import Axios, { AxiosError, AxiosResponse } from 'axios';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useAuthStore } from '../auth/store';
import { getWebConsoleLogger } from '../../../utils';
import { useCoreServiceAPI } from '../../utils';
import { DocumentEntity, DocumentEntityType } from '@utm-entities/document';
import { useDocumentStore } from './store';

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



export const useQueryDocuments = () => {

	const {
		pageTake,
		pageSkip,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText
	} = useDocumentStore();

	const {
		document: { getDocuments }
	} = useCoreServiceAPI();

	const query = useQuery(
		[
			'documents',
			pageTake,
			pageSkip,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText
		],
		() =>
			getDocuments(
				pageTake,
				pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText,
			),
		{ keepPreviousData: true }
	);

	const data = query.isSuccess ? query.data : null;
	const documents = data ? data.documents : [];
	const count = data ? data.count : 0;

	return {
		...query,
		documents,
		count
	}
	// return useQuery(['documents'], () => getDocuments());

}

export interface UseUpdateDocumentParams {
	document: DocumentEntity;
}
export const useUpdateDocument = () => {
	const queryClient = useQueryClient();

	const {
		document: { saveDocument }
	} = useCoreServiceAPI();

	return useMutation<
		AxiosResponse<any>,
		AxiosError,
		UseUpdateDocumentParams
	>((params) => saveDocument(DocumentEntityType.USER, '', params.document), {
		onSuccess: () => {
			window.location.href = `${window.location.href}`;
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
	return useQuery(['tags'], () => getDocumentAvailableTags(entityType), {
		retry: false,
		retryDelay: 0,
		refetchInterval: false,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: false,
	});
};

export const useDocumentSchemas = (entityType: string) => {
	const {
		document: { getDocumentSchemas }
	} = useCoreServiceAPI();
	return useQuery([`${entityType}-schemas`], () => getDocumentSchemas(entityType), {
		retry: false,
		retryDelay: 0,
		refetchInterval: false,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: false,
	});
};

export const useDocumentTagSchema = (entityType: string, tag: string) => {
	const {
		document: { getDocumentTagSchema }
	} = useCoreServiceAPI();
	return useQuery(['tagSchema', tag], () => getDocumentTagSchema(entityType, tag), {
		retry: false,
		retryDelay: 0,
		refetchInterval: false,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: false,
	});
};
