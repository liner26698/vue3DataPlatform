import { RouteRecordRaw } from "vue-router";
import { Layout } from "@/routers/constant";

// 日志模块
const logsRouter: Array<RouteRecordRaw> = [
	{
		path: "/logs",
		component: Layout,
		redirect: "/logs/index",
		children: [
			{
				path: "index",
				name: "logs",
				component: () => import("@/views/logs/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "日志管理",
					key: "logs"
				}
			}
		]
	}
];

export default logsRouter;
