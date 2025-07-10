import { FC } from 'react';
import { useDocumentStore } from '../store';
import FilterAndOrderSearchTools from 'src/app/commons/components/hubs/FilterAndOrderSearchTools';

const DocumentSearchTools: FC = () => {
	return (
		<FilterAndOrderSearchTools
			useStore={useDocumentStore}
			entityName={'document'}
			searchableProps={['id', 'name', 'tag', 'referenced_entity_id', 'referenced_entity_type']}
			orderableProps={['id', 'name', 'tag', 'referenced_entity_id', 'referenced_entity_type']}
		/>
	);
};

export default DocumentSearchTools;
