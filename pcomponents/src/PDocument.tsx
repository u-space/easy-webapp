import {
	Dialog,
	DialogStep,
	FormGroup,
	Icon,
	InputGroup,
	Intent,
	MultistepDialog,
	Spinner,
	SpinnerSize
} from '@blueprintjs/core';
import { DocumentEntity } from '@utm-entities/document';
import classNames from 'classnames';
import { CSSProperties, FC, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Kanpur.module.scss';
import PBooleanInput from './PBooleanInput';
import PButton, { PButtonSize, PButtonType } from './PButton';
import PDateInput, { MAX_DATE } from './PDateInput';
import PFileInput from './PFileInput';
import PInput from './PInput';
import PNumberInput from './PNumberInput';
import PTextArea from './PTextArea';
import env from '../../src/vendor/environment/env';

const MAX_FILE_SIZE = env.max_file_size; //5 * 1024 * 1024; // TODO: make configurable
const byte2MB = (sizeInByte: number) => (sizeInByte / 1024 / 1024).toFixed(1);

export interface PDocumentProps {
	document: DocumentEntity;
	explanation?: string;
	title: string;
	label: string;
	id: string;
	isDarkVariant?: boolean;
	isEditing?: boolean;
	schema: object;
	isAdding?: boolean;
	onClose: () => void;
	onSave: (document: DocumentEntity) => void;
	onDelete?: () => void;
	onSaveObservation?: (observation: string) => void;
	onSaveValidation?: (isValid: boolean) => void;
	canValidate?: boolean;
	isAdmin?: boolean;
	isLoading?: boolean;
	deleteDocument?: (id: string) => void;
}

export interface ExtraInfoPanelProps {
	document: DocumentEntity;
	id: string;
	schema: Record<string, any>;
	isEditing?: boolean;
}

const parsePredefinedExpiration = (
	predefinedExpiration: string
): { date: Date; label: string; count: number } => {
	const date = new Date();
	// format NumberLetter regex: \d+\w
	const regexExtractor = /\d+\w/g;
	const match = regexExtractor.exec(predefinedExpiration);
	if (!match) {
		return { date: date, label: '', count: 0 };
	}
	const number = parseInt(match[0].slice(0, -1));
	const unit = match[0].slice(-1);
	let label = '';
	switch (unit) {
		case 'd':
			date.setDate(date.getDate() + number);
			label = 'days';
			break;
		case 'w':
			date.setDate(date.getDate() + number * 7);
			label = 'weeks';
			break;
		case 'm':
			date.setMonth(date.getMonth() + number);
			label = 'months';
			break;
		case 'y':
			date.setFullYear(date.getFullYear() + number);
			label = 'years';
			break;
	}

	return { date: date, label: label, count: number };
};

const expirable = (document: DocumentEntity) => {
	return new Date(document['valid_until']) < MAX_DATE;
};

const isExpirable = (schema: any) => {
	return schema && schema.__metadata && schema.__metadata.expirable === true;
};

const ExtraInfoPanel = (props: ExtraInfoPanelProps) => {
	const { t } = useTranslation();
	const { document, id, schema, isEditing = false } = props;

	//FIXME this is for fire re render
	const [validUntil, setValidUntil] = useState<Date>(isExpirable(schema) ? new Date(MAX_DATE) : new Date(document['valid_until']));


	const PredefinedExpirations = ({
		predefinedExpirations,
		document,
		setValidUntil
	}: {
		predefinedExpirations: string[];
		document: DocumentEntity;
		setValidUntil: (value: Date) => void;
	}) => {
		return (
			<FormGroup
				className={classNames(styles.form, {
					[styles.dark]: true
				})}
				style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row' }}
			>
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						flexDirection: 'row',
						justifyContent: 'flex-end',
						margin: '0 1rem 0 0'
					}}
				>
					{predefinedExpirations.map(parsePredefinedExpiration).map((exp) => (
						<PButton
							style={{ margin: '0 0.5rem 0.5rem 0' }}
							intent={Intent.PRIMARY}
							key={`${exp?.count}-${exp?.label}`}
							text={t(`x ${exp?.label}`, { x: exp.count })}
							onClick={() => {
								document['valid_until'] = new Date(exp.date);
								setValidUntil(document['valid_until']);
							}}
						/>
					))}
				</div>
			</FormGroup>
		);
	};

	return (
		<div className={classNames(styles.addFile)}>
			{(isEditing && (isExpirable(schema))) && (
				<PBooleanInput
					key={'expirable'}
					id={'expirable'}
					label={t('Expirable')}
					inline
					defaultValue={expirable(document)}
					onChange={(exp: boolean) => {
						if (!exp) {
							document['valid_until'] = new Date(MAX_DATE);
						} else {
							document['valid_until'] = new Date();
						}
						setValidUntil(document['valid_until']);
					}}
					disabled={!isEditing}
					isDarkVariant
				/>
			)}
			{isExpirable(schema) && document['valid_until'] < new Date(MAX_DATE) && (
				<PDateInput
					key={'valid_until'}
					id={id}
					defaultValue={new Date(document['valid_until'])}
					label={t('Valid until')}
					onChange={(value) => {
						document['valid_until'] = value;
						setValidUntil(value);
					}}
					disabled={!isEditing}
					isRequired
					isDarkVariant
					inline
					value={new Date(document['valid_until'])}
				/>
			)}

			{isEditing &&
				isExpirable(schema) &&
				expirable(document) &&
				schema &&
				schema.__metadata &&
				schema.__metadata.predefinedExpirations && (
					<PredefinedExpirations
						predefinedExpirations={schema.__metadata.predefinedExpirations}
						document={document}
						setValidUntil={setValidUntil}
					/>
				)}

			{Object.keys(schema)
				.filter((d) => d !== '__metadata')
				.map((key) => {
					const { type, required } = schema[key];
					const baseInputProps = {
						id: key,
						label: t(key),
						defaultValue: document.extra_fields[key],
						onChange: (value: string | number | Date | boolean) => {
							document.extra_fields[key] = value
						},
						isRequired: required,
						isDarkVariant: true,
						disabled: !isEditing,
						inline: true
					};
					if (type === 'String') {
						return <PInput {...baseInputProps} />;
					} else if (type === 'Number') {
						return <PNumberInput {...baseInputProps} min={0} />;
					} else if (type === 'Date') {
						return (
							<PDateInput
								{...baseInputProps}
								defaultValue={new Date(document.extra_fields[key])}
							/>
						);
					} else if (type === 'Bool') {
						return <PBooleanInput {...baseInputProps} />;
					} else {
						return null;
					}
				})}
			<PTextArea
				id={'observations'}
				label={t('Observations')}
				defaultValue={document.observations || t('No observations')}
				disabled
				isDarkVariant
				onChange={() => {
					alert('Observations are not editable from this area');
				}}
			/>
		</div>
	);
};

