import { CustomCell, GridCell, GridCellKind, TextCell } from '@glideapps/glide-data-grid';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PButtonSize, PButtonType } from '@pcomponents/PButton';
import PButton from '@pcomponents/PButton';
import PTooltip from '@pcomponents/PTooltip';
import PModal, { PModalType } from '@pcomponents/PModal';
import GenericHub, { rowHeight } from '../../../../commons/screens/GenericHub';
import { useQueryString } from '../../../../utils';
import { useDeleteUser, useQueryUsers, useUpdateUser, useUpdateUserStatus } from '../hooks';
import { useUpdateDocumentValidation } from '../../../document/hooks';
import { useGetVehiclesByOperator } from '../../vehicle/hooks';
import { UserVerificationState, useUserStore } from '../store';
import { shallow } from 'zustand/shallow';
import { useAuthIsAdmin } from '../../../auth/store';
import UserSearchTools from '../components/UserSearchTools';

import { UseMutationResult } from 'react-query';
import ViewAndEditUser from '../pages/ViewAndEditUser';
import { UserEntity } from '@utm-entities/user';

interface ExtraActionsProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: Record<string, any>;
	setOverlay: (overlay: ReactNode) => void;
}

const getExtraActions =
	(setOverlay: (overlay: ReactNode) => void) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	({ data }: { data: Record<string, any> }) => {
		return <ExtraActions data={data} setOverlay={setOverlay} />;
	};

const ExtraActions: FC<ExtraActionsProps> = ({ data, setOverlay }) => {
	const { t } = useTranslation();
	const updateUserStatus = useUpdateUserStatus();

	return (
		<PTooltip content={data.verified ? t('De-authorize') : t('Authorize')}>
			<PButton
				size={PButtonSize.SMALL}
				icon={data.verified ? 'cross' : 'tick'}
				variant={PButtonType.SECONDARY}
				onClick={() =>
					updateUserStatus.mutate(
						{
							username: data.username,
							verified: !data.verified
						},
						{
							onError: (error) => {
								setOverlay(
									<PModal
										key={'errorOnUpdateUserStatus'}
										title={t('Error')}
										content={t('ui:' + error.response?.data?.message)}
										type={PModalType.ERROR}
										primary={{
											onClick: () => setOverlay(undefined),
											text: t('Ok')
										}}
									/>
								);
							}
						}
					)
				}
			/>
		</PTooltip>
	);
};

const UserHub = () => {
	// Other hooks
	const { t } = useTranslation(['ui', 'glossary']);
	const history = useHistory();
	const queryString = useQueryString();

	// Store
	const { setFilterStatus } = useUserStore(
		(state) => ({
			setFilterStatus: state.setFilterStatus
		}),
		shallow
	);
	const isAdmin = useAuthIsAdmin();

	// State

	const idSelected = queryString.get('id');
	const shouldShowNonAuthorized = queryString.get('unconfirmed');
	const columns = [
		{ title: ' ', width: rowHeight * 2 },
		{ title: t('glossary:user.fullname'), width: 3 },
		{ title: t('glossary:user.email'), width: 2 },
		// { title: t('glossary:user.username'), width: 1 },
		{ title: t('glossary:user.role'), width: 1 }
	];
	const [overlay, setOverlay] = useState<ReactNode>(undefined);

	// Backend
	const queryUsers = useQueryUsers();

	const { users, count } = queryUsers;

	const updateUser = useUpdateUser();
	const updateUserStatus = useUpdateUserStatus();
	const updateDocumentValidation = useUpdateDocumentValidation();
	const deleteUser = useDeleteUser();
	const queryVehicles = useGetVehiclesByOperator(idSelected || '');

	// Handlers
	function getData([col, row]: readonly [number, number]): GridCell {
		const user = users[row];
		if (user) {
			let data;
			let kind = GridCellKind.Text;
			if (col === 1) {
				data = user.fullName;
				/*} else if (col === 2) {
					data = user.username;*/
			} else if (col === 3 - 1) {
				data = user.email;
			} else if (col === 4 - 1) {
				data = user.role;
			} else if (col === 0) {
				data = '';
				kind = GridCellKind.Custom;
			}

			if (kind === GridCellKind.Text) {
				return {
					kind: GridCellKind.Text,
					data: data,
					displayData: data,
					allowOverlay: false
				} as TextCell;
			} else if (kind === GridCellKind.Custom) {
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

	const onEntitySelected = (user: UserEntity) =>
		history.replace(user ? `/users?id=${user.username}` : '/users');

	// Effects
	useEffect(() => {
		if (shouldShowNonAuthorized) {
			setFilterStatus(UserVerificationState.UNCONFIRMED);
		}
	}, [shouldShowNonAuthorized]);

	// Components

	return (
		<GenericHub<UserEntity>
			idProperty={'username'}
			extraActions={isAdmin ? getExtraActions(setOverlay) : undefined}
			getData={getData}
			entitySearchTools={UserSearchTools}
			entityPage={ViewAndEditUser}
			extraEntityPageProps={{ isAbleToChangeRole: isAdmin, vehicles: queryVehicles.data }}
			columns={columns}
			entityName={'user'}
			useStore={useUserStore}
			entities={users}
			onEntitySelected={onEntitySelected}
			idSelected={idSelected}
			updateQuery={updateUser as UseMutationResult}
			deleteQuery={deleteUser as UseMutationResult}
			extraIsLoading={updateUserStatus.isLoading || updateDocumentValidation.isLoading}
			query={{ ...queryUsers, count }}
			overlay={overlay}
			canEdit={() => isAdmin}
		/>
	);
};

export default UserHub;
