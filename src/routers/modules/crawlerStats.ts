import { RouteRecordRaw } from "vue-router";
import { Layout } from "@/routers/constant";

// 爬取数据统计模块
const crawlerStatsRouter: Array<RouteRecordRaw> = [
	{
		path: "/crawler-stats",
		component: Layout,
		redirect: "/crawler-stats/game",
		meta: {
			title: "爬取数据统计",
			icon: "data-analysis"
		},
		children: [
			{
				path: "/crawler-stats/game",
				name: "crawlerStatsGame",
				component: () => import("@/views/crawlerStats/game/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "游戏数据统计",
					key: "gameStats"
				}
			}
			// 后续可以添加更多子模块，如新闻数据统计、AI数据统计等
		]
	}
];

export default crawlerStatsRouter;