export interface EditingModalProps {
	onClose: () => void;
	document: DocumentEntity;
	id: string;
	label: string;
	explanation?: string;
	schema: object;
	onSave: (document: DocumentEntity) => void;
}

const EditingModal = (props: EditingModalProps) => {
	const { t } = useTranslation();
	const { onClose, onSave, document, id, label, explanation, schema } = props;

	const finalButtonProps = {
		intent: Intent.PRIMARY,
		onClick: () => {
			const errors: string[] = [];
			for (const [key, value] of Object.entries(schema)) {
				if (key === '__metadata') continue; // skip metadata
				if (value.required && !document.extra_fields[key]) {
					errors.push(`Field ${t(key)} is required`);
				} else {
					if (
						value.min_lenght &&
						document.extra_fields[key].toString().length < value.min_lenght
					) {
						errors.push(
							`Field ${t(key)} must have at least ${value.min_lenght} characters`
						);
					}
					if (
						value.max_lenght &&
						document.extra_fields[key].toString().length > value.max_lenght
					) {
						errors.push(
							`Field ${t(key)} must have at most ${value.max_lenght} characters`
						);
					}
				}
			}

			if (!document['valid_until']) {
				errors.push('Date is required');
			}

			if (errors.length > 0) {
				alert(errors.join('\n'));
			} else {
				onClose();
				onSave(
					new DocumentEntity({
						...document,
						file: file instanceof File ? file : undefined
					})
				);
			}
		},
		text: t('Confirm')
	};

	const [file, setFile] = useState<File | string | undefined | null>(
		document.file || document.downloadFileUrl
	);

	const handleFileChange = (file: File | null) => {
		if (file) {
			if (file?.size < MAX_FILE_SIZE) {
				setFile(file);
			} else {
				alert(
					`Max file size is ${byte2MB(MAX_FILE_SIZE)} and the file size is ${byte2MB(
						file?.size
					)}`
				);
			}
		}
		if (file) {
			const fileType = file.type;
			const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

			if (validTypes.includes(fileType)) {
				setFile(file);
			} else {
				alert(`File type ${fileType} is not supported`);
			}
		}
	};

	return (
		<MultistepDialog
			isOpen
			onClose={onClose}
			icon="add"
			title={t('Add') + ' ' + label}
			closeButtonProps={{ text: t('Close') }}
			finalButtonProps={finalButtonProps}
			nextButtonProps={{
				disabled: file == void 0,
				text: t('Next')
			}}
			backButtonProps={{ text: t('Back') }}
			isCloseButtonShown={true}
			showCloseButtonInFooter={true}
			resetOnClose
			canEscapeKeyClose
			canOutsideClickClose
		>
			<DialogStep
				id="select"
				panel={
					<div className={classNames(styles.addFile)}>
						<div className={styles.content}>
							<section className={styles.details}>
								<PFileInput
									{...{ id, label, explanation: '' }}
									// {...{ id, label, explanation }}
									defaultValue={file}
									onChange={handleFileChange}
									isDarkVariant
									isRequired={true}
									API={'changeme'}
								/>
							</section>
						</div>
					</div>
				}
				title={t('Add file')}
			/>
			<DialogStep
				id="extraInfo"
				panel={<ExtraInfoPanel {...{ id, document, schema }} isEditing={true} />}
				title={t('Extra information')}
			/>
		</MultistepDialog>
	);
};

