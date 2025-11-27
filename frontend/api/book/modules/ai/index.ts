import { bookMicroservices } from "@/api/config/servicePort";

import http from "@/api";

/**
 * @name AI模块
 */
// * AI获取列表接口
export const getAiListApi = (params: any) => {
	return http.post(bookMicroservices + `/ai/getAiList`, params, { headers: { noLoading: true } });
};
