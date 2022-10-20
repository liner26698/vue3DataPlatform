<template>
	<!--  content -->
	<div class="content w-full h-full flex flex-col">
		<div class="content-header flex flex-row items-center">
			<div class="title mr-16 text-c3c text-xl">{{ title }}</div>
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
			<!-- 书籍列表 -->
			<div
				class="book-list flex flex-row flex-wrap overflow-x-hidden w-full h-full"
				v-infinite-scroll="load"
				infinite-scroll-immediate="false"
				infinite-scroll-distance="1200"
				infinite-scroll-delay="600"
			>
				<template v-if="bookList.length != 0">
					<div class="book-item" v-for="(bookItem, bookIndex) in bookList" :key="bookIndex" @click="showDetail(bookItem)">
						<div class="book-img w-full h-2/4 relative">
							<el-image :src="bookItem.Img" fit="cover" class="rounded-t-lg">
								<template #error>
									<div class="image-slot">
										<img src="@/assets/images/404.png" alt="加载失败" />
									</div>
								</template>
							</el-image>
						</div>
						<div class="book-info w-full h-2/4 bg-white overflow-y-hidden flex flex-col rounded-b-lg shadow-md">
							<div class="book-name text-sm pt-3 px-5 self-start">{{ bookItem.Name }}</div>
							<div class="book-author text-xs px-5">
								<el-divider content-position="left">{{ bookItem.Author }} - {{ bookItem.CName }}</el-divider>
							</div>
							<div class="book-author text-xs text-c3c w-full h-full overflow-y-scroll overflow-x-hidden px-1 py-2">
								{{ bookItem.Desc }}
							</div>
						</div>
					</div>
				</template>

				<template v-else>
					<el-empty description="换个搜索条件试试吧" style="width: 100%; height: 100%" />
				</template>
			</div>

			<!-- 章节目录 -->
			<div class="chapter-contents">
				<el-drawer v-model="drawer" direction="rtl" :before-close="drawerClose">
					<template #title>
						<div>
							<p class="text-center text-base text-c3c font-black">{{ currentDetail.name }}</p>
							<p class="flex justify-evenly items-center text-xs">
								<b>作者:{{ currentDetail.author }}</b>
								<b>更新时间:{{ currentDetail.updateTime }}</b>
								<b>最新章节:{{ currentDetail.lastChapter }}</b>
							</p>
						</div>
					</template>
					<template #default>
						<div class="chapter-list">
							<div class="chapter-item"></div>
						</div>
					</template>
					<template #footer>
						<div style="flex: auto">
							<el-button @click="cancelClick">cancel</el-button>
							<el-button type="primary" @click="confirmClick">confirm</el-button>
						</div>
					</template>
				</el-drawer>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { getBooks, getBookCatalogs } from "@/api/modules/mybook";
import { BookStore } from "@/store/modules/book";

const bookStore = BookStore();
const title = "全部资源";
const activeName = ref("最新");
const tabs = [
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
let bookList = reactive([] as any);
const handleClick = (): void => {};
const pushBookList = (data: any): void => {
	if (data && data.data?.length) {
		bookList.push(...data.data);
	}
};
const load = async () => {
	bookStore.searchInfo.page++;
	let res = await getBooks(bookStore.searchInfo);
	pushBookList(res);
};
const drawer = ref(false);

const currentDetail = reactive({
	id: "",
	name: "",
	author: "",
	lastChapter: "",
	updateTime: ""
});
const drawerClose = (): void => {
	drawer.value = false;
};

const cancelClick = (): void => {
	drawer.value = false;
};
const confirmClick = (): void => {
	drawer.value = false;
};
// 异步详情
const showDetail = async (item: any) => {
	const { Name, Author, LastChapter, UpdateTime } = item;
	drawer.value = true;
	currentDetail.id = item.Id;
	currentDetail.name = Name;
	currentDetail.author = Author;
	currentDetail.lastChapter = LastChapter;
	currentDetail.updateTime = UpdateTime;
	let res = await getBookCatalogs(currentDetail.id);
	console.log(res);
};

onMounted(async () => {
	bookStore.searchInfo.page = 1;
	bookStore.searchInfo.key = " ";
	let res = await getBooks(bookStore.searchInfo);
	pushBookList(res);
});

const storeBookkey = computed(() => {
	return bookStore.searchInfo.key;
});

watch(
	storeBookkey,
	async () => {
		bookList.length = 0;
		bookStore.searchInfo.page = 1;
		let res = await getBooks(bookStore.searchInfo);
		pushBookList(res);
	},
	{ deep: true }
);
</script>
<style lang="scss">
.content {
	.el-tabs__nav-wrap::after {
		display: none;
	}
	.el-tabs__item {
		font-weight: 400;
		color: #757575;
	}
	.title {
		font-weight: 400;
	}
	.el-image {
		width: 100%;
		height: 100%;
	}
	.el-divider__text {
		color: #3c4248 !important;
	}
}
</style>
<style lang="scss" scoped>
@import "../index.scss";
</style>
