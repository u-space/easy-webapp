import PButton from '@pcomponents/PButton';
import { GeographicalZone } from '@flight-request-entities/geographicalZone';
import { Checkbox, Spinner } from '@blueprintjs/core';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react';
import PageLayout from '../../../../../commons/layouts/PageLayout';
import { useQueryGeographicalZonesIntersectingPolygon } from '../../../geographical_zone/hooks';
import { FlightRequestEntity } from '@flight-request-entities/flightRequest';
import { Polygon } from 'geojson';
import styles from '../../../../../commons/Pages.module.scss';
import { SubTotals } from '../../screens/LegacyFlightRequestStepsEditor';
import DashboardLayout from '../../../../../commons/layouts/DashboardLayout';
import PFullModal from '@pcomponents/PFullModal';

interface FlightRequestCoordinationsStepProps {
	previousStep: () => void;
	nextStep: () => void;
	flightRequest: FlightRequestEntity;
	zonesChecked: GeographicalZone[];
	setZonesChecked: (zones: GeographicalZone[]) => void;
	total: SubTotals[];
}

const CoordinationsStep = (props: FlightRequestCoordinationsStepProps) => {
	const { t } = useTranslation();

	const { previousStep, nextStep, flightRequest, zonesChecked, setZonesChecked, total } = props;

	const [isShowingExplanation, setShowingExplanation] = useState(false);

	useEffect(() => {
		if (flightRequest.volumes[0].operation_geography === null) alert('Error occured');
	}, [flightRequest]);

	const { intersections: geographicalZonesIntersectingVolume, isLoading } =
		useQueryGeographicalZonesIntersectingPolygon(
			flightRequest.volumes[0]?.operation_geography as Polygon // This is checked on FlightRequestEditor
		);

	const totalNumber = useMemo(() => {
		return total.reduce((acc, obj) => acc + obj.amount, 0);
	}, [total]);

	return (
		<DashboardLayout isLoading={isLoading}>
			<PageLayout
				onArrowBack={previousStep}
				footer={
					<PButton disabled={totalNumber === 0} onClick={nextStep}>
						{t('Continue')}
					</PButton>
				}
			>
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
							{geographicalZonesIntersectingVolume?.map(
								(zone: GeographicalZone, index: number) => (
									<Checkbox
										id={`coordination-${index}`}
										key={zone.id}
										label={zone.name}
										checked={
											zonesChecked.find((z) => z.id === zone.id) !== undefined
										}
										onChange={(value) => {
											if (value.currentTarget.checked) {
												setZonesChecked([...zonesChecked, zone]);
											} else {
												setZonesChecked(
													zonesChecked.filter((z) => z.id !== zone.id)
												);
											}
										}}
									>
										<p>{zone.coordinator?.price}€</p>
									</Checkbox>
								)
							)}
						</section>
					</div>
					<div className={styles.content}>
						<aside className={styles.summary}>
							<h2>{t('Sub-total')}</h2>
							<h1>{totalNumber}€</h1>
						</aside>
						<section className={styles.details}>
							<ul>
								{total.map((item, index) => (
									<li key={item.reason}>
										{item.amount}€ {item.reason}
									</li>
								))}
							</ul>
						</section>
					</div>
				</div>
			</PageLayout>
		</DashboardLayout>
	);
};

export default observer(CoordinationsStep);
