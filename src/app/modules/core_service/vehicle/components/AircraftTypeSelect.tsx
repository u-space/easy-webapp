import { Button, MenuItem } from '@blueprintjs/core';
import { ItemPredicate, ItemRenderer, Select2 } from '@blueprintjs/select';
import { AircraftType } from '@utm-entities/aircraftType';
import React from 'react';
import { useTranslation } from 'react-i18next';

const filterAircraftType: ItemPredicate<AircraftType> = (
	query,
	aircraftType,
	_index,
	exactMatch
) => {
	const normalizedTitle = `${aircraftType.manufacturer} ${aircraftType.model}`.toLowerCase();
	const normalizedQuery = query.toLowerCase();

	if (exactMatch) {
		return normalizedTitle === normalizedQuery;
	} else {
		return normalizedTitle.indexOf(normalizedQuery) >= 0;
	}
};

const renderAircraftType: ItemRenderer<AircraftType> = (
	aircraftType,
	{ handleClick, handleFocus, modifiers, query }
) => {
	if (!modifiers.matchesPredicate) {
		return null;
	}
	return (
		<MenuItem
			active={modifiers.active}
			disabled={modifiers.disabled}
			key={aircraftType.id}
			label={aircraftType.manufacturer}
			onClick={handleClick}
			onFocus={handleFocus}
			roleStructure="listoption"
			text={`${aircraftType.manufacturer} ${aircraftType.model}`}
		/>
	);
};

interface AircraftTypesSelectProps {
	aircraftTypes: AircraftType[];
	selected: AircraftType | null;
	onSelected: (aircraftType: AircraftType) => void;
}

const AircraftTypeDisplayName = (aircraftType :AircraftType) => {
	return `${aircraftType.manufacturer} ${aircraftType.model}`
}

const AircraftTypeSelect: React.FC<AircraftTypesSelectProps> = ({
	aircraftTypes,
	onSelected,
	selected
}) => {
	const { t } = useTranslation();
	return (
		<Select2<AircraftType>
			items={aircraftTypes.sort((at1,at2)=> AircraftTypeDisplayName(at1).localeCompare(AircraftTypeDisplayName(at2)))}
			fill={true}
			itemPredicate={filterAircraftType}
			itemRenderer={renderAircraftType}
			noResults={
				<MenuItem disabled={true} text={t('No results')} roleStructure="listoption" />
			}
			onItemSelect={(value) => {
				onSelected(value);
			}}
			popoverProps={{ matchTargetWidth: true }}
		>
			<Button
				fill
				text={
					selected
						? `${selected?.manufacturer} ${selected?.model}`
						: t('Please select an aircraft type')
				}
				rightIcon="double-caret-vertical"
				placeholder="Select aircraft type"
			/>
		</Select2>
	);
};

export default AircraftTypeSelect;
