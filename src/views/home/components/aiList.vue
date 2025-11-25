<template>
	<div class="ai-list-container">
		<!-- 搜索栏 -->
		<div class="search-wrapper">
			<el-form :model="searchForm" class="search-form">
				<el-row :gutter="16">
					<el-col :xs="24" :sm="12" :md="8">
						<el-form-item label="分类">
							<el-select v-model="searchForm.category" placeholder="请选择分类" clearable class="w-full" @change="handleSearch">
								<el-option label="全部" value="所有" />
								<el-option label="热门" value="hot" />
								<el-option label="文本处理" value="文本处理" />
								<el-option label="图像生成" value="图像生成" />
								<el-option label="代码助手" value="代码助手" />
								<el-option label="内容创作" value="内容创作" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :xs="24" :sm="12" :md="10">
						<el-form-item label="搜索">
							<el-input v-model="searchForm.searchText" placeholder="输入工具名称或描述" clearable @keyup.enter="handleSearch" />
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

		<!-- AI 工具列表 -->
		<div v-if="aiList.length > 0" class="ai-grid">
			<div v-for="(item, index) in aiList" :key="index" class="ai-card">
				<a :href="item.url" target="_blank" class="card-link">
					<div class="card-header">
						<img :src="item.picture" :alt="item.name" class="card-icon" />
						<h3 class="card-title">{{ item.name }}</h3>
					</div>
					<p class="card-description">{{ item.description }}</p>
					<div class="card-category">{{ item.category }}</div>
				</a>
			</div>
		</div>

		<!-- 空状态 -->
		<el-empty v-else description="暂无数据，换个条件试试" />

		<!-- 分页 -->
		<div v-if="aiList.length > 0 && pagination.total >= pagination.size" class="pagination-container">
			<el-pagination
				v-model:current-page="pagination.current"
				v-model:page-size="pagination.size"
				:page-sizes="[10, 20, 30, 40]"
				:total="pagination.total"
				layout="total, sizes, prev, pager, next, jumper"
				@current-change="handlePageChange"
				@size-change="handleSizeChange"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAiListApi } from "@/api/book/modules/ai/index";

interface AiItem {
	category: string;
	description: string;
	name: string;
	picture: string;
	url: string;
}

interface SearchForm {
	category: string;
	searchText: string;
}

const searchForm = ref<SearchForm>({
	category: "所有",
	searchText: ""
});

const aiList = ref<AiItem[]>([]);
const pagination = ref({
	current: 1,
	size: 20,
	total: 0
});

// 获取 AI 列表数据
const fetchAiList = async () => {
	try {
		const params = {
			current: pagination.value.current,
			pageSize: pagination.value.size,
			category: searchForm.value.category === "所有" ? "" : searchForm.value.category,
			searchText: searchForm.value.searchText
		};

		const res: any = await getAiListApi(params);
		if (res && res.data) {
			aiList.value = res.data.records;
			// 清理 URL 中的反引号
			aiList.value.forEach((item: AiItem) => {
				item.url = item.url.replace(/`/g, "");
			});
			pagination.value.total = res.data.total;
		}
	} catch (error) {
		console.error("获取 AI 列表失败:", error);
	}
};

// 搜索
const handleSearch = () => {
	pagination.value.current = 1;
	fetchAiList();
};

// 重置搜索
const resetSearch = () => {
	searchForm.value = {
		category: "所有",
		searchText: ""
	};
	handleSearch();
};

// 页码改变
const handlePageChange = (page: number) => {
	pagination.value.current = page;
	fetchAiList();
};

// 每页数量改变
const handleSizeChange = (size: number) => {
	pagination.value.size = size;
	pagination.value.current = 1;
	fetchAiList();
};

// 初始化加载
onMounted(() => {
	fetchAiList();
});
</script>

<style scoped lang="scss">
.ai-list-container {
	display: flex;
	flex-direction: column;
	gap: 16px;

	.search-wrapper {
		padding: 16px;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9ecf1 100%);
		border-radius: 8px;
		border-left: 4px solid #f093fb;
	}

	.search-form {
		:deep(.el-row) {
			width: 100%;
		}

		:deep(.el-col) {
			width: 100%;
		}

		:deep(.el-form-item) {
			margin-bottom: 0;
			width: 100%;

			.el-form-item__label {
				font-weight: 600;
				color: #333;
				width: auto !important;
				padding-right: 12px !important;
			}

			.el-form-item__content {
				line-height: 1;
				width: 100% !important;
				flex: 1;
			}
		}

		:deep(.el-input),
		:deep(.el-select) {
			width: 100% !important;
			flex: 1;
		}

		:deep(.el-input__wrapper),
		:deep(.el-select__wrapper) {
			width: 100% !important;
			box-sizing: border-box;
		}

		:deep(.el-input__inner) {
			width: 100% !important;
		}

		:deep(.el-select__tags) {
			width: 100%;
		}

		:deep(.el-select__suffix) {
			flex-shrink: 0;
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

	.ai-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 16px;

		.ai-card {
			border-radius: 8px;
			overflow: hidden;
			transition: all 0.3s ease;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

			&:hover {
				box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
				transform: translateY(-4px);
			}

			.card-link {
				display: flex;
				flex-direction: column;
				height: 100%;
				padding: 16px;
				background: white;
				text-decoration: none;
				color: inherit;
				border-radius: 8px;

				&:hover {
					background: #f9f9f9;
				}
			}

			.card-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 12px;

				.card-icon {
					width: 48px;
					height: 48px;
					border-radius: 6px;
					object-fit: cover;
					flex-shrink: 0;
					background: #f0f0f0;
				}

				.card-title {
					margin: 0;
					font-size: 14px;
					font-weight: 600;
					line-height: 1.4;
					color: #333;
					word-break: break-word;
				}
			}

			.card-description {
				margin: 0 0 8px 0;
				font-size: 12px;
				color: #666;
				line-height: 1.5;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				flex: 1;
			}

			.card-category {
				font-size: 11px;
				color: #999;
				background: #f0f0f0;
				padding: 4px 8px;
				border-radius: 3px;
				width: fit-content;
			}
		}
	}

	.pagination-container {
		display: flex;
		justify-content: center;
		padding: 20px;
		background: #f5f5f5;
		border-radius: 4px;
	}
}
</style>
