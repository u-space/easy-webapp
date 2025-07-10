import { useTranslation } from 'react-i18next';
import MasterLayout from './commons/layouts/MasterLayout';
import { Switch, useHistory } from 'react-router-dom';
import RoleGatedRoute from './commons/components/RoleGatedRoute';
import { AuthRole, useAuthStore } from './modules/auth/store';
import Home from './commons/screens/Home';
import LiveMap from './modules/map/screens/live/LiveMap';
import UserHub from './modules/core_service/user/screens/UserHub';
import OperationHub from './modules/core_service/operation/screens/OperationHub';
import RegularFlightHub from './modules/core_service/regular_flight/screens/RegularFlightHub';
import SimpleStaticInformation from './commons/screens/SimpleStaticInformation';
import VehiclesHub from './modules/core_service/vehicle/screens/VehicleHub';
import UvrsHub from './modules/core_service/uvr/screens/UvrHub';
import CoordinatorsHub from './modules/flight_request_service/coordinators/screens/CoordinatorHub';
import Editors from './commons/screens/Editors';
import OperationEditor from './modules/core_service/operation/screens/OperationEditor';
import NewUserScreen from './modules/core_service/user/screens/NewUserScreen';
import NewVehicleScreen from './modules/core_service/vehicle/screens/NewVehicleScreen';
import { isFeatureEnabled } from '../utils';
import NewCoordinatorScreen from './modules/flight_request_service/coordinators/screens/NewCoordinatorScreen';
import TrackersHub from './modules/core_service/tracker/screens/TrackersHub';
import NewTrackerScreen from './modules/core_service/tracker/screens/NewTrackerScreen';
import RfvHub from './modules/core_service/rfv/screens/RfvHub';
import RfvEditor from './modules/core_service/rfv/screens/RfvEditor';
import SuccessScreen from './modules/flight_request_service/flight_request/screens/SuccessScreen';
import CanceledScreen from './modules/flight_request_service/flight_request/screens/CanceledScreen';
import FlightRequestHub from './modules/flight_request_service/flight_request/screens/FlightRequestHub';
import PlanningMap from './modules/flight_request_service/flight_request/screens/PlanningMap';
import { getFeatureOption } from './utils';
import UserProfileScreen from './modules/core_service/user/screens/UserProfileScreen';
import CoordinationHub from './modules/flight_request_service/coordination/screens/CoordinationHub';
import { reactify } from 'svelte-preprocess-react';
import FlightRequestEditorSvelte from './modules/flight_request_service/flight_request/screens/FlightRequestEditorApp.svelte';
import LegacyFlightRequestStepsEditor from './modules/flight_request_service/flight_request/screens/LegacyFlightRequestStepsEditor';
import Vehicle from './modules/core_service/vehicle/screens/Vehicle';
import HistoricalMapApp from './modules/map/screens/historical/HistoricalMapApp.svelte';
import UpdateGeographicalZonesScreen from './modules/admin/screens/UpdateGeographicalZonesScreen';
import UvrEditor from './modules/core_service/uvr/screens/UvrEditor';
import DocumentHub from './modules/document/screens/DocumentHub';
// import CoordinatorMapEditor from './modules/flight_request_service/coordinators/screens/CoordinatorMapEditor';
const HistoricalMap = reactify(HistoricalMapApp);

const FlightRequestEditor = reactify(FlightRequestEditorSvelte);

