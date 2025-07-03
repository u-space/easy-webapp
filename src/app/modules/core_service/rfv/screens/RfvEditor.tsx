import { PButtonProps } from '@pcomponents/PButton';
import { PFullModalProps } from '@pcomponents/PFullModal';
import { PModalType } from '@pcomponents/PModal';
import { useTokyo } from '@tokyo/store';
import { EditMode } from '@tokyo/types';
import { translateErrors } from '@utm-entities/_util';
import { RfvEntity } from '@utm-entities/rfv';
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
import InfoRfv from '../components/InfoRfv';
import { useQueryRfv, useUpdateRfv } from '../hooks';
import env from 'src/vendor/environment/env';

const EditorMapView = reactify(EditorMapViewSvelte);

const RfvEditor = () => {
	const { t } = useTranslation(['ui', 'glossary']);
	const history = useHistory();
	const queryString = useQueryString();

	const id = queryString.get('id');

	const queryRfv = useQueryRfv(id || '', !!id);
	const tokyo = useTokyo();

	const queryGeographicalZones = useQueryGeographicalZones(true);

	const [modalProps, setModalProps] = useState<PFullModalProps | undefined>(undefined);
	const [selectedVolume, setSelectedVolume] = useState<number | null>(null);

	const rfv = useMemo(() => {
		if (queryRfv.isSuccess) {
			return queryRfv.data?.data;
		} else {
			return new RfvEntity();
		}
	}, [queryRfv.data?.data, queryRfv.isSuccess]);

	const polygons = useMemo(() => {
		if (rfv.geography) {
			return rfv.geography ? [_.cloneDeep(rfv.geography)] : [];
		} else {
			return [];
		}
	}, [rfv.geography]);

	const onPolygonsUpdated = useCallback(
		(polygons: Polygon[]) => {
			rfv.geography = polygons[0];
		},
		[rfv]
	);

	const queryClient = useQueryClient();
	const saveRfvMutation = useUpdateRfv(
		() =>
			setModalProps({
				isVisible: true,
				type: PModalType.SUCCESS,
				title: t('Success'),
				content: t('The Rfv was created successfully'),
				primary: {
					onClick: () => {
						queryClient.invalidateQueries('rfvs').then();
						history.push('/rfvs');
					}
				}
			}),
		(error) =>
			setModalProps({
				isVisible: true,
				type: PModalType.ERROR,
				title: t('An error ocurred while saving'),
				content: translateErrors(error, 'rfv'),
				primary: {
					onClick: resetError
				}
			})
	);

	const save: PButtonProps['onClick'] = (evt) => {
		evt.preventDefault();
		saveRfvMutation.mutate({ entity: rfv });
	};

	const resetError = () => {
		setModalProps(undefined);
		saveRfvMutation.reset();
	};

	/* -- */

	useEffect(() => {
		const geography = queryRfv.data?.data.geography;
		if (queryRfv.isSuccess && geography) {
			tokyo.flyToCenterOfGeometry(geography);
		}
	}, [queryRfv.data?.data.geography, queryRfv.isSuccess, tokyo]);

	const props = _.filter(_.keys(rfv), (key) => key !== 'id');

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
				menu: saveRfvMutation.isLoading || saveRfvMutation.isSuccess,
				main: saveRfvMutation.isLoading
			}}
			menu={
				<InfoRfv
					rfv={rfv}
					isEditingExisting={queryRfv.isSuccess}
					props={props}
					save={save}
				/>
			}
			statusOverlay={{
				text: `### ${t('You are in EDITOR MODE')} `
			}}
			modal={modalProps}
		>
			<EditorMapView
				{...editorMapViewProps}
				onSelect={(e) => setSelectedVolume((e as CustomEvent<number>).detail)}
				onEdit={(e) => onPolygonsUpdated((e as CustomEvent<Polygon[]>).detail)}
			/>
		</MapLayout>
	);
};

export default observer(RfvEditor);
