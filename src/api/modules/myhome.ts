import http from "@/api";
import { PORT1 } from "@/api/config/servicePort";

/**
 * @name 首页模块
 */
// * 获取每日一句
export const getDailySentence = () => {
	return http.get(PORT1 + `/home/dailySentence`);
};
