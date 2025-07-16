import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUpdateVehicle } from '../hooks';
import { useLs } from '../../../../commons/utils';
import { VehicleEntity } from '@utm-entities/vehicle';
import { useSchemaStore } from '../../../schemas/store';
import { useAuthIsAdmin, useAuthStore } from '../../../auth/store';
import NewEntity from '../../../../commons/pages/NewEntity';
import PageLayout from '../../../../commons/layouts/PageLayout';
import { t } from 'i18next';
import AircraftTypeSelect from '../components/AircraftTypeSelect';
import { useQueryAircraftTypes } from '../../aircraft_type/hooks';
import PButton from '@pcomponents/PButton';
import { AircraftType, vehicleType } from '@utm-entities/aircraftType';
import { UseMutationResult } from 'react-query';
import ViewAndEditVehicle from '../pages/ViewAndEditVehicle';
import DashboardLayout from '../../../../commons/layouts/DashboardLayout';
import { getCSSVariable } from '@pcomponents/utils';
import env from '../../../../../vendor/environment/env';
import { useQueryUser } from '../../user/hooks';

export enum FormStep {
	SELECT_FROM_PREDEFINED_VEHICLES = 0,
	COMPLETE_DATA = 1
}

const NewVehicleScreen = () => {
	const history = useHistory();
	const registerVehicle = useUpdateVehicle();
	const data = registerVehicle.data?.data;

	const schemaVehicles = useSchemaStore((state) => state.vehicles);
	const username = useAuthStore((state) => state.username);
	const isAdmin = useAuthIsAdmin();

	const [step, setStep] = useState<FormStep>(0);
	const ls = useLs<VehicleEntity>(new VehicleEntity({}, schemaVehicles, username, null));

	// Aircraft type associated state
	const [hasSelectedAnAircraftType, setHasSelectedAnAircraftType] = useState<boolean>(false);
	const [aircraftType, setAircraftType] = useState<AircraftType | null>(null);
	const { isSuccessAircraftTypes, isLoadingAircraftTypes, aircraftTypes } =
		useQueryAircraftTypes();

	const [options, setOptions] = useState<AircraftType[]>([]);

	const { data: userData } = useQueryUser(username, true);


	useEffect(() => {
		if (userData) {
			ls.entity.owner = userData.data;
		}
	}, [username, userData?.data.username])

	useEffect(() => {
		if (!isLoadingAircraftTypes && isSuccessAircraftTypes) {
			const optionsArr = aircraftTypes.concat({
				manufacturer: 'Aeronave',
				model: 'de fabricación propia',
				id: -1,
				class: vehicleType.MULTIROTOR,
				mtom: '',
				time_autonomy: 0,
				pilot: '',
				band: '',
				color: '',
				lights: '',
				load_weight: 0,
				vhf: false,
				visual_front_sensor: '',
				dimension: '',
				energy: ''
			} as AircraftType);
			setOptions(optionsArr);
		}
	}, [isLoadingAircraftTypes, isSuccessAircraftTypes, aircraftTypes]);

	const onClickFinished = () => history.push(data ? `/vehicles?id=${data.uvin}` : '/vehicles');
	const finishedText = data ? `${data.vehicleName} (${data.manufacturer} ${data.model})` : '';

	if (step === FormStep.SELECT_FROM_PREDEFINED_VEHICLES) {
		return (
			<DashboardLayout>
				<PageLayout
					footer={
						<PButton
							type="submit"
							icon="arrow-right"
							iconLocation="right"
							onClick={() => {
								const aircraftTypeObj = aircraftType;
								if (aircraftTypeObj && aircraftTypeObj.id !== -1) {
									setHasSelectedAnAircraftType(true);
									for (const _key of Object.keys(ls.entity)) {
										const key = _key as keyof VehicleEntity;
										const value = aircraftTypeObj[key];
										if (value) {
											ls.setInfo(key, value);
										}
									}
									for (const key of Object.keys(schemaVehicles)) {
										const value = aircraftTypeObj[key];
										if (value) {
											ls.entity.extra_fields[key] = value;
										}
									}
								} else {
									setHasSelectedAnAircraftType(false);
									for (const _key of Object.keys(ls.entity)) {
										const key = _key as keyof VehicleEntity;
										const value = ls.entity[key];
										if (value) {
											ls.entity.manufacturer = '';
											ls.entity.model = '';
											ls.entity.class = '';
										}
									}
								}
								setStep(FormStep.COMPLETE_DATA);
							}}
							disabled={isLoadingAircraftTypes || !aircraftType}
						>
							{t('Next')}
						</PButton>
					}
					headerText={t('Creating a new vehicle') || ''}
				>
					<div style={{ padding: getCSSVariable('spacing-2') }}>
						<AircraftTypeSelect
							aircraftTypes={options}
							selected={aircraftType}
							onSelected={setAircraftType}
						/>
					</div>
				</PageLayout>
			</DashboardLayout>
		);
	} else if (step === FormStep.COMPLETE_DATA) {
		return (
			<NewEntity
				ls={ls}
				mutation={registerVehicle as UseMutationResult}
				componentProps={{ isAdmin, hasSelectedAnAircraftType }}
				entity={'vehicle'}
				entityComponent={ViewAndEditVehicle}
				onClickFinished={onClickFinished}
				finishedText={finishedText}
				onArrowBack={() => setStep(FormStep.SELECT_FROM_PREDEFINED_VEHICLES)}
			/>
		);
	} else {
		return null;
	}
};

export default observer(NewVehicleScreen);
