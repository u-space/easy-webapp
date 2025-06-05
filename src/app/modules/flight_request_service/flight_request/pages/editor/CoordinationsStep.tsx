import PButton from '@pcomponents/PButton';
import { GeographicalZone } from '@flight-request-entities/geographicalZone';
import { Checkbox, Spinner } from '@blueprintjs/core';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react';
import PageLayout from '../../../../../commons/layouts/PageLayout';
import { useQueryGeographicalZonesIntersectingPolygon } from '../../../geographical_zone/hooks';
import { FlightRequestEntity } from '@flight-request-entities/flightRequest';
import { Polygon } from 'geojson';
import styles from '../../../../../commons/Pages.module.scss';
// import { SubTotals } from '../../screens/LegacyFlightRequestStepsEditor';
import DashboardLayout from '../../../../../commons/layouts/DashboardLayout';
import PFullModal, { PFullModalProps } from '@pcomponents/PFullModal';
import { useFlightRequestServiceAPI } from 'src/app/utils';
import { useMutation } from 'react-query';
import { PModalType } from '@pcomponents/PModal';
import { translateErrors } from '@utm-entities/_util';
import { useHistory } from 'react-router-dom';
import { UserEntity } from '@utm-entities/user';
import PTooltip from '@pcomponents/PTooltip';
import { CoordinatorEntity } from '@flight-request-entities/coordinator';

interface FlightRequestCoordinationsStepProps {
	previousStep: () => void;
	nextStep: () => void;
	flightRequest: FlightRequestEntity;
	zonesChecked: GeographicalZone[];
	setZonesChecked: (zones: GeographicalZone[]) => void;
	// total: SubTotals[];
	setModalProps: (props: PFullModalProps | undefined) => void;
	modalProps: PFullModalProps | undefined;
	isOnNight: boolean;
	setIsOnNight: (isOnNight: boolean) => void;
}

