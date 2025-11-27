import http from "@/api/book/bookRequest";
import http2 from "@/api/book/bookRequest2";
import http3 from "@/api/book/bookRequest3";
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
	return http2.get(`/book/${params.bookid}/${params.chapterid}.html`, {}, { headers: { noLoading: false } });
};

// * 查询小说列表 - 使用后端 API
export const getNovelList = (params: any) => {
	return http3.post(`/book/getBookList`, params, { headers: { noLoading: false } });
};

// * 查询小说章节列表 - 使用后端 API
export const getNovelChapters = (params: any) => {
	return http3.post(`/book/getChapters`, params, { headers: { noLoading: true } });
};

// * 查询小说章节内容 - 使用后端 API
export const getNovelChapterContent = (params: any) => {
	return http3.post(`/book/getChapterContent`, params, { headers: { noLoading: false } });
};
