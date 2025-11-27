<template>
	<div class="game-stats-container">
		<!-- 搜索栏 -->
		<el-card class="search-card">
			<el-form :model="searchForm" label-width="100px" :rules="rules" ref="searchFormRef" @keyup.enter="handleSearch">
				<el-row :gutter="20">
					<el-col :span="6">
						<el-form-item label="游戏名称" prop="name">
							<el-input v-model="searchForm.name" placeholder="请输入游戏名称" />
						</el-form-item>
					</el-col>
					<el-col :span="6">
						<el-form-item label="游戏平台" prop="targetgametype">
							<el-select v-model="searchForm.targetgametype" placeholder="请选择游戏平台">
								<el-option
									v-for="targetgametype in platformOptions"
									:key="targetgametype.value"
									:label="targetgametype.label"
									:value="targetgametype.value"
								/>
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="6">
						<el-form-item label="游戏类型" prop="type">
							<el-select v-model="searchForm.type" placeholder="请选择游戏类型">
								<el-option v-for="type in typeOptions" :key="type.value" :label="type.label" :value="type.value" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="6">
						<el-form-item label="发行日期" prop="releaseDate">
							<el-date-picker
								v-model="searchForm.releaseDate"
								type="date"
								placeholder="选择日期"
								format="YYYY-MM-DD"
								value-format="YYYY-MM-DD"
								:picker-options="pickerOptions"
							/>
						</el-form-item>
					</el-col>
				</el-row>
				<el-row>
					<el-col :span="24" class="text-right">
						<el-button type="primary" @click="handleSearch">搜索</el-button>
						<el-button @click="resetSearch">重置</el-button>
					</el-col>
				</el-row>
			</el-form>
		</el-card>

		<!-- 表格展示 -->
		<el-card class="table-card">
			<GameTable :data="tableData" :pagination="pagination" @page-change="handlePageChange" @size-change="handleSizeChange" />
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getGameStatsApi } from "@/api/crawlerStats/game";
import type { FormInstance, FormRules } from "element-plus";
import GameTable from "@/components/GameTable.vue";

// 搜索表单
const searchForm = ref({
	name: "",
	targetgametype: "ps5",
	type: "",
	releaseDate: ""
});

// 表单验证规则
const rules = ref<FormRules>({
	targetgametype: [{ required: true, message: "请选择游戏平台", trigger: "blur" }]
});

// 表格数据
const tableData = ref<any[]>([]);

// 分页配置
const pagination = ref({
	current: 1,
	size: 20,
	total: 0
});

// 下拉选项
const platformOptions = [
	{ label: "PS5", value: "ps5" },
	{ label: "PC", value: "pc" },
	{ label: "Switch", value: "switch" }
];

const typeOptions = [
	// 动作游戏 策略游戏 角色扮演 模拟游戏 动作角色扮演 冒险游戏 第三人称射击 第一人称射击
	{ label: "动作游戏", value: "动作游戏" },
	{ label: "策略游戏", value: "策略游戏" },
	{ label: "角色扮演", value: "角色扮演" },
	{ label: "模拟游戏", value: "模拟游戏" },
	{ label: "动作角色扮演", value: "动作角色扮演" },
	{ label: "冒险游戏", value: "冒险游戏" },
	{ label: "第三人称射击", value: "第三人称射击" },
	{ label: "第一人称射击", value: "第一人称射击" }
];

// 日期选择器选项
const pickerOptions = {
	disabledDate(time: any) {
		return time.getTime() > Date.now();
	},
	shortcuts: [
		{
			text: "本月",
			onClick(picker: any) {
				const end = new Date();
				const start = new Date();
				start.setDate(1);
				picker.$emit("pick", [start, end]);
			}
		},
		{
			text: "上个月",
			onClick(picker: any) {
				const end = new Date();
				end.setDate(0);
				const start = new Date();
				start.setDate(1);
				start.setMonth(start.getMonth() - 1);
				picker.$emit("pick", [start, end]);
			}
		}
	]
};

// 获取数据
const fetchData = async () => {
	const params = {
		...searchForm.value,
		page: pagination.value.current,
		size: pagination.value.size
	};
	try {
		const res = await getGameStatsApi(params);
		if (res) {
			tableData.value = res.data as any[];
			pagination.value.total = res.total;
		}
	} catch (error) {
		console.error("获取数据失败:", error);
	}
};

// 搜索表单引用
const searchFormRef = ref<FormInstance>();

// 搜索
const handleSearch = async () => {
	await searchFormRef.value?.validate(valid => {
		if (valid) {
			pagination.value.current = 1;
			fetchData();
		} else {
			console.log("error submit!");
		}
	});
};

// 重置搜索
const resetSearch = () => {
	searchForm.value = {
		name: "",
		targetgametype: "ps5",
		type: "",
		releaseDate: ""
	};
	handleSearch();
};

// 分页切换
const handlePageChange = (page: number) => {
	pagination.value.current = page;
	fetchData();
};

// 页数展示多选
const handleSizeChange = (size: number) => {
	pagination.value.size = size;
	fetchData();
};

onMounted(() => {
	// 初始化时清空搜索表单，并手动触发搜索
	resetSearch();
});
</script>

<style scoped>
.game-stats-container {
	padding: 20px;
	background-color: #f5f5f5;
	border-radius: 8px;
}

.search-card {
	margin-bottom: 20px;
	background-color: #ffffff;
	border-radius: 8px;
}

.table-card {
	margin-top: 20px;
	background-color: #ffffff;
	border-radius: 8px;
}

.pagination {
	margin-top: 20px;
	text-align: right;
}
</style>
