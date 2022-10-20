import http from "@/api/bookRequest";
import http2 from "@/api/bookRequest2";

// * 查询书籍
export const getBooks = (params: { key: string; page: number; siteid: string }) => {
	return http.get(`/search.aspx`, params, { headers: { noLoading: true } });
};

// * 查询书籍目录
export const getBookCatalogs = (id: string) => {
	return http2.get(`/book/${id}/`);
};
