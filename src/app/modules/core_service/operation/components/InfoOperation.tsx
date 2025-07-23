import PButton, { PButtonProps } from '@pcomponents/PButton';
import PDateInput from '@pcomponents/PDateInput';
import PInput from '@pcomponents/PInput';
import POperationStateSelect from '@pcomponents/POperationStateSelect';
import PTextArea from '@pcomponents/PTextArea';
import PTooltip from '@pcomponents/PTooltip';
import PUserSelectForAdmins from '@pcomponents/PUserSelectForAdmins';
import PVehicleSelect from '@pcomponents/PVehicleSelect';
import CVehicleSelectorSvelte from '@tokyo/gui/CVehicleSelector.svelte';
import { ExtraFieldSchema } from '@utm-entities/extraFields';
import { UserEntity } from '@utm-entities/user';
import { Operation, OperationState } from '@utm-entities/v2/model/operation';
import { NestedUser } from '@utm-entities/v2/model/user';
import { UtmBaseVehicle } from '@utm-entities/v2/model/vehicle';
import { VehicleAuthorizationStatus, VehicleEntity } from '@utm-entities/vehicle';
import { observer } from 'mobx-react';
import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { reactify } from 'svelte-preprocess-react';
import env from '../../../../../vendor/environment/env';
import CardGroup from '../../../../commons/layouts/dashboard/menu/CardGroup';
import { useCoreServiceAPI } from '../../../../utils';
import { useAuthIsAdmin, useAuthIsPilot, useAuthStore } from '../../../auth/store';
const CVehicleSelector = reactify(CVehicleSelectorSvelte);

interface OperationInfoProps {
	prop: string;
	entity: Operation;
	setInfo: (prop: keyof Operation, value: Operation[keyof Operation]) => void;
}

const OperationInfo: FC<OperationInfoProps> = observer(({ prop, entity, setInfo }) => {
	const { t } = useTranslation('glossary');
	if (prop === 'submit_time' || prop === 'update_time' || prop === 'owner' || prop === 'creator')
		return null;
	if (prop === 'flight_comments') {
		return (
			<PTextArea
				style={{ width: '100%' }}
				key={prop}
				id={`editor-operation-${prop}`}
				defaultValue={entity[prop]}
				label={t(`glossary:operation.${prop}`)}
				onChange={(value) => setInfo(prop as keyof Operation, value)}
			/>
		);
	}
	const value = entity[prop as keyof Operation];
	if (typeof value === 'string') {
		return (
			<PInput
				key={prop}
				id={`editor-operation-${prop}`}
				defaultValue={value}
				label={t(`glossary:operation.${prop}`)}
				onChange={(value) => setInfo(prop as keyof Operation, value)}
				isRequired
			/>
		);
	} else if (typeof value === 'object' && value instanceof Date) {
		return (
			<PDateInput
				key={prop}
				id={`editor-volume-${prop}`}
				defaultValue={value}
				label={t(`volume.${prop}`)}
				onChange={(value) => setInfo(prop as keyof Operation, value)}
				isRequired
				isTime
			/>
		);
	} else {
		return null;
	}
});

interface InfoOperationProps {
	operation: Operation;
	schemaUsers: ExtraFieldSchema;
	schemaVehicles: ExtraFieldSchema;
	isEditingExisting: boolean;
	props: string[];
	save: PButtonProps['onClick'];
}

