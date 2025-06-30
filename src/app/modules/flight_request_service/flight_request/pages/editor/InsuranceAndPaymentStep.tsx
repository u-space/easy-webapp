/* eslint-disable @typescript-eslint/no-explicit-any */
import { Checkbox, DialogStep, MultistepDialog, Spinner, SpinnerSize } from '@blueprintjs/core';
import { FlightRequestEntity } from '@flight-request-entities/flightRequest';
import PButton from '@pcomponents/PButton';
import PDropdown from '@pcomponents/PDropdown';
import PFullModal, { PFullModalProps } from '@pcomponents/PFullModal';
import { PModalType } from '@pcomponents/PModal';
import PNumberInput from '@pcomponents/PNumberInput';
import { translateErrors } from '@utm-entities/_util';
import { DocumentEntity } from '@utm-entities/document';
import { GetVehicleInsuranceSimulationFlySafeParams, VehicleEntity } from '@utm-entities/vehicle';
import { AxiosError, AxiosResponse } from 'axios';
import { observer } from 'mobx-react-lite';
import { FC, FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UseMutationResult, useMutation } from 'react-query';
import { useHistory } from 'react-router-dom';
import styles from '../../../../../commons/Pages.module.scss';
import DashboardLayout from '../../../../../commons/layouts/DashboardLayout';
import PageLayout from '../../../../../commons/layouts/PageLayout';
import { useFlightRequestServiceAPI } from '../../../../../utils';
import { useGetVehicleInsuranceSimulation } from '../../../../core_service/vehicle/hooks';
// import { SubTotals } from '../../screens/LegacyFlightRequestStepsEditor';

interface InsuranceAndPaymentStepProps {
	previousStep: () => void;
	flightRequest: FlightRequestEntity;
	// total: SubTotals[];
	modalProps: PFullModalProps | undefined;
	setModalProps: (props: PFullModalProps | undefined) => void;
}

const insuranceDocument = (uav: VehicleEntity) =>
	(uav.extra_fields?.documents as DocumentEntity[]).find((doc: any) => {
		return doc.tag === 'InsuranceDocument';
	});

const InsuranceForm = ({
	insuranceFormValues,
	setInsuranceFormValues
}: {
	insuranceFormValues: any;
	setInsuranceFormValues: any;
}) => {
	const { t } = useTranslation();
	return (
		<div style={{ margin: '1rem' }}>
			<PNumberInput
				id="drone_purchase_year"
				label={t('drone_purchase_year')}
				placeholder={t('drone_purchase_year')}
				defaultValue={insuranceFormValues.drone_purchase_year}
				onChange={(value) => {
					setInsuranceFormValues({
						...insuranceFormValues,
						drone_purchase_year: value
					});
				}}
				isDarkVariant
			/>
			<PDropdown
				id="capital"
				explanation={t('capital_explanation')}
				labelInfo={t('capital_info')}
				label={t('capital')}
				isDarkVariant
				options={[
					{ value: 300000, label: String(300000) },
					{ value: 500000, label: String(500000) }
				]}
				defaultValue={insuranceFormValues.capital}
				onChange={(value: any) => {
					setInsuranceFormValues({ ...insuranceFormValues, capital: Number(value) });
				}}
			/>
			<PDropdown
				id="usage"
				explanation={t('usage_explanation')}
				labelInfo={t('usage_info')}
				label={t('usage')}
				isDarkVariant
				options={[
					{ value: 'professional', label: t('professional') },
					{ value: 'private', label: t('private') }
				]}
				defaultValue={insuranceFormValues.usage}
				onChange={(value: any) => {
					setInsuranceFormValues({ ...insuranceFormValues, usage: value });
				}}
			/>
			<Checkbox
				id="consents_data_management"
				label={t('consents_data_management')}
				defaultChecked={insuranceFormValues.consents_data_management}
				style={{ marginTop: '1rem' }}
				onChange={(event: any) => {
					setInsuranceFormValues({
						...insuranceFormValues,
						consents_data_management: event.target.checked
					});
				}}
			/>
			<Checkbox
				id="consents_precontractual"
				label={t('consents_precontractual')}
				defaultChecked={insuranceFormValues.consents_precontractual}
				onChange={(event: any) => {
					setInsuranceFormValues({
						...insuranceFormValues,
						consents_precontractual: event.target.checked
					});
				}}
			/>
			<Checkbox
				id="consents_contractual"
				label={t('consents_contractual')}
				defaultChecked={insuranceFormValues.consents_contractual}
				onChange={(event: any) => {
					setInsuranceFormValues({
						...insuranceFormValues,
						consents_contractual: event.target.checked
					});
				}}
			/>
		</div>
	);
};

