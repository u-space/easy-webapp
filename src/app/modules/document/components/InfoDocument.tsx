import PInput from '@pcomponents/PInput';
import PButton, { PButtonProps } from '@pcomponents/PButton';
import { observer } from 'mobx-react';
import { useTranslation } from 'react-i18next';
import { FC } from 'react';
// import CardGroup from '../../../../commons/layouts/dashboard/menu/CardGroup';
import { DocumentEntity } from '@utm-entities/document';
import PNumberInput from '@pcomponents/PNumberInput';
import PDateInput from '@pcomponents/PDateInput';
import PSelect from '@pcomponents/PSelect';
import CardGroup from 'src/app/commons/layouts/dashboard/menu/CardGroup';

interface InfoProps {
	prop: keyof DocumentEntity;
	entity: DocumentEntity;
	setInfo: (prop: keyof DocumentEntity, value: DocumentEntity[keyof DocumentEntity]) => void;
}

const Info: FC<InfoProps> = observer(({ prop, entity, setInfo }) => {
	const { t } = useTranslation('glossary');
	const value = entity[prop];
	if (typeof value === 'string') {
		return (
			<PInput
				key={prop}
				id={`editor-document-${prop}`}
				defaultValue={value}
				label={t(`glossary:document.${prop}`)}
				onChange={(value) => setInfo(prop, value)}
				isRequired
				disabled={prop === 'id'}
			/>
		);
	} else if (typeof value === 'number') {
		return (
			<PNumberInput
				key={prop}
				id={`editor-document-${prop}`}
				defaultValue={value}
				label={t(`glossary:document.${prop}`)}
				onChange={(value) => alert(prop)} //setInfo(prop, value) }
				isRequired
				disabled={prop === 'id'}
			/>
		);
	} else if (entity[prop] instanceof Date) {
		return <PDateInput
			key={prop}
			id={`editor-document-${prop}`}
			label={t(`glossary:document.${prop}`)}
			labelInfo={undefined}
			explanation={undefined}
			placeholder={undefined}
			// defaultValue={new Date(entity[prop])}
			defaultValue={new Date()}
			// defaultValue={entity[value] as Date}
			onChange={(value: Date) => {
				if (prop === 'valid_until' || prop === 'upload_time') {
					entity[prop] = new Date(value)
				}
			}}
			isRequired
			isTime
		/>
	}
	else {
		return null;
	}
});

interface InfoDocumentProps {
	document: DocumentEntity;
	isEditingExisting: boolean;
	props: string[];
	save: PButtonProps['onClick'];
}

const InfoDocument: FC<InfoDocumentProps> = ({ document, isEditingExisting, props, save }) => {
	const { t } = useTranslation(['ui', 'glossary']);
	return (
		<>
			<CardGroup header="Creating a Document">
				{props.map((prop) => (
					<Info
						key={'0' + prop}
						entity={document}
						prop={prop as keyof DocumentEntity}
						setInfo={(prop: keyof DocumentEntity, value: DocumentEntity[keyof DocumentEntity]) => {
							if (value && prop != 'displayName' && prop != 'hasSomethingToShow' && prop != 'isLocal') {
								// document[prop] = value
								alert('fixme')
							}
						}
						}
					/>
				))}
			</CardGroup>
			<PButton onClick={save}>
				{isEditingExisting ? t('Save the Document') : t('Create the Document')}
			</PButton>
		</>
	);
};

export default observer(InfoDocument);