const CoordinationsStep = (props: FlightRequestCoordinationsStepProps) => {
	const { t } = useTranslation();
	const history = useHistory();

	const {
		previousStep,
		nextStep,
		flightRequest,
		zonesChecked,
		setZonesChecked,
		setModalProps,
		modalProps,
		isOnNight
	} = props;

	const [isShowingExplanation, setShowingExplanation] = useState(false);
	const [coordinators, setCoordinators] = useState<CoordinatorEntity[]>([]);

	useEffect(() => {
		if (flightRequest.volumes[0].operation_geography === null) alert('Error occured');
	}, [flightRequest]);

	const { intersections: geographicalZonesIntersectingVolume, isLoading } =
		useQueryGeographicalZonesIntersectingPolygon(
			flightRequest.volumes[0]?.operation_geography as Polygon,
			flightRequest.volumes[0]?.min_altitude || 0,
			flightRequest.volumes[0]?.max_altitude || 0
		);

	useEffect(() => {
		if (geographicalZonesIntersectingVolume) {
			setZonesChecked(
				geographicalZonesIntersectingVolume.map((zone: GeographicalZone) => zone)
			);
		}
		const coordinatorsList = [];
		if (geographicalZonesIntersectingVolume) {
			for (const zone of geographicalZonesIntersectingVolume) {
				if (
					zone.coordinator &&
					coordinatorsList.findIndex((c) => c?.id === zone.coordinator?.id) === -1
				) {
					coordinatorsList.push(zone.coordinator);
				}
			}
		}
		setCoordinators(coordinatorsList);
	}, [geographicalZonesIntersectingVolume]);

	const {
		flightRequest: { saveFlightRequest }
	} = useFlightRequestServiceAPI();

	const saveFlightRequestMutation = useMutation(
		async () => {
			return saveFlightRequest(flightRequest);
		},
		{
			onSuccess: (data) => {
				setModalProps({
					isVisible: true,
					type: PModalType.SUCCESS,
					title: t('Flight request saved'),
					content: t('Flight request was saved successfully'),
					primary: {
						onClick: () => {
							setModalProps(undefined);
							history.push('/flight-requests');
						}
					}
				});
			},
			onError: (error) => {
				setModalProps({
					isVisible: true,
					type: PModalType.ERROR,
					title: t('An error ocurred while saving'),
					content: translateErrors(error, 'flightRequest'),
					primary: {
						onClick: () => {
							setModalProps(undefined);
							history.push('/flight-requests');
						}
					}
				});
			}
		}
	);

	const finishAndPay = (evt: FormEvent) => {
		evt.preventDefault();
		saveFlightRequestMutation.mutate();
	};

	const canCreateFlightRequest = (): boolean => {
		const hasGeographicalZoneIntersections =
			geographicalZonesIntersectingVolume && geographicalZonesIntersectingVolume.length > 0;

		const specialCoordinations =
			needBvlosCoordination(flightRequest) ||
			needAltitudeCoordination(flightRequest)
		// &&
		// isOnNight;

		const operatorCanOPerate =
			flightRequest.operator != undefined &&
			flightRequest.operator instanceof UserEntity &&
			flightRequest.operator.canOperate === true;

		return (hasGeographicalZoneIntersections || specialCoordinations) && operatorCanOPerate;
	};

	const createButtonDisable: boolean = !canCreateFlightRequest();

	const getCauseMessage = () => {
		const hasGeographicalZoneIntersections =
			geographicalZonesIntersectingVolume && geographicalZonesIntersectingVolume.length > 0;
		const specialCoordinations =
			needBvlosCoordination(flightRequest) ||
			needAltitudeCoordination(flightRequest)
		//  &&
		// isOnNight;
		const operatorCanOPerate =
			flightRequest.operator &&
			flightRequest.operator instanceof UserEntity &&
			flightRequest.operator.canOperate;

		if (!(hasGeographicalZoneIntersections || specialCoordinations)) {
			return t('glossary:flightRequest:noCoordinationMsg');
		} else if (!operatorCanOPerate) {
			return t('ui:user_cant_create_operation');
		} else {
			return t('Save');
		}
	};

	function getStartTime(flightRequest: FlightRequestEntity): Date | undefined {
		if (!flightRequest || flightRequest.volumes.length === 0) {
			return undefined;
		}
		return flightRequest.volumes
			.filter((volume) => volume.effective_time_begin !== null)
			.reduce(
				(minDate, volume) =>
					volume.effective_time_begin !== null && volume.effective_time_begin < minDate
						? volume.effective_time_begin
						: minDate,
				flightRequest.volumes[0].effective_time_begin as Date
			);
	}

	function checkTimeInterval(
		minimun_coordination_days: number,
		flightRequest: FlightRequestEntity
	) {
		const startTime = getStartTime(flightRequest);
		if (startTime) {
			const now = new Date();
			const days = daysBetween(now, startTime);
			return days >= minimun_coordination_days;
		}
	}

	function daysBetween(startDate: Date, endDate: Date) {
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}

	return (
		<DashboardLayout isLoading={isLoading || saveFlightRequestMutation.isLoading}>
			<PageLayout
				onArrowBack={previousStep}
				footer={
					<PTooltip content={getCauseMessage()}>
						<PButton disabled={createButtonDisable} onClick={finishAndPay}>
							{t('Create')}
						</PButton>
					</PTooltip>
				}
			>
				{modalProps && <PFullModal {...modalProps} />}
				<PFullModal
					title={t('Coordinations')}
					content={t('Coordinations explanation')}
					isVisible={isShowingExplanation}
					primary={{
						text: t('Close'),
						onClick: () => setShowingExplanation(false)
					}}
				/>
				<div className={styles.twobytwo}>
					<div className={styles.content}>
						<aside className={styles.summary}>
							<h2>{t('Coordinations')}</h2>
							{t('Coordinations explanation').length > 255 && (
								<>
									{t('Coordinations explanation').substring(0, 255)}
									{'...'}
									<PButton onClick={() => setShowingExplanation(true)}>
										{t('See more')}
									</PButton>
								</>
							)}
							{t('Coordinations explanation').length <= 255 && (
								<>{t('Coordinations explanation')}</>
							)}
						</aside>
						<section className={styles.details}>
							{isLoading && <Spinner />}
							{coordinators &&
								coordinators.map((coordinationZone, index) => (
									<>
										<Checkbox
											id={`coordinatorZone-${index}`}
											key={coordinationZone.id}
											label={`${coordinationZone.infrastructure} (${coordinationZone.id}) - ${coordinationZone.email}`}
											checked={true}
										></Checkbox>
										{!checkTimeInterval(
											coordinationZone?.minimun_coordination_days || 0,
											flightRequest
										) &&
											getStartTime !== undefined && (
												<div className={styles.alert}>
													La coordinación requiere{' '}
													<strong>
														{
															coordinationZone?.minimun_coordination_days
														}
													</strong>{' '}
													días para realizarse y la coordinación
													solicitada comienza el{' '}
													{(
														getStartTime(flightRequest) as Date
													).toLocaleString()}{' '}
													en{' '}
													<strong>
														{daysBetween(
															new Date(),
															getStartTime(flightRequest) as Date
														)}
													</strong>{' '}
													días.
												</div>
											)}
									</>
								))}
							{needBvlosCoordination(flightRequest) && (
								<Checkbox
									id={`coordination-bvlos`}
									label={`BVLOS`}
									checked={true}
								/>
							)}
							{needAltitudeCoordination(flightRequest) && (
								<Checkbox
									id={`coordination-altitude`}
									label={`Altitude`}
									checked={true}
								/>
							)}
							{/* {isOnNight && (
								<Checkbox
									id={`coordination-night`}
									label={t(`It's a night flight`)}
									checked={true}
								/>
							)} */}
						</section>
					</div>
				</div>
			</PageLayout>
		</DashboardLayout>
	);
};

const needAltitudeCoordination = (flightRequest: FlightRequestEntity) => {
	return flightRequest.volumes
		.filter((vol) => vol.effective_time_begin)
		.some((vol) => vol.max_altitude > 120);
};

const needBvlosCoordination = (flightRequest: FlightRequestEntity) => {
	return flightRequest.bvlos;
};

export default observer(CoordinationsStep);
