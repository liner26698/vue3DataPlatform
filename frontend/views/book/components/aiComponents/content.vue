<template>
	<div class="content-main overflow-hidden w-full h-full flex-auto">
		<div class="list-box" v-show="list.length != 0">
			<el-row :gutter="20">
				<el-col :span="6" v-for="(item, index) in list" :key="index">
					<div class="grid-content ep-bg-purple">
						<div class="list-items">
							<div class="part-item-website f-item p-item">
								<a :href="item.url" target="_blank" class="f-box">
									<h3 class="item-title">
										<i class="item-ico"
											><i class="thumb thumb-img"><img :src="item.picture" :alt="item.name" /></i
										></i>
										<strong class="title"> {{ item.name }} </strong>
									</h3>
									<div class="item-desc">{{ item.description }}</div>
								</a>
							</div>
						</div>
					</div>
				</el-col>
			</el-row>
			<div class="pagination-box flex items-center justify-center w-full mt-8" v-if="pageable.total >= params.pageSize">
				<span>{{ pageable.total }} 条</span>
				<el-pagination
					background
					layout="prev, pager, next"
					:currentPage="params.current"
					:page-size="params.pageSize"
					:total="pageable.total"
					@current-change="handleCurrentChange"
				/>
			</div>
		</div>
		<el-empty v-show="list.length == 0" description="换个搜索条件试试吧" style="width: 100%; height: 100%" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getAiListApi } from "@/api/book/modules/ai/index";
import { BookStore } from "@/store/modules/book";
interface ListProps {
	category: string;
	description: string;
	name: string;
	picture: string;
	url: string;
}
interface paramsProps {
	searchText?: string; // 搜索内容
	category?: string; // 分类
	current: number; // 当前页
	pageSize: number; // 每页数量
}

const bookStore = BookStore();
const storeBookkey = computed(() => {
	return bookStore.searchInfo.key;
});
const leftTabLabel = computed(() => {
	return bookStore.leftTabLabel;
});
let list = ref<ListProps[]>([]);
let pageable: any = ref({
	total: 0
});
let params = ref<paramsProps>({
	category: bookStore.leftTabLabel,
	current: 1,
	pageSize: 20
});

onMounted(() => {
	getList();
});

watch(
	storeBookkey,
	async () => {
		if (!bookStore.searchInfo.key || bookStore.searchInfo.key.trim() === "") {
			getList();
		}
		list.value = [];
		params.value.current = 1;
		getList();
	},
	{ deep: true }
);
watch(
	leftTabLabel,
	async () => {
		params.value.category = bookStore.leftTabLabel;
		params.value.current = 1;
		getList();
	},
	{ deep: true }
);

const getList = async () => {
	if (storeBookkey.value && storeBookkey.value.trim() !== "") {
		params.value.searchText = storeBookkey.value;
	} else {
		delete params.value.searchText;
	}
	let res: any = await getAiListApi(params.value);
	if (res) {
		list.value = res.data.records;
		list.value.forEach((item: ListProps) => {
			item.url = item.url.replace(/`/g, "");
		});
		pageable.value.total = res.data.total;
	}
};

const handleCurrentChange = (val: number) => {
	params.value.current = val;
	getList();
};
</script>

<style lang="scss" scoped>
@import "../../index.scss";
.el-row {
	margin-bottom: 20px;
}
.el-row:last-child {
	margin-bottom: 0;
}
.el-col {
	border-radius: 4px;
}
</style>
