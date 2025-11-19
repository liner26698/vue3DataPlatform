import { crawlerStats } from "@/api/config/servicePort";

import http from "@/api";

/**
 * @name 游戏数据统计
 */
// * 游戏数据统计接口
export const getGameStatsApi = (params: any) => {
	return http.post(crawlerStats + `/game/getGameStats`, params);
};
