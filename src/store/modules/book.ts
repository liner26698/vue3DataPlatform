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
		}
	}),
	getters: {},
	actions: {
		async setSearchInfo(searchCriteria: BookInfoStateParams) {
			this.searchInfo = searchCriteria;
		}
	},
	persist: piniaPersistConfig("BookState")
});
