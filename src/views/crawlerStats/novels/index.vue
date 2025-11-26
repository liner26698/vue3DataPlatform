<template>
	<div class="crawler-novels-container">
		<!-- 筛选卡片 -->
		<el-card class="filter-card">
			<el-row :gutter="20">
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="小说类型">
						<el-select v-model="selectedGenre" @change="handleGenreChange">
							<el-option label="全部类型" value="" />
							<el-option label="悬疑推理" value="mystery" />
							<el-option label="言情恋爱" value="romance" />
							<el-option label="奇幻冒险" value="fantasy" />
							<el-option label="都市生活" value="urban" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="排序方式">
						<el-select v-model="sortBy" @change="handleSort">
							<el-option label="最新更新" value="updated_desc" />
							<el-option label="字数最多" value="chapters_desc" />
							<el-option label="点击最多" value="views_desc" />
							<el-option label="评分最高" value="rating_desc" />
						</el-select>
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6">
					<el-form-item label="搜索">
						<el-input v-model="searchKeyword" placeholder="搜索小说名称或作者" @input="handleSearch" />
					</el-form-item>
				</el-col>
				<el-col :xs="24" :sm="12" :md="6" class="text-right">
					<el-button type="primary" @click="refreshNovels">刷新数据</el-button>
				</el-col>
			</el-row>
		</el-card>

		<!-- 统计信息 -->
		<el-row :gutter="20" class="stats-row">
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-box">
					<div class="stat-number">{{ allNovels.length }}</div>
					<div class="stat-text">总小说数</div>
					<div class="stat-icon">📚</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-box">
					<div class="stat-number">{{ completedCount }}</div>
					<div class="stat-text">已完成</div>
					<div class="stat-icon">✅</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-box">
					<div class="stat-number">{{ serializingCount }}</div>
					<div class="stat-text">连载中</div>
					<div class="stat-icon">📝</div>
				</div>
			</el-col>
			<el-col :xs="24" :sm="12" :md="6">
				<div class="stat-box">
					<div class="stat-number">{{ avgChapters }}</div>
					<div class="stat-text">平均章节数</div>
					<div class="stat-icon">📖</div>
				</div>
			</el-col>
		</el-row>

		<!-- 小说列表 -->
		<div class="novels-wrapper">
			<el-empty v-if="filteredNovels.length === 0" description="暂无数据" />

			<transition-group name="list" tag="div" class="novels-list">
				<div
					v-for="(novel, index) in filteredNovels"
					:key="novel.id"
					class="novel-item"
					:style="{ animationDelay: `${index * 50}ms` }"
				>
					<div class="novel-card">
						<!-- 左侧：书籍封面 -->
						<div class="novel-cover">
							<div class="cover-placeholder">📖</div>
							<div class="cover-status" :class="`status-${novel.status}`">
								{{ getStatusName(novel.status) }}
							</div>
						</div>

						<!-- 右侧：信息 -->
						<div class="novel-content">
							<!-- 标题和作者 -->
							<div class="novel-header">
								<h3 class="novel-title">{{ novel.title }}</h3>
								<p class="novel-author">作者: {{ novel.author }}</p>
							</div>

							<!-- 分类 -->
							<div class="novel-meta">
								<el-tag :type="getGenreType(novel.genre)">
									{{ getGenreName(novel.genre) }}
								</el-tag>
								<span class="meta-item">
									<span class="icon">📊</span>
									{{ novel.chapters }} 章
								</span>
								<span class="meta-item">
									<span class="icon">👁</span>
									{{ formatNumber(novel.views) }} 次阅读
								</span>
								<span class="meta-item">
									<span class="icon">⭐</span>
									{{ novel.rating }} 分
								</span>
							</div>

							<!-- 描述 -->
							<p class="novel-description">{{ novel.description }}</p>

							<!-- 进度条 -->
							<div class="novel-progress">
								<div class="progress-bar">
									<el-progress :percentage="novel.progress" />
								</div>
								<span class="progress-text">{{ novel.progress }}% 更新进度</span>
							</div>

							<!-- 最后更新 -->
							<div class="novel-footer">
								<span class="update-time">最后更新: {{ novel.lastUpdated }}</span>
								<el-button type="primary" link @click="readNovel(novel)"> 阅读 → </el-button>
							</div>
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
				:page-sizes="[10, 20, 30, 50]"
				:total="totalCount"
				layout="total, sizes, prev, pager, next, jumper"
				@size-change="handleSizeChange"
				@current-change="handlePageChange"
			/>
		</div>
	</div>
