import PDropdown from '@pcomponents/PDropdown';
import PInput from '@pcomponents/PInput';
import PUserSelectForAdmins from '@pcomponents/PUserSelectForAdmins';
import PUserSelectForPilots from '@pcomponents/PUserSelectForPilots';
import { ExtraFieldSchema, ExtraFieldSchemas } from '@utm-entities/extraFields';
import { UserEntity } from '@utm-entities/user';
import { VehicleEntity } from '@utm-entities/vehicle';
import { observer, useObserver } from 'mobx-react';
import { CSSProperties, FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import env from '../../../../../vendor/environment/env';
import styles from '../../../../commons/Pages.module.scss';
import ExtraField from '../../../../commons/components/ExtraField';
import { UseLocalStoreEntity } from '../../../../commons/utils';
import { getFeatureOption } from '../../../../utils';
import {
	AuthRole,
	useAuthGetRole,
	useAuthIsAdmin,
	useAuthIsPilot,
	useAuthStore
} from '../../../auth/store';
import { useSchemaStore } from '../../../schemas/store';
import { VehicleDocuments } from './VehicleDocuments';

export interface BaseVehicleDetailsProps {
	ls: UseLocalStoreEntity<VehicleEntity>;
	isEditing: boolean;
	isCreating: boolean;
	hasSelectedAnAircraftType: boolean;
}

const BaseVehicleDetails: FC<BaseVehicleDetailsProps> = observer(
	({ ls, isEditing, isCreating, hasSelectedAnAircraftType }) => {
		const { t } = useTranslation(['glossary', 'ui']);
		// const [payloadTypesDrop, setPayloadTypesDrop] = useState<PayloadType[]>([]);

		const classes = [
			{ label: t('ui:Multi rotor'), value: 'MULTIROTOR' },
			{ label: t('ui:Fixed wing'), value: 'FIXEDWING' },
			{ label: 'VTOL', value: 'VTOL' },
			{ label: t('ui:Other'), value: 'OTHER' }
		];

		return (
			<>
				{Object.entries(ls.entity).map((pair) => {
					const [prop, value] = pair;
					const isNotVisible = isCreating && prop === 'uvin';
					const isUvinAndShouldBeVisible =
						!getFeatureOption('Vehicles', 'hideUvin') || prop !== 'uvin';
					if (
						ls.entity.isBasic(prop) &&
						prop !== 'operators' &&
						!isNotVisible &&
						prop !== 'class' &&
						prop !== 'payload' &&
						prop !== 'faaNumber' &&
						prop !== 'owner_id' &&
						isUvinAndShouldBeVisible
					) {
						const id = `input-${prop}`;
						const label = t(`vehicle.${prop}`);
						const explanation = t(`vehicle.${prop}_desc`);
						const isNotEditable =
							prop === 'uvin' ||
							(hasSelectedAnAircraftType &&
								(prop === 'model' || prop === 'manufacturer'));
						if (typeof value === 'string')
							return (
								<PInput
									key={prop}
									id={id}
									defaultValue={value}
									label={label}
									explanation={explanation}
									disabled={!isEditing || isNotEditable}
									onChange={(value) => {
										// TODO: There's some strange bug where it doesn't recognize the prop as a string, but as this should be improved soon we can ignore it for now
										// Ignore TS7053
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment
										// @ts-ignore
										ls.entity[prop] = value;
									}}
									isRequired
									isDarkVariant
									inline
								/>
							);
					}
					return null;
				})}
				<PDropdown
					id={'class'}
					options={classes}
					defaultValue={ls.entity.class}
					disabled={!isEditing || hasSelectedAnAircraftType}
					label={t('vehicle.class')}
					explanation={t('vehicle.class_desc')}
					onChange={(value) => (ls.entity.class = value)}
					isRequired
					isDarkVariant
					inline
				/>
			</>
		);
	}
);

interface ExtraVehicleDetailsProps {
	ls: UseLocalStoreEntity<VehicleEntity>;
	isEditing: boolean;
}

const ExtraVehicleDetailsValues = ({
	ls,
	schema,
	property,
	required: isRequired,
	isEditing
}: {
	ls: UseLocalStoreEntity<VehicleEntity>;
	schema: ExtraFieldSchemas['vehicles'];
	property: string;
	required: boolean;
	isEditing: boolean;
}) => {
	const { t } = useTranslation('glossary');
	const label = t(`vehicle.${property}`);
	const explanation = t([`vehicle.${property}_desc`, '']);
	const id = `input-${property}`;
	const value = ls.entity.extra_fields[property];

	const schemaValue = schema[property];

	return (
		<ExtraField
			key={property}
			isDarkVariant
			isEditing={isEditing}
			id={id}
			label={label}
			explanation={explanation}
			ls={ls}
			value={value}
			schemaValue={schemaValue}
			property={property}
			required={isRequired}
		/>
	);
};

interface ExtraVehicleDetailsProps {
	ls: UseLocalStoreEntity<VehicleEntity>;
	isEditing: boolean;
	showAllPropertiesRegardlessOfSchema?: boolean;
}
const ExtraVehicleDetails: FC<ExtraVehicleDetailsProps> = ({ ls, isEditing }) => {
	const schema = useSchemaStore((state) => state.vehicles);
	const keys = useMemo(() => Array.from(Object.keys(schema)), [schema]);

	return useObserver(() => {
		if (ls.entity) {
			return (
				<div
					className={styles.extraVehicleDetails}
					style={{ display: 'flex', flexDirection: 'column', margin: 0 }}
				>
					{keys.map((key) => (
						<div key={key} style={{ order: schema[key].required ? 1 : 2 }}>
							<ExtraVehicleDetailsValues
								// key={key}
								property={key}
								ls={ls}
								schema={schema}
								required={schema[key].required}
								isEditing={isEditing}
							/>
						</div>
					))}
				</div>
			);
		} else {
			return null;
		}
	});
};

const userNameAsUsers = (usernames: string[], schema: ExtraFieldSchema): UserEntity[] => {
	return usernames.map((username: string) => {
		const user = new UserEntity({ username: username }, schema);
		return user;
	});
};

export interface ViewAndEditVehicleProps {
	ls: UseLocalStoreEntity<VehicleEntity>;
	isEditing: boolean;
	isCreating?: boolean;
	style?: CSSProperties;
	showAllPropertiesRegardlessOfSchema?: boolean;
	hasSelectedAnAircraftType?: boolean;
}

const ViewAndEditVehicle: FC<ViewAndEditVehicleProps> = ({
	ls,
	isEditing,
	isCreating = false,
	style,
	showAllPropertiesRegardlessOfSchema = false,
	hasSelectedAnAircraftType = false
}) => {
	const { t } = useTranslation();
	const isPilot = useAuthIsPilot();
	const isAdmin = useAuthIsAdmin();
	const role = useAuthGetRole();

	const token = useAuthStore((state) => state.token);
	const userSchema = useSchemaStore((state) => state.users);

	const [operators, setOperators] = useState<UserEntity[]>([]);

	useEffect(() => {
		if (ls.entity.operators) setOperators(ls.entity.operators);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (token === null) return null;
	if (ls.entity) {
		return (
			<div className={styles.twobytwo} style={style}>
				<div className={styles.content}>
					<aside className={styles.summary}>
						<h2>{t('Basic details')}</h2>
						{t(
							'To be able to fly in the system the vehicle must be registered and approved by the authority'
						)}
					</aside>
					<section className={styles.details}>
						<BaseVehicleDetails
							isEditing={isEditing && role !== AuthRole.REMOTE_SENSOR}
							isCreating={isCreating && role !== AuthRole.REMOTE_SENSOR}
							ls={ls}
							hasSelectedAnAircraftType={hasSelectedAnAircraftType}
						/>
						<ExtraVehicleDetails
							isEditing={isEditing && role !== AuthRole.REMOTE_SENSOR}
							ls={ls}
							showAllPropertiesRegardlessOfSchema={
								showAllPropertiesRegardlessOfSchema
							}
						/>
					</section>

					<div className={styles.separator} />
					<aside className={styles.summary}>
						<h2>{t('Owner')}</h2>
						{t('Owner explanation')}
					</aside>
					<section className={styles.details}>
						{isPilot && (
							<PUserSelectForPilots
								label={' '}
								id="owner"
								onSelect={(selected) => {
									if (selected.length > 0) {
										ls.entity.owner_id = selected[0];
									} else {
										ls.entity.owner_id = '';
									}
								}}
								preselected={ls.entity.owner_id ? [ls.entity.owner_id] : []}
								fill
								isRequired
								disabled={!isEditing || !isAdmin || !isCreating}
								isDarkVariant
								api={env.core_api}
								token={token}
								schema={userSchema}
							/>
						)}
						{isAdmin && (
							<PUserSelectForAdmins
								label={' '}
								api={env.core_api}
								token={token}
								schema={userSchema}
								id="owner"
								onSelect={(selected) => {
									if (selected.length > 0) {
										ls.entity.owner_id = selected[0].username;
										ls.entity.owner = selected[0];
									} else {
										ls.entity.owner_id = '';
										ls.entity.owner = null;
									}
								}}
								preselected={ls.entity.owner ? [ls.entity.owner] : []}
								fill
								isRequired
								disabled={!isEditing || !isAdmin }
								isDarkVariant
							/>
						)}
					</section>

					<div className={styles.separator} />
					<aside className={styles.summary}>
						<h2>{t('Aditional operators')}</h2>
						{t('Operators explanation')}
					</aside>
					<section className={styles.details}>
						{isPilot && (
							<PUserSelectForPilots
								label={' '}
								id="operators"
								// schema={schema}
								onSelect={(selected) => {
									ls.entity.operators = userNameAsUsers(selected, userSchema);
								}}
								preselected={ls.entity.operators.map((o) => o.username)}
								fill
								isRequired
								disabled={!isEditing}
								isDarkVariant
								api={env.core_api}
								token={token}
								schema={userSchema}
							/>
						)}
						{isAdmin && (
							<PUserSelectForAdmins
								label={' '}
								api={env.core_api}
								token={token}
								schema={userSchema}
								single={false}
								id="operators"
								onSelect={(selected) => {
									ls.entity.operators = selected.map((s) => s.username);
									setOperators(selected);
								}}
								preselected={operators}
								fill
								isRequired
								disabled={!isEditing || !isAdmin}
								isDarkVariant
							/>
						)}
					</section>

					<div className={styles.separator} />
					<aside className={styles.summary}>
						<h2>{t('Documentation')}</h2>
						{t('Documentation explanation')}
					</aside>
					<section
						className={styles.details}
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							width: '100%'
						}}
					>
						<VehicleDocuments isEditing={isEditing} ls={ls} />
					</section>
				</div>
			</div>
		);
	} else {
		return null;
	}
};

export default observer(ViewAndEditVehicle);
