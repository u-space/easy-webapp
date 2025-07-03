import PBooleanInput from '@pcomponents/PBooleanInput';
import PButton, { PButtonSize, PButtonType } from '@pcomponents/PButton';
import PDateInput from '@pcomponents/PDateInput';
import PInput from '@pcomponents/PInput';
import PNumberInput from '@pcomponents/PNumberInput';
import POperationStateSelect from '@pcomponents/POperationStateSelect';
import PTextArea from '@pcomponents/PTextArea';
import PUserSelectForPilots from '@pcomponents/PUserSelectForPilots';
import PVehicleSelect from '@pcomponents/PVehicleSelect';
import { operationTokyoConverter } from '@tokyo/converters/core/operation';
import { useTokyo } from '@tokyo/store';
import Tokyo from '@tokyo/Tokyo.svelte';
import TokyoGenericMapElement from '@tokyo/TokyoGenericMapElement.svelte';
import { EditMode, TokyoProps } from '@tokyo/types';
import { Operation } from '@utm-entities/v2/model/operation';
import { UtmBaseVehicle } from '@utm-entities/v2/model/vehicle';
import { Polygon } from 'geojson';
import { observer } from 'mobx-react';
import { CSSProperties, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { reactify } from 'svelte-preprocess-react';
import env from '../../../../../vendor/environment/env';
import styles from '../../../../commons/Pages.module.scss';
import { UseLocalStoreEntity } from '../../../../commons/utils';
import { AuthRole, useAuthGetRole, useAuthStore } from '../../../auth/store';
import { useSchemaStore } from '../../../schemas/store';

interface BaseOperationDetailsProps {
	ls: UseLocalStoreEntity<Operation>;
	isEditing: boolean;
	isCreating: boolean;
}

const BaseOperationDetails = (props: BaseOperationDetailsProps) => {
	const { ls, isEditing, isCreating } = props;
	const { t } = useTranslation('glossary');
	const flags = { isRequired: true, isDarkVariant: true };
	return (
		<>
			{!isCreating && (
				<PInput
					id="gufi"
					defaultValue={ls.entity.gufi || ''}
					label={t('operation.gufi')}
					disabled={true}
					{...flags}
					inline
				/>
			)}
			<PInput
				id="name"
				defaultValue={ls.entity.name}
				label={t('operation.name')}
				disabled={!isEditing}
				onChange={(value) => (ls.entity.name = value)}
				inline
				{...flags}
			/>
			{Object.keys(ls.entity).map((_prop) => {
				const prop = _prop as keyof Operation;
				const op = ls.entity;
				const value = ls.entity[prop] as string | null;
				if (
					prop !== 'gufi' &&
					prop !== 'name' &&
					prop !== 'state' &&
					prop !== 'flight_comments' &&
					prop !== 'owner' &&
					prop !== 'uas_registrations' &&
					prop !== 'creator' &&
					prop !== 'begin' &&
					prop !== 'end' &&
					prop !== 'displayName' &&
					prop !== 'operation_volumes' &&
					value !== null
				) {
					const id = `input-${prop}`;
					const label = t(`operation.${prop}`);
					const explanation = t(`operation.${prop}_desc`);
					if (prop === 'submit_time' || prop === 'update_time') {
						return (
							<PDateInput
								key={prop}
								id={id}
								// defaultValue={value}
								label={label}
								// explanation={explanation}
								disabled={true}
								onChange={(value) => {
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									ls.entity[prop] = value;
								}}
								{...flags}
								isTime
								inline
							/>
						);
					} else {
						return (
							<PInput
								key={prop}
								id={id}
								defaultValue={value}
								label={label}
								explanation={explanation}
								disabled={(!isEditing)}
								onChange={(value) => {
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									ls.entity[prop] = value;
								}}
								{...flags}
								inline
							/>
						);
					}
				} else {
					return null;
				}
			})}
		</>
	);
};

interface DetailedOperationDetailsProps {
	ls: UseLocalStoreEntity<Operation>;
	isEditing: boolean;
	isAdmin?: boolean;
}

const DetailedOperationDetails = (props: DetailedOperationDetailsProps) => {
	const { t } = useTranslation('glossary');
	const { ls, isEditing, isAdmin = false } = props;

	const token = useAuthStore((state) => state.token);
	const role = useAuthGetRole();
	const schemaVehicles = useSchemaStore((state) => state.vehicles);
	const schemaUsers = useSchemaStore((state) => state.users);

	const flags = { isRequired: true, isDarkVariant: true, fill: true };

	return (
		<>
			{token && schemaUsers && (
				<PUserSelectForPilots
					id="owner"
					label={t('glossary:operation.owner')}
					onSelect={(_users) => {
						return;
					}}
					preselected={ls.entity.owner ? [ls.entity.owner.username] : []}
					fill
					isRequired
					disabled
					isDarkVariant
					api={env.core_api}
					schema={schemaUsers}
					token={token}
				/>
			)}
			<POperationStateSelect
				id="state"
				label={t('glossary:operation.state')}
				defaultValue={ls.entity.state}
				onChange={(value: string) => ls.setInfo('state', value)}
				isDarkVariant
				disabled={!(isEditing && (role === AuthRole.PILOT || role === AuthRole.ADMIN))}
				inline={false}
				fill={false}
				validAllTransitions={role === AuthRole.ADMIN}
			/>

			<PVehicleSelect
				label={t('glossary:operation.uas_registrations')}
				onSelect={(value: UtmBaseVehicle[]) => ls.setInfo('uas_registrations', value)}
				preselected={ls.entity.uas_registrations}
				username={ls.entity?.owner?.username}
				fill
				isDarkVariant
				disabled
				isRequired
				token={token}
				schema={schemaVehicles}
				api={env.core_api}
			/>

			{/* <PTextArea
				id="flight_comments"
				defaultValue={ls.entity.aircraft_comments}
				label={t('operation.aircraft_comments')}
				disabled={!isEditing}
				onChange={(value) => (ls.entity.aircraft_comments = value)}
				{...flags}
			/> */}
			<PTextArea
				id="flight_comments"
				defaultValue={ls.entity.flight_comments}
				label={t('operation.flight_comments')}
				disabled={!isEditing}
				onChange={(value) => (ls.entity.flight_comments = value)}
				{...flags}
			/>
		</>
	);
};

interface VolumeDetailsProps {
	ls: UseLocalStoreEntity<Operation>;
	isEditing: boolean;
	isAbleToChangeDates: boolean;
}

const TokyoSvelte = reactify(Tokyo);
const TokyoGenericMapElementSvelte = reactify(TokyoGenericMapElement);
const MapContainer = styled.div`
	position: relative;
	height: 500px;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
`;

const VolumeDetails: FC<VolumeDetailsProps> = ({ ls, isEditing, isAbleToChangeDates }) => {
	const { t } = useTranslation(['ui', 'glossary']);
	const tokyo = useTokyo();
	// TODO: Multiple volumes
	const volume = ls.entity.operation_volumes[0];
	const flags = { isRequired: true, isDarkVariant: true, fill: true };
	const tokyoOptions: TokyoProps = {
		editOptions: {
			mode: EditMode.DISABLED
		},
		mapOptions: {
			isPickEnabled: false
		},
		controlsOptions: {
			zoom: {
				enabled: true
			},
			geolocator: {
				enabled: false
			},
			backgroundModeSwitch: {
				enabled: true
			},
			geocoder: {
				enabled: false,
				geoapifyApiKey: env.API_keys.geoapify
			}
		},
		t
	};

	const history = useHistory();

	return (
		<>
			<MapContainer>
				<TokyoSvelte {...tokyoOptions}>
					<TokyoGenericMapElementSvelte
						id={operationTokyoConverter.getId(ls.entity)}
						getLayer={operationTokyoConverter.getConverter(ls.entity)}
						onLoad={() =>
							tokyo.flyToCenterOfGeometry(volume.operation_geography as Polygon)
						}
					/>
				</TokyoSvelte>
				<div style={{ flex: 0, position: 'absolute', bottom: 0, left: 0 }}>
					<PButton
						size={PButtonSize.SMALL}
						icon="eye-open"
						variant={PButtonType.PRIMARY}
						onClick={() => history.push(`/map?operation=${ls.entity.gufi}`)}
					>
						{t('View complete map')}
					</PButton>
				</div>
			</MapContainer>
			<PDateInput
				id="effective_time_begin"
				label={t('glossary:volume.effective_time_begin')}
				defaultValue={volume.effective_time_begin || new Date()}
				onChange={(value) => volume.set('effective_time_begin', value)}
				disabled={!isEditing || !isAbleToChangeDates}
				inline
				isTime
				{...flags}
			/>
			<PDateInput
				id="effective_time_begin"
				label={t('glossary:volume.effective_time_end')}
				defaultValue={volume.effective_time_end || new Date()}
				onChange={(value) => volume.set('effective_time_end', value)}
				disabled={!isEditing || !isAbleToChangeDates}
				inline
				isTime
				{...flags}
			/>
			{Object.keys(volume).map((prop) => {
				if (
					prop !== 'operation_geography' &&
					prop !== 'ordinal' &&
					prop !== 'actual_time_end' &&
					prop !== 'id' &&
					prop !== 'beyond_visual_line_of_sight' &&
					prop !== 'volume_type' &&
					prop !== 'effective_time_begin' &&
					prop !== 'effective_time_end' &&
					prop !== 'near_structure'
				) {
					const id = `input-${prop}`;
					const label = t(`glossary:volume.${prop}`);
					const value = volume.get(prop);
					if (typeof value === 'number') {
						return (
							<PNumberInput
								key={prop}
								id={id}
								isDarkVariant
								disabled={!isEditing}
								inline
								defaultValue={value}
								label={label}
								onChange={(value) => {
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									ls.entity.operation_volumes[0].set(prop, value);
								}}
							/>
						);
					} else {
						return null;
					}
				} else {
					return null;
				}
			})}
			<PBooleanInput
				id="near_structure"
				defaultValue={ls.entity.operation_volumes[0].near_structure}
				label={t('glossary:volume.near_structure')}
				disabled={!isEditing}
				onChange={(value) => ls.entity.operation_volumes[0].set('near_structure', value)}
				isRequired
				isDarkVariant
				inline
			/>
			<PBooleanInput
				id="beyond_visual_line_of_sight"
				defaultValue={ls.entity.operation_volumes[0].beyond_visual_line_of_sight}
				label={t('glossary:volume.beyond_visual_line_of_sight')}
				disabled={!isEditing}
				onChange={(value) =>
					ls.entity.operation_volumes[0].set('beyond_visual_line_of_sight', value)
				}
				isRequired
				isDarkVariant
				inline
			/>
		</>
	);
};

export interface ViewAndEditOperationProps {
	ls: UseLocalStoreEntity<Operation>;
	isEditing: boolean;
	isAbleToChangeState?: boolean;
	isCreating?: boolean;
	style?: CSSProperties;
}

const ViewAndEditOperation: FC<ViewAndEditOperationProps> = ({
	ls,
	isEditing,
	isAbleToChangeState = true,
	isCreating = false,
	style
}) => {
	const { t } = useTranslation();
	return (
		<div className={styles.twobytwo} style={style}>
			<div className={styles.content}>
				<aside className={styles.summary}>
					<h2>{t('Operation information')}</h2>
					{t('Operation information explanation')}
				</aside>
				<section className={styles.details}>
					<BaseOperationDetails isCreating={false} isEditing={isEditing} ls={ls} />
				</section>
				<div className={styles.separator} />
				<aside className={styles.summary} />
				<section className={styles.details} style={{ gridColumn: '1 / -1' }}>
					<DetailedOperationDetails
						isEditing={isEditing}
						ls={ls}
						isAdmin={isAbleToChangeState}
					/>
				</section>
				<div className={styles.separator} />
				<aside className={styles.summary}>
					<h2>{t('Volume')}</h2>
					{t('Volume explanation')}
				</aside>
				<section className={styles.details}>
					<VolumeDetails isAbleToChangeDates={false} isEditing={isEditing} ls={ls} />
				</section>
			</div>
		</div>
	);
};

export default observer(ViewAndEditOperation);
