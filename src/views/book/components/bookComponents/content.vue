<template>
	<!--  content -->
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
						<el-image :src="bookItem.Img" fit="cover" class="rounded-lg">
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
							<b>更新时间:{{ format(currentDetail.updateTime) }}</b>
							<!-- <b>最新章节:{{ currentDetail.lastChapter }}</b> -->
						</p>
					</div>
				</template>
				<template #default>
					<div class="directory-main w-full h-5/6 flex flex-col">
						<div class="tabs flex justify-center">
							<el-tabs v-model="directoryName" @tab-click="directoryClick">
								<el-tab-pane
									:label="tabItem.label"
									:name="tabItem.label"
									v-for="(tabItem, tabIndex) in directoryTabs"
									:key="tabIndex"
								>
								</el-tab-pane>
							</el-tabs>
						</div>

						<!-- 简介 | 最新章节 | 相关推荐 -->
						<workInformation
							v-if="directoryName == '作品信息'"
							@relatedimg-change="relatedimgChange"
							:currentDetail="currentDetail"
							:relatedList="relatedList"
							:otherInfo="otherInfo"
						></workInformation>

						<!-- 章节列表 -->
						<chapterList v-else :id="currentDetail.id"></chapterList>
					</div>
				</template>
				<!-- <template #footer>
						<div style="flex: auto">
							<el-button @click="cancelClick">cancel</el-button>
							<el-button type="primary" @click="confirmClick">confirm</el-button>
						</div>
					</template> -->
			</el-drawer>
		</div>
	</div>
</template>

<script setup lang="ts">
import { getBooks } from "@/api/book/modules/mybook";
import { BookStore } from "@/store/modules/book";
import workInformation from "../workInformation.vue";
import chapterList from "../chapterList.vue";

const bookStore = BookStore();
const title = ref("");
let directoryName = ref("作品信息");

const directoryTabs = [
	{
		label: "作品信息",
		value: "bookInfo"
	},
	{
		label: "目录",
		value: "directory"
	}
];
let bookList = reactive([] as any);
let relatedList = reactive([] as any);
let otherInfo = reactive({
	Name: "",
	Author: "",
	Desc: ""
});

const directoryClick = (tab: any): void => {
	if (tab.name === "目录") {
		directoryName.value = tab.value;
	}
};
// 搜索
const pushBookList = (data: any): void => {
	if (data?.data?.length) {
		bookList.push(...data.data);
	}
};
// 时间去除时分秒
const format = (date: string): string => {
	const d = new Date(date);
	const year = d.getFullYear();
	const month = d.getMonth() + 1;
	const day = d.getDate();
	return `${year}-${month}-${day}`;
};

const load = async () => {
	bookStore.searchInfo.page++;
	let res = await getBooks(bookStore.searchInfo, false);
	pushBookList(res);
};
const drawer = ref(false);

const currentDetail = reactive({
	id: "",
	name: "",
	author: "",
	lastChapter: "",
	updateTime: "",
	desc: "",
	type: "",
	status: ""
});
const drawerClose = (): void => {
	drawer.value = false;
};

const showDetail = async (item: any) => {
	drawer.value = true;
	directoryName.value = "作品信息";
	Object.assign(currentDetail, {
		id: item.Id,
		name: item.Name,
		author: item.Author,
		lastChapter: item.LastChapter,
		updateTime: item.UpdateTime,
		desc: item.Desc,
		type: item.CName,
		status: item.BookStatus
	});
	getRelatedList();
};
// 获取相关书籍列表
const getRelatedList = async () => {
	relatedList.length = 0;
	let res: any;
	res = await getBooks(
		{
			key: currentDetail.name,
			page: 1,
			siteid: "app2"
		},
		true
	);
	if (res?.data?.length) {
		relatedList.push(...res.data.slice(1, 6));
		relatedimgChange(0);
	}
};

// 走马灯切换显示文书信息
const relatedimgChange = (index: number) => {
	if (relatedList[index] === undefined) return;
	const { Name, Author, Desc } = relatedList[index];
	otherInfo.Name = Name;
	otherInfo.Author = Author;
	otherInfo.Desc = Desc;
};

onMounted(async () => {
	bookStore.searchInfo.page = 1;
	bookStore.searchInfo.key = " ";
	title.value = bookStore.leftTabLabel;
	let res = await getBooks(bookStore.searchInfo, false);
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
		let res = await getBooks(bookStore.searchInfo, false);
		pushBookList(res);
	},
	{ deep: true }
);

watch(
	() => bookStore.leftTabLabel,
	() => {
		title.value = bookStore.leftTabLabel;
	}
);
</script>
<style lang="scss" scoped>
@import "../../index.scss";

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
