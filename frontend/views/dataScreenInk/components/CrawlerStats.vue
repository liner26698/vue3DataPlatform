<template>
	<div class="crawler-stats">
		<!-- 切换按钮 -->
		<div class="stats-header">
			<div class="tabs-container">
				<button
					v-for="(tab, index) in tabs"
					:key="index"
					:class="['tab-btn', { active: currentTab === index }]"
					@click="currentTab = index"
				>
					<span class="tab-icon">{{ tab.icon }}</span>
					<span class="tab-label">{{ tab.label }}</span>
				</button>
			</div>
		</div>

		<!-- 内容容器 - 切换动画 -->
		<div class="stats-content">
			<!-- 标签页1: 快速概览 -->
			<div v-show="currentTab === 0" class="tab-content overview-content">
				<div class="overview-grid">
					<!-- 执行次数卡片 -->
					<div class="overview-card execution-card">
						<div class="card-top">
							<div class="card-icon">📊</div>
							<div class="card-info">
								<div class="card-label">累计执行</div>
								<div class="card-value">{{ totalExecutions }}</div>
							</div>
						</div>
						<div class="card-progress">
							<div class="progress-bar" :style="{ width: '75%' }"></div>
						</div>
						<div class="card-items">
							<div v-for="item in executionDetails" :key="item.name" class="item-row">
								<span class="item-label">{{ item.name }}</span>
								<span class="item-value">{{ item.count }}</span>
							</div>
						</div>
					</div>

					<!-- 数据量卡片 -->
					<div class="overview-card data-card">
						<div class="card-top">
							<div class="card-icon">📈</div>
							<div class="card-info">
								<div class="card-label">数据量</div>
								<div class="card-value">{{ totalDataCount }}</div>
							</div>
						</div>
						<div class="card-progress">
							<div class="progress-bar" :style="{ width: '85%' }"></div>
						</div>
						<div class="card-items">
							<div v-for="item in dataCountDetails" :key="item.name" class="item-row">
								<span class="item-label">{{ item.name }}</span>
								<span class="item-value">{{ item.count }}</span>
							</div>
						</div>
					</div>

					<!-- 平均耗时卡片 -->
					<div class="overview-card time-card">
						<div class="card-top">
							<div class="card-icon">⏱️</div>
							<div class="card-info">
								<div class="card-label">平均耗时</div>
								<div class="card-value">{{ avgDuration }}<span class="value-unit">ms</span></div>
							</div>
						</div>
						<div class="card-progress">
							<div class="progress-bar" :style="{ width: '60%' }"></div>
						</div>
						<div class="card-items">
							<div class="item-row">
								<span class="item-label">整体耗时</span>
								<span class="item-value">{{ overallAvgDuration }} ms</span>
							</div>
						</div>
					</div>

					<!-- 成功率卡片 -->
					<div class="overview-card success-card">
						<div class="card-top">
							<div class="card-icon">✅</div>
							<div class="card-info">
								<div class="card-label">成功率</div>
								<div class="card-value">{{ avgSuccessRate }}<span class="value-unit">%</span></div>
							</div>
						</div>
						<div class="card-progress">
							<div class="progress-bar" :style="{ width: avgSuccessRate + '%' }"></div>
						</div>
						<div class="card-items">
							<div class="item-row">
								<span class="item-label">平均成功率</span>
								<span class="item-value">{{ avgSuccessRate }}%</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 标签页2: 详细数据 -->
			<div v-show="currentTab === 1" class="tab-content details-content">
				<div class="details-list">
					<div v-for="spider in crawlerStats" :key="spider.spiderName" class="spider-detail-card">
						<div class="spider-header">
							<div class="spider-name">{{ spider.spiderName }}</div>
							<div class="spider-badges">
								<span class="badge execution">执行: {{ spider.runCount }}</span>
								<span class="badge success">成功率: {{ spider.successRate }}%</span>
							</div>
						</div>
						<div class="spider-stats">
							<div class="stat-row">
								<div class="stat-item">
									<span class="stat-label">数据量</span>
									<span class="stat-highlight">{{ spider.totalCount }}</span>
									<span class="stat-unit">条</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">耗时</span>
									<span class="stat-highlight">{{ spider.duration }}</span>
									<span class="stat-unit">ms</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">执行次数</span>
									<span class="stat-highlight">{{ spider.runCount }}</span>
									<span class="stat-unit">次</span>
								</div>
								<div class="stat-item">
									<span class="stat-label">成功率</span>
									<span class="stat-highlight">{{ spider.successRate }}</span>
									<span class="stat-unit">%</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getCrawlerStatsApi } from "@/api/dataScreen/index";

interface CrawlerData {
	spiderName: string;
	totalCount: number;
	successRate: number | string;
	duration: number;
	runCount: number;
}

