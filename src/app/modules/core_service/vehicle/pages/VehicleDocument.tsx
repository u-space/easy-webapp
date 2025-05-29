/* eslint-disable no-mixed-spaces-and-tabs */
import { Spinner } from '@blueprintjs/core';
import { MAX_DATE } from '@pcomponents/PDateInput';
import PDocument from '@pcomponents/PDocument';
import { DocumentEntity } from '@utm-entities/document';
import { VehicleEntity } from '@utm-entities/vehicle';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import { showDate } from 'src/app/commons/displayUtils';
import { getWebConsoleLogger } from '../../../../../utils';
import { UseLocalStoreEntity } from '../../../../commons/utils';
import { useAuthIsAdmin } from '../../../auth/store';
import {
	UseUpdateDocumentObservationParams,
	UseUpdateDocumentValidationParams,
	useDeleteDocument,
	useDocumentTagSchema,
	useUpdateDocumentObservation,
	useUpdateDocumentValidation
} from '../../../document/hooks';
import { useVehicleStore } from '../store';

export interface VehicleDocumentProps {
	ls: UseLocalStoreEntity<VehicleEntity>;
	document: DocumentEntity;
	isEditing: boolean;
	index: number;
	canValidate?: boolean;
}
const showExpiredDate = (schema: any) => {
	return (
		(schema && !schema.__metadata) ||
		(schema && schema.__metadata && !(schema.__metadata.expirable === false))
	);
};
const labelDate = (schema: any, document: DocumentEntity) => {
	if (showExpiredDate(schema)) {
		if (new Date(document.valid_until) < new Date(MAX_DATE)) {
			return 'ui:Valid until';
		} else {
			return 'ui:Not_expirable';
		}
	} else {
		return 'ui:Not_expirable';
	}
};

export const VehicleDocument: FC<VehicleDocumentProps> = ({
	ls,
	document,
	isEditing,
	canValidate,
	index
}) => {
	const [fireRender, setFireRender] = useState(false);

	const queryClient = useQueryClient();
	const {
		pageTake,
		pageSkip,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText
	} = useVehicleStore((state) => ({
		pageTake: state.pageTake,
		pageSkip: state.pageSkip,
		sortingProperty: state.sortingProperty,
		sortingOrder: state.sortingOrder,
		filterProperty: state.filterProperty,
		filterMatchingText: state.filterMatchingText
	}));

	const { t } = useTranslation('glossary');
	const isAdmin = useAuthIsAdmin();
	const { tag } = document;
	const schemaQuery = useDocumentTagSchema('vehicle', tag);

	const title = `${t(`vehicle.${tag}`)}`;
	const label = `${t('ui:Type')}: ${t(`vehicle.${tag}`)}, ${t(labelDate(schemaQuery.data, document))}${showExpiredDate(schemaQuery.data) ? `: ${showDate(document.valid_until)}` : ''}`;
	const explanation = t([`vehicle.${tag}_desc`, '']);
	const id = `input-${document.name || 'new'}`;

	const updateDocumentObservationMutation = useUpdateDocumentObservation();
	const updateDocumentValidationMutation = useUpdateDocumentValidation();
	const deleteDocumentMutation = useDeleteDocument();

	const deleteDocument = (id:string) => {
		deleteDocumentMutation.mutate({
			docId: id
		});
	};

	useEffect(() => {
		if (schemaQuery.data && schemaQuery.data.__metadata && schemaQuery.data.__metadata.expirable === false) {
			if (document.valid_until < new Date(MAX_DATE)) {
				console.log(`Document: ${document.id}, valid_until: ${document.valid_until}`);
				const d = new DocumentEntity({ ...document, valid_until: new Date(MAX_DATE) })
				ls.documents.set(document.id, d);
			}
		}
	}, [schemaQuery.data]);

	const onSaveObservation = (
		observation: UseUpdateDocumentObservationParams['body']['observation']
	) =>
		updateDocumentObservationMutation.mutate({
			docId: document.id,
			body: { observation, userToNotify: ls.entity.owner?.username || '' }
		});
	const onSaveValidation = (validation: UseUpdateDocumentValidationParams['valid']) => {
		updateDocumentValidationMutation.mutate({
			docId: document.id,
			valid: validation
		});
	};

	useEffect(() => {
		if (
			updateDocumentValidationMutation.isSuccess ||
			updateDocumentObservationMutation.isSuccess
		) {
			console.log('Update validation or observation success ');
			queryClient
				.invalidateQueries([
					'vehicles',
					pageTake,
					pageSkip,
					sortingProperty,
					sortingOrder,
					filterProperty,
					filterMatchingText
				])
				.then((a: any) => {
					console.log('Invalidate queries', JSON.stringify(a, null, 2));
					setFireRender(!fireRender);
				});
			//document.valid = updateDocumentValidationMutation.data.data.valid;
			// window.location.href = `${window.location.href}`;
		}
	}, [updateDocumentValidationMutation.isSuccess, updateDocumentObservationMutation.isSuccess]);

	if (!schemaQuery.isLoading && schemaQuery.data) {
		if (
			updateDocumentObservationMutation.isLoading ||
			updateDocumentValidationMutation.isLoading
		) {
			return <Spinner size={8} />;
		}

		return (
			<PDocument
				title={title}
				isEditing={isEditing}
				document={document}
				id={id}
				label={label}
				explanation={explanation}
				isDarkVariant
				schema={schemaQuery.data}
				onClose={() => {
					if (document.isBeingAdded) {
						if (!ls.documents) {
							getWebConsoleLogger().getErrorForDeveloperToFix(
								'ls.documents is undefined in VehiclesViewAndEdit PDocumentWithSchema'
							);
						} else {
							ls.documents.delete(document.id);
						}
					}
				}}
				onSave={(document) => {
					if (!ls.documents) {
						getWebConsoleLogger().getErrorForDeveloperToFix(
							'ls.documents is undefined in VehiclesViewAndEdit PDocumentWithSchema'
						);
					} else {
						ls.documents.set(document.id, document);
					}
				}}
				onDelete={
					document.id.indexOf('TEMP_') === 0
						? () => {
							if (!ls.documents) {
								getWebConsoleLogger().getErrorForDeveloperToFix(
									'ls.documents is undefined in VehiclesViewAndEdit PDocumentWithSchema'
								);
							} else {
								ls.documents.delete(document.id);
							}
						}
						: undefined
				}
				deleteDocument={deleteDocument}
				onSaveObservation={onSaveObservation}
				onSaveValidation={onSaveValidation}
				canValidate={canValidate}
				isAdmin={isAdmin}
			/>
		);
	} else {
		return <Spinner size={8} />;
	}
};
