<template>
	<div class="crawler-aiTools-container">
		<!-- 筛选和搜索 -->
		<el-card class="filter-card">
			<el-row :gutter="20">
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="工具分类">
						<el-select v-model="selectedCategory" @change="handleCategoryChange">
							<el-option label="全部分类" value="" />
							<el-option label="生产力工具" value="productivity" />
							<el-option label="创意工具" value="creative" />
							<el-option label="开发工具" value="development" />
							<el-option label="学习工具" value="learning" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="排序方式">
						<el-select v-model="sortBy" @change="handleSort">
							<el-option label="热度最高" value="popularity_desc" />
							<el-option label="评分最高" value="rating_desc" />
							<el-option label="最近添加" value="added_desc" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="搜索">
						<el-input v-model="searchKeyword" placeholder="搜索工具名称" @input="handleSearch" />
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6" class="text-right">
					<el-button type="primary" @click="refreshTools">刷新数据</el-button>
				</el-col>
			</el-row>
		</el-card>

		<!-- 统计卡片 -->
		<el-row :gutter="20" class="stats-row">
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-card">
					<div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">📊</div>
					<div class="stat-content">
						<div class="stat-value">{{ allTools.length }}</div>
						<div class="stat-label">总工具数</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-card">
					<div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">⭐</div>
					<div class="stat-content">
						<div class="stat-value">{{ avgRating }}</div>
						<div class="stat-label">平均评分</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-card">
					<div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">👥</div>
					<div class="stat-content">
						<div class="stat-value">{{ totalUsers }}</div>
						<div class="stat-label">总用户数</div>
					</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-card">
					<div class="stat-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7)">🔥</div>
					<div class="stat-content">
						<div class="stat-value">{{ hotToolsCount }}</div>
						<div class="stat-label">热门工具</div>
					</div>
				</div>
			</el-col>
		</el-row>

		<!-- 工具列表 -->
		<div class="tools-wrapper">
			<el-empty v-if="filteredTools.length === 0" description="暂无数据" />

			<transition-group name="list" tag="div" class="tools-grid">
				<div
					v-for="(tool, index) in filteredTools"
					:key="tool.id"
					class="tool-item"
					:style="{ animationDelay: `${index * 50}ms` }"
				>
					<!-- 工具卡片 -->
					<div class="tool-card">
						<!-- 头部 -->
						<div class="tool-header">
							<div class="tool-icon">
								{{ tool.icon }}
							</div>
							<div class="tool-header-info">
								<h3 class="tool-title">{{ tool.name }}</h3>
								<div class="tool-rating">
									<el-rate v-model="tool.rating" disabled size="small" />
									<span class="rating-text">({{ tool.rating }})</span>
								</div>
							</div>
						</div>

						<!-- 分类标签 -->
						<div class="tool-category-tag">
							{{ getCategoryName(tool.category) }}
						</div>

						<!-- 描述 -->
						<p class="tool-description">{{ tool.description }}</p>

						<!-- 特性标签 -->
						<div class="tool-features">
							<span v-for="feature in tool.features" :key="feature" class="feature-tag">
								{{ feature }}
							</span>
						</div>

						<!-- 底部信息 -->
						<div class="tool-footer">
							<el-button type="primary" link size="small" @click="visitTool(tool)"> 访问 → </el-button>
						</div>
					</div>
				</div>
			</transition-group>
		</div>

		<!-- 分页 -->
		<div class="pagination-wrapper">
			<el-pagination
				v-model:current-page="currentPage"
				v-model:page-size="pageSize"
				:page-sizes="[12, 24, 36]"
				:total="totalCount"
				layout="total, sizes, prev, pager, next, jumper"
				@size-change="handleSizeChange"
				@current-change="handlePageChange"
			/>
		</div>
	</div>
</template>

<script setup lang="ts" name="crawlerAiTools">
import { ref, computed, onMounted } from "vue";

interface AiTool {
	id: string;
	name: string;
	description: string;
	category: string;
	icon: string;
	rating: number;
	users: number;
	popularity: number;
	features: string[];
	url?: string;
	isPaid?: boolean;
}