const LoggedInScreens = () => {
	const { t } = useTranslation();
	const token = useAuthStore((state) => state.token);
	const history = useHistory();

	return (
		<MasterLayout>
			<Switch>
				{/* Home Screen */}
				<RoleGatedRoute
					exact
					path={'/'}
					roles={[
						AuthRole.ADMIN,
						AuthRole.PILOT,
						AuthRole.MONITOR,
						AuthRole.COA,
						AuthRole.REMOTE_SENSOR,
						AuthRole.AIR_TRAFIC
					]}
				>
					<Home />
				</RoleGatedRoute>
				<RoleGatedRoute
					path={'/profile'}
					roles={[
						AuthRole.ADMIN,
						AuthRole.PILOT,
						AuthRole.MONITOR,
						AuthRole.COA,
						AuthRole.REMOTE_SENSOR,
						AuthRole.AIR_TRAFIC
					]}
				>
					<UserProfileScreen />
				</RoleGatedRoute>
				<RoleGatedRoute
					exact
					path={'/editor'}
					roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.COA, AuthRole.REMOTE_SENSOR]}
				>
					<Editors />
				</RoleGatedRoute>
				<RoleGatedRoute exact path={'/editor/user'} roles={[AuthRole.ADMIN]}>
					<NewUserScreen />
				</RoleGatedRoute>
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Realtime Map */}
				{isFeatureEnabled('RealtimeMap') && (
					<RoleGatedRoute
						path={'/map'}
						roles={[
							AuthRole.ADMIN,
							AuthRole.PILOT,
							AuthRole.MONITOR,
							AuthRole.COA,
							AuthRole.REMOTE_SENSOR,
							AuthRole.AIR_TRAFIC
						]}
					>
						<LiveMap />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* UsersHub */}
				{isFeatureEnabled('UsersHub') && (
					<RoleGatedRoute path={'/users'} roles={[AuthRole.ADMIN, AuthRole.MONITOR]}>
						<UserHub />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Vehicles */}
				{isFeatureEnabled('Vehicles') && (
					<RoleGatedRoute
						exact
						path={'/vehicles/:uvin'}
						roles={[
							AuthRole.ADMIN,
							AuthRole.PILOT,
							AuthRole.MONITOR,
							AuthRole.REMOTE_SENSOR
						]}
					>
						<Vehicle />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('Vehicles') && (
					<RoleGatedRoute
						path={'/vehicles'}
						roles={[
							AuthRole.ADMIN,
							AuthRole.PILOT,
							AuthRole.MONITOR,
							AuthRole.REMOTE_SENSOR
						]}
					>
						<VehiclesHub />
					</RoleGatedRoute>
				)}

				{isFeatureEnabled('Vehicles') && (
					<RoleGatedRoute
						exact
						path={'/editor/vehicle'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.REMOTE_SENSOR]}
					>
						<NewVehicleScreen />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Operations */}
				{isFeatureEnabled('Operations') && (
					<RoleGatedRoute
						exact
						path={'/operations'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.MONITOR, AuthRole.COA]}
					>
						<OperationHub />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('Operations') && (
					<RoleGatedRoute
						exact
						path={'/historical'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.MONITOR, AuthRole.COA]}
					>
						<HistoricalMap token={token} />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('Operations') && (
					<RoleGatedRoute
						exact
						path={'/editor/operation'}
						roles={
							getFeatureOption('Operations', 'pilotCanCreateOperations')
								? [AuthRole.ADMIN, AuthRole.PILOT]
								: [AuthRole.ADMIN]
						}
					>
						<OperationEditor />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Regular Flights */}
				{isFeatureEnabled('RegularFlights') && (
					<RoleGatedRoute
						path={'/regular-flights'}
						roles={[AuthRole.ADMIN, AuthRole.MONITOR]}
					>
						<RegularFlightHub />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Rfvs */}
				{isFeatureEnabled('Rfvs') && (
					<RoleGatedRoute
						path={'/rfvs'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.MONITOR]}
					>
						<RfvHub />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('Rfvs') && (
					<RoleGatedRoute path={'/editor/rfv'} roles={[AuthRole.ADMIN]}>
						<RfvEditor />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Uvrs */}
				{isFeatureEnabled('Uvrs') && (
					<RoleGatedRoute
						path={'/uvrs'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.MONITOR, AuthRole.COA]}
					>
						<UvrsHub />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('Uvrs') && (
					<RoleGatedRoute path={'/editor/uvr'} roles={[AuthRole.ADMIN, AuthRole.COA]}>
						<UvrEditor />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Trackers */}
				{isFeatureEnabled('Trackers') && (
					<RoleGatedRoute
						path={'/trackers'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.MONITOR]}
					>
						<TrackersHub />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('Trackers') && (
					<RoleGatedRoute
						path={'/editor/tracker'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT]}
					>
						<NewTrackerScreen />
					</RoleGatedRoute>
				)}
				{/* ------------------------------------------------------------------------------------------------ */}
				{/* Flight Requests Feature Set */}
				{/* Coordinators */}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						path={'/coordinators'}
						roles={[AuthRole.ADMIN, AuthRole.MONITOR, AuthRole.COA]}
					>
						<CoordinatorsHub />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						path={'/coordinations'}
						roles={[
							AuthRole.ADMIN,
							AuthRole.MONITOR,
							AuthRole.COA,
							AuthRole.AIR_TRAFIC
						]}
					>
						<CoordinationHub />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						exact
						path={'/flight-requests'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.COA]}
					>
						<FlightRequestHub />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						path={'/flight-requests/:id'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.COA]}
					>
						<PlanningMap />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						exact
						path={'/editor/flightrequest/:polygon/:volumeData'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.COA]}
					>
						<LegacyFlightRequestStepsEditor />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						exact
						path={'/editor/flightrequest/:polygon'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.COA]}
					>
						<LegacyFlightRequestStepsEditor />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						exact
						path={'/editor/flightrequest'}
						roles={[AuthRole.ADMIN, AuthRole.PILOT, AuthRole.COA]}
					>
						<LegacyFlightRequestStepsEditor />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute path={'/success'} roles={[AuthRole.ADMIN, AuthRole.PILOT]}>
						<SuccessScreen />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute path={'/canceled'} roles={[AuthRole.ADMIN, AuthRole.PILOT]}>
						<CanceledScreen />
					</RoleGatedRoute>
				)}
				{isFeatureEnabled('FlightRequests') && (
					<RoleGatedRoute
						path={'/editor/coordinator'}
						roles={[AuthRole.ADMIN, AuthRole.COA]}
					>
						{/* <CoordinatorMapEditor /> */}
						<NewCoordinatorScreen />
					</RoleGatedRoute>
				)}
				<RoleGatedRoute path={'/documents'} roles={[AuthRole.ADMIN]}>
					<DocumentHub />
				</RoleGatedRoute>
				<RoleGatedRoute path={'/update-zones'} roles={[AuthRole.ADMIN]}>
					<UpdateGeographicalZonesScreen />
				</RoleGatedRoute>
				{/* Not found */}
				<SimpleStaticInformation
					title={t('Not found')}
					icon="high-priority"
					text={t('The requested page does not exist')}
				/>
			</Switch>
		</MasterLayout>
	);
};

export default LoggedInScreens;
