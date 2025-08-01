import PButton from '@pcomponents/PButton';
import PInput from '@pcomponents/PInput';
import PModal, { PModalType } from '@pcomponents/PModal';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useAuthStore } from 'src/app/modules/auth/store';
import { Spinner } from '@blueprintjs/core';

interface PasswordChangerProps {
	onFinish?: () => void;
}

const PasswordChangerRequestForm: FC<PasswordChangerProps> = ({ onFinish = null }) => {
	const { t } = useTranslation();
	const [error, setError] = useState<string | null>(null);
	const [email, setEmail] = useState<string>('');
	const [success, setSuccess] = useState<boolean>(false);
	const [isFetching, setIsFetching] = useState<boolean>(false);

	const reset = useAuthStore((state) => state.reset);

	return (
		<>
			<h2>{t('Change password')}</h2>
			<p>
				{t('Enter your email address to receive instructions for changing your password')}.
			</p>
			<OneLine>
				<>
					<PInput
						id={'email'}
						onChange={(value) => {
							setEmail(value);
						}}
						type="email"
						// label={t('email')}
						autoComplete="email"
						isDarkVariant
						inline={true}
						minLength={5}
						defaultValue={email}
						disabled={isFetching}
					>
						<p style={{ color: 'var(--ramen-500)' }}>
							{t('Your password must have atleast 9 characters')}
						</p>
					</PInput>
					<PButton
						// style={{ margin: '1rem auto' }}
						disabled={isFetching}
						onClick={() => {
							if (email) {
								setIsFetching(true);
								reset(
									email,
									() => {
										setError(null);
										setIsFetching(false);
										setEmail('');
										setSuccess(true);
									},
									(error) => {
										setError(error);
										setIsFetching(false);
									}
								);
							}
						}}
					>
						{!isFetching && t('Recover password')}
						{isFetching && <Spinner />}
					</PButton>
				</>
			</OneLine>
			{error && (
				<PModal
					type={PModalType.ERROR}
					title={t('Error while saving')}
					content={error}
					primary={{
						onClick: () => {
							console.log('error')
							setError(null);
						}
					}}
				/>
			)}
			{success && (
				<PModal
					type={PModalType.INFORMATION}
					title={t('Recovery email sent')}
					content={t('Check your email for further instructions to change your password')}
					primary={{
						onClick: () => {
							setSuccess(false);
						}
					}}
				/>
			)}
		</>
	);
};

const OneLine = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	flex-wrap: wrap;
	gap: 1rem;

	* {
		flex: 1;
		min-width: 200px;
	}
`;

const CenteredLine = styled.div`
	display: flex;
	justify-content: center;
	height: 100%;
	align-items: center;
`;

export default PasswordChangerRequestForm;
