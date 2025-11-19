import { RouteRecordRaw } from "vue-router";
import { Layout } from "@/routers/constant";

// 抽奖模块
const lotteryRouter: Array<RouteRecordRaw> = [
	{
		path: "/lottery",
		component: Layout,
		redirect: "/lottery/index",
		meta: {
			title: "抽奖"
		},
		children: [
			{
				path: "/lottery/index",
				name: "lotteryIndex",
				component: () => import("@/views/lottery/index.vue"),
				meta: {
					keepAlive: true,
					requiresAuth: true,
					title: "抽奖",
					key: "lotteryIndex"
				}
			}
		]
	}
];

export default lotteryRouter;