export interface ViewingModalProps {
	document: DocumentEntity;
	id: string;
	schema: object;
	label: string;
	explanation?: string;
	onClose: () => void;
	onSaveObservation?: (observation: string) => void;
	isAdmin?: boolean;
}

const ViewingModal = (props: ViewingModalProps) => {
	const { t } = useTranslation();
	const {
		document,
		id,
		schema,
		label,
		explanation,
		onClose,
		onSaveObservation,
		isAdmin = false
	} = props;
	const [isAddingObservation, setAddingObservationFlag] = useState(false);
	const [observation, setObservation] = useState(document.observations || '');

	if (!isAddingObservation) {
		return (
			<Dialog isOpen onClose={onClose} title={t(label)}>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'right',
						justifyContent: 'center',
						padding: '1rem'
					}}
				>
					<PFileInput
						{...{ id, label, explanation: '' }}
						defaultValue={document.downloadFileUrl}
						disabled
						onChange={() => { }}
						isDarkVariant
						isRequired={true}
						API={'changeme'}
						style={{
							// marginLeft: 'auto',
							// width: 'auto',
							display: 'flex',
							flexDirection: 'row'
						}}
					/>
					<ExtraInfoPanel
						{...{
							document,
							id,
							schema
						}}
						isEditing={false}
					/>
					{isAdmin && onSaveObservation && (
						<PButton
							onClick={() => {
								setAddingObservationFlag(true);
							}}
						>
							{(document.observations !== '' && t('Edit observations')) ||
								t('Add observations')}
						</PButton>
					)}
				</div>
			</Dialog>
		);
	} else {
		return (
			<Dialog
				isOpen={isAddingObservation}
				onClose={() => {
					setAddingObservationFlag(false);
				}}
				title={
					(document.observations !== '' && t('Edit observations')) ||
					t('Add observations')
				}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '1rem'
					}}
				>
					<PTextArea
						id={id}
						label={t('Observations')}
						defaultValue={observation}
						onChange={setObservation}
						isDarkVariant
						style={{
							width: '100%',
							marginBottom: '1rem'
						}}
					/>
					<PButton
						onClick={() => {
							if (onSaveObservation) {
								onSaveObservation(observation);
								setAddingObservationFlag(false);
								onClose();
							} else {
								alert('Unimplemented error');
							}
						}}
					>
						{(observation && t('Edit observations')) || t('Add observations')}
					</PButton>
				</div>
			</Dialog>
		);
	}
};

