import request from "@/api/index";

// 获取热门话题列表
export const getHotTopicsApi = (params?: any) => {
	return request.post("/statistics/getHotTopics", params || {});
};

// 获取指定平台的热门话题
export const getHotTopicsByPlatformApi = (platform: string, params?: any) => {
	return request.post("/statistics/getHotTopicsByPlatform", {
		platform,
		...params
	});
};
