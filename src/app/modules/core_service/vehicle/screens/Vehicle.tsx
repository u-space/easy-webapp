import PButton from '@pcomponents/PButton';
import CLoadingSvelte from '@tokyo/gui/CLoading.svelte';
import { CModalVariant } from '@tokyo/gui/CModal';
import CModalSvelte from '@tokyo/gui/CModal.svelte';
import { VehicleEntity } from '@utm-entities/vehicle';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { reactify } from 'svelte-preprocess-react';
import DashboardLayout from '../../../../commons/layouts/DashboardLayout';
import PageLayout from '../../../../commons/layouts/PageLayout';
import { useLs } from '../../../../commons/utils';
import { useQueryVehicle, useUpdateVehicle } from '../hooks';
import ViewAndEditVehicle from '../pages/ViewAndEditVehicle';
import FullParentOverlayBlock, {
	FullBlockType
} from 'src/app/commons/components/FullParentOverlayBlock';
import { translateErrors } from '@utm-entities/_util';
import PFullModal, { PFullModalProps } from '@pcomponents/PFullModal';
import { PModalType } from '@pcomponents/PModal';

const CLoading = reactify(CLoadingSvelte);
const CModal = reactify(CModalSvelte);

const LoadedVehicle = (props: { vehicle: VehicleEntity }) => {
	const { t } = useTranslation();
	const history = useHistory();
	const ls = useLs<VehicleEntity>(props.vehicle);

	const updateVehicle = useUpdateVehicle();
	const [isEditing, setEditingFlag] = useState<boolean>(false);

	const [modalProps, setModalProps] = useState<PFullModalProps | undefined>(undefined);

	useEffect(() => {
		if (updateVehicle.isSuccess) {
			setEditingFlag(false);
		}
	}, [updateVehicle.isSuccess]);

	return (
		<DashboardLayout>
			{modalProps && <PFullModal {...modalProps} />}
			<PageLayout
				onArrowBack={() => history.push('/vehicles')}
				extraLeftHeaderButtons={
					<>
						{!isEditing && (
							<PButton
								icon={'edit'}
								onClick={() => {
									setModalProps({
										isVisible: true,
										type: PModalType.INFORMATION,
										title: t('Warning'),
										content: t(
											"If you modify your aircraft's data, it will be disabled until a DINACIA operator verifies the information. The process may take up to 72 business hours. Do you wish to continue?"
										),
										primary: {
											onClick: () => {
												setEditingFlag(true);
												setModalProps(undefined);
											},
											text: t('Continue')
										},
										secondary: {
											onClick: () => setModalProps(undefined),
											text: t('Cancel')
										}
									});
								}}
							/>
						)}
						{isEditing && (
							<PButton
								icon={'floppy-disk'}
								onClick={() => {
									updateVehicle.mutate({
										entity: ls.entity,
										documents: ls.documents,
										isCreating: false
									});
								}}
							/>
						)}
					</>
				}
			>
				<ViewAndEditVehicle ls={ls} isEditing={isEditing} />
				<footer
					style={{
						height: '50px'
					}}
				>
					{!updateVehicle.isLoading && (
						<>
							{!isEditing && ls.entity && (
								<PButton
									icon={'edit'}
									onClick={() => {
										setEditingFlag(true);
									}}
								>
									{t('Edit')}
								</PButton>
							)}
							{isEditing && (
								<PButton
									icon={'floppy-disk'}
									onClick={() => {
										// resetError();
										updateVehicle.mutate({
											entity: ls.entity,
											documents: ls.documents,
											isCreating: false
										});
									}}
								>
									{t('Save')}
								</PButton>
							)}
						</>
					)}
				</footer>
				{updateVehicle.isLoading && (
					<CModal disabled variant={CModalVariant.INFORMATION} title={t('Saving')}>
						{t('Please wait while your changes are being saved')}.
					</CModal>
				)}
				{updateVehicle.isSuccess && (
					<CModal
						variant={CModalVariant.SUCCESS}
						title={t('The vehicle details have been succesfully saved!')}
						onClose={() => {
							updateVehicle.reset();
						}}
					>
						{t('Your changes to VEHICLE have been saved', {
							vehicle: ls.entity.vehicleName
						})}
						.
					</CModal>
				)}
				<FullParentOverlayBlock
					type={FullBlockType.ERROR}
					isVisible={updateVehicle.isError}
					buttons={<PButton onClick={() => updateVehicle.reset()}>{t('Okay')}</PButton>}
				>
					<>
						<h1>{t('An error ocurred while saving')}</h1>
						<p>
							{translateErrors(updateVehicle.error, 'vehicle').map((error) => (
								<li key={error}>{t(error)}</li>
							))}
						</p>
					</>
				</FullParentOverlayBlock>
			</PageLayout>
		</DashboardLayout>
	);
};

const Vehicle = () => {
	const { uvin } = useParams() as { uvin: string };
	const { vehicle, refetch, isSuccess } = useQueryVehicle(uvin);

	useEffect(() => {
		refetch().then();
	}, [refetch]);

	if (!isSuccess) return <CLoading />;
	return <LoadedVehicle vehicle={vehicle} />;
};

export default Vehicle;
