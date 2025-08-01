import LabelInfo from './form/LabelInfo';
import { Classes, FileInput, FormGroup } from '@blueprintjs/core';
import { CSSProperties, useEffect, useState } from 'react';
import classnames from 'classnames';
import styles from './Kanpur.module.scss';
import { useTranslation } from 'react-i18next';
import PButton, { PButtonSize, PButtonType } from './PButton';

const MAX_FILE_SIZE_MB = 15;

export interface PFileInputProps {
	id: string;
	label: string;
	labelInfo?: string;
	explanation?: string;
	defaultValue?: File | string | null;
	placeholder?: string;
	API?: string;
	onChange: (value: File | null) => void;
	disabled?: boolean;
	isLoading?: boolean;
	isRequired?: boolean;
	isDarkVariant?: boolean;
	inline?: boolean;
	style?: CSSProperties;
	description?: string;
}

const PFileInput = ({
	id,
	label,
	labelInfo,
	explanation,
	placeholder,
	API = 'error',
	defaultValue = null,
	onChange,
	disabled = false,
	inline = false,
	isDarkVariant = false,
	isLoading = false,
	isRequired = false,
	style,
	description,
	...extraProps
}: PFileInputProps) => {
	const { t } = useTranslation();

	const [value, setValue] = useState<File | string | null>(defaultValue);
	// const [source, setSource] = useState<string|null>(null);

	const onValueChange = (value: File | null) => {
		setValue(value);
		onChange(value);
	};

	useEffect(() => {
		if (defaultValue !== undefined) {
			setValue(defaultValue);
		}
	}, [defaultValue]);

	// useEffect(() => {
	// 	const sourceAux

	// }, [source]);

	const source = value && value instanceof File ? URL.createObjectURL(value) : value;

	return (
		<FormGroup
			className={classnames(styles.form, {
				[styles.dark]: isDarkVariant
			})}
			helperText={explanation}
			label={label}
			labelFor={id}
			inline={inline}
			labelInfo={
				<LabelInfo isHidden={disabled} isRequired={isRequired} labelInfo={labelInfo} />
			}
			style={style}
		>
			{description && <span className={styles.pDocumentDescription}>{description}</span>}
			<div style={{ display: 'flex !important', flexDirection: 'row' }}>
				{source && (
					<PButton
						variant={PButtonType.SECONDARY}
						size={PButtonSize.SMALL}
						onClick={() => {
							window.open(source, '_blank');
						}}
					>
						{t('View file')}
					</PButton>
				)}
				{!disabled && (
					<FileInput
						className={classnames(styles.reset, {
							[Classes.SKELETON]: isLoading,
							[styles.dark]: isDarkVariant
						})}
						id={id}
						buttonText={t('upload')}
						placeholder={placeholder}
						disabled={disabled}
						inputProps={{ accept: 'image/*,application/pdf' }}
						text={
							value === null
								? label
								: value instanceof File
									? value.name
									: value.split('/').pop()
						}
						onInputChange={(evt) => {
							if (
								evt.currentTarget.files &&
								evt.currentTarget.files.length > 0 &&
								evt.currentTarget.files[0].size > MAX_FILE_SIZE_MB * 1024 * 1024
							) {
								alert(t('Max file size is x MB', { number: MAX_FILE_SIZE_MB }));
							} else if (
								evt.currentTarget.files &&
								evt.currentTarget.files.length > 0 &&
								(evt.currentTarget.files[0].type.indexOf('image/') >= 0 ||
									evt.currentTarget.files[0].type.indexOf('application/pdf') >= 0)
							) {
								onValueChange(evt.currentTarget.files[0]);
							} else if (
								evt.currentTarget.files &&
								evt.currentTarget.files.length === 0
							) {
								onValueChange(null);
							} else {
								alert(t('Only images and pdfs are allowed'));
							}
						}}
						fill={false}
						{...extraProps}
					/>
				)}
			</div>
		</FormGroup>
	);
};

export default PFileInput;
