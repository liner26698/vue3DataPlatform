<template>
	<div class="header">
		<!-- LOGO - TAB LIST -->
		<div class="header-left h-full flex items-center">
			<div class="logo h-full flex items-center pr-36">
				<img src="@/assets/images/logo.png" alt="logo" class="w-8 h-8" />
			</div>
			<div class="tab-list flex flex-row">
				<div
					class="tab-item cursor-pointer hover:text-c50 text-base py-2 px-4"
					:class="{ active: tabItem.label === headerCurrentLabel }"
					v-for="(tabItem, tabIndex) in headerTabList"
					:key="tabIndex"
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
					placeholder="请输入书名或者作者"
					:suffix-icon="Search"
					@keyup.enter="searchBookFn"
				/>
			</div>
			<div class="login">登录/注册</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { BookStore } from "@/store/modules/book";

const bookStore = BookStore();
const headerCurrentLabel = ref("首页");
const headerTabList = [
	{
		label: "首页",
		value: "login"
	},
	{
		label: "小说",
		value: "book"
	},
	{
		label: "漫画",
		value: "comic"
	},
	{
		label: "音乐",
		value: "music"
	},
	{
		label: "影视",
		value: "movie"
	},
	{
		label: "游戏",
		value: "game"
	},
	{
		label: "动漫",
		value: "anime"
	},
	{
		label: "体育",
		value: "sport"
	},
	{
		label: "科技",
		value: "technology"
	},
	{
		label: "生活",
		value: "life"
	},
	{
		label: "其他",
		value: "other"
	}
];
const searchInfo = reactive({
	key: "",
	page: 1,
	siteid: "app2"
});
const searchBookFn = () => {
	// 防止修改原始数据 搜索条件为空默认空格 否则查不出数据
	let _cloneKey = searchInfo.key ? JSON.parse(JSON.stringify(searchInfo.key)) : " ";
	bookStore.setSearchInfo({
		key: _cloneKey,
		page: 1,
		siteid: "app2"
	});
};
</script>

<style lang="scss">
.header {
	.el-input__wrapper {
		border-radius: 30px;
	}
}
</style>
<style lang="scss" scoped>
@import "../index.scss";
</style>
