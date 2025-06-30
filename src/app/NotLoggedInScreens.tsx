import { Route, Switch, useHistory } from 'react-router-dom';
import LoginScreen from './modules/auth/screens/LoginScreen';
import PasswordResetRequest from './modules/auth/screens/PasswordResetRequest';
import PasswordResetScreen from './modules/auth/screens/PasswordResetScreen';
import RegisterScreen from './modules/auth/screens/RegisterScreen';
import VerificationScreen from './modules/auth/screens/VerificationScreen';
import LivePublicMap from './modules/map/screens/live/LivePublicMap';


const NotLoggedInScreens = () => {
	const history = useHistory();
	return (
		<Switch>
			<Route exact path="/map">
				<LivePublicMap />
			</Route>
			<Route exact path="/verify/:username">
				<VerificationScreen />
			</Route>
			<Route exact path="/reset-password/request">
				<PasswordResetRequest />
			</Route>
			<Route exact path="/reset-password/">
				<PasswordResetScreen />
			</Route>
			<Route exact path="/register">
				<RegisterScreen />
			</Route>
			<Route path="/">
				<LoginScreen />
			</Route>
		</Switch>
	);
};

export default NotLoggedInScreens;
