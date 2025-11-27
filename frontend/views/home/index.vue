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

				<!-- 热门话题模块 -->
				<el-col :xs="24" :sm="24" :md="24" :lg="24">
					<el-card class="module-card topics-module">
						<template #header>
							<div class="card-header">
								<span class="title">🔥 热门话题</span>
								<el-button type="primary" link @click="toggleTopics" class="toggle-btn">{{
									topicsVisible ? "收起" : "展开"
								}}</el-button>
							</div>
						</template>
						<div v-show="topicsVisible" class="topics-content">
							<HotTopics />
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
import HotTopics from "./components/hotTopics.vue";
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
const topicsVisible = ref(true);

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

const toggleTopics = () => {
	topicsVisible.value = !topicsVisible.value;
};

onMounted(() => {
	fetchData();
});
</script>

<style lang="scss" scoped>
$primary-color: #409eff;
$border-color: #e4e7eb;
$text-color: #606266;
$game-gradient-start: #667eea;
$game-gradient-end: #764ba2;
$ai-gradient-start: #f093fb;
$ai-gradient-end: #f5576c;

.home-box {
	min-height: 100vh;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	padding: 30px 20px;

	.home-content {
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}
}

.modules-container {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;

	:deep(.el-col) {
		width: 100%;
		animation: slideUp 0.6s ease-out both;

		&:nth-child(1) {
			animation-delay: 0.1s;
		}

		&:nth-child(2) {
			animation-delay: 0.3s;
		}

		&:nth-child(3) {
			animation-delay: 0.5s;
		}
	}
}

.module-card {
	width: 100%;
	border: none;
	border-radius: 12px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
	overflow: hidden;

	&:hover {
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px);
	}

	:deep(.el-card__header) {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		padding: 18px 20px;
	}

	:deep(.el-card__body) {
		padding: 24px;
		background-color: #ffffff;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;

		.title {
			font-size: 18px;
			font-weight: 600;
			background-size: 100%;
			transition: all 0.3s ease;
		}

		.toggle-btn {
			padding: 0 8px;
			font-size: 13px;
			color: #409eff;
			transition: all 0.3s ease;

			&:hover {
				color: #66b1ff;
				transform: scale(1.05);
			}
		}
	}
}

.game-module {
	:deep(.el-card__header) {
		border-left: 4px solid $game-gradient-start;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
	}

	.card-header {
		.title {
			background: linear-gradient(135deg, $game-gradient-start 0%, $game-gradient-end 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.game-content {
		width: 100%;
		display: flex;
		flex-direction: column;
		min-height: 500px;

		:deep(.pro-table) {
			flex: 1;
			display: flex;
			flex-direction: column;
		}

		:deep(.el-table) {
			flex: 1;
		}

		:deep(.el-pagination) {
			padding: 16px 0;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-top: auto;
		}
	}
}

.ai-module {
	:deep(.el-card__header) {
		border-left: 4px solid $ai-gradient-start;
		background: linear-gradient(135deg, rgba(240, 147, 251, 0.05) 0%, rgba(245, 87, 108, 0.05) 100%);
	}

	.card-header {
		.title {
			background: linear-gradient(135deg, $ai-gradient-start 0%, $ai-gradient-end 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.ai-content {
		width: 100%;
	}
}

.topics-module {
	:deep(.el-card__header) {
		border-left: 4px solid #ff6b6b;
		background: linear-gradient(135deg, rgba(255, 107, 107, 0.05) 0%, rgba(255, 71, 87, 0.05) 100%);
	}

	.card-header {
		.title {
			background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.topics-content {
		width: 100%;
		min-height: 300px;
	}
}

.search-wrapper {
	margin-bottom: 20px;
	width: 100%;
	padding: 16px;
	background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%);
	border-radius: 10px;
	border-left: 3px solid $game-gradient-start;

	.search-form {
		width: 100%;

		:deep(.el-form-item) {
			width: 100% !important;
			margin-bottom: 12px;

			&:last-child {
				margin-bottom: 0;
			}

			.el-form-item__label {
				font-weight: 500;
				color: #303133;
				font-size: 13px;
			}

			.el-form-item__content {
				width: 100% !important;
				flex: 1 !important;
				box-sizing: border-box;

				.el-input,
				.el-select {
					width: 100% !important;
				}
			}
		}

		:deep(.el-row) {
			width: 100% !important;
		}

		:deep(.el-col) {
			width: 100% !important;
		}

		:deep(.el-input__wrapper),
		:deep(.el-select__wrapper) {
			background-color: rgba(255, 255, 255, 0.9);
			border: 1px solid rgba(102, 126, 234, 0.2);
			border-radius: 6px;
			transition: all 0.3s ease;

			&:hover {
				border-color: rgba(102, 126, 234, 0.4);
				box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
			}

			&:focus-within {
				border-color: $game-gradient-start;
				box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
			}
		}
	}
}

.button-group {
	display: flex;
	gap: 10px;
	width: 100%;

	.search-btn,
	.reset-btn {
		flex: 1;
		border-radius: 6px;
		transition: all 0.3s ease;
		font-weight: 500;

		&:hover {
			transform: translateY(-1px);
		}
	}

	.search-btn {
		background: linear-gradient(135deg, $game-gradient-start 0%, $game-gradient-end 100%);
		border: none;
		color: white;

		&:hover {
			box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
		}
	}

	.reset-btn {
		background-color: rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.1);
		color: #606266;

		&:hover {
			background-color: rgba(0, 0, 0, 0.08);
			border-color: rgba(0, 0, 0, 0.15);
		}
	}
}

// 进入动画
@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(30px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 响应式设计
@media (max-width: 768px) {
	.home-box {
		padding: 20px 12px;
	}

	.modules-container {
		gap: 16px;
	}

	.module-card {
		:deep(.el-card__header) {
			padding: 14px 16px;
		}

		:deep(.el-card__body) {
			padding: 16px;
		}

		.card-header {
			flex-direction: column;
			gap: 12px;
			align-items: flex-start;

			.toggle-btn {
				align-self: flex-end;
			}

			.title {
				font-size: 16px;
			}
		}
	}

	.search-wrapper {
		margin-bottom: 16px;
		padding: 12px;
		border-radius: 8px;
	}

	.button-group {
		gap: 8px;

		.search-btn,
		.reset-btn {
			font-size: 12px;
			padding: 8px 12px;
		}
	}
}

@media (max-width: 480px) {
	.home-box {
		padding: 12px 8px;
	}

	.modules-container {
		gap: 12px;
	}

	.module-card {
		border-radius: 10px;

		:deep(.el-card__header) {
			padding: 12px 14px;
		}

		:deep(.el-card__body) {
			padding: 12px;
		}

		.card-header {
			.title {
				font-size: 14px;
			}

			.toggle-btn {
				font-size: 12px;
			}
		}
	}

	.search-wrapper {
		margin-bottom: 12px;
		padding: 10px;
		border-radius: 6px;
	}

	.button-group {
		gap: 6px;

		.search-btn,
		.reset-btn {
			font-size: 11px;
			padding: 6px 10px;
		}
	}
}
</style>
