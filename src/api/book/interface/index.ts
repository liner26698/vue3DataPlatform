export namespace Book {
	export interface BooksParams {
		key: string;
		page: number;
		siteid: string;
	}

	export interface BookCatalogsParams {
		id: string;
	}

	export interface BookContentParams {
		bookid: string;
		chapterid: string;
	}
}
