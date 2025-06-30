import { getUTMClient } from '@utm-entities/client';
import { getFlightRequestServiceAPIClient } from '@flight-request-entities/client';
import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import env from '../vendor/environment/env';
import { getWebConsoleLogger } from '../utils';
import { Tenant } from '../vendor/environment/_types';

export function useQueryString() {
	const { search } = useLocation();
	return useMemo(() => new URLSearchParams(search), [search]);
}

export function getAssetPath(pathFromAssetsFolder: string) {
	return `${env.public_url}/vendor/assets/${pathFromAssetsFolder}`;
}

export function getFeatureOption<T>(feature: keyof Tenant['features'], option: string): T {
	if (!env.tenant.features[feature].enabled) throw new Error(`Feature ${feature} is not enabled`);

	if (env.tenant.features[feature].options === undefined)
		throw new Error(`Feature ${feature} has no options`);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if (env.tenant.features[feature].options[option] === undefined)
		throw new Error(`Option ${option} does not exist`);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return env.tenant.features[feature].options[option];
}

export const CoreAPIContext = createContext(
	getUTMClient(
		env.core_api,
		{
			users: {},
			vehicles: {},
			documents: {},
			vehicleDocument: {}
		},
		null
	)
);

if (!env.flight_request_api)
	getWebConsoleLogger().getErrorForDeveloperToFix('flight_request_api is not defined in env.ts');
export const FlightRequestAPIContext = createContext(
	getFlightRequestServiceAPIClient(env.flight_request_api || '', '')
);

export const PublicFlightRequestAPIContext = createContext(
	getFlightRequestServiceAPIClient(env.flight_request_public_api || '', '')
);

export const getCSSVariable = (name: string) => {
	return window.getComputedStyle(document.documentElement).getPropertyValue(`--${name}`);
};

export const setCSSVariable = (name: string, value: string) => {
	document.documentElement.style.setProperty(`--${name}`, value);
};

export const useCoreServiceAPI = () => useContext(CoreAPIContext);
export const useFlightRequestServiceAPI = () => useContext(FlightRequestAPIContext);
export const usePublicFlightRequestServiceAPI = () => useContext(PublicFlightRequestAPIContext);
