import { FC, ReactNode, useState } from 'react';
import env from '../../../vendor/environment/env';
import { getAssetPath, getCSSVariable, getFeatureOption, setCSSVariable } from '../../utils';
import styles from '../Layouts.module.scss';
import BarItems from './master/BarItems';

interface MasterLayoutProps {
	children: ReactNode;
}

const defaultBarWidth = getCSSVariable('bar-width');
const extendedBarWidth = getCSSVariable('bar-width-extended');

const MasterLayout: FC<MasterLayoutProps> = ({ children }) => {
	const [isExtended, setExtendedFlag] = useState(false);
	const increaseBarWidth = () => {
		setExtendedFlag(true);
		setCSSVariable('bar-width', extendedBarWidth);
	};
	const resetBarWidth = () => {
		setExtendedFlag(false);
		setCSSVariable('bar-width', defaultBarWidth);
	};

	return (
		<section className={styles.master}>
			{children}
			<aside
				className={`${styles.bar} ${isExtended ? styles.withBorder : ''}`}
				onMouseEnter={() => increaseBarWidth()}
				onMouseLeave={() => {
					resetBarWidth();
				}}
				onTouchEnd={() => resetBarWidth()}

			>
				{env.tenant.features.BarLogo.enabled && (
					<img
						src={getAssetPath(env.tenant.assets.logo)}
						alt={env.tenant.short_name}
						style={{
							width: 200,
							...(isExtended
								? {}
								: { transform: getFeatureOption('BarLogo', 'collapsedTransform') })
						}}
					/>
				)}
				<BarItems />
			</aside>
		</section>
	);
};

export default MasterLayout;
