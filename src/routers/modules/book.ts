import { RouteRecordRaw } from "vue-router";

// 小说模块
const bookRouter: Array<RouteRecordRaw> = [
	{
		path: "/book",
		redirect: "/book/list"
	},
	{
		path: "/book/list",
		name: "novelList",
		meta: {
			requireAuth: false,
			title: "小说列表",
			key: "book"
		},
		component: () => import("@/views/book/NovelList.vue")
	},
	{
		path: "/book/detail",
		name: "chapterReader",
		meta: {
			requireAuth: false,
			title: "章节阅读",
			key: "book"
		},
		component: () => import("@/views/book/ChapterReader.vue")
	},
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
