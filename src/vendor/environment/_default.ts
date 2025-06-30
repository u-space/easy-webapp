// DO NOT IMPORT THIS FILE DIRECTLY

import { logCIELUMError, logCIELUMGeneralInfo } from '../../utils';
import { Tenant } from './_types';

const host = 'localhost';
const port = 8228;

const defaultTenant: Tenant = {
	code: 'dev',
	short_name: 'CIELUMeasy (DevTenant)',
	assets: {
		favicon: '/dev/favicon.ico',
		logo: '/dev/platform.png',
		logo_tenant: '/dev/organization.png',
		login_background: '/dev/bg.jpg',
		dashboard_background: '/dev/dashboard_background.png',
		privacy_policy: {
			es: '/dev/privacy/es.md',
			en: '/dev/privacy/en.md'
		}
	},
	features: {
		RealtimeMap: { enabled: true, options: { hideOperationsControls: false } },
		UsersHub: { enabled: true },
		Operations: { enabled: true, options: { pilotCanCreateOperations: true } },
		RegularFlights: { enabled: true },
		Vehicles: { enabled: true, options: { hideUvin: false } },
		Uvrs: { enabled: true },
		Rfvs: { enabled: true },
		FlightRequests: {
			enabled: true,
			options: {
				liaisons: [],
				coordinatorTypes: [],
				defaultOperatorUsername: 'CHANGE_ME'
			}
		},
		Trackers: { enabled: true },
		BarLogo: { enabled: true, options: { collapsedTransform: '' } },
		ViewPublicMapButtonOnLoginScreen: { enabled: false }
	},
	extras: {}
};

interface Env {
	production: boolean;
	public_url: string;
	core_api: string;
	flight_request_api?: string; // If not provided, the app will show a static error in those pages that depend on this service
	flight_request_public_api?: string;
	dev_server?: {
		port: number;
	};
	tenant: Tenant;
	maintenance_mode?: {
		// If this is set, the app will show a static maintenance screen
		description?: string; // User-friendly description of the maintenance reason
	};
	API_keys: {
		// API keys for external services
		geoapify?: string; // If not provided, the Geocoder will display an error
	};
	redirect_small_screens_url?: string; // If provided, the app will redirect users with small screen size to this url
	timeout?: number;
	max_file_size?: number;
}

const config: Env = {
	production: false,
	public_url: `https://${host}:${port}`,
	core_api: `https://${host}:3000`,
	flight_request_api: `https://${host}:3002/api`,
	flight_request_public_api: `https://${host}:3002/public`,
	dev_server: {
		port: port
	},
	tenant: defaultTenant,
	API_keys: {},
	timeout: 20000,
	max_file_size: 5 * 1024 * 1024
};

try {
	const tenantFile = require('./tenant.ts');
	config.tenant = tenantFile.default;
	logCIELUMGeneralInfo(`Using tenant configuration for ${config.tenant.short_name}.`);
} catch (e) {
	logCIELUMError('No tenant configuration found.');
}

export default config;
