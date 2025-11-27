import { RouteRecordRaw } from "vue-router";
import { Layout } from "@/routers/constant";

// 小说管理
const novelRouter: Array<RouteRecordRaw> = [
	{
		path: "/novel",
		component: Layout,
		redirect: "/novel/index",
		meta: {
			title: "小说管理",
			icon: "notebook"
		},
		children: [
			{
				path: "/novel/index",
				name: "novelIndex",
				component: () => import("@/views/novel/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "小说管理",
					key: "photoIndex"
				}
			}
		]
	}
];

export default novelRouter;
