import { OperationEntity } from '@utm-entities/operation';
import { GeographicalZone } from '@flight-request-entities/geographicalZone';
import { RfvEntity } from '@utm-entities/rfv';
import { UvrEntity } from '@utm-entities/uvr';
import { PositionEntity } from '@utm-entities/position';
import { MapOptions, TokyoPick } from '@tokyo/types';
import { TokyoPolygon } from '@tokyo/shapes/2d/TokyoPolygon';

export enum LiveMapSelectableType {
	OPERATION = 'operation',
	GEOGRAPHICAL_ZONE = 'geographical_zone',
	RFV = 'rfv',
	UVR = 'uvr'
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

export interface LiveMapRfvSelected {
	type: LiveMapSelectableType.RFV;
	id: string;
}

export interface LiveMapUvrSelected {
	type: LiveMapSelectableType.UVR;
	id: string;
}

export type LiveMapSelected =
	| LiveMapOperationSelected
	| LiveMapGeographicalZoneSelected
	| LiveMapRfvSelected
	| LiveMapUvrSelected
	| null;

export interface LiveMapViewProps {
	rfvs: RfvEntity[];
	uvrs: UvrEntity[];

	handlers: {
		vehicleClick?: (vehicle: PositionEntity[]) => void;
		pick?: (elements: TokyoPick[]) => void;
	};
	// TODO: new props, remove old
	operations: OperationEntity[];
	geographicalZones: GeographicalZone[];
	t: (key: string) => string;
	mapOptions: Partial<MapOptions>;
	selected: LiveMapSelected;
	vehiclePositions: Map<string, PositionEntity[]>;
}