</template>

<script setup lang="ts" name="crawlerNovels">
import { ref, computed, onMounted } from "vue";

interface Novel {
	id: string;
	title: string;
	author: string;
	description: string;
	genre: string;
	chapters: number;
	views: number;
	rating: number;
	status: "completed" | "serializing" | "paused";
	progress: number;
	lastUpdated: string;
	url?: string;
}

// 数据
const allNovels = ref<Novel[]>([]);
const selectedGenre = ref("");
const sortBy = ref("updated_desc");
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = ref(10);

// 配置
const genreConfig: Record<string, { name: string; type: string }> = {
	mystery: { name: "悬疑推理", type: "warning" },
	romance: { name: "言情恋爱", type: "danger" },
	fantasy: { name: "奇幻冒险", type: "success" },
	urban: { name: "都市生活", type: "info" }
};

const statusConfig: Record<string, string> = {
	completed: "已完成",
	serializing: "连载中",
	paused: "已暂停"
};

const getGenreName = (genre: string) => genreConfig[genre]?.name || genre;
const getGenreType = (genre: string) => genreConfig[genre]?.type || "info";
const getStatusName = (status: string) => statusConfig[status] || status;

// 格式化数字
const formatNumber = (num: number) => {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + "M";
	} else if (num >= 1000) {
		return (num / 1000).toFixed(1) + "K";
	}
	return num.toString();
};

// 统计数据
const completedCount = computed(() => {
	return allNovels.value.filter(n => n.status === "completed").length;
});

const serializingCount = computed(() => {
	return allNovels.value.filter(n => n.status === "serializing").length;
});

const avgChapters = computed(() => {
	if (allNovels.value.length === 0) return 0;
	const sum = allNovels.value.reduce((acc, n) => acc + n.chapters, 0);
	return Math.round(sum / allNovels.value.length);
});

// 过滤和排序
const filteredNovels = computed(() => {
	let result = allNovels.value;

	// 类型筛选
	if (selectedGenre.value) {
		result = result.filter(n => n.genre === selectedGenre.value);
	}

	// 搜索
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase();
		result = result.filter(n => n.title.toLowerCase().includes(keyword) || n.author.toLowerCase().includes(keyword));
	}

	// 排序
	if (sortBy.value === "updated_desc") {
		result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
	} else if (sortBy.value === "chapters_desc") {
		result.sort((a, b) => b.chapters - a.chapters);
	} else if (sortBy.value === "views_desc") {
		result.sort((a, b) => b.views - a.views);
	} else if (sortBy.value === "rating_desc") {
		result.sort((a, b) => b.rating - a.rating);
	}

	// 分页
	const start = (currentPage.value - 1) * pageSize.value;
	return result.slice(start, start + pageSize.value);
});

// 总数
const totalCount = computed(() => {
	let result = allNovels.value;
	if (selectedGenre.value) {
		result = result.filter(n => n.genre === selectedGenre.value);
	}
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase();
		result = result.filter(n => n.title.toLowerCase().includes(keyword) || n.author.toLowerCase().includes(keyword));
	}
	return result.length;
});

