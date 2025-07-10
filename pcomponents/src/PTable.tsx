/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	DataEditor,
	DataEditorContainer,
	DataEditorProps,
	GridColumn
} from '@glideapps/glide-data-grid';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, ReactNode, useCallback, useState } from 'react';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ThemeProvider } from 'styled-components';
import styles from './Kanpur.module.scss';
import { getCSSVariable } from './utils';


export interface PTableProps {
	columns: GridColumn[];
	actions?: ReactNode;
	getData: DataEditorProps['getCellContent'];
	rowHeight: number;
	rowsQuantity?: number;
	isResizable?: boolean;
	isChildVisible?: boolean;
	nav?: ReactNode;
	children?: ReactNode;
}

const PTable: FC<PTableProps> = ({
	columns,
	actions,
	getData,
	rowHeight,
	rowsQuantity,
	isResizable,
	isChildVisible,
	nav,
	children
}) => {
	// Resize columns on dragging
	const [cols, setColumns] = useState<GridColumn[]>(columns);

	const onColumnResized = useCallback(
		(col: GridColumn, newSize: number) => {
			const index = cols.indexOf(col);
			const newCols = [...cols];
			newCols[index] = {
				...newCols[index],
				width: col.width
			};
			setColumns(newCols);
		},
		[cols]
	);

	// Styling

	const darkTheme = {
		accentColor: getCSSVariable('primary-500'),
		accentLight: getCSSVariable('mirai-200'),

		textDark: getCSSVariable('mirai-900'),
		textMedium: '#ffffff',
		textLight: '#ffffff',
		textBubble: '#ffffff',

		bgIconHeader: '#ffffff',
		fgIconHeader: '#000000',
		textHeader: '#ffffff',
		textHeaderSelected: '#ffffff',

		bgCell: getCSSVariable('mirai-100'),
		bgCellMedium: getCSSVariable('mirai-100'),
		bgHeader: getCSSVariable('primary-800'),
		bgHeaderHasFocus: getCSSVariable('primary-700'),
		bgHeaderHovered: getCSSVariable('primary-500'),

		bgBubble: '#212121',
		bgBubbleSelected: '#000000',

		bgSearchResult: '#69c515',

		borderColor: getCSSVariable('mirai-100'),
		horizontalBorderColor: getCSSVariable('mirai-200'),
		drilldownBorder: getCSSVariable('dronfies-red'),

		linkColor: '#4F5DFF',

		headerFontStyle: '14px',
		baseFontStyle: '14px',
		fontFamily: 'Lexend Deca, sans-serif'
	};


	const childVariants = {
		right: { translateX: '100%' },
		visible: { translateX: 0 },
		left: { translateX: '-100%' }
	};

	const colSumWith = cols.slice(1).map((col) => col.width).reduce((a, b) => a + b, 0);

	return (
		<ThemeProvider theme={darkTheme}>
			<AutoSizer>
				{(props) => {
					const actionsSize = cols[0].width;
					const _cols = cols.map((item, index) => {
						if (index > 0) {
							return {
								title: item.title,
								// width: (props.width - actionsSize) / (cols.length - 1) //equal width
								width: (props.width - actionsSize) * (item.width / colSumWith)
							};
						} else {
							return item;
						}
					});
					return (
						<div className={styles.table}>
							<DataEditorContainer
								width={props.width ?? 100}
								height={props.height ?? 100}
							>
								<DataEditor
									getCellContent={getData}
									columns={_cols}
									rows={rowsQuantity || 0}
									headerHeight={rowHeight}
									rowHeight={rowHeight}
									verticalBorder={false}
									showSearch={false}
									onColumnResized={isResizable ? onColumnResized : undefined}
								/>
								<section className={styles.overlay} style={{ top: rowHeight }}>
									{actions}
								</section>
								<AnimatePresence>
									{isChildVisible && (
										<motion.section
											key="child"
											initial="right"
											animate="visible"
											exit="left"
											variants={childVariants}
											transition={{ duration: 0.8 }}
											className={styles.card}
											style={{
												position: 'absolute',
												top: '0',
												left: '0'
											}}
										>
											{children}
											<div
												className={styles.nav}
												style={{ height: rowHeight }}
											>
												{nav}
											</div>
										</motion.section>
									)}
								</AnimatePresence>
							</DataEditorContainer>
						</div>
					);
				}}
			</AutoSizer>
		</ThemeProvider>
	);
};

PTable.propTypes = {};

export default PTable;
