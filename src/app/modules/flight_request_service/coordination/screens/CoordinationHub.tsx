import { GridCell, GridCellKind } from '@glideapps/glide-data-grid';
import { observer } from 'mobx-react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import PButton, { PButtonSize, PButtonType } from '@pcomponents/PButton';
import PTooltip from '@pcomponents/PTooltip';
import { useQueryString } from '../../../../utils';
import { useAuthGetRole, useAuthIsAdmin } from '../../../auth/store';
import useQueryCoordinations, { useUpdateCoordination } from '../hooks';
import GenericHub, { GenericHubProps, rowHeight } from '../../../../commons/screens/GenericHub';
import { CoordinationEntity } from '@flight-request-entities/coordination';
import { FC } from 'react';
import ViewAndEditCoordination from '../pages/ViewAndEditCoordination';
import CoordinationSearchTools from '../components/CoordinationSearchTools';
import { useCoordinationStore } from '../store';
import { UseMutationResult } from 'react-query';

interface ExtraActionsProps {
	data: CoordinationEntity;
}


// const ExtraActions: FC<ExtraActionsProps> = ({ data }) => {
// 	console.log(' -> ::: COordination entity:::');
// 	console.log(JSON.stringify(data, null, 2));
// 	const history = useHistory();
// 	return (
// 		<PTooltip content={data.geographical_zone ? 'Show on map' : 'No geographical zone'}>
// 			<PButton
// 				size={PButtonSize.SMALL}
// 				icon={'eye-open'}
// 				variant={PButtonType.SECONDARY}
// 				disabled={!data.geographical_zone}
// 				onClick={() =>
// 					history.replace('/map?geographical-zone=' + data.coordinator?.geographical_zone?[0]['id']).
// 				}
// 			/>
// 		</PTooltip>
// 	);
// };

const CoordinationHub = () => {
	// Other hooks
	const { t } = useTranslation();
	const history = useHistory();
	const queryString = useQueryString();

	// State

	// Props
	const isAdmin = useAuthIsAdmin();
	const role = useAuthGetRole();
	const canEdit = role === 'ADMIN' || role === 'COA' || role === 'AIR_TRAFIC';
	const idSelected = queryString.get('id');
	const columns = [
		{ title: ' ', width: rowHeight * 2 },
		{ title: t('glossary:coordination.reference'), width: 2 },
		{ title: t('glossary:coordination.state'), width: 2 },
		{ title: t('glossary:coordination.limit_date'), width: 3 },
		{ title: t('glossary:coordination.flightRequest'), width: 2 },
		{ title: t('glossary:flightRequest.creator'), width: 2 },
		{ title: t('glossary:flightRequest.role_manager'), width: 2 }
	];

	// Backend
	const query = useQueryCoordinations();
	const { coordinations, count } = query;

	const updateCoordination = useUpdateCoordination();

	// Handlers
	function getData([col, row]: readonly [number, number]): GridCell {
		const coordination = coordinations[row];
		if (coordination) {
			let data;
			let styleOverride;
			let kind = GridCellKind.Text;
			if (col === 1) {
				data = coordination.reference ? coordination.reference : '';
			} else if (col === 2) {
				data = t(`glossary:coordination.states.${coordination.state}`);
			} else if (col === 3) {
				data = new Date(coordination.limit_date).toLocaleString();
				if (new Date(coordination.limit_date) < new Date()) {
					styleOverride = {
						// textDark: 'red',
						bgCell: '#FF00005C'
					};
				}
			} else if (col === 4) {
				data = coordination.flightRequest ? coordination.flightRequest.name : '';
			} else if (col === 5) {
				data = coordination.flightRequest
					? coordination.flightRequest.creator.username
					: '';
			} else if (col === 6) {
				data = coordination.role_manager ? t(coordination.role_manager) : '';
			} else if (col === 0) {
				data = '';
				kind = GridCellKind.Custom;
			}

			if (kind === GridCellKind.Text) {
				return {
					kind: GridCellKind.Text,
					data: data,
					displayData: data,
					allowOverlay: true
				};
			} else {
				return {
					kind: GridCellKind.Custom,
					data: data,
					copyData: data,
					allowOverlay: false
				};
			}
		} else {
			return {
				kind: GridCellKind.Text,
				data: ' ',
				displayData: ' ',
				allowOverlay: false
			};
		}
	}
	const onEntitySelected = (coordination: CoordinationEntity) =>
		history.replace(coordination ? `/coordinations?id=${coordination.id}` : '/coordinations');

	// Effects

	// Components

	return (
		<GenericHub<CoordinationEntity>
			idProperty={'id'}
			// extraActions={ExtraActions as GenericHubProps<CoordinationEntity>['extraActions']}
			getData={getData}
			entitySearchTools={CoordinationSearchTools}
			entityPage={ViewAndEditCoordination}
			extraEntityPageProps={{ isAbleToChangeRole: isAdmin }}
			columns={columns}
			entityName={'coordinations'}
			useStore={useCoordinationStore}
			entities={coordinations}
			onEntitySelected={onEntitySelected}
			idSelected={idSelected}
			updateQuery={updateCoordination as UseMutationResult}
			query={{ ...query, count: count as number }}
			canEdit={() => canEdit}
			canAddNew={false}
		/>
	);
};

export default observer(CoordinationHub);
