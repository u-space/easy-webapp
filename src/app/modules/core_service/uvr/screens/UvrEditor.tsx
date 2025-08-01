import { PButtonProps } from '@pcomponents/PButton';
import { PFullModalProps } from '@pcomponents/PFullModal';
import { PModalType } from '@pcomponents/PModal';
import { useTokyo } from '@tokyo/store';
import { EditMode } from '@tokyo/types';
import { translateErrors } from '@utm-entities/_util';
import { UvrEntity } from '@utm-entities/uvr';
import { Polygon } from 'geojson';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { reactify } from 'svelte-preprocess-react';
import MapLayout from '../../../../commons/layouts/MapLayout';
import { useQueryString } from '../../../../utils';
import { useQueryGeographicalZones } from '../../../flight_request_service/geographical_zone/hooks';
import EditorMapViewSvelte from '../../../map/screens/editor/EditorMapView.svelte';
import { EditorMapViewProps } from '../../../map/screens/editor/EditorMapViewProps';
import InfoUvr from '../components/InfoUvr';
import { useQueryUvr, useUpdateUvr } from '../hooks';
import CardGroup from 'src/app/commons/layouts/dashboard/menu/CardGroup';
import ContextualInfo from 'src/app/commons/layouts/map/editor_map/ContextualInfo';
import env from 'src/vendor/environment/env';

const EditorMapView = reactify(EditorMapViewSvelte);

const UvrEditor = () => {
	const { t } = useTranslation(['ui', 'glossary']);
	const history = useHistory();
	const queryString = useQueryString();

	const id = queryString.get('message_id');

	const queryUvr = useQueryUvr(id || '', !!id);
	const tokyo = useTokyo();

	const queryGeographicalZones = useQueryGeographicalZones(true);

	const [modalProps, setModalProps] = useState<PFullModalProps | undefined>(undefined);
	const [selectedVolume, setSelectedVolume] = useState<number | null>(null);

	const uvr = useMemo(() => {
		if (queryUvr.isSuccess) {
			return queryUvr.data?.data;
		} else {
			return new UvrEntity();
		}
	}, [queryUvr.data?.data, queryUvr.isSuccess]);

	const polygons = useMemo(() => {
		if (uvr.geography) {
			return uvr.geography ? [_.cloneDeep(uvr.geography)] : [];
		} else {
			return [];
		}
	}, [uvr.geography]);

	const onPolygonsUpdated = useCallback(
		(polygons: Polygon[]) => {
			uvr.geography = polygons[0];
		},
		[uvr]
	);

	const queryClient = useQueryClient();
	const saveUvrMutation = useUpdateUvr(
		() =>
			setModalProps({
				isVisible: true,
				type: PModalType.SUCCESS,
				title: t('Success'),
				content: t('The Uvr was created successfully'),
				primary: {
					onClick: () => {
						queryClient.invalidateQueries('uvrs').then();
						history.push('/uvrs');
					}
				}
			}),
		(error) =>
			setModalProps({
				isVisible: true,
				type: PModalType.ERROR,
				title: t('An error ocurred while saving'),
				content: translateErrors(error, 'uvr'),
				primary: {
					onClick: resetError
				}
			})
	);

	const save: PButtonProps['onClick'] = (evt) => {
		evt.preventDefault();
		// saveUvrMutation.mutate({ entity: uvr });
		saveUvrMutation.mutate(uvr);
	};

	const resetError = () => {
		setModalProps(undefined);
		saveUvrMutation.reset();
	};

	/* -- */

	useEffect(() => {
		const geography = queryUvr.data?.data.geography;
		if (queryUvr.isSuccess && geography) {
			tokyo.flyToCenterOfGeometry(geography);
		}
	}, [queryUvr.data?.data.geography, queryUvr.isSuccess, tokyo]);

	const props = _.filter(_.keys(uvr), (key) => key !== 'message_id' && key !== 'cause');

	const editorMapViewProps: EditorMapViewProps = {
		geographicalZones: queryGeographicalZones.items,
		editOptions: {
			mode: EditMode.SINGLE,
			polygons
		},
		flightRequests: [],
		controlsOptions: {
			zoom: {
				enabled: true
			},
			geocoder: {
				enabled: true,
				geoapifyApiKey: env.API_keys.geoapify
			},
			geolocator: {
				enabled: true
			},
			backgroundModeSwitch: {
				enabled: true
			}
		}
	};
	return (
		<MapLayout
			isLoading={{
				menu: saveUvrMutation.isLoading || saveUvrMutation.isSuccess,
				main: saveUvrMutation.isLoading
			}}
			menu={
				<InfoUvr
					uvr={uvr}
					isEditingExisting={queryUvr.isSuccess}
					props={props}
					save={save}
				/>
			}
			statusOverlay={{
				text: `### ${t('You are in EDITOR MODE')} `
			}}
			modal={modalProps}
		// contextual={
		// 	<>
		// 		{selectedVolume !== null && (
		// 			<CardGroup header={t('Editar uvr')}>
		// <ContextualInfo
		// 					entity={uvr}
		// 					entityName={'uvr'}
		// 					hiddenProps={['ordinal', 'id']}
		// 				/>
		// 			</CardGroup>
		// 		)}
		// 	</>
		// }
		>
			<EditorMapView
				{...editorMapViewProps}
				onSelect={(e) => setSelectedVolume((e as CustomEvent<number>).detail)}
				onEdit={(e) => onPolygonsUpdated((e as CustomEvent<Polygon[]>).detail)}
			/>
		</MapLayout>
	);
};

export default observer(UvrEditor);
