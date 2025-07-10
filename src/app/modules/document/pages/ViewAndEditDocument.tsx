import PButton from '@pcomponents/PButton';
import PInput from '@pcomponents/PInput';
import PTextArea from '@pcomponents/PTextArea';
import { DocumentEntity } from '@utm-entities/document';
import { observer } from 'mobx-react';
import { CSSProperties, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styles from 'src/app/commons/Pages.module.scss'; //'../../../../commons/Pages.module.scss';
import { UseLocalStoreEntity } from 'src/app/commons/utils';


interface BaseDocumentDetailsProps {
	ls: UseLocalStoreEntity<DocumentEntity>;
	isEditing: boolean;
	isCreating?: boolean;
}

const BaseDocumentDetails: FC<BaseDocumentDetailsProps> = ({ ls, isEditing, isCreating }) => {
	const { t } = useTranslation('glossary');
	const history = useHistory();


	const flags = { isRequired: true, isDarkVariant: true, fill: false, inline: true };
	const document = ls.entity

	console.log('ls.entity', JSON.stringify(ls.entity, null, 2));

	return (
		<>
			<PInput
				id="id"
				defaultValue={ls.entity.id}
				label={t('id')}
				disabled={true}
				onChange={(value: string) => (ls.entity.name = value)}

				{...flags}
			/>
			<PInput
				id="name"
				defaultValue={ls.entity.name}
				label={t('glossary:document.name')}
				disabled={true}
				onChange={(value: string) => (ls.entity.name = value)}
				{...flags}
			/>
			<PInput
				id="tag"
				defaultValue={t(`glossary:${document.referenced_entity_type}.${document.tag}`)}
				label={t('glossary:document.referenced_entity_type')}
				disabled={true}
				onChange={(value: string) => (ls.entity.name = value)}
				{...flags}
			/>
			{/* <PInput
				id="type"
				defaultValue={t(ls.entity.referenced_entity_type || '')}
				label={t('glossary:document.referenced_entity_type')}
				disabled={true}
				onChange={(value: string) => (ls.entity.tag = value)}
				{...flags}
			/> */}

			<PInput
				id="valid"
				defaultValue={t(ls.entity.valid ? 'si' : 'no') || ''}
				label={t('glossary:document.valid')}
				disabled={true}
				onChange={(value: string) => (ls.entity.valid = value === 'true')}
				{...flags}
			/>
			{document.valid && <PInput
				id="validUntil"
				defaultValue={t(new Date(ls.entity.valid_until).toLocaleDateString()) || ''}
				label={t('glossary:document.valid_until')}
				disabled={true}
				onChange={(value: string) => (ls.entity.valid_until = new Date(value))}
				{...flags}
			/>}
			<PTextArea
				id="observations"
				defaultValue={ls.entity.observations}
				label={t('glossary:document.observations')}
				disabled={!isEditing}
				onChange={(value: string) => (ls.entity.observations = value)}
				{...flags}
			/>
			<PInput
				id="entityType"
				defaultValue={t(`ui:${document.referenced_entity_type}`)}
				label={t('glossary:document.referenced_entity_type')}
				disabled={true}
				onChange={(value: string) => (ls.entity.referenced_entity_type = value)}
				{...flags}
			/>
			<PInput
				id="referenced_entity_id"
				defaultValue={t(ls.entity.referenced_entity_id || '')}
				label={t('glossary:document.referenced_entity_id')}
				disabled={true}
				onChange={(value: string) => (ls.entity.tag = value)}
				{...flags}
			/>
			{/* <PTextArea
				id="extrafields"
				defaultValue={JSON.stringify(document.extra_fields, null, 2)}
				label={''}
				disabled={true}
				onChange={(value: string) => (ls.entity.extra_fields = JSON.parse(value))}
				{...flags}
			/> */}
			<PButton onClick={() => {
				const link = `${document.referenced_entity_type}s?id=${encodeURIComponent(document.referenced_entity_id || '')}`
				history.push(link)
			}}>{`${t('ui:Go to')} ${t(`ui:${document.referenced_entity_type}`)}`}</PButton>


		</>
	);
};

const ExtraFieldsDocumentDetails: FC<BaseDocumentDetailsProps> = ({ ls, isEditing, isCreating }) => {
	const { t } = useTranslation('glossary');
	const history = useHistory();


	const flags = { isRequired: true, isDarkVariant: true, fill: false, inline: true };
	const document = ls.entity
	const extraFields: Record<string, any> = document.extra_fields
	Object.keys(extraFields).forEach(key => {

	})

	return (
		<>
			{Object.keys(extraFields).map((key) => {
				return (
					<PInput
						id={extraFields[key]}
						defaultValue={extraFields[key]}
						label={t(`glossary:${document.referenced_entity_type}.${key}`)}
						disabled={true}
						onChange={(value: string) => (console.log(value))}
						{...flags}
					/>
				)
			})}
		</>
	);
};

interface ViewAndEditDocumentProps {
	ls: UseLocalStoreEntity<DocumentEntity>;
	isEditing: boolean;
	isCreating?: boolean;
	style?: CSSProperties;
}

const ViewAndEditDocument: FC<ViewAndEditDocumentProps> = ({ ls, isEditing, isCreating = false, style }) => {
	const { t } = useTranslation();
	return (
		<div className={styles.twobytwo} style={style}>
			<div className={styles.content}>
				<aside className={styles.summary}>
					<h2>{t('Document details')}</h2>
					{/* {t(
						'Documents....'
					)} */}
				</aside>
				<section className={styles.details}>
					<BaseDocumentDetails isEditing={isEditing} isCreating={isCreating} ls={ls} />
				</section>
				<div className={styles.separator} />
				<aside className={styles.summary}>
					<h2>{t('Document extra fields details')}</h2>
					{/* {t(
						'Documents....'
					)} */}
				</aside>
				<section className={styles.details}>
					<ExtraFieldsDocumentDetails isEditing={isEditing} isCreating={isCreating} ls={ls} />
				</section>

			</div>
		</div>
	);
};

export default observer(ViewAndEditDocument);
