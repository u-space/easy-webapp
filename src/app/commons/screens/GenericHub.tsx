/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence } from 'framer-motion';
import _ from 'lodash';
import { observer, useLocalStore } from 'mobx-react';
import React, { CSSProperties, FunctionComponent, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PButtonSize, PButtonType } from '@pcomponents/PButton';
import PButton from '@pcomponents/PButton';
import PModal, { PModalType } from '@pcomponents/PModal';
import PTable, { PTableProps } from '@pcomponents/PTable';
import PTableFooter from '@pcomponents/PTableFooter';
import PTooltip from '@pcomponents/PTooltip';
import PFrag from '@pcomponents/PFrag';
import DashboardLayout from '../layouts/DashboardLayout';
import { UseMutationResult, useQuery } from 'react-query';
import { UseGenericFilterableAndPaginableSliceStoreType } from '../stores/FilterableAndPaginableSlice';
import { shallow } from 'zustand/shallow';
import { translateErrors } from '@utm-entities/_util';
import { GridColumn } from '@glideapps/glide-data-grid';
import { EntityHasDisplayName } from '@utm-entities/types';
import BannerOverlay, { BannerOverlayType } from '../components/BannerOverlay';
import FullParentOverlayBlock, { FullBlockType } from '../components/FullParentOverlayBlock';
import { UseLocalStoreEntity, UseLocalStoreNullable } from '../utils';

export const rowHeight = 50;

export type GenericHubEntityType = EntityHasDisplayName;
export interface GenericHubProps<T extends GenericHubEntityType> {
	useStore: UseGenericFilterableAndPaginableSliceStoreType;
	extraActions?: FunctionComponent<{
		data: T;
	}>;
	entityName: string;
	entitySearchTools: FunctionComponent<{
		style?: CSSProperties;
		useStore: UseGenericFilterableAndPaginableSliceStoreType;
	}>;
	entityPage: FunctionComponent<{
		ls: UseLocalStoreEntity<T>;
		style?: CSSProperties;
		isEditing: boolean;
	}>;
	extraEntityPageProps?: Record<string, any>;
	onEntitySelected: (entity: T) => void;
	entities: T[];
	idSelected: string | null;
	idProperty: string;
	// TODO: Type all possible queries with this type, and create a reusable type
	query: ReturnType<typeof useQuery> & { count: number };
	updateQuery: UseMutationResult;
	deleteQuery?: UseMutationResult;
	getData: PTableProps['getData'];
	columns: GridColumn[];
	extraIsLoading?: boolean;
	overlay?: ReactNode;
	extraMenuButtons?: FunctionComponent<{
		style?: CSSProperties;
		entity: T;
	}>;
	canAddNew?: boolean;
	canEdit?: (entity: T) => boolean;
}

