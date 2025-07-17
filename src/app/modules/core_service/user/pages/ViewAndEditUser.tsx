import PBooleanInput from '@pcomponents/PBooleanInput';
import PButton, { PButtonSize, PButtonType } from '@pcomponents/PButton';
import PInput from '@pcomponents/PInput';
import PUserRoleSelect from '@pcomponents/PUserRoleSelect';
import { DocumentEntity } from '@utm-entities/document';
import { ExtraFieldSchemas } from '@utm-entities/extraFields';
import { UserEntity } from '@utm-entities/user';
import { VehicleEntity } from '@utm-entities/vehicle';
import { observer, useObserver } from 'mobx-react';
import { CSSProperties, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import styles from '../../../../commons/Pages.module.scss';
import ExtraField from '../../../../commons/components/ExtraField';
import { UseLocalStoreEntity } from '../../../../commons/utils';
import { useAuthStore } from '../../../auth/store';
import { useSchemaStore } from '../../../schemas/store';
import PasswordChanger from '../components/PasswordChanger';
import { UserDocuments } from './UserDocuments';

interface BaseUserDetailsProps {
	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	ls: any;
	isEditing: boolean;
	isCreating: boolean;
	isAbleToChangeRole: boolean;
}

const BaseUserDetails = (props: BaseUserDetailsProps) => {
	const { ls, isEditing, isCreating, isAbleToChangeRole } = props;
	const { t } = useTranslation('glossary');
	// const role = useAuthGetRole();

	return (
		<>
			{Object.keys(ls.entity).map((prop) => {
				if (ls.entity.isBasic(prop)) {
					const id = `input-${prop}`;
					const label = t(`user.${prop}`);
					const explanation = t(`user.${prop}_desc`);
					const isNotEditable =
						!isCreating &&
						// role !== 'ADMIN' &&
						(prop === 'username' || prop === 'email');
					let autoComplete = 'off';
					switch (prop) {
						case 'username':
							autoComplete = 'username';
							break;
						case 'email':
							autoComplete = 'email';
							break;
						case 'firstName':
							autoComplete = 'given-name';
							break;
						case 'lastName':
							autoComplete = 'family-name';
							break;
					}
					if (prop === 'username') {
						return null;
					} else if (prop !== 'role') {
						if (prop === 'canOperate') {
							if (isAbleToChangeRole) {
								return (
									<PBooleanInput
										key={prop}
										id={prop}
										defaultValue={ls.entity.canOperate}
										label={t('glossary:user.canOperate')}
										disabled={!isEditing || !isAbleToChangeRole}
										onChange={(value) => (ls.entity.canOperate = value)}
										// isRequired
										isDarkVariant
										inline
									/>
								);
							}
						} else
							return (
								<PInput
									key={prop}
									id={id}
									defaultValue={ls.entity[prop]}
									label={label}
									autoComplete={autoComplete}
									explanation={explanation}
									disabled={!isEditing || isNotEditable}
									onChange={(value) =>
										(ls.entity[prop as keyof UserEntity] = value)
									}
									isRequired
									isDarkVariant
									inline
								/>
							);
					} else if (isAbleToChangeRole) {
						return (
							<PUserRoleSelect
								key={prop}
								id={prop}
								label={t('glossary:user.role')}
								defaultValue={ls.entity.role}
								onChange={(value: string) => (ls.entity.role = value)}
								isDarkVariant
								inline
								isRequired
								disabled={!isEditing}
								style={{}}
							/>
						);
					} else {
						return null;
					}
				} else {
					return null;
				}
			})}
		</>
	);
};

export const showExpiredDate = (schema: any) => {
	return (
		(schema && !schema.__metadata) ||
		(schema && schema.__metadata && !(schema.__metadata.expirable === false))
	);
};

export const labelDate = (schema: any) => {
	if (showExpiredDate(schema)) {
		return 'ui:Valid until';
	} else {
		return 'ui:Not expirable';
	}
};

export const DocumentStatusLabel = styled.div`
	margin: 0 1rem 0 0;
	font-weight: 600;
`;

export const DocumentContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
`;

export interface ExtraUserFilesProps {
	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	ls: { entity: UserEntity; documents?: Map<string, DocumentEntity> };
	isEditing: boolean;
}

interface ExtraUserDetailsProps {
	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	ls: any;
	isEditing: boolean;
}

const ExtraUserDetailsValues = ({
	ls,
	schema,
	property,
	required,
	isEditing
}: {
	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	ls: any;
	schema: ExtraFieldSchemas['users'];
	property: string;
	required: boolean;
	isEditing: boolean;
}) => {
	const { t } = useTranslation('glossary');
	const label = t(`user.${property}`);
	const explanation = t([`user.${property}_desc`, '']);
	const id = `input-${property}`;
	const value = ls.entity.extra_fields[property];
	const schemaValue = schema[property];

	if (schemaValue.required === required) {
		return (
			<ExtraField
				key={property}
				isDarkVariant
				isEditing={isEditing}
				{...{
					property: property,
					required,
					label,
					explanation,
					id,
					value,
					ls,
					schemaValue
				}}
			/>
		);
	} else {
		return null;
	}
};

const UserExtraFields = (props: ExtraUserDetailsProps) => {
	const { ls, isEditing } = props;
	const schema = useSchemaStore((state) => state.users);
	const keys = useMemo(() => Array.from(Object.keys(schema)), [schema]);

	return useObserver(() => {
		if (ls.entity) {
			return (
				<>
					<div
						className={styles.extraVehicleDetails}
						style={{ display: 'flex', flexDirection: 'column', margin: 0 }}
					>
						{keys.map((key) => (
							<div key={key} style={{ order: schema[key].required ? 1 : 2 }}>
								<ExtraUserDetailsValues
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
				</>
			);
		} else {
			return null;
		}
	});
};

const Vehicles = ({ vehicles }: { vehicles: VehicleEntity[] }) => {
	const history = useHistory();
	return (
		<>
			{vehicles.map((vehicle) => (
				<div key={vehicle.uvin} className={styles.leftbalancedline}>
					<PButton
						icon="info-sign"
						size={PButtonSize.SMALL}
						variant={PButtonType.SECONDARY}
						onClick={() => history.push(`/vehicles?id=${vehicle.uvin}`)}
					/>
					{vehicle.asNiceString}
				</div>
			))}
		</>
	);
};

interface UserPageProps {
	ls: UseLocalStoreEntity<UserEntity>;
	isEditing: boolean;
	isAbleToChangeRole?: boolean;
	isCreating?: boolean;
	style?: CSSProperties;
	vehicles?: VehicleEntity[];
	isAbleToAddDocuments?: boolean;
}

const ViewAndEditUser = (props: UserPageProps) => {
	const {
		ls,
		isEditing,
		isAbleToChangeRole = false,
		isCreating = false,
		style,
		vehicles = null,
		isAbleToAddDocuments = true
	} = props;
	const token = useAuthStore((state) => state.token);
	const { t } = useTranslation();
	return (
		<div className={styles.twobytwo} style={style}>
			<div className={styles.content}>
				<aside className={styles.summary}>
					<h2>{t('Personal data')}</h2>
					{t('Basic details explanation')}
				</aside>
				<section className={styles.details}>
					<BaseUserDetails
						isEditing={isEditing}
						isCreating={isCreating}
						isAbleToChangeRole={isAbleToChangeRole}
						ls={ls}
					/>
				</section>
				<div className={styles.separator} />
				<aside className={styles.summary}>
					<h2>{t('Legal information')}</h2>
					{t('Legal information explanation')}
				</aside>
				<section className={styles.details}>
					<UserExtraFields isEditing={isEditing} ls={ls} />
				</section>
				<div className={styles.separator} />
				{isAbleToAddDocuments && (
					<>
						<aside className={styles.summary}>
							<h2>{t('User Documentation')}</h2>
							{t('User Documentation explanation')}
						</aside>
						<section className={styles.details}>
							<UserDocuments isEditing={isEditing} ls={ls} />
						</section>
						<div className={styles.separator} />
					</>
				)}
				<aside className={styles.summary}>
					<h2>{t('Password')}</h2>
					{t('Your password must have atleast 9 characters')}
				</aside>
				<section className={styles.details}>
					<PasswordChanger ls={ls} isCreating={isCreating} token={''} />
				</section>
				{!isCreating && vehicles && (
					<>
						<div className={styles.separator} />
						<aside className={styles.summary}>
							<h2>{t('Vehicles')}</h2>
							{t('All vehicles either owned or operated by the user')}
						</aside>
						<section className={styles.details}>
							<Vehicles vehicles={vehicles} />
						</section>
					</>
				)}
			</div>
		</div>
	);
};

export default observer(ViewAndEditUser);
