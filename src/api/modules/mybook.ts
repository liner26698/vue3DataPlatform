import http from "@/api/bookRequest";
import http2 from "@/api/bookRequest2";

interface BooksParams {
	key: string;
	page: number;
	siteid: string;
}

interface BookCatalogsParams {
	id: string;
}

interface BookContentParams {
	bookid: string;
	chapterid: string;
}
// * 查询书籍
export const getBooks = (params: BooksParams, isLoading: boolean) => {
	return http.get(`/search.aspx`, params, { headers: { noLoading: isLoading } });
};

// * 查询书籍目录
export const getBookCatalogs = (id: BookCatalogsParams) => {
	return http2.get(`/book/${id}/`, {}, { headers: { noLoading: true } });
};

// * 查询书籍内容
export const getBookContent = (params: BookContentParams) => {
	return http2.get(`/book/${params.bookid}/${params.chapterid}.html`, {}, { headers: { noLoading: true } });
};
// export const getBookContent = (bookid: string, chapterid: string) => {
// 	return http2.get(`/book/${bookid}/${chapterid}.html`, {}, { headers: { noLoading: true } });
// };