type CapitalValue = 300000 | 500000;
type InsuranceValues = {
	capital: CapitalValue;
	drone_purchase_year: number;
	usage: 'professional' | 'private';
	consents_data_management: boolean;
	consents_precontractual: boolean;
	consents_contractual: boolean;
};

const InsuranceConfirmation: FC<{
	getSimulatedInsurancePrice: UseMutationResult<AxiosResponse<{ data: any }>, AxiosError, any>;
}> = ({ getSimulatedInsurancePrice }) => {
	const { t } = useTranslation();
	if (getSimulatedInsurancePrice.isError) {
		return (
			<div>
				{getSimulatedInsurancePrice.isLoading ? (
					<Spinner size={SpinnerSize.LARGE} />
				) : (
					<div>{t('ui:error')}</div>
				)}
			</div>
		);
	} else {
		if (getSimulatedInsurancePrice.isLoading) {
			return <div>{<Spinner size={SpinnerSize.LARGE} />}</div>;
		} else {
			return (
				<div>
					{
						<>
							<h2>{t('Your total is')}</h2>
							<h3>{getSimulatedInsurancePrice.data?.data?.data?.premium_total}</h3>
						</>
					}
				</div>
			);
		}
	}
};

const InsuranceAndPaymentStep = (props: InsuranceAndPaymentStepProps) => {
	const { previousStep, flightRequest, modalProps, setModalProps } = props;
	const { t } = useTranslation();
	const history = useHistory();

	const [isInsuranceFormOpened, setInsuranceFormOpenedFlag] = useState(false);
	const [vehicleSelectedForInsurance, setVehicleSelectedForInsurance] =
		useState<VehicleEntity | null>(null);
	const [insuranceFormValues, setInsuranceFormValues] = useState<InsuranceValues>({
		drone_purchase_year: new Date().getFullYear(),
		capital: 300000,
		usage: 'private',
		consents_data_management: false,
		consents_precontractual: false,
		consents_contractual: false
	});
	const [insurancePrices, setInsurancePrices] = useState<Array<any>>([]);

	const getSimulatedInsurancePrice = useGetVehicleInsuranceSimulation();

	useEffect(() => {
		if (getSimulatedInsurancePrice.isSuccess && getSimulatedInsurancePrice.data) {
			setInsurancePrices([...insurancePrices, getSimulatedInsurancePrice.data.data.data]);
		}
	}, [getSimulatedInsurancePrice.isSuccess, getSimulatedInsurancePrice.data]);

	const {
		flightRequest: { saveFlightRequest }
	} = useFlightRequestServiceAPI();
	const saveFlightRequestMutation = useMutation(
		async () => {
			return saveFlightRequest(flightRequest);
		},
		{
			onSuccess: (data) => {
				// window.location.href = data.paymentLink;
			},
			onError: (error) => {
				setModalProps({
					isVisible: true,
					type: PModalType.ERROR,
					title: t('An error ocurred while saving'),
					content: translateErrors(error, 'operation'),
					primary: {
						onClick: () => setModalProps(undefined)
					}
				});
			}
		}
	);

	const finishAndPay = (evt: FormEvent) => {
		evt.preventDefault();

		saveFlightRequestMutation.mutate();
	};

	const getVehicleInsurancePrices = async (
		vehicle: VehicleEntity,
		params: GetVehicleInsuranceSimulationFlySafeParams
	) => {
		try {
			const insurancePrice = await getSimulatedInsurancePrice.mutateAsync({
				vehicle,
				params
			});
			return { ...vehicle, insurancePrice };
		} catch (error) {
			console.error(error);
			return;
		}
	};

	const save = (evt: MouseEvent) => {
		evt.preventDefault();
		// TODO: Remove these following lines
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		saveFlightRequestMutation.mutate(flightRequest);
	};

	// const totalNumber = useMemo(() => {
	// 	return total.reduce((acc, obj) => acc + obj.amount, 0);
	// }, [total]);

	const droneInsuranceTotal = useMemo(() => {
		return insurancePrices.reduce((acc, sim) => acc + (sim.premium_total ?? 0), 0);
	}, [insurancePrices]);

	return (
		<DashboardLayout isLoading={saveFlightRequestMutation.isLoading}>
			<PageLayout footer={<PButton onClick={finishAndPay}>{t('Finish and pay')}</PButton>}>
				{modalProps && <PFullModal {...modalProps} />}
				<MultistepDialog
					isOpen={isInsuranceFormOpened}
					onClose={() => setInsuranceFormOpenedFlag(false)}
					title={t('Insurance')}
					nextButtonProps={{ text: t('Next') }}
					backButtonProps={{ text: t('Back') }}
					finalButtonProps={{
						text: t('Accept'),
						onClick: () => {
							setInsuranceFormOpenedFlag(false);
							const uavRef = flightRequest.uavs.find(
								(uav: VehicleEntity) =>
									uav.uvin === vehicleSelectedForInsurance?.uvin
							);
							if (uavRef) {
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								uavRef.extra_fields.insurance =
									getSimulatedInsurancePrice.data?.data.data;
							}
						}
					}}
					onChange={(step: number) => {
						if (step === 2) {
							if (!vehicleSelectedForInsurance) {
								console.error('No vehicle selected for insurance');
								return;
							}
							getVehicleInsurancePrices(
								vehicleSelectedForInsurance,
								insuranceFormValues
							);
						}
					}}
				>
					<DialogStep
						id={1}
						title={t('Fill the form')}
						panel={
							<InsuranceForm
								insuranceFormValues={insuranceFormValues}
								setInsuranceFormValues={setInsuranceFormValues}
							/>
						}
					/>
					<DialogStep
						id={2}
						title={t('Confirm')}
						panel={
							<InsuranceConfirmation
								getSimulatedInsurancePrice={getSimulatedInsurancePrice}
							/>
						}
					/>
				</MultistepDialog>
				<header />

				<div className={styles.twobytwo}>
					<div className={styles.content}>
						<aside className={styles.summary}>
							<h2>{t('Insurance')}</h2>
							{t('Insurance description')}
						</aside>
						<ul className={styles.details}>
							{flightRequest.uavs.map((uav: VehicleEntity) => {
								const insurance = (uav.extra_fields?.documents as Array<any>).find(
									(doc: any) => {
										return doc.tag === 'InsuranceDocument';
									}
								);
								return (
									<li
										key={uav.uvin}
										style={{ color: insurance ? 'green' : 'red' }}
									>
										<div style={{ color: 'var(--primary-900)' }}>
											<p>{uav.vehicleName}</p>
											<p>
												{' '}
												{insuranceDocument(uav) ? (
													<>
														{t(
															'This drone has a valid insurance until'
														)}{' '}
														{new Date(
															insurance?.valid_until
														).toLocaleDateString()}
													</>
												) : uav.extra_fields.insurance ? (
													<p>
														{t(
															'This insurance for this drone is calculated in'
														)}{' '}
														{
															(uav.extra_fields.insurance as any)
																.premium_total
														}{' '}
														{'€'}
													</p>
												) : (
													<>{t('The drone has no valid insurance')}</>
												)}
											</p>
										</div>
									</li>
								);
							})}
						</ul>
					</div>
					<div className={styles.content}>
						<aside className={styles.summary}>
							<h2>{t('Sub-total')}</h2>
							{/* <h1>{totalNumber}€</h1> */}
						</aside>
						<section className={styles.details}>
							<ul>
								{/* {total.map((item) => {
									return (
										<li>
											<p>
												{' '}
												{item.amount}€ {item.reason}
											</p>
										</li>
									);
								})} */}
							</ul>
						</section>
					</div>
				</div>
			</PageLayout>
		</DashboardLayout>
	);
};

export default observer(InsuranceAndPaymentStep);
