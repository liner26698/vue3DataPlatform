import { Logs } from "@/api/interface/index";
import http from "@/api";

/**
 * @name 日志管理模块
 */
// * 获取日志列表
export const getLogsApi = () => {
	return http.post<Logs.ResLogsList[]>(`/logs`);
};
// * 删除日志
export const deleteLogsApi = (params: string) => {
	return http.delete(`/logs/${params}`);
};
// * 清空日志
export const clearLogsApi = () => {
	return http.delete(`/logs`);
};
// * 导出日志
export const exportLogsApi = (params: { lines?: number }) => {
	return http.get(`/logs/export`, { params });
};
