import http3 from "@/api/book/bookRequest3";

/**
 * 获取小说列表
 */
export const getNovelList = (params: any): Promise<any> => {
	return http3.post(`/book/getBookList`, params, { headers: { noLoading: false } });
};

/**
 * 获取章节列表
 */
export const getNovelChapters = (params: any): Promise<any> => {
	return http3.post(`/book/getChapters`, params, { headers: { noLoading: true } });
};

/**
 * 获取章节内容
 */
export const getNovelChapterContent = (params: any): Promise<any> => {
	return http3.post(`/book/getChapterContent`, params, { headers: { noLoading: false } });
};

/**
 * 获取小说分类
 */
export const getNovelCategories = (): Promise<any> => {
	return http3.post(`/book/getCategories`, {}, { headers: { noLoading: true } });
};
