import { FlightCategory, FlightRequestEntity } from '@flight-request-entities/flightRequest';
import PBooleanInput from '@pcomponents/PBooleanInput';
import PDropdown from '@pcomponents/PDropdown';
import PInput from '@pcomponents/PInput';
import PTextArea from '@pcomponents/PTextArea';
import PUserSelectForAdmins from '@pcomponents/PUserSelectForAdmins';
import PUserSelectForPilots from '@pcomponents/PUserSelectForPilots';
import CVehicleSelectorSvelte from '@tokyo/gui/CVehicleSelector.svelte';
import { UserEntity } from '@utm-entities/user';
import {
	VehicleAuthorizationStatus,
	VehicleEntity,
	vehicleFullAuthorized
} from '@utm-entities/vehicle';
import { observer } from 'mobx-react';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useQueryUser } from 'src/app/modules/core_service/user/hooks';
import { reactify } from 'svelte-preprocess-react';
import env from '../../../../../vendor/environment/env';
import CardGroup from '../../../../commons/layouts/dashboard/menu/CardGroup';
import { useCoreServiceAPI } from '../../../../utils';
import { useAuthIsAdmin, useAuthIsPilot, useAuthStore } from '../../../auth/store';
import { useSchemaStore } from '../../../schemas/store';
import { useGetVehiclesByOperator } from 'src/app/modules/core_service/vehicle/hooks';
const CVehicleSelector = reactify(CVehicleSelectorSvelte);

interface FlightRequestInfoProps {
	prop: keyof FlightRequestEntity;
	entity: FlightRequestEntity;
	setInfo: (
		prop: keyof FlightRequestEntity,
		value: Exclude<FlightRequestEntity[keyof FlightRequestEntity], undefined>
	) => void;
}

const FlightRequestInfo: FC<FlightRequestInfoProps> = observer(({ prop, entity, setInfo }) => {
	const { t } = useTranslation('glossary');
	if (prop === 'creator') return null;
	const value = entity[prop];
	if (prop === 'flight_comments') {
		return (
			<PTextArea
				style={{ width: '100%' }}
				key={prop}
				id={`editor-flightRequest-${prop}`}
				defaultValue={entity[prop]}
				label={t(`glossary:flightRequest.${prop}`)}
				onChange={(value) => setInfo(prop, value)}
			/>
		);
	}
	if (prop === 'flight_category') {
		return (
			<PDropdown
				key={prop}
				options={Object.values(FlightCategory).map((value) => ({
					value: value,
					label: t(`glossary:flightRequest.flight_category.${value}`)
				}))}
				id={`editor-flightRequest-${prop}`}
				defaultValue={entity[prop]}
				label={t(`glossary:flightRequest.flightCategory`)}
				onChange={(value) => setInfo(prop, value)}
				isRequired
			/>
		);
	}
	if (typeof value === 'string') {
		return (
			<PInput
				key={prop}
				id={`editor-flightRequest-${prop}`}
				defaultValue={value}
				label={t(`glossary:flightRequest.${prop}`)}
				onChange={(value) => setInfo(prop, value)}
				isRequired
				disabled={prop === 'id'}
			/>
		);
	} else if (typeof value === 'boolean') {
		return (
			<PBooleanInput
				key={prop}
				id={`editor-volume-${prop}`}
				defaultValue={value}
				label={t(`flightRequest.${prop}`)}
				onChange={(value) => setInfo(prop, value)}
				isRequired
				fill
			/>
		);
	} else {
		return null;
	}
});

interface InfoFlightRequestProps {
	flightRequest: FlightRequestEntity;
	isEditingExisting: boolean;
	volumeProps: string[];
	setBlockingCenter: (value: boolean) => void;
	children: ReactNode;
}

