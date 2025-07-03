import { FlightRequestEntity } from '@flight-request-entities/flightRequest';
import { GeographicalZone } from '@flight-request-entities/geographicalZone';
import { ControlsOptions, EditOptions } from '@tokyo/types';
import { UvrEntity } from '@utm-entities/uvr';

export interface EditorMapViewProps {
	geographicalZones: GeographicalZone[];
	flightRequests: FlightRequestEntity[];
	uvrs?: UvrEntity[];
	editOptions: EditOptions;
	controlsOptions?: ControlsOptions;
}