// 数据
const allTools = ref<AiTool[]>([]);
const selectedCategory = ref("");
const sortBy = ref("popularity_desc");
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = ref(12);

// 分类配置
const categoryConfig: Record<string, string> = {
	productivity: "生产力工具",
	creative: "创意工具",
	development: "开发工具",
	learning: "学习工具"
};

const getCategoryName = (category: string) => {
	return categoryConfig[category] || category;
};

// 计算统计数据
const avgRating = computed(() => {
	if (allTools.value.length === 0) return "0";
	const sum = allTools.value.reduce((acc, tool) => acc + tool.rating, 0);
	return (sum / allTools.value.length).toFixed(1);
});

const totalUsers = computed(() => {
	const total = allTools.value.reduce((acc, tool) => acc + tool.users, 0);
	if (total >= 1000000) {
		return (total / 1000000).toFixed(1) + "M";
	} else if (total >= 1000) {
		return (total / 1000).toFixed(1) + "K";
	}
	return total.toString();
});

const hotToolsCount = computed(() => {
	return allTools.value.filter(tool => tool.popularity > 8000).length;
});

// 过滤和排序
const filteredTools = computed(() => {
	let result = allTools.value;

	// 分类筛选
	if (selectedCategory.value) {
		result = result.filter(tool => tool.category === selectedCategory.value);
	}

	// 关键词搜索
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase();
		result = result.filter(tool => tool.name.toLowerCase().includes(keyword) || tool.description.toLowerCase().includes(keyword));
	}

	// 排序
	if (sortBy.value === "popularity_desc") {
		result.sort((a, b) => b.popularity - a.popularity);
	} else if (sortBy.value === "rating_desc") {
		result.sort((a, b) => b.rating - a.rating);
	}

	// 分页
	const start = (currentPage.value - 1) * pageSize.value;
	return result.slice(start, start + pageSize.value);
});

// 总数
const totalCount = computed(() => {
	let result = allTools.value;
	if (selectedCategory.value) {
		result = result.filter(tool => tool.category === selectedCategory.value);
	}
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase();
		result = result.filter(tool => tool.name.toLowerCase().includes(keyword) || tool.description.toLowerCase().includes(keyword));
	}
	return result.length;
});

// 事件处理
const handleCategoryChange = () => {
	currentPage.value = 1;
};

const handleSort = () => {
	currentPage.value = 1;
};

const handleSearch = () => {
	currentPage.value = 1;
};

const handlePageChange = () => {
	window.scrollTo({ top: 0, behavior: "smooth" });
};

const handleSizeChange = () => {
	currentPage.value = 1;
};

const refreshTools = async () => {
	// 可以调用API刷新数据
	console.log("刷新AI工具数据...");
};

const visitTool = (tool: AiTool) => {
	if (tool.url) {
		window.open(tool.url, "_blank");
	}
};

// 加载真实数据
const loadToolsData = async () => {
	try {
		const res = await fetch("/bookMicroservices/ai/getAiList", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				current: 1,
				pageSize: 1000 // 一次性获取所有数据
			})
		});

		if (!res.ok) {
			throw new Error("获取AI工具数据失败");
		}

		const data = await res.json();

		// 如果成功获取数据
		if (data && data.data && data.data.records) {
			const tools: AiTool[] = data.data.records.map((item: any) => {
				// 根据数据库返回的category或字段名确定分类
				let category = "productivity";
				if (item.category) {
					const catLower = item.category.toLowerCase();
					if (catLower.includes("creative") || catLower.includes("创意")) {
						category = "creative";
					} else if (catLower.includes("development") || catLower.includes("开发")) {
						category = "development";
					} else if (catLower.includes("learning") || catLower.includes("学习")) {
						category = "learning";
					}
				}

				return {
					id: item.id || `ai-${item.name}`,
					name: item.name || "未知工具",
					description: item.description || "",
					category: category,
					icon: "🤖", // 默认图标
					rating: item.rating || 4.5,
					users: item.users || 0,
					popularity: item.popularity || item.visit_count || 0,
					features: item.features ? (Array.isArray(item.features) ? item.features : [item.features]) : [],
					url: item.url || "#",
					isPaid: item.isPaid || false
				};
			});

			allTools.value = tools;
		}
	} catch (error) {
		console.error("加载AI工具数据出错:", error);
		// 出错时使用空数组
		allTools.value = [];
	}
};

