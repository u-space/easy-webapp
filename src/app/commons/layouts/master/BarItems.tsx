import env from '../../../../vendor/environment/env';
import BarItem from './BarItem';
import { AuthRole } from '../../../modules/auth/store';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { setCSSVariable } from 'src/app/utils';
import { getCSSVariable } from '@pcomponents/utils';

const BarItems = () => {
	const { t } = useTranslation();
	const history = useHistory();

	const location = useLocation();
	const active = location.pathname.split('/')[1];

	const [showBar, setShowBar] = useState<boolean>(true);
	const defaultSideWidth = getCSSVariable('side-width-default');


	const extraTenantPages = env.tenant.extras?.pages;
	return (
		<>
			<BarItem
				icon="double-chevron-left"
				label={showBar ? t('Hide menu') : t('Show menu')}
				onClick={() => {
					if (showBar) {
						setCSSVariable('side-width', '0');
					} else {
						setCSSVariable('side-width', defaultSideWidth);
					}
					setShowBar(!showBar);
				}}
				roles={[
					AuthRole.ADMIN,
					AuthRole.PILOT,
					AuthRole.MONITOR,
					AuthRole.COA,
					AuthRole.AIR_TRAFIC
				]}
			/>

			{env.tenant.features.RealtimeMap.enabled && (
				<BarItem
					icon="map"
					label={t('REALTIME MAP')}
					isActive={active === 'map'}
					onClick={() => history.push('/map')}
					roles={[
						AuthRole.ADMIN,
						AuthRole.PILOT,
						AuthRole.MONITOR,
						AuthRole.COA,
						AuthRole.AIR_TRAFIC
					]}
				/>
			)}

			{env.tenant.features.UsersHub.enabled && (
				<BarItem
					icon="person"
					label={t('USERS')}
					isActive={active === 'users'}
					onClick={() => history.push('/users')}
					roles={[AuthRole.ADMIN, AuthRole.MONITOR]}
				/>
			)}
			{env.tenant.features.Vehicles.enabled && (
				<BarItem
					icon="airplane"
					label={t('VEHICLES')}
					isActive={active === 'vehicles'}
					onClick={() => history.push('/vehicles')}
					roles={[
						AuthRole.ADMIN,
						AuthRole.MONITOR,
						AuthRole.PILOT,
						AuthRole.REMOTE_SENSOR
					]}
				/>
			)}
			{env.tenant.features.FlightRequests.enabled && (
				<>
					<BarItem
						icon="third-party"
						label={t('COORDINATORS')}
						isActive={active === 'coordinators'}
						onClick={() => history.push('/coordinators')}
						roles={[AuthRole.ADMIN, AuthRole.MONITOR, AuthRole.COA]}
					/>
					<BarItem
						icon="folder-open"
						label={t('COORDINATIONS')}
						isActive={active === 'coordinations'}
						onClick={() => history.push('/coordinations')}
						roles={[
							AuthRole.ADMIN,
							AuthRole.MONITOR,
							AuthRole.COA,
							AuthRole.AIR_TRAFIC
						]}
					/>
					<BarItem
						icon="polygon-filter"
						label={t('FLIGHT REQUESTS')}
						isActive={active === 'flight-requests'}
						onClick={() => history.push('/flight-requests')}
						roles={[AuthRole.ADMIN, AuthRole.MONITOR, AuthRole.PILOT, AuthRole.COA]}
					/>
				</>
			)}

			{extraTenantPages?.map((page) => (
				<BarItem
					key={page.label}
					icon={page.icon}
					label={t(page.label)}
					isActive={active === page.url}
					onClick={() => history.push('/' + page.url)}
					roles={page.roles}
				/>
			))}

			{env.tenant.features.Operations.enabled && (
				<BarItem
					icon="area-of-interest"
					label={t('OPERATIONS')}
					isActive={active === 'operations'}
					onClick={() => history.push('/operations')}
					roles={[AuthRole.ADMIN, AuthRole.MONITOR, AuthRole.PILOT, AuthRole.COA]}
				/>
			)}

			{env.tenant.features.RegularFlights.enabled && (
				<BarItem
					icon="route"
					label={t('REGULAR FLIGHTS')}
					isActive={active === 'regularflights'}
					onClick={() => history.push('/regular-flights')}
					roles={[AuthRole.ADMIN, AuthRole.MONITOR]}
				/>
			)}

			{env.tenant.features.Uvrs.enabled && (
				<BarItem
					icon="graph-remove"
					label={t('UVRS')}
					isActive={active === 'uvrs'}
					onClick={() => history.push('/uvrs')}
					roles={[AuthRole.ADMIN, AuthRole.MONITOR, AuthRole.COA]}
				/>
			)}
			{env.tenant.features.Rfvs.enabled && (
				<BarItem
					icon="polygon-filter"
					label={t('RFVS')}
					isActive={active === 'rfvs'}
					onClick={() => history.push('/rfvs')}
					roles={[AuthRole.ADMIN, AuthRole.MONITOR]}
				/>
			)}

			<BarItem
				icon="document"
				label={t('DOCUMENTS')}
				isActive={active === 'documents'}
				onClick={() => history.push('/documents')}
				roles={[AuthRole.ADMIN]}
			/>

			{env.tenant.features.Trackers.enabled && (
				<BarItem
					icon="circle"
					label={t('TRACKERS')}
					isActive={active === 'trackers'}
					onClick={() => history.push('/trackers')}
					roles={[AuthRole.ADMIN, AuthRole.MONITOR]}
				/>
			)}
			<BarItem
				spaceTop
				icon="user"
				label={'PERFIL'}
				isActive={active === 'profile'}
				onClick={() => history.push('/profile')}
				roles={[
					AuthRole.ADMIN,
					AuthRole.MONITOR,
					AuthRole.PILOT,
					AuthRole.COA,
					AuthRole.REMOTE_SENSOR,
					AuthRole.AIR_TRAFIC
				]}
			/>

			{/*<BarItem
				spaceTop
				icon="plus"
				label={`${t('CREATE NEW')}...`}
				isActive={active === 'editor'}
				onClick={() => history.push('/editor')}
				roles={[AuthRole.ADMIN, AuthRole.PILOT]}
			/>*/}
		</>
	);
};
export default BarItems;
