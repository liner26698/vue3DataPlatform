import { statistics } from "@/api/config/servicePort";

import http from "@/api";

/**
 * @name 大屏模块
 */
// * 实时游客统计接口
export const realTimeVisitorApi = () => {
	return http.get(statistics + `/getRealTimeVisitorNum`);
};

// * 实时游客性别接口
export const realTimeVisitorSexApi = () => {
	return http.get(statistics + `/getSexRatio`);
};

// * 告警数据接口
export const alarmListApi = () => {
	return http.get(statistics + `/getAlarmList`);
};

// * 热门旅游推荐
export const hotPlateApi = () => {
	return http.get(statistics + `/getHotPlate`);
};

export const chatApi = (params: any) => {
	return http.post(statistics + `/chatGpt`, params);
};
