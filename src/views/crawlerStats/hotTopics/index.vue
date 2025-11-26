<template>
	<div class="crawler-hotTopics-container">
		<!-- 分类筛选 -->
		<el-card class="filter-card">
			<el-row :gutter="20">
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="选择平台">
						<el-select v-model="selectedPlatform" @change="handlePlatformChange">
							<el-option label="全部平台" value="" />
							<el-option label="百度热搜" value="baidu" />
							<el-option label="微博热搜" value="weibo" />
							<el-option label="B站热门" value="bilibili" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="排序方式">
						<el-select v-model="sortBy" @change="handleSort">
							<el-option label="热度最高" value="heat_desc" />
							<el-option label="热度最低" value="heat_asc" />
							<el-option label="最近更新" value="updated_desc" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="搜索">
						<el-input v-model="searchKeyword" placeholder="输入话题关键词" @input="handleSearch" />
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6" class="text-right">
					<el-button type="primary" @click="refreshTopics">刷新数据</el-button>
				</el-col>
			</el-row>
		</el-card>

		<!-- 热门话题展示 -->
		<div class="topics-grid">
			<el-empty v-if="filteredTopics.length === 0" description="暂无数据" />
			
			<transition-group name="list" tag="div" class="grid-container">
				<div
					v-for="(topic, index) in filteredTopics"
					:key="topic.id"
					class="topic-card"
					:style="{ animationDelay: `${index * 50}ms` }"
				>
					<!-- 排名徽章 -->
					<div class="topic-rank" :class="`rank-${Math.min(index + 1, 3)}`">
						{{ index + 1 }}
					</div>

					<!-- 平台标签 -->
					<div class="platform-tag" :style="{ backgroundColor: getPlatformColor(topic.platform) }">
						{{ getPlatformName(topic.platform) }}
					</div>

					<!-- 内容 -->
					<div class="topic-body">
						<h3 class="topic-title">{{ topic.title }}</h3>
						<p class="topic-description">{{ topic.description }}</p>

						<!-- 热度和标签 -->
						<div class="topic-footer">
							<div class="topic-heat">
								<span class="heat-icon">🔥</span>
								<span class="heat-value">{{ formatHeat(topic.heat) }}</span>
							</div>
							<div class="topic-tags">
								<span v-for="tag in topic.tags" :key="tag" class="tag">{{ tag }}</span>
							</div>
						</div>
					</div>

					<!-- 操作按钮 -->
					<div class="topic-actions">
						<el-button link type="primary" size="small" @click="openTopic(topic)">
							查看详情 →
						</el-button>
					</div>
				</div>
			</transition-group>
		</div>

		<!-- 分页 -->
		<div class="pagination-wrapper">
			<el-pagination
				v-model:current-page="currentPage"
				v-model:page-size="pageSize"
				:page-sizes="[12, 24, 36, 48]"
				:total="totalCount"
				layout="total, sizes, prev, pager, next, jumper"
				@size-change="handleSizeChange"
				@current-change="handlePageChange"
			/>
		</div>
	</div>
</template>

<script setup lang="ts" name="crawlerHotTopics">
import { ref, computed, onMounted } from "vue";

interface Topic {
	id: string;
	title: string;
	description: string;
	platform: string;
	heat: number;
	category: string;
	tags: string[];
	url?: string;
}

// 数据
const allTopics = ref<Topic[]>([]);
const selectedPlatform = ref("");
const sortBy = ref("heat_desc");
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = ref(12);

// 平台配置
const platformConfig: Record<string, { name: string; color: string; icon: string }> = {
	baidu: { name: "百度", color: "#2319dc", icon: "🔍" },
	weibo: { name: "微博", color: "#e6162d", icon: "✨" },
	bilibili: { name: "B站", color: "#fb7299", icon: "▶" }
};

// 获取平台信息
const getPlatformName = (platform: string) => {
	return platformConfig[platform]?.name || platform;
};

const getPlatformColor = (platform: string) => {
	return platformConfig[platform]?.color || "#909399";
};

// 格式化热度
const formatHeat = (heat: number) => {
	if (heat >= 1000000) {
		return (heat / 1000000).toFixed(1) + "M";
	} else if (heat >= 1000) {
		return (heat / 1000).toFixed(1) + "K";
	}
	return heat.toString();
};

// 过滤和排序
const filteredTopics = computed(() => {
	let result = allTopics.value;

	// 平台筛选
	if (selectedPlatform.value) {
		result = result.filter(topic => topic.platform === selectedPlatform.value);
	}

	// 关键词搜索
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase();
		result = result.filter(
			topic =>
				topic.title.toLowerCase().includes(keyword) ||
				topic.description.toLowerCase().includes(keyword)
		);
	}

	// 排序
	if (sortBy.value === "heat_desc") {
		result.sort((a, b) => b.heat - a.heat);
	} else if (sortBy.value === "heat_asc") {
		result.sort((a, b) => a.heat - b.heat);
	}

	// 分页
	const start = (currentPage.value - 1) * pageSize.value;
	return result.slice(start, start + pageSize.value);
});