// 数据状态
const crawlerStats = ref<CrawlerData[]>([]);
const totalStats = ref<any>({});
const currentTab = ref(0);

// 标签页配置
const tabs = ref([
	{ label: "快速概览", icon: "📊" },
	{ label: "详细数据", icon: "📋" }
]);

// 计算属性
const totalExecutions = computed(() => {
	return crawlerStats.value.reduce((sum, spider) => sum + (spider.runCount || 0), 0);
});

const totalDataCount = computed(() => {
	return crawlerStats.value.reduce((sum, spider) => sum + (spider.totalCount || 0), 0);
});

const executionDetails = computed(() => {
	return crawlerStats.value.map(spider => ({
		name: spider.spiderName,
		count: spider.runCount || 0
	}));
});

const dataCountDetails = computed(() => {
	return crawlerStats.value.map(spider => ({
		name: spider.spiderName,
		count: spider.totalCount || 0
	}));
});

const avgDuration = computed(() => {
	if (crawlerStats.value.length === 0) return 0;
	const total = crawlerStats.value.reduce((sum, spider) => sum + (spider.duration || 0), 0);
	return Math.round(total / crawlerStats.value.length);
});

const overallAvgDuration = computed(() => {
	const details = crawlerStats.value.map(spider => ({
		name: spider.spiderName,
		duration: spider.duration || 0
	}));
	if (details.length === 0) return 0;
	const total = details.reduce((sum, item) => sum + item.duration, 0);
	return Math.round(total / details.length);
});

const avgSuccessRate = computed(() => {
	if (crawlerStats.value.length === 0) return 0;
	const rates = crawlerStats.value
		.filter(spider => spider.totalCount > 0)
		.map(spider => parseFloat(String(spider.successRate || 0)));
	if (rates.length === 0) return 0;
	const total = rates.reduce((sum, rate) => sum + rate, 0);
	return Math.round(total / rates.length);
});

// 获取统计数据
const fetchCrawlerStats = async () => {
	try {
		const response: any = await getCrawlerStatsApi();
		if (response?.data) {
			crawlerStats.value = response.data.crawlers || [];
			totalStats.value = response.data.totalStats || {};
		}
	} catch (error) {
		console.error("获取爬虫统计数据失败:", error);
	}
};

onMounted(() => {
	fetchCrawlerStats();
	// 每30秒刷新一次
	setInterval(fetchCrawlerStats, 30000);
});
</script>