const InfoOperation: FC<InfoOperationProps> = ({
	operation,
	schemaUsers,
	schemaVehicles,
	isEditingExisting,
	props,
	save
}) => {
	const { t } = useTranslation(['ui', 'glossary']);
	const isAdmin = useAuthIsAdmin();
	const isPilot = useAuthIsPilot();
	const token = useAuthStore((state) => state.token);
	const [canCreateOperation, setCanCreateOperation] = useState(false);
	const [reScanVehicles, setReScanVehicles] = useState(false);

	const ownerList = useMemo(() => {
		if (operation.owner) {
			return [new UserEntity(operation.owner, {})];
		}
		return [];
	}, [operation.owner]);

	useEffect(() => {
		const owner = ownerList && ownerList.length > 0 ? ownerList[0] : undefined;
		const hasVehicle = operation.uas_registrations && operation.uas_registrations.length > 0;
		const userCanOperate = owner?.canOperate || false;
		setCanCreateOperation(hasVehicle && userCanOperate);
		// }, [operation.uas_registrations, ownerList]);
	}, [reScanVehicles, operation.owner, operation.uas_registrations]);

	const onSelectUser = (_value: UserEntity[]) => {
		operation.contact = '';
		operation.contact_phone = '';
		// TODO: operation.uas_registrations = [];
		if (_value.length > 0) {
			const value = _value[0];

			operation.owner = new NestedUser(value);

			if (value.fullName) operation.contact = value.fullName;
			if (value.extra_fields?.phone) {
				operation.contact_phone = String(value.extra_fields.phone);
			} else {
				operation.contact_phone = t('The user has no known phone');
			}
		} else {
			operation.owner = null;
		}
	};

	const {
		vehicle: { getVehiclesByOperator }
	} = useCoreServiceAPI();

	const queryVehicles = useQuery(
		[`short_vehicles`, operation.owner],
		() => getVehiclesByOperator(operation.owner?.username as string, 99, 0),
		{
			retryDelay: 0,
			refetchInterval: false,
			refetchIntervalInBackground: false,
			refetchOnWindowFocus: false,
			enabled: !!operation.owner
		}
	);

	const canOperateCauseMsj = () => {
		const hasVehicle = operation.uas_registrations && operation.uas_registrations.length > 0;
		const owner = ownerList && ownerList.length > 0 ? ownerList[0] : undefined;
		const userCanOperate = owner?.canOperate || false;
		if (!userCanOperate) {
			return t('ui:user_cant_create_operation');
		} else if (!hasVehicle) {
			return t('ui:no_select_vehicle');
		} else {
			return t('ui:Create the operation');
		}
	};

	if (!token) return null;
	return (
		<>
			<CardGroup header="Creating an operation">
				{isAdmin && (
					<PUserSelectForAdmins
						label={t('glossary:operation.owner')}
						onSelect={onSelectUser}
						preselected={ownerList}
						fill
						isRequired
						disabled={isPilot}
						token={token}
						isAdmin={isAdmin}
						isPilot={isPilot}
						schema={schemaUsers}
						api={env.core_api}
						id={'user-select-admins'}
					/>
				)}
				{isAdmin && (
					<PVehicleSelect
						api={env.core_api}
						label={t('glossary:operation.uas_registrations')}
						onSelect={(value: VehicleEntity[]) => {
							operation.set(
								'uas_registrations',
								value.map((vehicle) => UtmBaseVehicle.fromVehicleEntity(vehicle))
							);
							// console.log('operation after changing uas_registrations', operation);
							setReScanVehicles(!reScanVehicles);
						}}
						preselected={operation.uas_registrations}
						username={operation.owner?.username}
						fill
						isRequired
						token={token}
						schema={schemaVehicles}
					/>
				)}
				{isPilot && (
					<>
						{queryVehicles.isSuccess &&
							queryVehicles.data.data.vehicles.filter(
								(v) => v.authorized === VehicleAuthorizationStatus.AUTHORIZED
							).length === 0 && (
								<h3>{t('You do not have any authorized vehicles')}</h3>
							)}
						<CVehicleSelector
							vehicles={
								queryVehicles.isSuccess ? queryVehicles.data.data.vehicles : []
							}
							onSelect={(event) => {
								operation.set(
									'uas_registrations',
									(event as CustomEvent<VehicleEntity[]>).detail.map((vehicle) =>
										UtmBaseVehicle.fromVehicleEntity(vehicle)
									)
								);
								setReScanVehicles(!reScanVehicles);
							}}
						>
							{t('Vehicles')}
						</CVehicleSelector>
					</>
				)}
				{isAdmin && isEditingExisting && (
					<POperationStateSelect
						id="editor-state"
						label={t('glossary:operation.state')}
						defaultValue={operation.state}
						onChange={(value: OperationState) => operation.set('state', value)}
						inline={undefined}
						fill={undefined}
						isDarkVariant={undefined}
					/>
				)}
				{props.map((prop) => (
					<OperationInfo
						key={'0' + prop}
						entity={operation}
						prop={prop}
						setInfo={(prop: keyof Operation, value: Operation[keyof Operation]) =>
							operation.set(prop, value)
						}
					/>
				))}
			</CardGroup>
			<PTooltip content={canOperateCauseMsj()} placement="right">
				<PButton onClick={save} disabled={!canCreateOperation}>
					{isEditingExisting ? t('Save the operation') : t('Create the operation')}
				</PButton>
			</PTooltip>
		</>
	);
};

export default observer(InfoOperation);
