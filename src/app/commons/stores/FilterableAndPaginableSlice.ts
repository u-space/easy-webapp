import { create, StoreApi } from 'zustand';

export interface FilterableAndPaginableSliceState {
	count: number;
	filterMatchingText: string | undefined;
	filterProperty: string;
	sortingProperty: string;
	sortingOrder: 'ASC' | 'DESC';
	pageTake: number;
	pageSkip: number;
	setFilterByText(text: string): void;
	setFilterProperty(property: string): void;
	// Sorting
	setSortingProperty(property: string): void;
	setSortingOrder(order: 'ASC' | 'DESC'): void;
	// Pagination
	setCount(count: number): void;
	setPageNumber(pageNumber: number): void;
	setPage(take: number, skip: number): void;
	getCurrentPageAndTotalPages(): { currentPage: number; totalPages: number };
}

export const createFilterableAndPaginableSlice = <T>(
	set: StoreApi<FilterableAndPaginableSliceState>['setState'],
	get: StoreApi<FilterableAndPaginableSliceState & T>['getState']
): FilterableAndPaginableSliceState => ({
	count: 0,
	filterMatchingText: undefined,
	filterProperty: '',
	sortingProperty: '',
	sortingOrder: 'DESC',
	pageTake: 10,
	pageSkip: 0,
	setFilterByText: (text) => set({ filterMatchingText: text !== '' ? text : undefined, pageSkip:0 }),
	setFilterProperty: (property) => set({ filterProperty: property, pageSkip:0 }),
	setSortingProperty: (property) => set({ sortingProperty: property , pageSkip:0}),
	setSortingOrder: (order) => set({ sortingOrder: order , pageSkip:0}),
	setCount: (count) => {
		if (Number.isInteger(count)) {
			set({ count: count });
		} else {
			throw new Error('Count must be an integer');
		}
	},
	setPageNumber: (pageNumber) => {
		if (Number.isInteger(pageNumber)) {
			set({ pageSkip: (pageNumber - 1) * get().pageTake });
		} else {
			throw new Error('Page number must be an integer');
		}
	},
	setPage: (take, skip) => {
		if (Number.isInteger(take) && Number.isInteger(skip)) {
			set({ pageTake: take, pageSkip: skip });
		} else {
			throw new Error('Page take and skip must be an integer');
		}
	},
	getCurrentPageAndTotalPages: () => {
		const pageTake = get().pageTake;
		const pageSkip = get().pageSkip;
		const count = get().count;
		const totalPages = Math.ceil(count / pageTake);
		const currentPage = Math.floor(pageSkip / pageTake) + 1;
		return { currentPage, totalPages };
	}
});

/* @deprecated Use only this for typing generic components */
export const useInternalGenericFilterableAndPaginableSlice =
	create<FilterableAndPaginableSliceState>()((set, get) => ({
		...createFilterableAndPaginableSlice(set, get)
	}));

export type UseGenericFilterableAndPaginableSliceStoreType =
	typeof useInternalGenericFilterableAndPaginableSlice;
