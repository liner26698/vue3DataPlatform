import http from "@/api/book/bookRequest";
import http2 from "@/api/book/bookRequest2";
import { Book } from "@/api/book/interface/index";

// * 查询书籍
export const getBooks = (params: Book.BooksParams, isLoading?: boolean) => {
	return http.get(`/search.aspx`, params, { headers: { noLoading: isLoading } });
};

// * 查询书籍目录
export const getBookCatalogs = (params: Book.BookCatalogsParams) => {
	return http2.get(`/book/${params.id}/`, {}, { headers: { noLoading: true } });
};

// * 查询书籍内容
export const getBookContent = (params: Book.BookContentParams) => {
	return http2.get(`/book/${params.bookid}/${params.chapterid}.html`, {}, { headers: { noLoading: true } });
};
