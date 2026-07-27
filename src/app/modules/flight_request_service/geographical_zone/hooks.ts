import { useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import {
	useFlightRequestServiceAPI,
	usePublicFlightRequestServiceAPI,
	useQueryString
} from '../../../utils';
import { WebMercatorViewport } from '@deck.gl/core/typed';
import { GeographicalZone } from '@flight-request-entities/geographicalZone';
import { useTokyo } from '@tokyo/store';
import { polygon } from '@turf/helpers';
import { useDebounce } from '@uidotdev/usehooks';
import { Polygon } from 'geojson';
import { useTranslation } from 'react-i18next';
import { useGeographicalZoneStore } from './store';

export function useSelectedGeographicalZone() {
	const queryString = useQueryString();
	const {
		geographicalZone: { getGeographicalZone }
	} = useFlightRequestServiceAPI();

	const idGz = queryString.get('geographical-zone');
	const prev = queryString.get('prev');
	const querySelectedGz = useQuery(
		['geographicalZone', idGz],
		() => getGeographicalZone(idGz || ''),
		{
			enabled: false
		}
	);

	useEffect(() => {
		if (idGz) {
			querySelectedGz.refetch();
		}
	}, [idGz]);

	const gz = querySelectedGz?.data?.data;

	return {
		gz,
		selected: { geographicalZone: idGz, prev: prev ? prev.replace(/'/g, '') : undefined },
		query: querySelectedGz
	};
}

// Public counterpart of useSelectedGeographicalZone, used by the map shown to
// visitors without a session. Hits the unauthenticated getById, which returns
// only safe fields + minimun_coordination_days (no coordinator object).
export function usePublicSelectedGeographicalZone() {
	const queryString = useQueryString();
	const {
		geographicalZone: { getPublicGeographicalZone }
	} = usePublicFlightRequestServiceAPI();

	const idGz = queryString.get('geographical-zone');
	const prev = queryString.get('prev');
	const querySelectedGz = useQuery(
		['publicGeographicalZone', idGz],
		() => getPublicGeographicalZone(idGz || ''),
		{
			enabled: false
		}
	);

	useEffect(() => {
		if (idGz) {
			querySelectedGz.refetch();
		}
	}, [idGz]);

	const gz = querySelectedGz?.data?.data;

	return {
		gz,
		selected: { geographicalZone: idGz, prev: prev ? prev.replace(/'/g, '') : undefined },
		query: querySelectedGz
	};
}

export function useQueryGeographicalZonesIntersectingPolygon(
	polygon: Polygon,
	min_altitude: number,
	max_altitude: number
) {
	const {
		geographicalZone: { getGeographicalZonesIntersecting }
	} = useFlightRequestServiceAPI();
	const query = useQuery(
		['intersectingPolygonCoordinations', polygon],
		() => getGeographicalZonesIntersecting(polygon, min_altitude, max_altitude),
		{
			enabled: !!polygon
		}
	);
	const intersections = query.data?.data.geographicalZones as GeographicalZone[];
	return { intersections, isLoading: query.isLoading };
}

export function useQueryGeographicalZones(all = false) {
	const { t } = useTranslation();

	const {
		geographicalZone: { getGeographicalZones }
	} = useFlightRequestServiceAPI();

	const pageTake = useGeographicalZoneStore((state) => state.pageTake);
	const pageSkip = useGeographicalZoneStore((state) => state.pageSkip);
	const sortingProperty = useGeographicalZoneStore((state) => state.sortingProperty);
	const sortingOrder = useGeographicalZoneStore((state) => state.sortingOrder);
	const filterProperty = useGeographicalZoneStore((state) => state.filterProperty);
	const filterMatchingText = useGeographicalZoneStore((state) => state.filterMatchingText);

	const tokyo = useTokyo();
	const box = useMemo(() => {
		if (tokyo.state.viewState) {
			const viewport = new WebMercatorViewport(tokyo.state.viewState);
			const topLeft = viewport.unproject([0, 0]);
			const topRight = viewport.unproject([viewport.width, 0]);
			const bottomRight = viewport.unproject([viewport.width, viewport.height]);
			const bottomLeft = viewport.unproject([0, viewport.height]);
			return topLeft && topRight && bottomRight && bottomLeft
				? polygon([[topLeft, topRight, bottomRight, bottomLeft, topLeft]])
				: null;
		} else {
			return null;
		}
	}, [tokyo.state.viewState, all]);

	const debouncedBox = useDebounce(box, 500);

	const {
		isLoading,
		isSuccess,
		isError,
		data: responseGeographicalZones,
		isPreviousData,
		isFetching,
		error
	} = useQuery(
		[
			'geographicalZones',
			pageTake,
			pageSkip,
			sortingProperty,
			sortingOrder,
			filterProperty,
			filterMatchingText,
			debouncedBox
		],
		() =>
			getGeographicalZones(
				all ? 9999 : pageTake,
				all ? 0 : pageSkip,
				sortingProperty,
				sortingOrder,
				filterProperty,
				filterMatchingText,
				all && debouncedBox
					? debouncedBox.geometry
					: all
					? {
							type: 'Polygon',
							coordinates: [
								[
									[-0.01, -0.01],
									[0.01, -0.01],
									[-0.01, 0.01],
									[0.01, 0.01],
									[-0.01, -0.01]
								]
							]
					  }
					: undefined
			),
		{ keepPreviousData: true }
	);

	const data = isSuccess ? responseGeographicalZones.data : null;
	const items = isSuccess ? responseGeographicalZones.data.geographicalZones : [];
	const count = data ? data.count : 0;

	return {
		items,
		count,
		data,
		isPreviousData,
		isLoading,
		isSuccess,
		isError,
		isFetching,
		error
	};
}

/**
 * Same shape as useQueryGeographicalZones, but backed by the unauthenticated
 * endpoint so it can be used by the map shown to visitors without a session.
 * There is no viewport filtering here: the public endpoint ignores the polygon,
 * so we just fetch the whole set once.
 */
export function useQueryPublicGeographicalZones() {
	const {
		geographicalZone: { getPublicGeographicalZones }
	} = usePublicFlightRequestServiceAPI();

	const {
		isLoading,
		isSuccess,
		isError,
		data: responseGeographicalZones,
		isPreviousData,
		isFetching,
		error
	} = useQuery(
		['publicGeographicalZones'],
		() => getPublicGeographicalZones(9999, 0, 'name', 'ASC'),
		{ keepPreviousData: true }
	);

	const data = isSuccess ? responseGeographicalZones.data : null;
	const items = isSuccess ? responseGeographicalZones.data.geographicalZones : [];
	const count = data ? data.count : 0;

	return {
		items,
		count,
		data,
		isPreviousData,
		isLoading,
		isSuccess,
		isError,
		isFetching,
		error
	};
}