// 总数
const totalCount = computed(() => {
	let result = allTopics.value;
	if (selectedPlatform.value) {
		result = result.filter(topic => topic.platform === selectedPlatform.value);
	}
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase();
		result = result.filter(
			topic =>
				topic.title.toLowerCase().includes(keyword) ||
				topic.description.toLowerCase().includes(keyword)
		);
	}
	return result.length;
});

// 事件处理
const handlePlatformChange = () => {
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

const refreshTopics = async () => {
	// 这里可以调用API刷新数据
	console.log("刷新热门话题数据...");
};

const openTopic = (topic: Topic) => {
	if (topic.url) {
		window.open(topic.url, "_blank");
	}
};

// 模拟数据加载
const loadTopicsData = async () => {
	// 这里应该调用真实的 API
	// const res = await getHotTopicsApi();

	const mockData: Topic[] = [
		// 百度
		...Array.from({ length: 20 }, (_, i) => ({
			id: `baidu-${i}`,
			platform: "baidu",
			title: `百度热搜话题 ${i + 1}`,
			description: "这是一条来自百度热搜的热门话题",
			heat: 1000000 - i * 50000,
			category: "热搜",
			tags: ["百度", "热搜"],
			url: "#"
		})),
		// 微博
		...Array.from({ length: 20 }, (_, i) => ({
			id: `weibo-${i}`,
			platform: "weibo",
			title: `微博热搜话题 ${i + 1}`,
			description: "这是一条来自微博热搜的热门话题",
			heat: 900000 - i * 45000,
			category: "热搜",
			tags: ["微博", "热搜"],
			url: "#"
		})),
		// B站
		...Array.from({ length: 20 }, (_, i) => ({
			id: `bilibili-${i}`,
			platform: "bilibili",
			title: `B站热门话题 ${i + 1}`,
			description: "这是一条来自B站的热门话题",
			heat: 800000 - i * 40000,
			category: "热门",
			tags: ["B站", "视频"],
			url: "#"
		}))
	];

	allTopics.value = mockData;
};

onMounted(() => {
	loadTopicsData();
});
</script>

<style lang="scss" scoped>
.crawler-hotTopics-container {
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

	.topics-grid {
		.grid-container {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
			gap: 20px;
			margin-bottom: 30px;
		}

		.topic-card {
			background: white;
			border-radius: 12px;
			padding: 20px;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			position: relative;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			animation: cardEnter 0.6s ease-out;

			&::before {
				content: "";
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 3px;
				background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
				transition: left 0.6s ease-in-out;
			}

			&:hover {
				transform: translateY(-8px);
				box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);

				&::before {
					left: 100%;
				}
			}

			.topic-rank {
				position: absolute;
				top: 10px;
				right: 10px;
				width: 40px;
				height: 40px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: bold;
				color: white;
				font-size: 18px;

				&.rank-1 {
					background: linear-gradient(135deg, #f093fb, #f5576c);
					box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
				}

				&.rank-2 {
					background: linear-gradient(135deg, #4facfe, #00f2fe);
					box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
				}

				&.rank-3 {
					background: linear-gradient(135deg, #43e97b, #38f9d7);
					box-shadow: 0 4px 12px rgba(67, 233, 123, 0.4);
				}
			}

			.platform-tag {
				display: inline-block;
				padding: 4px 12px;
				border-radius: 20px;
				color: white;
				font-size: 12px;
				font-weight: 500;
				margin-bottom: 12px;
				width: fit-content;
			}

			.topic-body {
				flex: 1;

				.topic-title {
					font-size: 16px;
					font-weight: bold;
					margin: 0 0 8px 0;
					color: #303133;
					line-height: 1.4;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}

				.topic-description {
					font-size: 12px;
					color: #909399;
					margin: 0 0 12px 0;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}

				.topic-footer {
					display: flex;
					justify-content: space-between;
					align-items: center;

					.topic-heat {
						display: flex;
						align-items: center;
						gap: 4px;

						.heat-icon {
							font-size: 16px;
						}

						.heat-value {
							font-weight: bold;
							color: #ff6b6b;
							font-size: 14px;
						}
					}

					.topic-tags {
						display: flex;
						gap: 4px;
						flex-wrap: wrap;

						.tag {
							font-size: 11px;
							padding: 2px 8px;
							background: #f0f9ff;
							color: #409eff;
							border-radius: 12px;
							border: 1px solid #c6e2ff;
						}
					}
				}
			}

			.topic-actions {
				margin-top: 12px;
				padding-top: 12px;
				border-top: 1px solid #ebeef5;
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

@keyframes cardEnter {
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
	.crawler-hotTopics-container {
		padding: 12px;

		.topics-grid {
			.grid-container {
				grid-template-columns: 1fr;
			}
		}
	}
}
</style>
