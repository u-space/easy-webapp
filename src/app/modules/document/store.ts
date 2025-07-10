import { createFilterableAndPaginableSlice, FilterableAndPaginableSliceState } from 'src/app/commons/stores/FilterableAndPaginableSlice';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type DocumentStoreSpecificState = Record<never, never>;

export type DocumentStoreState = DocumentStoreSpecificState & FilterableAndPaginableSliceState;

export const useDocumentStore = create<DocumentStoreState>()(
	devtools(
		(set, get) => ({
			...createFilterableAndPaginableSlice<DocumentStoreSpecificState>(set, get)
		}),
		{ name: 'DocumentStore' }
	)
);
