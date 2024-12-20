import { observer, useLocalStore } from 'mobx-react';
import { useState, FormEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import PInput from '@pcomponents/PInput';
import PButton from '@pcomponents/PButton';
import styles from '../auth.module.scss';
import { useAuthStore } from '../store';
import UnloggedLayout from '../layouts/UnloggedLayout';
import StatusLayout from '../layouts/StatusLayout';
import { useCoreServiceAPI } from '../../../utils';

const LoginScreen = () => {
	const { t } = useTranslation();
	const history = useHistory();

	const login = useAuthStore((state) => state.login);
	const hasTriedToRelogin = useAuthStore((state) => state.hasTriedToRelogin);
	const [isShowingPassword, setShowingPasswordFlag] = useState(false);
	const [isLoading, setLoadingFlag] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isError = error !== null;

	const ls = useLocalStore(() => ({
		user: '',
		password: '',
		setUser(user: string) {
			ls.user = user;
			// validate
		},
		setPassword(password: string) {
			ls.password = password;
		}
	}));

	const onSubmit = async (evt?: FormEvent) => {
		if (evt) evt.preventDefault();
		setLoadingFlag(true);
		login(
			ls.user,
			ls.password,
			() => {
				return;
			},
			(error) => {
				setLoadingFlag(false);
				setError(error);
			}
		);
	};

	return (
		<UnloggedLayout extraClassnames={[styles.login]} onSubmit={onSubmit}>
			<div className={styles.line}>
				<PInput onChange={ls.setUser} label={t('Email')} id={'user'} />
			</div>
			<div className={styles.line}>
				<PInput
					onChange={ls.setPassword}
					type={isShowingPassword ? 'text' : 'password'}
					label={t('Password')}
					autoComplete="current-password"
					id={'password'}
				/>
				<div style={{ marginLeft: '4px' }}>
					<PButton
						icon={isShowingPassword ? 'eye-off' : 'eye-open'}
						onClick={() => setShowingPasswordFlag((current) => !current)}
					/>
				</div>
			</div>
			<section className={styles.actions}>
				<PButton onClick={() => history.push('/register')}>{t('Register')}</PButton>
				<PButton type="submit" onClick={() => onSubmit()}>
					{t('Log-in')}
				</PButton>
			</section>
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				<PButton
					icon="help"
					onClick={() =>
						window.open(
							'https://www.youtube.com/playlist?list=PLn8uLplTYSbuGny6WerWmWCHh8-nkGj3f',
							'_blank'
						)
					}
				>
					Ver Tutoriales
				</PButton>
			</div>
			{!hasTriedToRelogin && <StatusLayout isLogin>{t('Please wait')}...</StatusLayout>}
			{isLoading && <StatusLayout isLogin>{t('Loading')}...</StatusLayout>}
			{isError && (
				<StatusLayout isError>
					<h3>{t('An error occured!')}</h3>
					{t(error)}
					<PButton style={{ margin: '1rem' }} onClick={() => setError(null)}>
						OK
					</PButton>
				</StatusLayout>
			)}
		</UnloggedLayout>
	);
};

export default observer(LoginScreen);
