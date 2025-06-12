import { FlightRequestEntity } from '@flight-request-entities/flightRequest';
import PButton, { PButtonSize } from '@pcomponents/PButton';
import PDateRangeInput from '@pcomponents/PDateRangeInput';
import { PFullModalProps } from '@pcomponents/PFullModal';
import { PModalType } from '@pcomponents/PModal';
import PNumberInput from '@pcomponents/PNumberInput';
import PTimeInput from '@pcomponents/PTimeInput';
import { EditMode, EditOptions } from '@tokyo/types';
import { OperationVolume } from '@utm-entities/v2/model/operation_volume';
import { Polygon } from 'geojson';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reactify } from 'svelte-preprocess-react';
import MapLayout from '../../../../../commons/layouts/MapLayout';
import EditorMapViewSvelte from '../../../../map/screens/editor/EditorMapView.svelte';
import { useQueryGeographicalZones } from '../../../geographical_zone/hooks';
import InfoFlightRequest from '../../components/InfoFlightRequest';
import { useOwnedFlightRequests } from '../../hooks';
import PFileInput from '@pcomponents/PFileInput';

const ONE_VOLUME_PER_DAY = false;

const EditorMapView = reactify(EditorMapViewSvelte);
interface VolumesStepProps {
	polygon: Polygon | undefined;
	nextStep: () => void;
	flightRequest: FlightRequestEntity;
	setPolygon: (polygon: Polygon) => void;
	modalProps: PFullModalProps | undefined;
	setModalProps: (modalProps: PFullModalProps | undefined) => void;
	isOnNight: boolean;
	setIsOnNight: (isOnNight: boolean) => void;
	defaultAltitude?: number;
}

