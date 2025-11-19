import { RouteRecordRaw } from "vue-router";
import { Layout } from "@/routers/constant";

// 自定义指令模块
const crawlerRouter: Array<RouteRecordRaw> = [
	{
		path: "/crawler",
		component: Layout,
		redirect: "/crawler/game/index",
		meta: {
			title: "游戏模块"
		},
		children: [
			{
				path: "/crawler/game/index",
				name: "crawlerGame",
				component: () => import("@/views/crawler/game/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "游戏爬虫",
					key: "crawlerGame"
				}
			}
			// {
			// 	path: "/crawler/watermarkDirect",
			// 	name: "watermarkDirect",
			// 	component: () => import("@/views/crawler/watermarkDirect/index.vue"),
			// 	meta: {
			// 		keepAlive: true,
			// 		requiresAuth: true,
			// 		title: "水印指令",
			// 		key: "watermarkDirect"
			// 	}
			// },
			// {
			// 	path: "/crawler/dragDirect",
			// 	name: "dragDirect",
			// 	component: () => import("@/views/crawler/dragDirect/index.vue"),
			// 	meta: {
			// 		keepAlive: true,
			// 		requiresAuth: true,
			// 		title: "拖拽指令",
			// 		key: "dragDirect"
			// 	}
			// },
			// {
			// 	path: "/crawler/debounceDirect",
			// 	name: "debounceDirect",
			// 	component: () => import("@/views/crawler/debounceDirect/index.vue"),
			// 	meta: {
			// 		keepAlive: true,
			// 		requiresAuth: true,
			// 		title: "防抖指令",
			// 		key: "debounceDirect"
			// 	}
			// },
			// {
			// 	path: "/crawler/throttleDirect",
			// 	name: "throttleDirect",
			// 	component: () => import("@/views/crawler/throttleDirect/index.vue"),
			// 	meta: {
			// 		keepAlive: true,
			// 		requiresAuth: true,
			// 		title: "节流指令",
			// 		key: "throttleDirect"
			// 	}
			// },
			// {
			// 	path: "/crawler/longpressDirect",
			// 	name: "longpressDirect",
			// 	component: () => import("@/views/crawler/longpressDirect/index.vue"),
			// 	meta: {
			// 		keepAlive: true,
			// 		requiresAuth: true,
			// 		title: "长按指令",
			// 		key: "longpressDirect"
			// 	}
			// }
		]
	}
];

export default crawlerRouter;
