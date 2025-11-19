import { bookMicroservices } from "@/api/config/servicePort";

import http from "@/api";

/**
 * @name 游戏模块
 */
// * 发售表获取列表接口
export const getGameListApi = (params: any) => {
	return http.post(bookMicroservices + `/game/getGameList`, params);
};
