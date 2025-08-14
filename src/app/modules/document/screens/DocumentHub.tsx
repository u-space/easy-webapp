import { DocumentEntity } from '@utm-entities/document';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { CustomCell, GridCell, GridCellKind, TextCell, UriCell } from '@glideapps/glide-data-grid';
import { UseMutationResult } from 'react-query';
import { useDeleteDocument, useQueryDocuments, useUpdateDocument } from '../hooks';
import ViewAndEditDocument from '../pages/ViewAndEditDocument';
import { useDocumentStore } from '../store';
import { observer } from 'mobx-react';
import GenericHub, { GenericHubProps, rowHeight } from 'src/app/commons/screens/GenericHub';
import { useQueryString } from 'src/app/utils';
import { useAuthIsAdmin } from '../../auth/store';
import DocumentSearchTools from '../components/DocumentSearchTools';
import env from 'src/vendor/environment/env';

const ExtraActions: FC<{ data: DocumentEntity }> = ({ data }) => {
	const { t } = useTranslation();
	const history = useHistory();
	return (
		// <PTooltip content={t('View in map')}>
		// 	<PButton
		// 		size={PButtonSize.SMALL}
		// 		icon="eye-open"
		// 		variant={PButtonType.SECONDARY}
		// 		onClick={() => history.push(`/map?document=${data.message_id}`)}
		// 	/>
		// </PTooltip>
		<></>
	);
};

const DocumentHub = () => {
	// Other hooks
	const { t } = useTranslation();
	const history = useHistory();
	const queryString = useQueryString();

	// State
	const isAdmin = useAuthIsAdmin();

	// Props
	const idSelected = queryString.get('id');
	const columns = [
		{ title: ' ', width: rowHeight * 2 }, // Fixed width
		{ title: t('glossary:document.name'), width: 4 }, // Ratios
		{ title: t('glossary:document.tag'), width: 2 },
		{ title: t('glossary:document.referenced_entity_type'), width: 1 },
		{ title: t('glossary:document.referenced_entity_id'), width: 2 },
		{ title: t('glossary:document.valid'), width: 1 },
		{ title: t('glossary:document.valid_until'), width: 1 },
		// { title: t('glossary:document.upload_time'), width: 1 },
		// { title: t('glossary:document.observations'), width: 1 }
	];


	// Backend
	const query = useQueryDocuments();
	const documents = query.documents
	const count = query.count

	const deleteDocument = useDeleteDocument();

	// Handlers
	const onEntitySelected = (document: DocumentEntity) =>
		history.replace(document ? `/documents?id=${document.id}` : '/documents');
	function getData([col, row]: readonly [number, number]): GridCell {
		const document: DocumentEntity = documents == undefined ? undefined : documents[row];
		if (document != undefined) {
			// console.log('document', document)
			let data;
			let kind = GridCellKind.Text;
			let extra = undefined;
			if (col === 1) {
				data = document.name;
			} else if (col === 2) {
				kind = GridCellKind.Text;
				data = t(`glossary:${document.referenced_entity_type}.${document.tag}`);
			} else if (col === 3) {
				kind = GridCellKind.Text;
				data = t(`ui:${document.referenced_entity_type}` || '')
			} else if (col === 4) {
				kind = GridCellKind.Text;
				// t(`ui:${document.referenced_entity_type}` || '')
				extra = document.referenced_entity_id
				data = `${env.public_url}/${document.referenced_entity_type}s/${document.referenced_entity_id}`
			} else if (col === 5) {
				kind = GridCellKind.Text;
				data = document.valid ? t('true') : t('false')
				// kind = GridCellKind.Boolean;
				// data = document.valid
			} else if (col === 6) {
				kind = GridCellKind.Text;
				data = new Date(document.valid_until).toLocaleDateString()
				// } else if (col === 5) {
				// 	kind = GridCellKind.Text;
				// 	data = new Date(document.upload_time).toLocaleString()
			} else if (col === 0) {
				data = '';
				kind = GridCellKind.Custom;
			}

			if (kind === GridCellKind.Text) {
				return {
					kind: GridCellKind.Text,
					data: data || '',
					displayData: extra ? extra : data || '',
					allowOverlay: true
				} as TextCell;
			}
			// else if (kind === GridCellKind.Uri) {
			// 	return {
			// 		kind: GridCellKind.Uri,
			// 		data: data,
			// 		// displayData: 'a',
			// 		allowOverlay: true,

			// 	} as UriCell;
			// }
			else if (kind === GridCellKind.Custom) {
				return {
					kind: GridCellKind.Custom,
					data: data,
					displayData: data,
					copyData: data,
					allowOverlay: false
				} as CustomCell;
			}
		}
		return {
			kind: GridCellKind.Text,
			data: ' ',
			displayData: ' ',
			allowOverlay: false
		};
	}

	return (
		<GenericHub<DocumentEntity>
			idProperty={'id'}
			extraActions={ExtraActions as GenericHubProps<DocumentEntity>['extraActions']}
			getData={getData}
			entitySearchTools={DocumentSearchTools}
			entityPage={ViewAndEditDocument}
			columns={columns}
			entityName={'document'}
			useStore={useDocumentStore}
			entities={documents}
			onEntitySelected={onEntitySelected}
			idSelected={idSelected}
			updateQuery={useUpdateDocument() as UseMutationResult}
			deleteQuery={deleteDocument as UseMutationResult}
			query={{ ...query, count }}
			canEdit={() => isAdmin}
		/>
	);
};

export default observer(DocumentHub);
