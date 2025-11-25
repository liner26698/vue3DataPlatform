<!-- 首页 -->
<template>
	<div class="home-box">
		<div class="home-content">
			<!-- 功能模块区域 -->
			<el-row :gutter="20" class="modules-container">
				<!-- 游戏统计模块 -->
				<el-col :xs="24" :sm="24" :md="24" :lg="24">
					<el-card class="module-card game-module">
						<template #header>
							<div class="card-header">
								<span class="title">🎮 游戏统计</span>
								<el-button type="primary" link @click="toggleGame" class="toggle-btn">{{
									gameVisible ? "收起" : "展开"
								}}</el-button>
							</div>
						</template>
						<div v-show="gameVisible" class="game-content">
							<!-- 搜索栏 -->
							<div class="search-wrapper">
								<el-form :model="searchForm" class="search-form">
									<el-row :gutter="16">
										<el-col :xs="24" :sm="12" :md="6">
											<el-form-item label="游戏名称">
												<el-input v-model="searchForm.name" placeholder="请输入游戏名称" clearable />
											</el-form-item>
										</el-col>
										<el-col :xs="24" :sm="12" :md="6">
											<el-form-item label="游戏平台">
												<el-select v-model="searchForm.targetgametype" placeholder="请选择游戏平台" class="w-full">
													<el-option v-for="item in platformOptions" :key="item.value" :label="item.label" :value="item.value" />
												</el-select>
											</el-form-item>
										</el-col>
										<el-col :xs="24" :sm="12" :md="6">
											<el-form-item label="游戏类型">
												<el-select v-model="searchForm.type" placeholder="请选择游戏类型" clearable class="w-full">
													<el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
												</el-select>
											</el-form-item>
										</el-col>
										<el-col :xs="24" :sm="12" :md="6">
											<el-form-item label=" ">
												<div class="button-group">
													<el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
													<el-button @click="resetSearch" class="reset-btn">重置</el-button>
												</div>
											</el-form-item>
										</el-col>
									</el-row>
								</el-form>
							</div>

							<!-- 游戏表格 -->
							<GameTable
								:data="tableData"
								:pagination="pagination"
								@page-change="handlePageChange"
								@size-change="handleSizeChange"
							/>
						</div>
					</el-card>
				</el-col>

				<!-- AI 工具模块 -->
				<el-col :xs="24" :sm="24" :md="24" :lg="24">
					<el-card class="module-card ai-module">
						<template #header>
							<div class="card-header">
								<span class="title">🚀 AI 工具库</span>
								<el-button type="primary" link @click="toggleAi" class="toggle-btn">{{ aiVisible ? "收起" : "展开" }}</el-button>
							</div>
						</template>
						<div v-show="aiVisible" class="ai-content">
							<AiList />
						</div>
					</el-card>
				</el-col>
			</el-row>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import GameTable from "@/components/GameTable.vue";
import AiList from "./components/aiList.vue";
import { getGameStatsApi } from "@/api/crawlerStats/game";

// 游戏模块
const searchForm = ref({
	name: "",
	targetgametype: "ps5",
	type: "",
	releaseDate: ""
});

const tableData = ref<any[]>([]);
const pagination = ref({
	current: 1,
	size: 10,
	total: 0
});

const platformOptions = [
	{ label: "PS5", value: "ps5" },
	{ label: "PC", value: "pc" },
	{ label: "Switch", value: "switch" }
];

const typeOptions = [
	{ label: "动作游戏", value: "动作游戏" },
	{ label: "策略游戏", value: "策略游戏" },
	{ label: "角色扮演", value: "角色扮演" },
	{ label: "模拟游戏", value: "模拟游戏" },
	{ label: "动作角色扮演", value: "动作角色扮演" },
	{ label: "冒险游戏", value: "冒险游戏" },
	{ label: "第三人称射击", value: "第三人称射击" },
	{ label: "第一人称射击", value: "第一人称射击" }
];

// 模块展开/收起状态
const gameVisible = ref(true);
const aiVisible = ref(true);

// 获取游戏数据
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

const handleSearch = () => {
	pagination.value.current = 1;
	fetchData();
};

const resetSearch = () => {
	searchForm.value = {
		name: "",
		targetgametype: "ps5",
		type: "",
		releaseDate: ""
	};
	handleSearch();
};

const handlePageChange = (page: number) => {
	pagination.value.current = page;
	fetchData();
};

const handleSizeChange = (size: number) => {
	pagination.value.size = size;
	fetchData();
};

const toggleGame = () => {
	gameVisible.value = !gameVisible.value;
};

const toggleAi = () => {
	aiVisible.value = !aiVisible.value;
};

onMounted(() => {
	fetchData();
});
</script>

<style lang="scss" scoped>
.home-box {
	height: 100%;
	overflow: auto;
	background: #f5f7fa;
}

.home-content {
	padding: 20px;
	max-width: 1400px;
	margin: 0 auto;
}

.modules-container {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.module-card {
	border-radius: 8px;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	:deep(.el-card__header) {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 16px 20px;
		border-bottom: none;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;

		.title {
			font-size: 18px;
			font-weight: bold;
			color: white;
		}

		.toggle-btn {
			color: white;
			font-weight: 500;
			transition: all 0.2s ease;

			&:hover {
				opacity: 0.8;
			}
		}

		:deep(.el-button) {
			color: white;
			font-weight: 500;
		}
	}
}

.game-module {
	:deep(.el-card__header) {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
}

.ai-module {
	:deep(.el-card__header) {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}
}

.game-content {
	.search-wrapper {
		margin-bottom: 24px;
		padding: 16px;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9ecf1 100%);
		border-radius: 8px;
		border-left: 4px solid #667eea;
	}

	.search-form {
		:deep(.el-form-item) {
			margin-bottom: 0;

			.el-form-item__label {
				font-weight: 600;
				color: #333;
				width: auto !important;
				padding-right: 12px !important;
			}

			.el-form-item__content {
				line-height: 1;
			}
		}

		:deep(.el-input),
		:deep(.el-select) {
			width: 100%;
		}

		:deep(.el-select__wrapper) {
			width: 100%;
		}
	}

	.button-group {
		display: flex;
		gap: 8px;
		width: 100%;

		.search-btn,
		.reset-btn {
			flex: 1;
			min-width: 80px;
		}

		:deep(.el-button) {
			padding: 8px 16px;
			font-size: 14px;
		}
	}
}

.ai-content {
	min-height: 500px;
}
</style>
