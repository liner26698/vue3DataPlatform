import { RouteRecordRaw } from "vue-router";

// 小说模块
const bookRouter: Array<RouteRecordRaw> = [
	{
		path: "/book",
		name: "book",
		meta: {
			requireAuth: false,
			title: "小说",
			key: "book"
		},
		component: () => import("@/views/book/index.vue")
	}
];

export default bookRouter;
