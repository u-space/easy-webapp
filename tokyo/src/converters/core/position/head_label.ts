import type { PositionEntity } from '@utm-entities/position';
import type { ConvertToLayer } from '../../../types';
import { getPickableId, PickableType } from '../../../util';
import { TextLayer } from '@deck.gl/layers/typed';
import { ELEVATION_MULTIPLIER } from '../../util';

type HeadLabelDrawingProps = {
	size: number;
};

type VehiclePositionHeadLabelTokyoConverter = ConvertToLayer<PositionEntity, HeadLabelDrawingProps>;

const getConverterFromPosition: VehiclePositionHeadLabelTokyoConverter['getConverter'] =
	(position: PositionEntity, options: HeadLabelDrawingProps) => () => {
		return new TextLayer({
			id: getIdFromPosition(position),
			data: [position],
			pickable: false,
			billboard: true,
			getPosition: (d) => [
				d.location.coordinates[0],
				d.location.coordinates[1],
				d.altitude_gps * ELEVATION_MULTIPLIER
			],
			getText: (d) => `${d.altitude_gps}m AMSL`,
			getSize: options.size,
			getTextAnchor: 'start',
			getAlignmentBaseline: 'top',
			getPixelOffset: [5, 5],
			parameters: {
				depthTest: false
			}
		});
	};

function getIdFromPosition(position: PositionEntity) {
	return (
		getPickableId(PickableType.Vehicle, position.gufi + position.uvin, position.displayName) +
		'-label'
	);
}

export const vehiclePositionHeadLabelTokyoConverter: VehiclePositionHeadLabelTokyoConverter = {
	getId: getIdFromPosition,
	getConverter: getConverterFromPosition
};