<style lang="scss" scoped>
.crawler-stats {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 12px;
	background: linear-gradient(180deg, rgba(0, 20, 40, 0.3) 0%, rgba(0, 40, 80, 0.2) 100%);

	.stats-header {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.tabs-container {
			display: flex;
			gap: 6px;
			background: rgba(0, 255, 255, 0.05);
			border: 1px solid rgba(0, 255, 255, 0.15);
			border-radius: 6px;
			padding: 4px;

			.tab-btn {
				display: flex;
				align-items: center;
				gap: 6px;
				padding: 6px 14px;
				background: transparent;
				border: 1px solid transparent;
				border-radius: 4px;
				color: rgba(0, 255, 255, 0.6);
				cursor: pointer;
				font-size: 12px;
				font-weight: 500;
				transition: all 0.3s ease;
				white-space: nowrap;

				.tab-icon {
					font-size: 14px;
				}

				.tab-label {
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}

				&:hover {
					color: rgba(0, 255, 255, 0.9);
					border-color: rgba(0, 255, 255, 0.2);
					background: rgba(0, 255, 255, 0.05);
				}

				&.active {
					background: linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(0, 100, 255, 0.1) 100%);
					border-color: rgba(0, 255, 255, 0.3);
					color: #00ff88;
					box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
				}
			}
		}
	}

	.stats-content {
		flex: 1;
		display: flex;
		overflow: hidden;

		.tab-content {
			width: 100%;
			display: flex;
			flex-direction: column;
			overflow-y: auto;

			&::-webkit-scrollbar {
				width: 4px;
			}

			&::-webkit-scrollbar-track {
				background: transparent;
			}

			&::-webkit-scrollbar-thumb {
				background: rgba(0, 255, 255, 0.3);
				border-radius: 2px;

				&:hover {
					background: rgba(0, 255, 255, 0.5);
				}
			}
		}

		// 快速概览布局
		.overview-content {
			.overview-grid {
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: 12px;
				padding: 4px;

				.overview-card {
					background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 100, 255, 0.05) 100%);
					border: 1px solid rgba(0, 255, 255, 0.15);
					border-radius: 8px;
					padding: 14px;
					display: flex;
					flex-direction: column;
					gap: 10px;
					transition: all 0.3s ease;

					&:hover {
						background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 100, 255, 0.1) 100%);
						border-color: rgba(0, 255, 255, 0.3);
						box-shadow: 0 0 15px rgba(0, 255, 255, 0.15);
						transform: translateY(-2px);
					}

					.card-top {
						display: flex;
						align-items: center;
						gap: 10px;

						.card-icon {
							font-size: 24px;
							min-width: 28px;
						}

						.card-info {
							flex: 1;

							.card-label {
								font-size: 10px;
								color: rgba(0, 255, 255, 0.6);
								text-transform: uppercase;
								letter-spacing: 0.5px;
							}

							.card-value {
								font-size: 20px;
								color: #00ff88;
								font-weight: bold;
								text-shadow: 0 0 8px rgba(0, 255, 136, 0.4);

								.value-unit {
									font-size: 12px;
									margin-left: 4px;
									color: rgba(0, 255, 255, 0.5);
								}
							}
						}
					}

					.card-progress {
						height: 3px;
						background: rgba(0, 255, 255, 0.1);
						border-radius: 2px;
						overflow: hidden;

						.progress-bar {
							height: 100%;
							background: linear-gradient(90deg, #00ff88 0%, #00ffff 100%);
							border-radius: 2px;
							transition: width 0.5s ease;
						}
					}

					.card-items {
						display: flex;
						flex-direction: column;
						gap: 6px;

						.item-row {
							display: flex;
							justify-content: space-between;
							align-items: center;
							font-size: 11px;
							padding: 4px 0;

							.item-label {
								color: rgba(255, 255, 255, 0.5);
								flex: 1;
								white-space: nowrap;
								overflow: hidden;
								text-overflow: ellipsis;
							}

							.item-value {
								color: #00ff88;
								font-weight: 600;
								text-shadow: 0 0 6px rgba(0, 255, 136, 0.3);
								margin-left: 8px;
								flex-shrink: 0;
							}
						}
					}
				}
			}
		}

		// 详细数据布局
		.details-content {
			.details-list {
				display: flex;
				flex-direction: column;
				gap: 10px;
				padding: 4px;

				.spider-detail-card {
					background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 107, 53, 0.03) 100%);
					border: 1px solid rgba(0, 255, 255, 0.15);
					border-radius: 8px;
					padding: 12px;
					transition: all 0.3s ease;

					&:hover {
						background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 107, 53, 0.08) 100%);
						border-color: rgba(0, 255, 255, 0.3);
						box-shadow: 0 0 15px rgba(0, 255, 255, 0.15);
					}

					.spider-header {
						display: flex;
						align-items: center;
						justify-content: space-between;
						gap: 10px;
						margin-bottom: 10px;
						padding-bottom: 10px;
						border-bottom: 1px solid rgba(0, 255, 255, 0.1);

						.spider-name {
							font-size: 12px;
							font-weight: 600;
							color: #00ffff;
							text-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
							text-transform: uppercase;
							letter-spacing: 0.5px;
						}

						.spider-badges {
							display: flex;
							gap: 6px;
							flex-wrap: wrap;

							.badge {
								font-size: 9px;
								padding: 2px 8px;
								border-radius: 3px;
								text-transform: uppercase;
								letter-spacing: 0.3px;
								font-weight: 500;

								&.execution {
									background: rgba(0, 255, 255, 0.15);
									color: #00ffff;
									border: 1px solid rgba(0, 255, 255, 0.3);
								}

								&.success {
									background: rgba(0, 255, 136, 0.15);
									color: #00ff88;
									border: 1px solid rgba(0, 255, 136, 0.3);
								}
							}
						}
					}

					.spider-stats {
						.stat-row {
							display: grid;
							grid-template-columns: repeat(4, 1fr);
							gap: 8px;

							.stat-item {
								background: rgba(0, 255, 255, 0.05);
								border: 1px solid rgba(0, 255, 255, 0.1);
								border-radius: 6px;
								padding: 8px;
								display: flex;
								flex-direction: column;
								align-items: center;
								gap: 4px;
								transition: all 0.3s ease;

								&:hover {
									background: rgba(0, 255, 255, 0.1);
									border-color: rgba(0, 255, 255, 0.2);
									box-shadow: 0 0 8px rgba(0, 255, 255, 0.1);
								}

								.stat-label {
									font-size: 9px;
									color: rgba(0, 255, 255, 0.5);
									text-transform: uppercase;
									letter-spacing: 0.3px;
								}

								.stat-highlight {
									font-size: 16px;
									color: #00ff88;
									font-weight: bold;
									text-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
								}

								.stat-unit {
									font-size: 8px;
									color: rgba(0, 255, 255, 0.5);
								}
							}
						}
					}
				}
			}
		}
	}
}
</style>
