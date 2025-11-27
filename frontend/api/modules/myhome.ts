import http from "@/api";

/**
 * @name 首页模块
 */
// * 获取首页图片
export const getRolloverImage = () => {
	return http.get(`/home/rolloverImage`, {}, { headers: { noLoading: true } });
};
