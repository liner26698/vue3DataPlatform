import { RouteRecordRaw } from "vue-router";
import { Layout } from "@/routers/constant";

// 照片墙模块
const photoWallRouter: Array<RouteRecordRaw> = [
	{
		path: "/photo",
		component: Layout,
		redirect: "/photo/index",
		meta: {
			title: "照片墙"
		},
		children: [
			{
				path: "/photo/index",
				name: "photoIndex",
				component: () => import("@/views/photo/home/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "照片墙",
					key: "photoIndex"
				}
			}
		]
	}
];

export default photoWallRouter;
