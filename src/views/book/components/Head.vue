<template>
	<div class="header">
		<!-- LOGO - TAB LIST -->
		<div class="header-left h-full flex items-center">
			<div class="logo h-full flex items-center pr-36" @click="toHome">
				<img src="@/assets/images/logo.png" alt="logo" class="w-8 h-8" />
			</div>
			<div class="tab-list flex flex-row">
				<div
					class="tab-item cursor-pointer hover:text-c50 text-base py-2 px-4"
					:class="{ active: tabItem.label === headerCurrentLabel }"
					v-for="(tabItem, tabIndex) in headerTabList"
					:key="tabIndex"
					@click="currentTab(tabItem.label)"
				>
					{{ tabItem.label }}
				</div>
			</div>
		</div>

		<!-- SEARCHSOMTHING LOGIN -->
		<div class="header-right h-full flex items-center">
			<div class="w-80">
				<el-input
					v-model.trim="searchInfo.key"
					size="large"
					placeholder="请输入要搜索的内容..."
					:suffix-icon="Search"
					@keyup.enter="searchBookFn"
				/>
			</div>
			<div class="login">{{ userName || "登录/注册" }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { BookStore } from "@/store/modules/book";
import { GlobalStore } from "@/store";
import { useRouter } from "vue-router";

const router = useRouter();

const bookStore = BookStore();
const globalStore = GlobalStore();
const headerCurrentLabel = ref("AI");
const searchInfo = reactive({
	key: "",
	page: 1,
	siteid: "app2"
});
let userName = computed(() => globalStore.userInfo.userName);
let headerTabList = computed(() => globalStore.headerTabList);
const searchBookFn = () => {
	// 防止修改原始数据 搜索条件为空默认空格 否则查不出数据
	let _cloneKey = searchInfo.key ? JSON.parse(JSON.stringify(searchInfo.key)) : " ";
	bookStore.setSearchInfo({
		key: _cloneKey,
		page: 1,
		siteid: "app2"
	});
};
const commonTabTypeList = [
	{
		label: "最新",
		value: "newest"
	},
	{
		label: "下载",
		value: "download"
	},
	{
		label: "评论",
		value: "comment"
	},
	{
		label: "喜欢",
		value: "like"
	},
	{
		label: "推荐",
		value: "recommend"
	}
];
const gameTabTypeList = [
	// 游戏发售表
	{
		label: "发售表",
		value: "release"
	}
];
const currentTab = (label: string) => {
	bookStore.setTabTypeList(commonTabTypeList);
	headerCurrentLabel.value = label;
	bookStore.setHeaderCurrentLabel(label);
	switch (label) {
		case "AI":
			bookStore.setClassificationList([
				{
					label: "所有",
					value: "hot"
				},
				{
					label: "高效办公",
					value: "office"
				},
				{
					label: "图像生成",
					value: "image"
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
					label: "其他工具",
					value: "other"
				}
			]);
			break;
		case "小说":
			bookStore.setClassificationList([
				{
					label: "玄幻",
					value: "xuanhuan"
				},
				{
					label: "修真",
					value: "xiuzhen"
				},
				{
					label: "都市",
					value: "dushi"
				},
				{
					label: "历史",
					value: "lishi"
				},
				{
					label: "网游",
					value: "wangyou"
				},
				{
					label: "科幻",
					value: "kehuan"
				},
				{
					label: "灵异",
					value: "lingyi"
				},
				{
					label: "其他",
					value: "other"
				}
			]);
			break;
		case "游戏":
			bookStore.setClassificationList([
				{
					label: "PS5",
					value: "ps5"
				},
				{
					label: "PC",
					value: "pc"
				}
				// {
				// 	label: "NS",
				// 	value: "ns"
				// },
				// {
				// 	label: "XSX",
				// 	value: "xsx"
				// },
				// {
				// 	label: "PS4",
				// 	value: "ps4"
				// },
				// {
				// 	label: "XONE",
				// 	value: "xone"
				// },
				// {
				// 	label: "其他",
				// 	value: "other"
				// }
			]);

			bookStore.setTabTypeList(gameTabTypeList);
		default:
			break;
	}
};
const toHome = () => {
	router.push({
		path: "/home/index"
	});
};

onMounted(() => {
	// 如果store中没有设置header tab，则默认选中AI
	if (!bookStore.headerCurrentLabel) {
		currentTab("AI");
	} else {
		headerCurrentLabel.value = bookStore.headerCurrentLabel;
	}
	// bookStore.setTabTypeList(commonTabTypeList);
});
</script>

<style lang="scss" scoped>
@import "../index.scss";
:deep .el-input__wrapper {
	border-radius: 30px;
}
</style>
