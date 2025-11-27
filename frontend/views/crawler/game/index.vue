<template>
	<div class="content-box">
		<keep-alive>
			<el-form :inline="true" :model="formInline" class="demo-form-inline">
				<el-form-item label="类型选择">
					<el-select v-model="formInline.category" placeholder="类型选择" clearable>
						<el-option label="PC" value="PC" />
						<el-option label="ps5" value="ps5" />
					</el-select>
				</el-form-item>
				<el-form-item label="请选择日期">
					<el-date-picker v-model="formInline.month" type="date" clearable value-format="YYYY-MM-DD" placeholder="请选择日期" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="crawling">爬取</el-button>
				</el-form-item>
			</el-form>
		</keep-alive>
	</div>
</template>

<script setup lang="ts" name="crawlerGame">
import { reactive, onMounted } from "vue";
import { changeGameCrawlerApi } from "@/api/modules/crawler";

const formInline = reactive({
	category: "",
	month: ""
});

// 爬取功能
const crawling = async () => {
	// month格式为YYYY-MM-DD, 需要修改为YYYYMM
	formInline.month = formInline.month.replace(/-/g, "").slice(0, 6);
	let res: any = await changeGameCrawlerApi(formInline);
	if (res) {
		console.log(res);
	}
};

const fn1 = async () => {
	await fn2();
	console.log("3 :>> ", 3);
};

const fn2 = async () => {
	setTimeout(() => {
		console.log("2 :>> ", 2);
	}, 3000);
};
onMounted(() => {
	console.log("1 :>> ", 1);
	fn1();
});
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
