import { Static, Type } from '@sinclair/typebox';
import { GeojsonPolygon } from '@utm-entities/v2/model/geojson';
import { UtmEntity } from '@utm-entities/v2/utm-entity';
import { Polygon } from 'geojson';

const DEFAULT_MAX_ALTITUDE = 120;
const DEFAULT_MIN_ALTITUDE = 0;
const DEFAULT_DIFF_HOURS = 2;

export const RequestOperationVolume = Type.Object({
	id: Type.Optional(Type.Number()),
	max_altitude: Type.String(), // TODO: Backend should return this as a number
	min_altitude: Type.String(), // TODO: Backend should return this as a number
	beyond_visual_line_of_sight: Type.Boolean(),
	//near_structure: Type.Boolean(),
	effective_time_begin: Type.String(),
	effective_time_end: Type.String(),
	ordinal: Type.String(), // TODO: Backend should return this as a number
	operation_geography: GeojsonPolygon
});

export type RequestOperationVolume = Static<typeof RequestOperationVolume>;

export const ResponseOperationVolume = Type.Composite([
	RequestOperationVolume,
	Type.Object({
		id: Type.Number()
	})
]);

export type ResponseOperationVolume = Static<typeof ResponseOperationVolume>;

export class OperationVolume implements UtmEntity<RequestOperationVolume> {
	readonly id: number | null; // Null if not yet saved
	readonly ordinal: number;
	readonly near_structure: boolean;
	readonly effective_time_begin: Date | null;
	readonly effective_time_end: Date | null;
	readonly min_altitude: number;
	readonly max_altitude: number;
	readonly beyond_visual_line_of_sight: boolean;
	readonly operation_geography: Polygon | null;

	[key: string]: OperationVolume[keyof OperationVolume];

	constructor(backendOperationVolume?: ResponseOperationVolume) {
		if (backendOperationVolume) {
			this.id = backendOperationVolume.id;
			this.ordinal = Number(backendOperationVolume.ordinal);
			//this.near_structure = backendOperationVolume.near_structure;
			this.near_structure = false;
			this.effective_time_begin = new Date(backendOperationVolume.effective_time_begin);
			this.effective_time_end = new Date(backendOperationVolume.effective_time_end);
			this.min_altitude = Number(backendOperationVolume.min_altitude);
			this.max_altitude = Number(backendOperationVolume.max_altitude);
			this.beyond_visual_line_of_sight = backendOperationVolume.beyond_visual_line_of_sight;
			this.operation_geography = backendOperationVolume.operation_geography;
		} else {
			// default values
			this.id = null;
			this.ordinal = 0;
			this.near_structure = false;
			// this.effective_time_begin = null;
			// this.effective_time_end = null;
			this.effective_time_begin = new Date();
			this.effective_time_end = new Date();
			this.effective_time_end.setHours(this.effective_time_begin.getHours() + DEFAULT_DIFF_HOURS);
			this.min_altitude = DEFAULT_MIN_ALTITUDE;
			this.max_altitude = DEFAULT_MAX_ALTITUDE;
			this.beyond_visual_line_of_sight = false;
			this.operation_geography = null;
		}
	}

	asPrintableEntries(): { property: string; value: string }[] {
		const entries: { property: string; value: string }[] = [];
		entries.push({ property: 'min_altitude', value: this.min_altitude.toString() });
		entries.push({ property: 'max_altitude', value: this.max_altitude.toString() });
		return entries;
	}

	asBackendFormat(): RequestOperationVolume {
		if (!this.operation_geography) throw new Error('Operation volume must have a polygon');
		if (!this.effective_time_begin) throw new Error('Operation volume must have a start time');
		if (!this.effective_time_end) throw new Error('Operation volume must have an end time');

		const requestOperationVolume: RequestOperationVolume = {
			min_altitude: this.min_altitude.toString(),
			max_altitude: this.max_altitude.toString(),
			beyond_visual_line_of_sight: this.beyond_visual_line_of_sight,
			//near_structure: this.near_structure,
			operation_geography: this.operation_geography,
			ordinal: this.ordinal.toString(),
			effective_time_begin: this.effective_time_begin.toISOString(),
			effective_time_end: this.effective_time_end.toISOString()
			// First and last point same-ness is enforced by the map library
		};

		if (this.id) requestOperationVolume.id = this.id; // Operation volume exists, we are updating it
		return requestOperationVolume;
	}

	get displayName() {
		return `${this.ordinal
			} (${this.effective_time_begin?.toLocaleTimeString()} - ${this.effective_time_end?.toLocaleTimeString()})`;
	}

	set(prop: string, value: OperationVolume[keyof OperationVolume]) {
		this[prop] = value;
	}

	get(prop: string) {
		return this[prop];
	}

	get asDMS() {
		return this.operation_geography?.coordinates[0].map((coord: any) => {
			const lat = coord[1];
			const long = coord[0];
			const latDMS = getDMSFromDecimal(lat);
			const longDMS = getDMSFromDecimal(long);
			return `${latDMS.isPositive ? `${latDMS.text} N` : `${latDMS.text} S`} ${longDMS.isPositive ? `${longDMS.text} E` : `${longDMS.text} W`
				}`;
		});
	}
}

export const getAsDMS = (operation_geography: Polygon) => {
	return operation_geography?.coordinates[0].map((coord: any) => {
		const lat = coord[1];
		const long = coord[0];
		const latDMS = getDMSFromDecimal(lat);
		const longDMS = getDMSFromDecimal(long);
		return `${latDMS.isPositive ? `${latDMS.text} N` : `${latDMS.text} S`} ${longDMS.isPositive ? `${longDMS.text} E` : `${longDMS.text} W`
			}`;
	});
};

function getDMSFromDecimal(decimal: number) {
	const fractionalDegrees = Math.abs(decimal);
	const degrees = Math.trunc(fractionalDegrees);
	const fractionalMinutes = (fractionalDegrees - degrees) * 60;
	const minutes = Math.trunc(fractionalMinutes);
	const fractionalSeconds = (fractionalMinutes - minutes) * 60;
	const DIGITS_AFTER_SECONDS = 3;
	const factor = 10 ** DIGITS_AFTER_SECONDS;
	const seconds = Math.round(fractionalSeconds * factor) / factor;
	return {
		isPositive: decimal > 0,
		text: `${degrees}°${minutes}'${seconds}"`
	};
}
