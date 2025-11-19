import { defineStore } from "pinia";
import { BookInfoState, BookInfoStateParams } from "../interface";
import piniaPersistConfig from "@/config/piniaPersist";

// BookStore
export const BookStore = defineStore({
	id: "BookInfoState",
	state: (): BookInfoState => ({
		// * 搜索信息
		searchInfo: {
			key: " ",
			page: 1,
			siteid: "app2"
		},
		// * 书籍详情
		bookInfo: {},
		// * 分类列表
		classificationList: [
			{
				label: "所有",
				value: "all"
			},
			{
				label: "高效办公",
				value: "office"
			},
			{
				label: "图像",
				value: "image"
			},
			{
				label: "音频",
				value: "audio"
			},
			{
				label: "视频",
				value: "video"
			},
			{
				label: "设计",
				value: "design"
			},
			{
				label: "代码开发",
				value: "program"
			},
			{
				label: "智能对话",
				value: "dialogue"
			},
			{
				label: "内容检测",
				value: "detection"
			},
			{
				label: "训练模型",
				value: "model"
			},
			{
				label: "教程",
				value: "tutorial"
			},
			{
				label: "交流社区",
				value: "community"
			},
			{
				label: "其他",
				value: "other"
			}
		],
		// * 同步左侧tab
		leftTabLabel: "hot",
		// * 同步头部tab
		headerCurrentLabel: "",
		// tab类型列表
		tabTypeList: []
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
		},
		// * 设置分类列表
		async setClassificationList(list: any[]) {
			this.classificationList = list;
			this.leftTabLabel = list[0].label;
		},
		// * 设置当前tab
		setCurrentTabLabel(label: string) {
			this.leftTabLabel = label;
		},
		// * 设置头部tab
		setHeaderCurrentLabel(label: string) {
			this.headerCurrentLabel = label;
		},
		// * 设置tab类型列表
		setTabTypeList(list: any[]) {
			this.tabTypeList = list;
		}
	},
	persist: piniaPersistConfig("BookState")
});
