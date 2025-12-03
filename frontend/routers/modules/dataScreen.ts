import { RouteRecordRaw } from "vue-router";

// 数据大屏模块 - 自动重定向到新的墨青色数据大屏
const dataScreenRouter: Array<RouteRecordRaw> = [
	{
		path: "/dataScreen",
		redirect: "/dataScreenInk"
	}
];

export default dataScreenRouter;