// 事件处理
const handleGenreChange = () => {
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

const refreshNovels = async () => {
	console.log("刷新小说数据...");
};

const readNovel = (novel: Novel) => {
	if (novel.url) {
		window.open(novel.url, "_blank");
	}
};

// 加载数据
const loadNovelsData = async () => {
	const genres = ["mystery", "romance", "fantasy", "urban"];
	const statuses: Array<"completed" | "serializing" | "paused"> = ["completed", "serializing", "paused"];

	const mockData: Novel[] = Array.from({ length: 100 }, (_, i) => ({
		id: `novel-${i}`,
		title: `小说标题 ${i + 1}`,
		author: `作者 ${Math.floor(Math.random() * 50) + 1}`,
		description: "这是一部充满悬念和精彩故事情节的网络小说，讲述了一个引人入胜的故事...",
		genre: genres[Math.floor(Math.random() * genres.length)],
		chapters: Math.floor(Math.random() * 1000) + 10,
		views: Math.floor(Math.random() * 10000000) + 1000,
		rating: 3 + Math.random() * 2,
		status: statuses[Math.floor(Math.random() * statuses.length)],
		progress: Math.floor(Math.random() * 100),
		lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("zh-CN"),
		url: "#"
	}));

	allNovels.value = mockData;
};

onMounted(() => {
	loadNovelsData();
});
</script>

<style lang="scss" scoped>
.crawler-novels-container {
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

		.stat-box {
			background: white;
			border-radius: 12px;
			padding: 20px;
			text-align: center;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			transition: all 0.3s ease;
			position: relative;
			overflow: hidden;

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
				transform: translateY(-4px);
				box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);

				&::before {
					left: 100%;
				}
			}

			.stat-number {
				font-size: 32px;
				font-weight: bold;
				color: #303133;
				margin-bottom: 8px;
			}

			.stat-text {
				font-size: 13px;
				color: #909399;
				margin-bottom: 12px;
			}

			.stat-icon {
				font-size: 24px;
			}
		}
	}

	.novels-wrapper {
		.novels-list {
			display: flex;
			flex-direction: column;
			gap: 16px;
			margin-bottom: 30px;

			.novel-item {
				animation: itemEnter 0.6s ease-out;
			}
		}

		.novel-card {
			background: white;
			border-radius: 12px;
			overflow: hidden;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			display: flex;
			position: relative;

			&::before {
				content: "";
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 4px;
				background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
				transition: left 0.6s ease-in-out;
				z-index: 1;
			}

			&:hover {
				transform: translateX(4px);
				box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

				&::before {
					left: 100%;
				}
			}

			.novel-cover {
				position: relative;
				width: 100px;
				height: 140px;
				flex-shrink: 0;
				background: linear-gradient(135deg, #667eea, #764ba2);
				display: flex;
				align-items: center;
				justify-content: center;
				border-right: 1px solid #ebeef5;

				.cover-placeholder {
					font-size: 48px;
					opacity: 0.8;
				}

				.cover-status {
					position: absolute;
					bottom: 8px;
					left: 50%;
					transform: translateX(-50%);
					padding: 4px 8px;
					border-radius: 4px;
					font-size: 11px;
					font-weight: 500;
					color: white;
					background: rgba(0, 0, 0, 0.5);

					&.status-completed {
						background: #67c23a;
					}

					&.status-serializing {
						background: #409eff;
					}

					&.status-paused {
						background: #e6a23c;
					}
				}
			}

			.novel-content {
				flex: 1;
				padding: 16px 20px;
				display: flex;
				flex-direction: column;
				justify-content: space-between;

				.novel-header {
					margin-bottom: 12px;

					.novel-title {
						font-size: 16px;
						font-weight: bold;
						margin: 0 0 6px 0;
						color: #303133;
						line-height: 1.4;
					}

					.novel-author {
						font-size: 12px;
						color: #909399;
						margin: 0;
					}
				}

				.novel-meta {
					display: flex;
					align-items: center;
					gap: 12px;
					margin-bottom: 12px;
					flex-wrap: wrap;

					:deep(.el-tag) {
						margin: 0;
					}

					.meta-item {
						font-size: 12px;
						color: #606266;
						display: flex;
						align-items: center;
						gap: 4px;

						.icon {
							font-size: 14px;
						}
					}
				}

				.novel-description {
					font-size: 12px;
					color: #909399;
					margin: 0 0 12px 0;
					line-height: 1.5;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}

				.novel-progress {
					display: flex;
					align-items: center;
					gap: 12px;
					margin-bottom: 12px;

					.progress-bar {
						flex: 1;
						min-width: 150px;

						:deep(.el-progress__bar) {
							background: linear-gradient(90deg, #667eea, #764ba2);
						}
					}

					.progress-text {
						font-size: 12px;
						color: #909399;
						white-space: nowrap;
					}
				}

				.novel-footer {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding-top: 12px;
					border-top: 1px solid #ebeef5;

					.update-time {
						font-size: 11px;
						color: #a8abb2;
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
		transform: translateX(-20px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

.list-enter-active,
.list-leave-active {
	transition: all 0.3s ease;
}

.list-enter-from {
	opacity: 0;
	transform: translateX(-10px);
}

.list-leave-to {
	opacity: 0;
	transform: translateX(10px);
}

@media (max-width: 768px) {
	.crawler-novels-container {
		padding: 12px;

		.stats-row {
			:deep(.el-col) {
				margin-bottom: 12px;
			}
		}

		.novels-wrapper {
			.novel-card {
				flex-direction: column;

				.novel-cover {
					width: 100%;
					height: 80px;
					border-right: none;
					border-bottom: 1px solid #ebeef5;
				}
			}
		}
	}
}
</style>
