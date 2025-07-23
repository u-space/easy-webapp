import classnames from 'classnames';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Kanpur.module.scss';
import PButton, { PButtonType, PButtonSize } from './PButton';
import PInput, { PInputProps } from './PInput';
import { UserEntity, getUserAPIClient } from '@utm-entities/user';
import { ExtraFieldSchema } from '@utm-entities/extraFields';
import { useQuery } from 'react-query';

export interface PUserSelectForPilotsProps extends Omit<PInputProps, 'onSelect'> {
	label: string;
	disabled?: boolean;
	single?: boolean;
	onSelect: (users: string[]) => void;
	isDarkVariant?: boolean;
	preselected?: string[];
	api: string;
	token: string;
	schema: ExtraFieldSchema;
}

// const userNameAsUsers = (usernames: string[], schema: ExtraFieldSchema): UserEntity[] => {
// 	return usernames.map((username: string) => {
// 		const user = new UserEntity({ username: username }, schema);
// 		return user;
// 	});
// };

const PUserSelectForPilots = (props: PUserSelectForPilotsProps) => {
	const {
		label,
		disabled = false,
		single = true,
		onSelect,
		isDarkVariant = false,
		preselected,
		api,
		token,
		schema,
		...extra
	}: PUserSelectForPilotsProps = props;

	const [value, setValue] = useState('');
	const [selected, setSelected] = useState<string[]>(preselected ? preselected : []);
	const { userExists } = getUserAPIClient(api, token, schema);

	const [usernameToCheck, setUsernameToCheck] = useState<string | undefined>(undefined);

	useEffect(() => {
		//check if usernameTocheck exists on selected
		if (selected.includes(usernameToCheck ? usernameToCheck : '')) {
			// alert('User already selected');
		} else {
			if (usernameToCheck) {
				userExists(usernameToCheck)
					.then((response) => {
						if (response.data) {
							setSelected((current: string[]) => {
								const selected = [...current, value];
								onSelect(selected);
								setUsernameToCheck(undefined);
								setValue('');
								return selected;
							});
						} else {
							console.error('User does not exist');
						}
					})
					.catch((err) => {
						console.error(err);
					});
			}
		}
	}, [usernameToCheck]);

	useEffect(() => {
		if (props.preselected) {
			setSelected(props.preselected);
		} else {
			setSelected([]);
		}
	}, [props.preselected]);

	const isEditing = !disabled;
	const isChoosing = isEditing && ((single && selected.length === 0) || !single);

	const remove = (username: string) => {
		setSelected((current) => {
			const selected = _.filter(current, (u) => u !== username);
			// const users = userNameAsUsers(selected, schema);
			onSelect(selected);
			return selected;
		});
	};

	return (
		<>
			{label && label.length > 0 && <p>{label}</p>}
			{selected.map((user) => (
				<DisplaySelectedUser
					key={user}
					username={user}
					isDarkVariant={isDarkVariant}
					isEditing={isEditing}
					remove={remove}
				/>
			))}
			{isEditing && (
				<TextFieldSelectUser
					{...{
						value,
						disabled,

						setValue,
						extra,

						isDarkVariant,
						onSelect,
						setSelected,
						setUsernameToCheck
					}}
				/>
			)}
		</>
	);
};

interface DisplaySelectedUserProps {
	isDarkVariant: boolean;
	isEditing: boolean;
	username: string;
	remove: (username: string) => void;
}

const DisplaySelectedUser = (props: DisplaySelectedUserProps) => {
	const { isDarkVariant, remove, username, isEditing } = props;

	return (
		<div className={classnames(styles.selected_user, { [styles.dark]: isDarkVariant })}>
			{isEditing && (
				<PButton
					size={PButtonSize.EXTRA_SMALL}
					icon={'cross'}
					variant={PButtonType.SECONDARY}
					onClick={() => remove(username)}
				/>
			)}
			{username}
		</div>
	);
};

interface TextFieldSelectUserProps {
	value: string;
	disabled: boolean;

	setValue: (value: string) => void;
	extra: any;
	isDarkVariant: boolean;
	onSelect: (users: string[]) => void;
	setSelected: (fn: (current: string[]) => string[]) => void;
	setUsernameToCheck: (username: string | undefined) => void;
}

const TextFieldSelectUser = (props: TextFieldSelectUserProps) => {
	const {
		value,
		disabled,
		setValue,
		extra,

		isDarkVariant,
		onSelect,
		setSelected,
		setUsernameToCheck
	} = props;
	const { t } = useTranslation();
	return (
		<>
			<PInput
				id="owner"
				defaultValue={value}
				disabled={disabled}
				onChange={(value) => {
					setValue(value);
				}}
				isDarkVariant={isDarkVariant}
				inline
				fill
				{...extra}
			/>
			{value.length > 0 && (
				<PButton
					style={{ marginLeft: 'auto' }}
					size={PButtonSize.SMALL}
					icon="plus"
					onClick={() => {
						// setSelected((current: string[]) => {
						// 	const selected = [...current, value];
						// 	onSelect(selected);
						// 	return selected;
						// });
						setUsernameToCheck(value);
					}}
				>
					{t('Add user as operator', { user: value })}
				</PButton>
			)}
		</>
	);
};

export default PUserSelectForPilots;
