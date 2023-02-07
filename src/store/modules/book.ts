import { defineStore } from "pinia";
import { BookInfoState, BookInfoStateParams } from "../interface";
import piniaPersistConfig from "@/config/piniaPersist";

// BookStore
export const BookStore = defineStore({
	id: "BookInfoState",
	state: (): BookInfoState => ({
		searchInfo: {
			key: " ",
			page: 1,
			siteid: "app2"
		},
		bookInfo: {}
	}),
	getters: {},
	actions: {
		// * 设置搜索信息
		async setSearchInfo(searchCriteria: BookInfoStateParams) {
			this.searchInfo = searchCriteria;
		},
		// * 设置书籍详情
		async setBookDetail(info: any) {
			this.bookInfo = info;
		}
	},
	persist: piniaPersistConfig("BookState")
});
