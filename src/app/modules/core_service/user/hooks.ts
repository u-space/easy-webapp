import { AxiosError, AxiosResponse } from 'axios';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useCoreServiceAPI } from '../../../utils';
import { useSchemaStore } from '../../schemas/store';
import { useAuthIsAdmin, useAuthIsPilot } from '../../auth/store';
import { ChangeUserConfirmationStatusError, UserEntity } from '@utm-entities/user';
import { UpdateEntityParams } from '@utm-entities/types';
import { useUserStore } from './store';
import { shallow } from 'zustand/shallow';

export function useUpdateUser() {
	const queryClient = useQueryClient();

	const schema = useSchemaStore((state) => state.users);
	const isPilot = useAuthIsPilot();
	const isAdmin = useAuthIsAdmin();
	const {
		multi: { saveUserAndDocuments }
	} = useCoreServiceAPI();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return useMutation<AxiosResponse<UserEntity>, AxiosError, UpdateEntityParams<UserEntity>>(
		({ entity: user, documents, isCreating }) => {
			if (isPilot) {
				user = new UserEntity(user, schema);
			}
			return saveUserAndDocuments(user, isAdmin, documents, isCreating);
		},
		{
			onSuccess: () => {
				// Invalidate and refetch
				queryClient.invalidateQueries('users').then(() => {
					console.log('Invalidated users');
				});
			}
		}
	);
}

export interface UseUpdateUserPasswordMutationParams {
	email: string;
	password: string;
}

export interface UseUpdateUserPasswordByTokenMutationParams {
	email: string;
	password: string;
	token: string;
}

export function useUpdateUserPassword() {
	const {
		user: { updateUserPassword }
	} = useCoreServiceAPI();
	return useMutation<AxiosResponse<void>, AxiosError, UseUpdateUserPasswordMutationParams>(
		(params) => updateUserPassword(params.email, params.password)
	);
}

export function useUpdateUserPasswordByToken() {
	const {
		user: { updateUserPasswordToken }
	} = useCoreServiceAPI();
	return useMutation<AxiosResponse<void>, AxiosError, UseUpdateUserPasswordByTokenMutationParams>(
		(params) => updateUserPasswordToken(params.email, params.password, params.token)
	);
}

export interface UseSendRecoverUserPasswordMutationParams {
	email: string;
}

export function useUpdateUserStatus() {
	const queryClient = useQueryClient();

	const {
		user: { changeUserConfirmationStatus }
	} = useCoreServiceAPI();

	return useMutation<
		AxiosResponse<void>,
		ChangeUserConfirmationStatusError,
		{ username: string; verified: boolean }
	>(({ username, verified }) => changeUserConfirmationStatus(username, verified), {
		onSuccess: () => {
			// TODO: We probably only want to invalidate the data of the updated user
			queryClient.invalidateQueries('users');
			// window.location.href = `${window.location.href}`;
		}
	});
}

export function useUpdateCanOperate() {
	const queryClient = useQueryClient();

	const {
		user: { updateCanOperate }
	} = useCoreServiceAPI();

	return useMutation<
		AxiosResponse<void>,
		ChangeUserConfirmationStatusError,
		{ username: string; canOperate: boolean }
	>(({ username, canOperate }) => updateCanOperate(username, canOperate), {
		onSuccess: () => {
			// TODO: We probably only want to invalidate the data of the updated user
			queryClient.invalidateQueries('users');
			window.location.href = `${window.location.href}`;
		}
	});
}

export function useDeleteUser() {
	const queryClient = useQueryClient();

	const {
		user: { deleteUser }
	} = useCoreServiceAPI();

	return useMutation<AxiosResponse<void>, AxiosError, UserEntity>(
		(user) => deleteUser(user.username),
		{
			onSuccess: () => {
				// Invalidate and refetch
				queryClient.invalidateQueries('users');
			}
		}
	);
}

export function useQueryUser(username: string, enabled = false) {
	const {
		user: { getUser }
	} = useCoreServiceAPI();
	return useQuery([`user-${username}`, 'user'], () => getUser(username), { enabled });
}

export function useQueryUsers(all = false) {
	const {
		user: { getUsers }
	} = useCoreServiceAPI();

	const {
		pageTake,
		pageSkip,
		filterStatus,
		sortingProperty,
		sortingOrder,
		filterProperty,
		filterMatchingText
	} = useUserStore(
		(state) => ({
			pageTake: state.pageTake,
			pageSkip: state.pageSkip,
			filterStatus: state.filterStatus,
			sortingProperty: state.sortingProperty,
			sortingOrder: state.sortingOrder,
			filterProperty: state.filterProperty,
			filterMatchingText: state.filterMatchingText
		}),
		shallow
	);

	const query = useQuery(
		[
			'users',
			pageTake,
			pageSkip,
			filterStatus,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText
		],
		() =>
			getUsers(
				all ? 99999 : pageTake,
				all ? 0 : pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText,
				filterStatus
			),
		{ keepPreviousData: true }
	);

	const {
		isLoading: isLoadingUsers,
		isSuccess: isSuccessUsers,
		isError: isErrorUsers,
		data: response,
		error: errorUsers,
		isPreviousData: isPreviousDataUsers
	} = query;

	const data = isSuccessUsers ? response.data : null;
	const users = data ? data.user : [];
	const count = data ? data.count : 0;

	return {
		users,
		count,
		/* DEPRECATED, use isLoading instead */
		isLoadingUsers,
		/* DEPRECATED, use isSuccess instead */
		isSuccessUsers,
		/* DEPRECATED, use isError instead */
		isErrorUsers,
		/* DEPRECATED, use error instead */
		errorUsers,
		/* DEPRECATED, use isPreviousData instead */
		isPreviousDataUsers,
		...query
	};
}
