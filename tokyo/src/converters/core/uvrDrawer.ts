import { PolygonLayer } from '@deck.gl/layers/typed';
import _ from 'lodash';
import type { ConvertToLayer, RGBA, RGBnumber } from '../../types';
import { getPickableId, PickableType } from '../../util';

import type { UvrEntity } from '@utm-entities/uvr';
import { ELEVATION_MULTIPLIER } from '../util';

export interface OperationDrawingProps {
	fillAlpha?: RGBnumber; // 0-255
	lineAlpha?: RGBnumber; // 0-255
	selected?: { gufi: string; volume: number };
	t?: (key: string) => string;
}

export const uvrTokyoConverter: ConvertToLayer<UvrEntity, OperationDrawingProps> = {
	getId: getIdFromUvr,
	getConverter: getConverterFromOperation
};

function getIdFromUvr(uvr: UvrEntity) {
	return getPickableId(
		PickableType.Uvr,
		uvr.message_id || '',
		`type:${uvr.type},cause:${uvr.cause},reason:${uvr.reason}` || ''
	);
}

function getConverterFromOperation(_uvr: UvrEntity, options?: OperationDrawingProps) {
	const uvr: UvrEntity = _.cloneDeep(_uvr);

	// No entiendo estas lineas, trato de adaptar
	// uvr.operation_volumes.forEach((volume) => {
	// 	if (volume.operation_geography)
	// 		volume.operation_geography.coordinates[0].forEach((coordinate) => {
	// 			coordinate[2] = volume.min_altitude * ELEVATION_MULTIPLIER;
	// 		});
	// });
	if (uvr.geography)
		uvr.geography.coordinates[0].forEach((coordinate) => {
			coordinate[2] = uvr.min_altitude * ELEVATION_MULTIPLIER;
		});

	const id = getIdFromUvr(uvr);
	const fillAlpha = options?.fillAlpha ?? 100;
	const lineAlpha = options?.lineAlpha ?? 255;

	const fillColor: RGBA = [255, 153, 51, fillAlpha];
	const lineColor: RGBA = [255, 153, 51, lineAlpha];

	return () =>
		new PolygonLayer({
			pickable: true,
			id,
			data: [{ ...uvr.geography, properties: uvr }],
			getPolygon: (d) => d.coordinates,
			getFillColor: fillColor,
			getLineColor: lineColor,
			lineWidthUnits: 'pixels',
			getLineWidth: 1,
			filled: true,
			extruded: true,
			parameters: {
				depthMask: false
			}
			//getElevation: 400
		});
}
