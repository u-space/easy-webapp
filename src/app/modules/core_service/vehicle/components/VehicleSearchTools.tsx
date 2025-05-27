import { FC } from 'react';
import CardGroup from '../../../../commons/layouts/dashboard/menu/CardGroup';
import FilterAndOrderSearchTools from '../../../../commons/components/hubs/FilterAndOrderSearchTools';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useVehicleStore } from '../store';
import { shallow } from 'zustand/shallow';
import { Checkbox } from '@blueprintjs/core';

const VehicleSearchToolsExtras = () => {
	const { t } = useTranslation(['ui', 'glossary']);
	const history = useHistory();

	const store = useVehicleStore(
		(state) => ({
			filterMatchingText: state.filterMatchingText,
			filterProperty: state.filterProperty,
			setFilterByText: state.setFilterByText,
			setFilterProperty: state.setFilterProperty,
			// showOnlyPending: state.
		}),
		shallow
	);

	const isFilteringPending =
		store.filterProperty === 'authorized' && store.filterMatchingText === 'PENDING';
	const isFilteringNotAuthorized =
		store.filterProperty === 'authorized' && store.filterMatchingText === 'NOT_AUTHORIZED';

	const resetFilterAuthorization = () => {
		store.setFilterProperty('vehicleName');
		store.setFilterByText('');
		history.replace('/vehicles');
	};

	return (
		<CardGroup header="Filter by type">
			{/* TODO: Replace by generic PCheckbox */}
			<Checkbox
				style={{
					display: 'flex',
					justifyContent: 'flex-start',
					alignItems: 'center'
				}}
				label={t('Show only not authorized vehicles')}
				checked={isFilteringPending}
				onChange={(evt) => {
					if (evt.currentTarget.checked) {
						// store.setFilterProperty('authorized');
						// store.setFilterByText('PENDING');
						history.replace('/vehicles?pending=true');
					} else {
						resetFilterAuthorization();
					}
				}}
			/>

			<Checkbox
				style={{
					display: 'flex',
					justifyContent: 'flex-start',
					alignItems: 'center'
				}}
				label={t('Show only remote sensor')}
				checked={store.filterProperty === 'remotesensorvalid' && store.filterMatchingText === 'false'}
				onChange={(evt) => {
					if (evt.currentTarget.checked) {
						store.setFilterProperty('remotesensorvalid');
						store.setFilterByText('false');
						// history.replace('/vehicles?pending=true');
					} else {
						resetFilterAuthorization();
					}
				}}
			/>
			{/* <Checkbox
				style={{
					display: 'flex',
					justifyContent: 'flex-start',
					alignItems: 'center'
				}}
				label={t('Show only not authorized vehicles')}
				checked={isFilteringNotAuthorized}
				onChange={(evt) => {
					if (evt.currentTarget.checked) {
						store.setFilterProperty('authorized');
						store.setFilterByText('NOT_AUTHORIZED');
					} else {
						resetFilterAuthorization();
					}
				}}
			/> */}
		</CardGroup>
	);
};

const VehicleSearchTools: FC = () => {
	return (
		<FilterAndOrderSearchTools
			useStore={useVehicleStore}
			entityName={'vehicle'}
			searchableProps={['vehicleName', 'model', 'uvin', 'operator', 'extraFields.plate']}
			orderableProps={['date', 'vehicleName', 'model', 'uvin']}
			extra={VehicleSearchToolsExtras}
		/>
	);
};

export default VehicleSearchTools;
