<template>
	<!--  content -->
	<div class="rightContent-content w-full h-full flex flex-col">
		<div class="content-header flex flex-row items-center">
			<div class="title mr-10 text-c3c text-xl">{{ title }}</div>
			<el-tabs v-model="activeName" @tab-click="handleClick">
				<el-tab-pane
					:label="tabItem.label"
					:name="tabItem.label"
					v-for="(tabItem, tabIndex) in tabs"
					:key="tabIndex"
				></el-tab-pane>
			</el-tabs>
		</div>
		<div class="content-main overflow-hidden w-full h-full flex-auto">
			<aiInfo v-if="headerCurrentLabel == 'AI'" />
			<bookInfo v-if="headerCurrentLabel == '小说'" />
			<gameInfo v-if="headerCurrentLabel == '游戏'" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { BookStore } from "@/store/modules/book";
import aiInfo from "./aiComponents/content.vue";
import bookInfo from "./bookComponents/content.vue";
import gameInfo from "./gameComponents/content.vue";

const bookStore = BookStore();
const title = ref("");
const activeName = ref("最新");
const headerCurrentLabel = ref("");
let tabs: any = reactive([]);

const handleClick = (): void => {};

onMounted(async () => {
	bookStore.searchInfo.page = 1;
	bookStore.searchInfo.key = " ";
	title.value = bookStore.headerCurrentLabel;
	headerCurrentLabel.value = bookStore.headerCurrentLabel;
	tabs = bookStore.tabTypeList;
});

watch(
	() => bookStore.leftTabLabel,
	() => {
		title.value = bookStore.leftTabLabel;
	}
);

watch(
	() => bookStore.headerCurrentLabel,
	() => {
		headerCurrentLabel.value = bookStore.headerCurrentLabel;
	}
);

watch(
	() => bookStore.tabTypeList,
	() => {
		tabs = bookStore.tabTypeList;
		activeName.value = tabs[0].label;
	}
);
</script>
<style lang="scss" scoped>
@import "../index.scss";

.rightContent-content {
	.el-drawer__body {
		overflow: hidden;
	}
	:deep .el-tabs__nav-wrap::after {
		display: none;
	}
	:deep .el-tabs__item {
		font-weight: 400;
		color: #757575;
	}
	.title {
		font-weight: 400;
		width: 100px;
		// 一行,超过宽度省略号
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.el-image {
		width: 100%;
		height: 100%;
	}
	:deep .el-divider__text {
		color: #3c4248 !important;
	}
	:deep .el-carousel__item h3 {
		color: #475669;
		opacity: 0.75;
		line-height: 200px;
		margin: 0;
		text-align: center;
	}

	:deep .el-carousel__item:nth-child(2n) {
		background-color: #99a9bf;
	}

	:deep .el-carousel__item:nth-child(2n + 1) {
		background-color: #d3dce6;
	}
}
</style>