onMounted(() => {
	loadToolsData();
});
</script>

<style lang="scss" scoped>
.crawler-aiTools-container {
	padding: 20px;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	min-height: 100vh;

	.filter-card {
		margin-bottom: 30px;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

		:deep(.el-form-item) {
			margin-bottom: 0;
		}

		.text-right {
			text-align: right;
		}
	}

	.stats-row {
		margin-bottom: 30px;

		.stat-card {
			background: white;
			border-radius: 12px;
			padding: 20px;
			display: flex;
			align-items: center;
			gap: 16px;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			transition: all 0.3s ease;

			&:hover {
				transform: translateY(-4px);
				box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
			}

			.stat-icon {
				width: 60px;
				height: 60px;
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32px;
				color: white;
				flex-shrink: 0;
			}

			.stat-content {
				.stat-value {
					font-size: 24px;
					font-weight: bold;
					color: #303133;
				}

				.stat-label {
					font-size: 12px;
					color: #909399;
					margin-top: 4px;
				}
			}
		}
	}

	.tools-wrapper {
		.tools-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
			gap: 20px;
			margin-bottom: 30px;

			.tool-item {
				animation: itemEnter 0.6s ease-out;
			}
		}

		.tool-card {
			background: white;
			border-radius: 12px;
			padding: 20px;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			display: flex;
			flex-direction: column;
			height: 100%;
			position: relative;
			overflow: hidden;

			&::before {
				content: "";
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 4px;
				background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
				transition: left 0.6s ease-in-out;
			}

			&:hover {
				transform: translateY(-8px);
				box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);

				&::before {
					left: 100%;
				}
			}

			.tool-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 12px;

				.tool-icon {
					font-size: 32px;
					line-height: 1;
				}

				.tool-header-info {
					flex: 1;

					.tool-title {
						font-size: 16px;
						font-weight: bold;
						margin: 0;
						color: #303133;
					}

					.tool-rating {
						display: flex;
						align-items: center;
						gap: 4px;
						margin-top: 4px;

						.rating-text {
							font-size: 12px;
							color: #909399;
						}
					}
				}
			}

			.tool-category-tag {
				display: inline-block;
				padding: 4px 12px;
				background: linear-gradient(135deg, #667eea, #764ba2);
				color: white;
				border-radius: 20px;
				font-size: 12px;
				font-weight: 500;
				margin-bottom: 12px;
				width: fit-content;
			}

			.tool-description {
				font-size: 13px;
				color: #606266;
				margin: 0 0 12px 0;
				line-height: 1.5;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
			}

			.tool-features {
				display: flex;
				flex-wrap: wrap;
				gap: 6px;
				margin-bottom: 12px;

				.feature-tag {
					font-size: 11px;
					padding: 3px 10px;
					background: #f0f9ff;
					color: #409eff;
					border-radius: 12px;
					border: 1px solid #c6e2ff;
				}
			}

			.tool-footer {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				padding-top: 12px;
				border-top: 1px solid #ebeef5;

				.tool-stats {
					display: flex;
					flex-direction: column;
					gap: 6px;
					margin-bottom: 12px;
					font-size: 12px;
					color: #606266;

					.stat {
						display: flex;
						align-items: center;
						gap: 4px;
					}
				}
			}
		}
	}

	.pagination-wrapper {
		display: flex;
		justify-content: center;
		padding: 20px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}
}

@keyframes itemEnter {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.list-enter-active,
.list-leave-active {
	transition: all 0.3s ease;
}

.list-enter-from {
	opacity: 0;
	transform: translateY(10px);
}

.list-leave-to {
	opacity: 0;
	transform: translateY(-10px);
}

@media (max-width: 768px) {
	.crawler-aiTools-container {
		padding: 12px;

		.stats-row {
			:deep(.el-col) {
				margin-bottom: 12px;
			}
		}

		.tools-wrapper {
			.tools-grid {
				grid-template-columns: 1fr;
			}
		}
	}
}
</style>
