import { PORT2 } from "@/api/config/servicePort";

import http from "@/api";

/**
 * @name 爬虫 - 游戏模块
 */
// * 更改游戏爬虫内容
export const changeGameCrawlerApi = (params: any) => {
	return http.post(PORT2 + `/crawler/changeGameCrawler`, params);
};