function GenericHub<T extends GenericHubEntityType>(props: GenericHubProps<T>) {
	const {
		useStore,
		extraActions = null,
		entityName,
		entitySearchTools,
		entityPage,
		extraEntityPageProps = {},
		onEntitySelected,
		entities,
		idSelected,
		idProperty,
		query,
		updateQuery,
		deleteQuery = null,
		getData,
		columns,
		extraIsLoading = false,
		overlay = undefined,
		extraMenuButtons = null,
		canAddNew = true,
		canEdit = () => true
	} = props;

	// Other hooks
	const { t } = useTranslation(['ui', 'glossary']);
	const history = useHistory();

	// State
	const [selected, setSelected] = useState<T | null>(null);
	const [isEditing, setEditingFlag] = useState(false);
	const ls: UseLocalStoreNullable<T> = useLocalStore(() => ({
		entity: null as T | null,
		documents: new Map(),

		setInfo(prop: keyof T, value: T[keyof T]) {
			if (ls.entity) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				ls.entity[prop] = value;
			}
		}
	}));
	const [isAskingToDelete, setAskingToDeleteFlag] = useState(false);

	// Store
	const store = useStore(
		(state) => ({
			filterMatchingText: state.filterMatchingText,
			setFilterByText: state.setFilterByText,
			setFilterProperty: state.setFilterProperty,
			setPage: state.setPage,
			pageSkip: state.pageSkip,
			pageTake: state.pageTake,
			setCount: state.setCount,
			count: state.count,
			setPageNumber: state.setPageNumber,
			totalPages: state.getCurrentPageAndTotalPages().totalPages,
			currentPage: state.getCurrentPageAndTotalPages().currentPage
		}),
		shallow
	);
	const { setFilterByText, setFilterProperty, setPage, pageSkip, setCount } = store;

	// Props
	const ExtraActions = extraActions || (() => null);
	const EntitySearchTools = entitySearchTools;
	const EntityPage = entityPage;
	const { isLoading, isPreviousData, isError, count } = query;
	const actionsBarSize = 50;
	const maxItems = Math.floor((window.innerHeight - actionsBarSize) / rowHeight - 2);

	// Effects
	useEffect(() => {
		if (idSelected && entities.length > 0) {
			if ((selected && selected[idProperty as keyof T] !== idSelected) || !selected) {
				setFilterByText(idSelected);
				setFilterProperty(idProperty);
				const selectedEntity = _.find(
					entities,
					(entity) => entity[idProperty as keyof T] === idSelected
				);
				if (selectedEntity) {
					onSelected(selectedEntity);
				} else {
					// TODO: Manage this error!
				}
			}
		}
	}, [idSelected, entities, selected]);
	useEffect(() => {
		setCount(count || 0);
	}, [count, setCount]);
	useEffect(() => {
		setPage(maxItems, pageSkip);
	}, [maxItems, setPage, pageSkip]);
	useEffect(
		() => () => {
			setFilterByText('');
		},
		[setFilterByText]
	);
	// One entity is selected, related effects
	useEffect(() => {
		if (updateQuery.isSuccess) {
			setEditingFlag(false);
		}
	}, [updateQuery.isSuccess]);
	/*useEffect(() => {
		if (deleteQuery.isSuccess) {
			onGoBack();
		}
	}, [deleteQuery.isSuccess]);*/

	// Handlers

	const onSelected = (entity: any, editing?: boolean) => {
		onEntitySelected(entity);
		setSelected(entity);
		if (editing) setEditingFlag(editing);
		ls.entity = entity;
		ls.documents = new Map();
	};
	const resetError = () => {
		updateQuery.reset();
		if (deleteQuery) deleteQuery.reset();
	};
	const onGoBack = () => {
		onSelected(null);
		if (query.refetch) query.refetch();
		resetError();
		setEditingFlag(false);
	};

	const ExtraMenuButtons = extraMenuButtons;

	const overlays = [overlay] ?? ([] as ReactNode[]);
	if (isAskingToDelete) {
		overlays.push(
			<PModal
				key={'isAskingToDelete'}
				primary={{
					onClick: () => {
						setAskingToDeleteFlag(false);
						if (deleteQuery) {
							deleteQuery.mutate(ls.entity);
						}
					},
					text: t('ui:Delete')
				}}
				title={t('Are you sure?')}
				content={t(
					'The selected entity will be deleted completely from the system and you will not be able to create it again'
				)}
				type={PModalType.ERROR}
				secondary={{
					onClick: () => setAskingToDeleteFlag(false),
					text: t('ui:Cancel')
				}}
			/>
		);
	} else if (deleteQuery && deleteQuery.isSuccess) {
		overlays.push(
			<PModal
				key={'hasDeleted'}
				primary={{
					onClick: () => {
						resetError();
						onGoBack();
					},
					text: t('ui:Okay')
				}}
				title={t('Success')}
				content={t('The entity has been deleted!')}
				type={PModalType.SUCCESS}
			/>
		);
	} else if (isError) {
		overlays.push(
			<PModal
				type={PModalType.ERROR}
				primary={{
					text: t('Go back'),
					onClick: () => {
						history.push('/');
					}
				}}
				content={t('Error while fetching entity')}
				title={t('The server has not responded correctly')}
			/>
		);
	}

	return (
		<DashboardLayout
			isLoading={
				isLoading ||
				isPreviousData ||
				extraIsLoading ||
				updateQuery.isLoading ||
				deleteQuery?.isLoading
			}
			menu={<EntitySearchTools style={{ marginTop: 'auto' }} useStore={useStore} />}
			overlay={PFrag({
				children: overlays
			})}
			options={{ center: { hasPadding: true } }}
		>
			<div style={{ width: '100%', height: `calc(100% - ${actionsBarSize}px)` }}>
				<PTable
					rowHeight={rowHeight}
					getData={getData}
					columns={columns}
					nav={
						<>
							<PButton icon="arrow-left" onClick={onGoBack}>
								{t('See all entities')}
							</PButton>
							{!updateQuery.isLoading && (
								<>
									{!isEditing && ls.entity && canEdit(ls.entity) && (
										<PButton
											icon={'edit'}
											onClick={() => {
												setEditingFlag(true);
											}}
										/>
									)}
									{isEditing && (
										<PButton
											icon={'floppy-disk'}
											onClick={() => {
												resetError();
												updateQuery.mutate({
													entity: ls.entity,
													documents: ls.documents,
													isCreating: false
												});
											}}
										/>
									)}
								</>
							)}
							{deleteQuery &&
								!deleteQuery.isLoading &&
								ls.entity &&
								canEdit(ls.entity) && (
									<PButton
										style={{ marginLeft: 'auto' }}
										variant={PButtonType.DANGER}
										icon={'trash'}
										onClick={() => {
											setAskingToDeleteFlag(true);
											resetError();
										}}
									/>
								)}
							{ExtraMenuButtons && (
								<ExtraMenuButtons
									style={{ marginLeft: 'auto' }}
									entity={ls.entity ?? ({} as T)}
								/>
							)}
						</>
					}
					actions={
						entities &&
						entities.map((entity) => {
							return (
								<section
									key={entity[idProperty]}
									style={{
										height: rowHeight,
										width: columns[0].width
									}}
								>
									<PTooltip content={t('View detailed info')}>
										<PButton
											size={PButtonSize.SMALL}
											icon="info-sign"
											variant={PButtonType.SECONDARY}
											onClick={() => onSelected(entity)}
										/>
									</PTooltip>
									{canEdit(entity) && (
										<PTooltip content={t('Edit')}>
											<PButton
												size={PButtonSize.SMALL}
												icon="edit"
												variant={PButtonType.SECONDARY}
												onClick={() => onSelected(entity, true)}
											/>
										</PTooltip>
									)}

									<ExtraActions data={entity} />
								</section>
							);
						})
					}
					rowsQuantity={store.pageTake}
					isResizable={false}
					isChildVisible={selected !== null}
				>
					{selected && (
						<>
							<header
								style={{
									height: rowHeight
								}}
							>
								<p>{selected.displayName}</p>
							</header>

							<EntityPage
								ls={ls as UseLocalStoreEntity<T>}
								style={{ height: `calc(100% - ${2 * rowHeight}px)` }}
								isEditing={isEditing}
								{...extraEntityPageProps}
							/>

							<footer
								style={{
									height: rowHeight,
									zIndex: 30
								}}
							>
								{!updateQuery.isLoading && (
									<>
										{!isEditing && ls.entity && canEdit(ls.entity) && (
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
													resetError();
													updateQuery.mutate({
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

							<BannerOverlay
								type={BannerOverlayType.DANGER}
								isVisible={isEditing}
								text={t(`You are editing the ${entityName}`)}
								style={{ top: rowHeight }}
							/>

							<BannerOverlay
								type={BannerOverlayType.SUCCESS}
								isVisible={updateQuery.isSuccess}
								text={t(`The ${entityName} details have been succesfully saved!`)}
								style={{ top: rowHeight }}
							/>

							<FullParentOverlayBlock
								type={FullBlockType.ERROR}
								isVisible={updateQuery.isError}
								buttons={<PButton onClick={resetError}>{t('Okay')}</PButton>}
							>
								<>
									<h1>{t('An error ocurred while saving')}</h1>
									<p>
										{translateErrors(updateQuery.error, entityName).map(
											(error) => (
												<li key={error}>{t(error)}</li>
											)
										)}
									</p>
								</>
							</FullParentOverlayBlock>
							{deleteQuery && (
								<FullParentOverlayBlock
									type={FullBlockType.ERROR}
									isVisible={deleteQuery.isError}
									buttons={<PButton onClick={resetError}>{t('Okay')}</PButton>}
								>
									<h1>{t('An error occurred while deleting')}</h1>
									<p>
										{translateErrors(deleteQuery.error, entityName).map(
											(error) => (
												<li key={error}>{t(error)}</li>
											)
										)}
									</p>
								</FullParentOverlayBlock>
							)}

							<FullParentOverlayBlock
								type={FullBlockType.DEFAULT}
								isVisible={deleteQuery?.isLoading || updateQuery.isLoading}
							>
								<h1>{t('Saving')}...</h1>
							</FullParentOverlayBlock>
						</>
					)}
				</PTable>
			</div>
			<div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
				<PTableFooter>
					{store.totalPages > 0 && (
						<div
							style={{
								display: 'flex',
								width: '200px',
								height: '25px',
								justifyContent: 'space-between',
								alignItems: 'center',
								userSelect: 'none'
							}}
						>
							<PButton
								icon="chevron-left"
								size={PButtonSize.SMALL}
								disabled={store.currentPage <= 1}
								onClick={() => store.setPageNumber(store.currentPage - 1)}
							/>
							{t('Page x out of y', {
								x: store.currentPage,
								y: store.totalPages
							})}
							<PButton
								icon="chevron-right"
								size={PButtonSize.SMALL}
								disabled={store.currentPage >= store.totalPages}
								onClick={() => store.setPageNumber(store.currentPage + 1)}
							/>
						</div>
					)}
					{canAddNew && (
						<PButton
							style={{ marginLeft: 'auto', textTransform: 'uppercase' }}
							icon="plus"
							size={PButtonSize.SMALL}
							onClick={() => history.push(`/editor/${entityName}`)}
						>
							{t(`Create new ${entityName}`)}
						</PButton>
					)}
				</PTableFooter>
			</div>
			<AnimatePresence>
				<BannerOverlay
					isVisible={
						!!store.filterMatchingText &&
						idSelected === null &&
						store.filterMatchingText.length > 0
					}
					type={BannerOverlayType.DANGER}
					style={{ top: rowHeight - 18 }}
					text={t('Only showing the entities that match the search query')}
				/>
			</AnimatePresence>
		</DashboardLayout>
	);
}

export default observer(GenericHub);