const InfoFlightRequest: FC<InfoFlightRequestProps> = ({
	flightRequest,
	isEditingExisting,
	volumeProps,
	setBlockingCenter,
	children
}) => {
	const { t } = useTranslation(['ui', 'glossary']);
	const isPilot = useAuthIsPilot();
	const isAdmin = useAuthIsAdmin();
	const username = useAuthStore((state) => state.username);
	const queryUser = useQueryUser(username, true);
	const schemaUsers = useSchemaStore((state) => state.users);
	const schemaVehicles = useSchemaStore((state) => state.vehicles);
	const token = useAuthStore((state) => state.token);
	const [operator, setOperator] = useState<string>('');

	useEffect(() => {
		if (queryUser.isSuccess) {
			const user: UserEntity = queryUser.data?.data;
			setOperator(username);
			flightRequest.setOperator(user);
		}
	}, [queryUser.isSuccess, username]);

	const {
		vehicle: { getVehiclesByOperator }
	} = useCoreServiceAPI();

	// const queryVehicles = useQuery(
	// 	[`short_vehicles`, operator],
	// 	() => getVehiclesByOperator(operator, 99, 0),
	// 	{
	// 		retry: false,
	// 		enabled: operator.length > 0,
	// 		refetchOnWindowFocus: false,
	// 	}
	// );

	const queryVehicles = useGetVehiclesByOperator(operator);

	const onSelectUserForAdmins = (_value: UserEntity[]) => {
		flightRequest.setUavs([]);
		if (_value.length > 0) {
			const value = _value[0];
			setOperator(value.username);
			flightRequest.setOperator(value);
		} else {
			setOperator('');
			flightRequest.setOperator(null);
		}
	};
	const onSelectUserForPilots = (value: string[]) => {
		flightRequest.setUavs([]);
		if (value.length > 0) {
			flightRequest.setOperator(value[0]);
			setOperator(value[0]);
		} else {
			setOperator('');
			flightRequest.setOperator(null);
		}
	};

	const preSelectedForPilots = (value: UserEntity | string | null | undefined) => {
		if (value == null || value === undefined) {
			return '';
		}
		if (typeof value === 'string') {
			return value;
		} else {
			return value.username;
		}
	};

	if (token === null) return null;

	return (
		<CardGroup hasSeparators header="Details of the request">
			<PInput
				id={'editor-volume-name'}
				label={t('glossary:flightRequest.name')}
				isRequired
				onChange={(value) => flightRequest.set('name', value)}
			/>
			{children}

			<div>
				{isAdmin && (
					<PUserSelectForAdmins
						label={t('glossary:flightRequest.operator')}
						onSelect={onSelectUserForAdmins}
						preselected={
							flightRequest.operator ? [flightRequest.operator as UserEntity] : []
						}
						fill
						isRequired
						disabled={isPilot}
						api={env.core_api}
						token={token}
						schema={schemaUsers}
						id={'editor-select-user-pilot'}
					/>
				)}
				{isPilot && (
					<PUserSelectForPilots
						preselected={[preSelectedForPilots(flightRequest.operator)]}
						label={t('glossary:flightRequest.operator')}
						onSelect={onSelectUserForPilots}
						id={'editor-select-user-admin'}
						api={env.core_api}
						token={token}
						schema={schemaUsers}
						disabled={true}
					/>
				)}
			</div>
			<div>
				{queryVehicles.isSuccess && queryVehicles.data &&
					queryVehicles.data.filter(
						(v) => v.authorized === VehicleAuthorizationStatus.AUTHORIZED
					).length === 0 && <h3>{t('You do not have any authorized vehicles')}</h3>}
				<CVehicleSelector
					vehicles={
						queryVehicles.isSuccess && queryVehicles.data
							? queryVehicles.data.sort((v1, v2) => {
								if (vehicleFullAuthorized(v1) && !vehicleFullAuthorized(v2))
									return -1;
								if (!vehicleFullAuthorized(v1) && vehicleFullAuthorized(v2))
									return 1;
								return 0;
							})
							: []
					}
					onSelect={(event) =>
						flightRequest.setUavs((event as CustomEvent<VehicleEntity[]>).detail)
					}
				>
					<p>{t('Vehicles')} <span style={{ color: 'red' }}>*</span></p>
				</CVehicleSelector>
			</div>
			<FlightRequestInfo
				key={'flight_comments'}
				prop={'flight_comments'}
				entity={flightRequest}
				setInfo={(prop, value) => flightRequest.setFlightComments(value as string)}
			/>
			<FlightRequestInfo
				key={'bvlos'}
				prop={'bvlos'}
				entity={flightRequest}
				setInfo={(prop, value) => flightRequest.setBvlos(value as boolean)}
			/>
		</CardGroup>
	);
};

export default observer(InfoFlightRequest);
