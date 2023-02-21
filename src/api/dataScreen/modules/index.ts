import { statistics } from "@/api/config/servicePort";

import http from "@/api";

/**
 * @name 大屏模块
 */
// * 实时游客统计接口
export const realTimeVisitorApi = () => {
	return http.get(statistics + `/getRealTimeVisitorNum`);
};
