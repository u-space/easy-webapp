import { Spinner } from '@blueprintjs/core';
import PDocumentTagSelector from '@pcomponents/PDocumentTagSelector';
import PFullModal, { PFullModalProps } from '@pcomponents/PFullModal';
import { PModalType } from '@pcomponents/PModal';
import { DocumentEntity } from '@utm-entities/document';
import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	useDocumentAvailableTags,
	useUpdateDocumentObservation,
	useUpdateDocumentValidation
} from '../../../document/hooks';
import { UserDocument } from './UserDocument';
import { ExtraUserFilesProps, DocumentContainer, DocumentStatusLabel } from './ViewAndEditUser';
import { AuthRole, useAuthGetRole } from 'src/app/modules/auth/store';


const documentKey = (doc: DocumentEntity) => {
	return `${doc.tag}-${doc.id}-${String(doc.valid)}`;
}

export const UserDocuments = observer((props: ExtraUserFilesProps) => {
	const { ls, isEditing } = props;
	const { t } = useTranslation(['glossary', 'ui']);
	// useQuery
	const updateDocumentValidationMutation = useUpdateDocumentValidation();
	const updateDocumentObservationMutation = useUpdateDocumentObservation();
	const userDocumentAvailableTagsQuery = useDocumentAvailableTags('user');
	const role = useAuthGetRole();
	// const [fireRender, setFireRender] = useState(false);

	// TODO: Improve this after generic hub fetches entity by entity
	// useEffect(() => {
	// 	if (
	// 		updateDocumentValidationMutation.isSuccess ||
	// 		updateDocumentObservationMutation.isSuccess
	// 	) {
	// 		// setFireRender(!fireRender);
	// 		alert('alerta alerta')
	// 		window.location.href = `${window.location.href}`;
	// 	}
	// }, [updateDocumentValidationMutation.isSuccess, updateDocumentObservationMutation.isSuccess]);

	const isLoading =
		updateDocumentValidationMutation.isLoading || updateDocumentObservationMutation.isLoading;

	const documents = ls.documents;

	const defaultModal = {
		isVisible: false,
		type: PModalType.INFORMATION,
		title: t('ui:Warning'),
		content: t(
			'ui:There are modified or new documents to be saved, please save the changes to the user to store these changes'
		),
		primary: {
			onClick: () => {
				setModalProps(defaultModal);
			}
		}
	};

	const canValidateUserDocument = (role: AuthRole, document: DocumentEntity) => {
		if (role === AuthRole.ADMIN) {
			return true;
		}
		// if (role === AuthRole.REMOTE_SENSOR) {
		// 	return document.tag === 'remote_sensor_id';
		// }
		if (role === AuthRole.PILOT) {
			return false;
		}
		return false;
	};

	const [modalProps, setModalProps] = useState<PFullModalProps>(defaultModal);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				width: '100%'
			}}
		>
			<PFullModal {...modalProps} />
			{isLoading && (
				<div style={{ margin: '0 auto' }}>
					<Spinner />
				</div>
			)}
			{!isLoading && ls.entity?.extra_fields?.documents && (
				<>
					{(ls.entity.extra_fields.documents as DocumentEntity[]).map(
						(document: DocumentEntity, index: number) => {
							return (
								<>
									<DocumentContainer
										key={documentKey(document)}
										style={{ order: document.valid ? 1 : 2 }}
									>
										<UserDocument
											key={documentKey(document)}
											ls={ls}
											document={document}
											isEditing={isEditing}
											index={index}
											canValidate={canValidateUserDocument(role, document)}
										/>
									</DocumentContainer>
									<div
										style={{
											width: '100%',
											height: 1,
											marginBottom: '1rem',
											marginTop: '1rem',
											backgroundColor: 'var(--mirai-200)',
											order: document.valid ? 1 : 2
										}}
									/>
								</>
							);
						}
					)}
				</>
			)}
			{!isLoading && ls.documents && Array.from(ls.documents.values()).length > 0 && (
				<>
					{Array.from(ls.documents.values()).map((document: DocumentEntity, index) => {
						if (document.id.indexOf('TEMP_') === 0) {
							return (
								<>
									<DocumentContainer key={documentKey(document)}>
										<DocumentStatusLabel>({t('ui:NEW')})</DocumentStatusLabel>
										<UserDocument
											key={documentKey(document)}
											ls={ls}
											document={document}
											isEditing={isEditing}
											index={index}
										/>
									</DocumentContainer>
									<div
										style={{
											width: '100%',
											height: 1,
											marginBottom: '1rem',
											marginTop: '1rem',
											backgroundColor: 'var(--mirai-200)'
										}}
									/>
								</>
							);
						} else {
							return null;
						}
					})}
				</>
			)}
			{isEditing && documents && (
				<div style={{ marginLeft: 'auto', marginRight: 'auto' }}>
					{userDocumentAvailableTagsQuery.isLoading && <Spinner />}
					{userDocumentAvailableTagsQuery.isSuccess && (
						<PDocumentTagSelector
							onItemSelect={(item) => {
								const tempId = `TEMP_${Math.random()
									.toString(36)
									.substring(2, 11)}`;

								documents.set(
									tempId,
									new DocumentEntity({
										id: tempId,
										tag: item.value,
										isBeingAdded: true
									})
								);

								setModalProps((state) => ({ ...state, isVisible: true }));
							}}
							tags={userDocumentAvailableTagsQuery.data.map((tag) => ({
								label: t(`user.${tag}`),
								value: tag
							}))}
						/>
					)}
				</div>
			)}
		</div>
	);
});