const PDocument = (props: PDocumentProps) => {
	const { t } = useTranslation();
	const {
		title,
		label,
		explanation,
		id,
		isDarkVariant = false,
		document,
		isEditing = false,
		schema,
		onClose,
		onDelete,
		onSave,
		onSaveObservation,
		onSaveValidation,
		canValidate,
		isAdmin = false,
		isLoading = false,
		deleteDocument,
	} = props;
	const [isShowingEditingModal, setShowingEditingModalFlag] = useState(
		document.isBeingAdded || false
	);
	const [isShowingViewingModal, setShowingViewingModalFlag] = useState(false);

	const iconColor = document.hasSomethingToShow ? (document.valid ? 'green' : 'red') : 'black';
	const icon = document.hasSomethingToShow ? (document.valid ? 'tick' : 'cross') : null;
	const validateText = document.valid ? t('Devalidate') : t('Validate');


	const formGroupProps = {
		className: classNames(styles.form, {
			[styles.dark]: isDarkVariant
		}),
		style: {
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: 0,
			flex: 1,
			width: '100%'
		} as CSSProperties,
		// helperText: explanation,
		helperText: '',
		label: label,
		labelFor: id,
		inline: true,
		labelInfo: document.hasSomethingToShow ? <Icon color={iconColor} icon={icon} /> : undefined
	};

	const buttonsStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem' };

	const Line: FC<{ children: ReactNode }> = ({ children }) => {
		return (
			<FormGroup
				{...formGroupProps}
				style={{
					backgroundColor: document.valid
						? 'rgba(0, 255, 0, 0.1)'
						: 'rgba(255, 0, 0, 0.1)'
				}}
			>
				<div style={buttonsStyle}>{children}</div>
			</FormGroup>
		);
	};

	if (isEditing) {
		if (isShowingEditingModal) {
			return (
				<>
					<EditingModal
						schema={schema}
						document={document}
						id={id}
						label={title}
						onClose={() => {
							setShowingEditingModalFlag(false);
							onClose();
							document.isBeingAdded = false;
						}}
						onSave={(document) => {
							onSave(document);
						}}
					/>
					<FormGroup {...formGroupProps}>
						<InputGroup
							className={classNames({
								[styles.dark]: isDarkVariant
							})}
							id={id}
							placeholder={t('Editing file')}
							disabled={true}
							type="text"
						/>
					</FormGroup>
				</>
			);
		} else {
			return (
				<Line>
					<PButton
						variant={PButtonType.SECONDARY}
						size={PButtonSize.SMALL}
						icon={document.hasSomethingToShow ? 'edit' : 'upload'}
						onClick={() => setShowingEditingModalFlag(true)}
					>
						{document.hasSomethingToShow ? t('Edit') : t('Upload')}
					</PButton>
					{onDelete && (
						<PButton
							variant={PButtonType.DANGER}
							size={PButtonSize.SMALL}
							onClick={onDelete}
						>
							{t('Delete')}
						</PButton>
					)}
				</Line>
			);
		}
	} else {
		// NOT EDITING
		if (isShowingViewingModal) {
			return (
				<ViewingModal
					onSaveObservation={onSaveObservation}
					document={document}
					id={id}
					schema={schema}
					label={title}
					onClose={() => setShowingViewingModalFlag(false)}
					isAdmin={isAdmin}
				/>
			);
		} else {
			return (
				<Line>
					{isLoading && <Spinner size={SpinnerSize.STANDARD} />}
					{!isLoading && document.hasSomethingToShow && (
						<>
							<PButton
								variant={PButtonType.SECONDARY}
								size={PButtonSize.SMALL}
								icon={'eye-open'}
								onClick={() => setShowingViewingModalFlag(true)}
							>
								{t('View')}
							</PButton>
							{canValidate && onSaveValidation && (
								<PButton
									disabled={(!document.valid && new Date(document.valid_until) < new Date())}
									variant={PButtonType.SECONDARY}
									size={PButtonSize.SMALL}
									onClick={() => {
										onSaveValidation(!document.valid);
									}}
								>
									{validateText}
								</PButton>
							)}
							{deleteDocument && (
								<PButton
									// disabled={(!document.valid && new Date(document.valid_until) < new Date())}
									variant={PButtonType.SECONDARY}
									size={PButtonSize.SMALL}
									onClick={() => {
										// alert('Deleting ' + document.id);
										deleteDocument(document.id);
									}}
								>
									{t('Delete')}
								</PButton>
							)}
						</>
					)}
				</Line>
			);
		}
	}
};

export default PDocument;
