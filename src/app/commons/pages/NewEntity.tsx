import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PageLayout, { PageLayoutProps } from '../layouts/PageLayout';
import FullParentOverlayBlock, { FullBlockType } from '../components/FullParentOverlayBlock';
import { translateErrors } from '@utm-entities/_util';
import PButton, { PButtonProps } from '@pcomponents/PButton';
import { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { UseLocalStoreEntity } from '../utils';
import { UseMutationResult } from 'react-query';

interface BaseComponentProps<T> {
	ls: UseLocalStoreEntity<T>;
	isCreating?: boolean;
	isEditing: boolean;
	style?: CSSProperties;
}

interface NewEntityProps<T, ExtraComponentProps> {
	ls: UseLocalStoreEntity<T>;
	mutation: UseMutationResult;
	entity: string;
	entityComponent: FunctionComponent<BaseComponentProps<T>>;
	componentProps?: ExtraComponentProps;
	isLoading?: boolean;
	onClickFinished: () => void;
	finishedText: string;
	onArrowBack?: PageLayoutProps['onArrowBack'];
}

const NewEntity = <T, ExtraComponentProps>({
	ls,
	mutation,
	entity,
	entityComponent,
	componentProps = undefined,
	isLoading = false,
	onClickFinished,
	finishedText,
	onArrowBack
}: NewEntityProps<T, ExtraComponentProps>) => {
	const { t } = useTranslation();

	const EntityComponent = entityComponent;

	const save: PButtonProps['onClick'] = (evt) => {
		evt.preventDefault();
		if (mutation) {
			mutation.mutate({ entity: ls.entity, documents: ls.documents, isCreating: true });
		}
	};

	const isEditing = !mutation || (!mutation.isError && mutation.isIdle);

	return (
		<DashboardLayout isLoading={isLoading}>
			<PageLayout
				footer={
					<PButton style={{ marginLeft: 'auto' }} type="submit" onClick={save}>
						{t('Save')}
					</PButton>
				}
				onArrowBack={onArrowBack}
			>
				<EntityComponent
					style={{ height: '100%' }}
					ls={ls}
					isCreating={true}
					isEditing={isEditing}
					{...componentProps}
				/>

				<FullParentOverlayBlock
					type={FullBlockType.ERROR}
					isVisible={mutation.isError}
					buttons={<PButton onClick={mutation.reset}>{t('Okay')}</PButton>}
				>
					<h1>{t('An error ocurred while saving')}</h1>
					<p>
						{translateErrors(mutation.error, entity).map((error) => (
							<li key={error}>{error}</li>
						))}
					</p>
				</FullParentOverlayBlock>
				<FullParentOverlayBlock type={FullBlockType.DEFAULT} isVisible={mutation.isLoading}>
					<h1>{t('Saving')}...</h1>
				</FullParentOverlayBlock>

				<FullParentOverlayBlock
					type={FullBlockType.SUCCESS}
					isVisible={mutation.isSuccess}
					buttons={
						<PButton onClick={onClickFinished}>
							{t(`See the created ${entity}`)}
						</PButton>
					}
				>
					<h1>{t(`The ${entity} was created successfully!`)}</h1>
					<h3>{finishedText}</h3>
				</FullParentOverlayBlock>
			</PageLayout>
		</DashboardLayout>
	);
};

export default NewEntity;