const VolumesStep = (props: VolumesStepProps) => {
	const {
		polygon,
		nextStep,
		flightRequest,
		setPolygon,
		modalProps,
		setModalProps,
		isOnNight,
		setIsOnNight,
		defaultAltitude
	} = props;

	const date = new Date();
	const tenDaysFromNow = setHoursAndReturnDate(addDays(date, 10), 9, 0);

	const [startDate, setStartDate] = useState<Date>(tenDaysFromNow);

	const [endDate, setEndDate] = useState<Date>(addHours(tenDaysFromNow, 4));
	// const [file, setFile] = useState<File | null>(null);

	const { t } = useTranslation();

	const [maxAltitude, setMaxAltitude] = useState<number>(defaultAltitude || 100);
	const [isBlockingCenter, setBlockingCenterFlag] = useState<boolean>(false);

	const queryGeographicalZones = useQueryGeographicalZones(true);

	const frQuery = useOwnedFlightRequests();
	const flightRequests: FlightRequestEntity[] = frQuery.flightRequests;

	const getUserSelectIntervalModalProps = useCallback(
		(): PFullModalProps => ({
			isVisible: true,
			type: PModalType.INFORMATION,
			title: t('Select the time interval'),
			content: (
				<>
					{t('Start and end dates')}
					<PDateRangeInput
						value={[startDate, endDate]}
						onChange={(value) => {
							if (value[0]) {
								const newDate = new Date(value[0]);
								setStartDate(newDate);
							}
							if (value[1]) {
								const newDate = new Date(value[1]);
								setEndDate(newDate);
							}
						}}
					/>
					<PTimeInput
						defaultValue={startDate}
						onChange={(value: Date) => {
							if (value) {
								// If the start date is changed, the end date is set to 4 hours later

								const hours = value.getHours();
								const minutes = value.getMinutes();

								const newDate = new Date(startDate);
								newDate.setHours(hours);
								newDate.setMinutes(minutes);
								setStartDate(newDate);

								const newEndDate = new Date(endDate);
								newEndDate.setHours(hours + 4);
								newEndDate.setMinutes(minutes);
								setEndDate(newEndDate);
							}
						}}
						explanation={''}
						id={'Start_Time'}
						labelInfo={''}
						label={t('Start Time')}
						isDarkVariant
					/>
					<PTimeInput
						defaultValue={endDate}
						onChange={(value: Date) => {
							if (value) {
								setEndDate(value);
							}
						}}
						explanation={''}
						id={'End_Time'}
						labelInfo={''}
						label={t('End Time')}
						isDarkVariant
					/>
				</>
			),
			primary: {
				text: t('Add'),
				onClick: () => {
					if (ONE_VOLUME_PER_DAY) {
						// For each day in the range, create a new volume
						// with the start and end time
						getDatesBetween(startDate, endDate).forEach((date) => {
							const newVolume = new OperationVolume();
							newVolume.set('ordinal', flightRequest.volumes.length - 1);
							const startDateAux = setHoursMinutesSeconds(startDate, new Date(date));
							const endDateAux = setHoursMinutesSeconds(endDate, new Date(date));
							newVolume.set('max_altitude', maxAltitude);
							newVolume.set('effective_time_begin', startDateAux);
							newVolume.set('effective_time_end', endDateAux);
							flightRequest.volumes.push(newVolume);
							setModalProps(undefined);
						});
					} else {
						const errors = validateDatesTimeVolumes(flightRequest, startDate, endDate);
						if (errors.length === 0) {
							const newVolume = new OperationVolume();
							newVolume.set('ordinal', flightRequest.volumes.length - 1);
							newVolume.set('max_altitude', maxAltitude);
							newVolume.set('effective_time_begin', startDate);
							newVolume.set('effective_time_end', endDate);
							flightRequest.volumes.push(newVolume);
							setModalProps(undefined);
						} else {
							alert(errors.map(t).join('\n'));
						}
					}
				}
			},
			secondary: {
				text: 'Cancelar',
				onClick: () => {
					setModalProps(undefined);
				}
			}
		}),
		[t, startDate, endDate, maxAltitude, flightRequest, setModalProps]
	);

	useEffect(() => {
		if (polygon && flightRequest.volumes.length < 2) {
			setModalProps(getUserSelectIntervalModalProps());
		}
	}, [
		polygon,
		flightRequest.volumes,
		setModalProps,
		getUserSelectIntervalModalProps
	]);

	useEffect(() => {
		flightRequest.volumes.forEach((volume) => {
			volume.set('max_altitude', defaultAltitude);
		});
	}, []);

	const onPolygonsUpdated = useCallback(
		(polygons: Polygon[]) => {
			const needToOpenModal = (polygon !== undefined);
			setPolygon(polygons[0]);
		},
		[getUserSelectIntervalModalProps, setPolygon, setModalProps]
	);

	const editOptions: EditOptions = {
		mode: EditMode.SINGLE,
		polygons: polygon ? [polygon] : []
	};

	const timeOptions = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	} as Intl.DateTimeFormatOptions;

	return (
		<MapLayout
			statusOverlay={{
				text: `### ${t('You are in EDITOR MODE')} `
			}}
			isBlockingCenter={isBlockingCenter}
			menu={
				<InfoFlightRequest
					{...{
						flightRequest,
						isEditingExisting: false,
						volumeProps: [],
						setBlockingCenter: setBlockingCenterFlag,
						nextStep
					}}
				>
					<div>
						<p>{t('Time intervals')}</p>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '1rem',
								justifyContent: 'center'
							}}
						>
							{flightRequest.volumes.map((volume, index) => {
								if (
									volume.effective_time_begin !== null &&
									volume.effective_time_end !== null
								) {
									return (
										<div
											key={volume.ordinal}
											style={{
												display: 'flex',
												justifyContent: 'center'
											}}
										>
											{volume.effective_time_begin.toLocaleString(
												[],
												timeOptions
											)}{' '}
											-{' '}
											{volume.effective_time_end.toLocaleString(
												[],
												timeOptions
											)}
											<PButton
												size={PButtonSize.SMALL}
												icon="minus"
												onClick={() => {
													if (flightRequest.volumes.length === 1) {
														flightRequest.volumes[0].set(
															'effective_time_begin',
															null
														);
														flightRequest.volumes[0].set(
															'effective_time_end',
															null
														);
													} else {
														flightRequest.volumes.splice(index, 1);
													}
												}}
											/>
										</div>
									);
								} else {
									return null;
								}
							})}
							<PButton
								size={PButtonSize.SMALL}
								icon="plus"
								id={'editor-flightRequest-add-time-interval'}
								onClick={() => {
									setModalProps(getUserSelectIntervalModalProps());
								}}
							>
								{t('Add interval')}
							</PButton>
						</div>
					</div>
					{isOnNight && (
						<div>
							<p>{t('Night Fly')}</p>
						</div>
					)}
					<div>
						<PNumberInput
							id="operation-height"
							label={t('Maximum altitude')}
							defaultValue={flightRequest.volumes[0]?.max_altitude ?? defaultAltitude}
							onChange={(value) => {
								setMaxAltitude(value);
								flightRequest.volumes.forEach((volume) => {
									volume.set('max_altitude', value);
								});
							}}
						/>
					</div>
					<div>
						<PFileInput
							id='editor-flightRequest-document'
							label={t('Document') + ' 1'}
							// labelInfo={flightRequest.document1?.name}
							defaultValue={flightRequest.document1}
							onChange={(value) => {
								flightRequest.set('document1', value);
							}}
							isDarkVariant
							isRequired={false}
							API={'changeme'}
						/>
						<PFileInput
							id='editor-flightRequest-document2'
							label={t('Document') + ' 2'}
							// labelInfo={flightRequest.document2?.name}
							defaultValue={flightRequest.document2}
							onChange={(value) => {
								flightRequest.set('document2', value);
							}}
							isDarkVariant
							isRequired={false}
							API={'changeme'}
						/>
					</div>
				</InfoFlightRequest>
			}
			modal={modalProps}
		>
			<EditorMapView
				editOptions={editOptions}
				geographicalZones={queryGeographicalZones.items}
				onEdit={(event: any) => onPolygonsUpdated(event.detail)}
				flightRequests={flightRequests}
			/>
			<PButton
				style={{
					position: 'absolute',
					bottom: '1rem'
				}}
				size={PButtonSize.LARGE}
				onClick={() => {
					nextStep();
				}}
			>
				{t('Continue')}
			</PButton>
		</MapLayout>
	);
};

