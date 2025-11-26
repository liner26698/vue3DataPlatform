import { RouteRecordRaw } from "vue-router";
import { Layout } from "@/routers/constant";

// 爬取数据统计模块
const crawlerStatsRouter: Array<RouteRecordRaw> = [
	{
		path: "/crawler-stats",
		component: Layout,
		redirect: "/crawler-stats/overview",
		meta: {
			title: "爬取数据统计",
			icon: "data-analysis"
		},
		children: [
			{
				path: "/crawler-stats/overview",
				name: "crawlerStatsOverview",
				component: () => import("@/views/crawlerStats/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "数据概览",
					key: "statsOverview"
				}
			},
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
			},
			{
				path: "/crawler-stats/hot-topics",
				name: "crawlerStatsHotTopics",
				component: () => import("@/views/crawlerStats/hotTopics/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "热门话题统计",
					key: "hotTopicsStats"
				}
			},
			{
				path: "/crawler-stats/ai-tools",
				name: "crawlerStatsAiTools",
				component: () => import("@/views/crawlerStats/aiTools/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "AI工具统计",
					key: "aiToolsStats"
				}
			}
		]
	}
];

export default crawlerStatsRouter;
