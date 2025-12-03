import { statistics } from "@/api/config/servicePort";
import http from "@/api";

/**
 * @name 数据大屏接口
 */

// * 获取爬虫倒计时数据（使用快速版本）
export const getCrawlerCountdownApi = () => {
	return http.post(statistics + `/getCrawlerCountdownFast`);
};

// * 获取爬虫倒计时数据（完整版）
export const getCrawlerCountdownFullApi = () => {
	return http.post(statistics + `/getCrawlerCountdown`);
};

// * 获取爬虫统计数据
export const getCrawlerStatsApi = () => {
	return http.post(statistics + `/getCrawlerStats`);
};

// * 获取热门话题数据
export const getHotTopicsApi = () => {
	return http.post(statistics + `/getHotTopics`);
};