// This function given 2 dates, returns an array of dates between them
const getDatesBetween = (startDate: Date, endDate: Date) => {
	const dates = [];
	const theDate = new Date(startDate);
	while (theDate <= endDate) {
		dates.push(new Date(theDate));
		theDate.setDate(theDate.getDate() + 1);
	}
	return dates;
};
// This function given 2 dates set the hour minutes and seconds of the secondone to the first one
const setHoursMinutesSeconds = (date: Date, dateToSet: Date) => {
	dateToSet.setHours(date.getHours());
	dateToSet.setMinutes(date.getMinutes());
	dateToSet.setSeconds(date.getSeconds());
	return dateToSet;
};

// This function add days to a date
const addDays = (date: Date, days: number) => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

const setHoursAndReturnDate = (date: Date, hours: number, minutes: number) => {
	date.setHours(hours);
	date.setMinutes(minutes);
	return date;
};

const addHours = (date: Date, hours: number) => {
	const result = new Date(date);
	result.setHours(result.getHours() + hours);
	return result;
};

export default observer(VolumesStep);

function validateDatesTimeVolumes(
	flightRequest: FlightRequestEntity,
	start: Date,
	end: Date
): string[] {
	const errors: string[] = [];
	const today = new Date();
	// if (start < today) {
	// 	errors.push(('The start date must be greater than today'));
	// }
	if (end < today) {
		errors.push('The end date must be greater than today');
	}
	if (start > end) {
		errors.push('The start date must be less than the end date');
	}

	flightRequest.volumes.forEach((volume) => {
		if (volume.effective_time_begin !== null && volume.effective_time_end !== null) {
			if (!(volume.effective_time_begin > end || volume.effective_time_end < start)) {
				return errors.push('The time interval must be outside others time interval');
			}
		}
	});
	return errors;
}
