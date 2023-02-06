<template>
	<div class="chapter w-full h-full outline-hidden">
		<div class="h-full">
			<el-tabs class="h-full overflow-hidden pb-10" type="border-card" @tab-change="tabPaneChange">
				<el-tab-pane :label="item.name" v-for="(item, index) in pieceList" :key="index">
					<template v-if="item && item.list.length != 0">
						<div
							class="list w-full h-full flex justify-center items-center leading-10 cursor-pointer hover:text-blue-500 hover:text-c50"
							v-for="(listItem, listIndex) in item.list"
							:key="listIndex"
							@click="getChapterContent(listItem)"
						>
							{{ listItem.name }}
						</div>
						<div class="h-20"></div>
					</template>
				</el-tab-pane>
			</el-tabs>
		</div>
		<div class="search-main">
			<div class="flex items-center mt-6">
				<p class="w-44 text-sm text-left">章节搜索:</p>
				<el-select
					v-model="searchValue"
					filterable
					remote
					clearable
					:loading="loading"
					no-match-text="暂无数据..."
					no-data-text="暂无数据..."
					placeholder="试试输入数字103,则会搜索第一百零三节"
					:remote-method="remoteMethod"
					@clear="remoteClear"
				>
					<el-option v-for="item in searchList" :label="item.name" :value="item.id" :key="item.id" />
				</el-select>
			</div>

			<p class="text-right text-xs mt-2">
				当前共有: <span class="text-purple-600 text-c50 text-sm p-1">{{ searchTotal }} </span>条数据.
			</p>
		</div>
	</div>
</template>

<script setup lang="ts" name="chapterList">
import { ElNotification } from "element-plus";
import { getBookCatalogs } from "@/api/modules/mybook";
import { getBookContent } from "@/api/modules/mybook";

interface chapterListProps {
	id: string;
}

const props = withDefaults(defineProps<chapterListProps>(), {
	id: ""
});
let pieceList = ref([
	{
		name: "",
		list: []
	}
]);
let currentList = ref([
	{
		name: "",
		id: ""
	}
]);
let searchValue = ref("");
let searchList = ref([
	{
		name: "",
		id: ""
	}
]);
const searchTotal = computed(() => currentList.value.length);
let loading = ref(false);

// 获取篇章列表
const getPieceList = async () => {
	let data: any = null;
	data = await getBookCatalogs(props.id);
	if (data) {
		data = JSON.parse(data.replace(/},]/g, "}]"));
		if (data.info === "success") {
			pieceList.value = data.data.list;
			tabPaneChange(0);
		}
	}
};

const tabPaneChange = (tab: number) => {
	currentList.value = pieceList.value[tab].list;
	searchList.value = currentList.value;
};

const getChapterContent = async (item: any) => {
	const { data } = await getBookContent(props.id, item.id);
	if (data?.content) {
		console.log("data :>> ", data.content);
	} else {
		ElNotification({
			title: "提示",
			message: "获取书籍内容失败！",
			type: "error"
		});
	}
};

const numberToChinese = (num: number | string) => {
	let chinese = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
	let unit = ["", "十", "百", "千", "万"];
	let str = "";
	let numString = num.toString();
	for (let i = 0; i < numString.length; i++) {
		let n = parseInt(numString[i]);
		// 可能输入汉字直接查询
		if (Number.isNaN(n)) {
			return numString;
		}
		if (n !== 0) {
			str += chinese[n] + unit[numString.length - 1 - i];
		} else {
			if (str.endsWith(chinese[0])) {
				continue;
			}
			str += chinese[0];
		}
	}
	loading.value = false;
	// 章节搜索参数接收为数字,比如: 103 => 第一百零三
	return str
		.replace(/零(十|百|千|万)/g, "零")
		.replace(/(零)+/g, "零")
		.replace(/零$/, "");
};

const remoteMethod = (query: string) => {
	if (query !== "") {
		loading.value = true;
		let searchVal = numberToChinese(query);
		let _currentList = currentList.value.filter((item: any) => item.name.indexOf(searchVal) !== -1);
		searchList.value = _currentList;
	} else {
		loading.value = false;
		searchList.value = currentList.value;
	}
};

const remoteClear = () => {
	searchList.value = currentList.value;
};

onMounted(() => {
	getPieceList();
});
</script>

<style lang="scss">
.chapter .el-tabs__content {
	height: 100%;
	overflow: scroll;
}
</style>
