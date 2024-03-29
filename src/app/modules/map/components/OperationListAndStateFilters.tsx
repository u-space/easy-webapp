import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import PInput from '@pcomponents/PInput';
import { useTokyo } from '@tokyo/store';
import { OPERATION_STATE_COLORS_CSS } from '@tokyo/TokyoDefaults';
import { observer } from 'mobx-react';
import { useOperationStore } from '../../core_service/operation/store';
import { shallow } from 'zustand/shallow';
import CardGroup from '../../../commons/layouts/dashboard/menu/CardGroup';
import GridCheckboxes from '../../../commons/layouts/dashboard/menu/GridCheckboxes';
import { useQueryOperations } from '../../core_service/operation/hooks';
import { useMemo } from 'react';
import { Polygon } from 'geojson';

const OperationListAndStateFilters = () => {
	const {
		filterShowProposed,
		filterShowAccepted,
		filterShowActivated,
		filterShowPending,
		filterShowRogue,
		filterShowClosed,
		filterShowNotAccepted,
		filterMatchingText,
		setFilterProposed,
		setFilterAccepted,
		setFilterActivated,
		setFilterPending,
		setFilterProperty,
		setFilterByText,
		setFilterRogue,
		setFilterClosed,
		setFilterNotAccepted,
		hiddenOperations,
		toggleHiddenOperation
	} = useOperationStore(
		(state) => ({
			filterShowProposed: state.filterShowProposed,
			filterShowAccepted: state.filterShowAccepted,
			filterShowActivated: state.filterShowActivated,
			filterShowPending: state.filterShowPending,
			filterShowRogue: state.filterShowRogue,
			filterShowClosed: state.filterShowClosed,
			filterMatchingText: state.filterMatchingText,
			filterShowNotAccepted: state.filterShowNotAccepted,
			setFilterProposed: state.setFilterProposed,
			setFilterAccepted: state.setFilterAccepted,
			setFilterActivated: state.setFilterActivated,
			setFilterPending: state.setFilterPending,
			setFilterProperty: state.setFilterProperty,
			setFilterByText: state.setFilterByText,
			setFilterRogue: state.setFilterRogue,
			setFilterClosed: state.setFilterClosed,
			setFilterNotAccepted: state.setFilterNotAccepted,
			hiddenOperations: state.hiddenOperations,
			toggleHiddenOperation: state.toggleHiddenOperation
		}),
		shallow
	);

	const { t } = useTranslation();
	const tokyo = useTokyo();

	let gridItems = [
		{
			checked: filterShowProposed,
			onChange: (check: boolean) => setFilterProposed(check),
			label: 'PROPOSED'
		},
		{
			checked: filterShowAccepted,
			onChange: (check: boolean) => setFilterAccepted(check),
			label: 'ACCEPTED'
		},
		{
			checked: filterShowActivated,
			onChange: (check: boolean) => setFilterActivated(check),
			label: 'ACTIVATED'
		},
		{
			checked: filterShowPending,
			onChange: (check: boolean) => setFilterPending(check),
			label: 'PENDING'
		},
		{
			checked: filterShowRogue,
			onChange: (check: boolean) => setFilterRogue(check),
			label: 'ROGUE'
		},
		{
			checked: filterShowClosed,
			onChange: (check: boolean) => setFilterClosed(check),
			label: 'CLOSED'
		},
		{
			checked: filterShowNotAccepted,
			onChange: (check: boolean) => setFilterNotAccepted(check),
			label: 'NOT_ACCEPTED'
		}
	];

	gridItems = gridItems.map((item) => ({
		...item,
		legendColor:
			OPERATION_STATE_COLORS_CSS[item.label as keyof typeof OPERATION_STATE_COLORS_CSS]
	}));

	const updateFilter = _.debounce(
		(text) => {
			setFilterProperty('name');
			setFilterByText(text);
		},
		250,
		{
			trailing: true,
			leading: false
		}
	);

	const { operations } = useQueryOperations(true);

	const operationGridItems = useMemo(() => {
		return operations.map((operation) => ({
			checked: !hiddenOperations.includes(operation.gufi as string),
			onClick: () => {
				if (operation.operation_volumes.length > 0)
					tokyo.flyToCenterOfGeometry(
						operation.operation_volumes[0].operation_geography as Polygon
					);
			},
			onChange: (check: boolean) => {
				toggleHiddenOperation(operation.gufi as string);
			},
			label: operation.name
		}));
	}, [operations]);

	return (
		<>
			<CardGroup header="Filter by state">
				<GridCheckboxes gridItems={gridItems} />
			</CardGroup>
			<CardGroup header="Search for a specific operation">
				<PInput
					onChange={(text) => updateFilter(text)}
					defaultValue={filterMatchingText}
					id="search"
					placeholder={`${t('Operation')}...`}
				/>
			</CardGroup>
			<CardGroup header="Matching operations">
				<GridCheckboxes gridItems={operationGridItems} />
			</CardGroup>
		</>
	);
};

export default observer(OperationListAndStateFilters);
