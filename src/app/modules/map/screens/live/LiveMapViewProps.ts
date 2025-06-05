import { GeographicalZone } from '@flight-request-entities/geographicalZone';
import { RfvEntity } from '@utm-entities/rfv';
import { UvrEntity } from '@utm-entities/uvr';
import { PositionEntity } from '@utm-entities/position';
import { ControlsOptions, TokyoPick } from '@tokyo/types';
import { BaseOperation } from '@utm-entities/v2/model/operation';
import { FlightRequestEntity } from '@flight-request-entities/flightRequest';

export enum LiveMapSelectableType {
	OPERATION = 'operation',
	GEOGRAPHICAL_ZONE = 'geographical_zone',
	RFV = 'rfv',
	UVR = 'uvr',
	FLIGHT_REQUEST = 'flight_request'
}
export interface LiveMapOperationSelected {
	type: LiveMapSelectableType.OPERATION;
	gufi: string;
	volume: number;
}

export interface LiveMapGeographicalZoneSelected {
	type: LiveMapSelectableType.GEOGRAPHICAL_ZONE;
	id: string;
}

export interface LiveMapFlightRequestZoneSelected {
	type: LiveMapSelectableType.FLIGHT_REQUEST;
	id: string;
}


export interface LiveMapRfvSelected {
	type: LiveMapSelectableType.RFV;
	id: string;
}

export interface LiveMapUvrSelected {
	type: LiveMapSelectableType.UVR;
	message_id: string;
	id: string;
}

export type LiveMapSelected =
	| LiveMapOperationSelected
	| LiveMapGeographicalZoneSelected
	| LiveMapFlightRequestZoneSelected
	| LiveMapRfvSelected
	| LiveMapUvrSelected
	| null;

export interface LiveMapViewProps {
	rfvs: RfvEntity[];
	uvrs: UvrEntity[];
	flightRequests: FlightRequestEntity[];

	handlers: {
		vehicleClick?: (vehicle: PositionEntity[]) => void;
		pick?: (elements: TokyoPick[]) => void;
	};
	// TODO: new props, remove old
	operations: BaseOperation[];
	geographicalZones: GeographicalZone[];
	t: (key: string) => string;
	controlsOptions: Partial<ControlsOptions>;
	selected: LiveMapSelected;
	vehiclePositions: Map<string, PositionEntity[]>;
	role: string;
	redirectToCreateOperation: () => void;
}
