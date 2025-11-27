import { RouteRecordRaw } from "vue-router";

// 墨青色数据大屏模块
const dataScreenInkRouter: Array<RouteRecordRaw> = [
	{
		path: "/dataScreenInk",
		name: "dataScreenInk",
		meta: {
			requiresAuth: false,
			title: "墨青色数据大屏",
			key: "dataScreenInk"
		},
		component: () => import("@/views/dataScreenInk/index.vue")
	}
];

export default dataScreenInkRouter;
