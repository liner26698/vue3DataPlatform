<template>
	<div class="crawler-stats-container">
		<!-- 顶部统计卡片 -->
		<div class="stats-header">
			<el-row :gutter="20">
				<el-col :xs="24" :sm="12" :md="6" v-for="stat in totalStats" :key="stat.id">
					<div class="stat-card" :style="{ borderLeft: `4px solid ${stat.color}` }">
						<div class="stat-content">
							<div class="stat-icon" :style="{ color: stat.color }">{{ stat.icon }}</div>
							<div class="stat-info">
								<div class="stat-label">{{ stat.label }}</div>
								<div class="stat-value">{{ stat.value }}</div>
								<div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
									{{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
								</div>
							</div>
						</div>
					</div>
				</el-col>
			</el-row>
		</div>

		<!-- 图表区域 -->
		<el-row :gutter="20" class="charts-section">
			<!-- 爬虫类型分布 -->
			<el-col :xs="24" :lg="12">
				<el-card class="chart-card">
					<template #header>
						<div class="card-header">
							<span class="title">📊 爬虫类型分布</span>
							<span class="subtitle">(各类型数据占比)</span>
						</div>
					</template>
					<div ref="spiderTypePieRef" class="chart-container"></div>
				</el-card>
			</el-col>

			<!-- 数据趋势 -->
			<el-col :xs="24" :lg="12">
				<el-card class="chart-card">
					<template #header>
						<div class="card-header">
							<span class="title">📈 近期爬取趋势</span>
							<span class="subtitle">(最近7天)</span>
						</div>
					</template>
					<div ref="trendLineRef" class="chart-container"></div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 爬虫详情表格 -->
		<el-row :gutter="20" class="table-section">
			<el-col :span="24">
				<el-card class="chart-card">
					<template #header>
						<div class="card-header">
							<span class="title">🔍 爬虫详细统计</span>
							<el-button type="primary" size="small" @click="refreshData">
								<i class="el-icon-refresh"></i> 刷新数据
							</el-button>
						</div>
					</template>
					<el-table :data="crawlerDetails" stripe v-loading="tableLoading" class="crawler-table">
						<el-table-column prop="spiderName" label="爬虫名称" width="150">
							<template #default="{ row }">
								<span class="spider-name" :style="{ color: row.color }">{{ row.icon }} {{ row.spiderName }}</span>
							</template>
						</el-table-column>
						<el-table-column prop="category" label="分类" width="120">
							<template #default="{ row }">
								<el-tag :type="row.categoryType">{{ row.category }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column prop="totalCount" label="总数据量" width="120">
							<template #default="{ row }">
								<div class="count-number">{{ row.totalCount }}</div>
							</template>
						</el-table-column>
						<el-table-column prop="lastUpdate" label="最后更新" width="180">
							<template #default="{ row }">
								<span class="time">{{ formatTime(row.lastUpdate) }}</span>
							</template>
						</el-table-column>
						<el-table-column prop="successRate" label="成功率" width="120">
							<template #default="{ row }">
								<el-progress :percentage="row.successRate" color="#409EFF" />
							</template>
						</el-table-column>
						<el-table-column prop="status" label="状态" width="100">
							<template #default="{ row }">
								<el-tag :type="row.status === 'success' ? 'success' : row.status === 'warning' ? 'warning' : 'danger'">
									{{ row.statusText }}
								</el-tag>
							</template>
						</el-table-column>
						<el-table-column label="操作" width="180" fixed="right">
							<template #default="{ row }">
								<el-button link type="primary" @click="viewDetails(row)">查看详情</el-button>
								<el-button link type="success" @click="viewData(row)">查看数据</el-button>
							</template>
						</el-table-column>
					</el-table>
				</el-card>
			</el-col>
		</el-row>

		<!-- 子路由展示区域 -->
		<el-row v-if="$slots.default" class="children-section">
			<el-col :span="24">
				<slot></slot>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";

// 数据类型定义
interface CrawlerStat {
	id: string;
	icon: string;
	label: string;
	value: number;
	trend: number;
	color: string;
}

interface CrawlerDetail {
	spiderName: string;
	icon: string;
	category: string;
	categoryType: string;
	totalCount: number;
	lastUpdate: string;
	successRate: number;
	status: string;
	statusText: string;
	color: string;
}

// 爬虫配置 - 易于扩展
const spiderConfig = [
	{
		id: "game",
		name: "游戏爬虫",
		icon: "🎮",
		color: "#FF6B6B",
		category: "游戏数据",
		categoryType: "danger"
	},
	{
		id: "hotTopics",
		name: "热门话题",
		icon: "🔥",
		color: "#FF8C42",
		category: "热搜数据",
		categoryType: "warning"
	},
	{
		id: "aiTools",
		name: "AI工具库",
		icon: "🤖",
		color: "#4ECDC4",
		category: "AI数据",
		categoryType: "info"
	},
	{
		id: "novels",
		name: "小说爬虫",
		icon: "📚",
		color: "#95E1D3",
		category: "文学数据",
		categoryType: "success"
	}
];

// 数据引用
const totalStats = ref<CrawlerStat[]>([]);
const crawlerDetails = ref<CrawlerDetail[]>([]);
const tableLoading = ref(false);

// ECharts 实例
let spiderTypePieChart: ECharts | null = null;
let trendLineChart: ECharts | null = null;
const spiderTypePieRef = ref<HTMLDivElement>();
const trendLineRef = ref<HTMLDivElement>();

// 格式化时间
const formatTime = (time: string | number) => {
	if (!time) return "未知";
	const date = new Date(time);
	return date.toLocaleString("zh-CN");
};

// 初始化 ECharts - 爬虫类型分布饼图
const initSpiderTypePie = () => {
	if (!spiderTypePieRef.value) return;

	const chartDom = spiderTypePieRef.value;
	spiderTypePieChart = echarts.init(chartDom, null, { locale: "ZH" });

	const pieData = crawlerDetails.value.map(detail => ({
		name: detail.spiderName,
		value: detail.totalCount,
		itemStyle: { color: detail.color }
	}));

	const option: EChartsOption = {
		tooltip: {
			trigger: "item",
			formatter: "{b}: {c} ({d}%)"
		},
		legend: {
			orient: "vertical",
			left: "left",
			top: "center"
		},
		series: [
			{
				name: "爬虫数据",
				type: "pie",
				radius: ["40%", "70%"],
				avoidLabelOverlap: false,
				itemStyle: {
					borderRadius: 10,
					borderColor: "#fff",
					borderWidth: 2
				},
				label: {
					show: false
				},
				emphasis: {
					label: {
						show: true,
						fontSize: 16,
						fontWeight: "bold"
					},
					itemStyle: {
						shadowBlur: 10,
						shadowOffsetX: 0,
						shadowColor: "rgba(0, 0, 0, 0.5)"
					}
				},
				labelLine: {
					show: false
				},
				data: pieData
			}
		],
		animation: true,
		animationDuration: 1000,
		animationEasing: "cubicOut"
	};

	spiderTypePieChart.setOption(option);
};

// 初始化 ECharts - 数据趋势折线图
const initTrendLine = () => {
	if (!trendLineRef.value) return;

	const chartDom = trendLineRef.value;
	trendLineChart = echarts.init(chartDom, null, { locale: "ZH" });

	// 模拟最近7天的数据
	const dates = Array.from({ length: 7 }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() - (6 - i));
		return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
	});

	const option: EChartsOption = {
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "cross",
				label: {
					backgroundColor: "#6a7985"
				}
			}
		},
		legend: {
			data: crawlerDetails.value.map(d => d.spiderName),
			top: "5%"
		},
		grid: {
			left: "3%",
			right: "4%",
			bottom: "3%",
			top: "15%",
			containLabel: true
		},
		xAxis: {
			type: "category",
			data: dates,
			boundaryGap: false
		},
		yAxis: {
			type: "value"
		},
		series: crawlerDetails.value.map(detail => ({
			name: detail.spiderName,
			type: "line",
			data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 1000) + detail.totalCount * 0.1),
			smooth: true,
			itemStyle: { color: detail.color },
			areaStyle: {
				color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: detail.color + "40" },
					{ offset: 1, color: detail.color + "00" }
				])
			},
			symbolSize: 8,
			lineStyle: {
				width: 2
			}
		})),
		animation: true,
		animationDuration: 1000
	};

	trendLineChart.setOption(option);
};

// 获取爬虫数据
const fetchCrawlerStats = async () => {
	tableLoading.value = true;
	try {
		// 这里可以替换为真实API调用
		// const res = await getCrawlerStatsApi();

		// 模拟数据构建
		const mockStats: CrawlerDetail[] = [
			{
				spiderName: "游戏爬虫",
				icon: "🎮",
				category: "游戏数据",
				categoryType: "danger",
				totalCount: 5432,
				lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
				successRate: 98,
				status: "success",
				statusText: "运行中",
				color: "#FF6B6B"
			},
			{
				spiderName: "热门话题",
				icon: "🔥",
				category: "热搜数据",
				categoryType: "warning",
				totalCount: 1850,
				lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
				successRate: 95,
				status: "success",
				statusText: "运行中",
				color: "#FF8C42"
			},
			{
				spiderName: "AI工具库",
				icon: "🤖",
				category: "AI数据",
				categoryType: "info",
				totalCount: 2156,
				lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
				successRate: 92,
				status: "success",
				statusText: "运行中",
				color: "#4ECDC4"
			},
			{
				spiderName: "小说爬虫",
				icon: "📚",
				category: "文学数据",
				categoryType: "success",
				totalCount: 8923,
				lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
				successRate: 97,
				status: "success",
				statusText: "运行中",
				color: "#95E1D3"
			}
		];

		crawlerDetails.value = mockStats;

		// 计算统计数据
		const totalCount = mockStats.reduce((sum, item) => sum + item.totalCount, 0);
		const avgSuccessRate = Math.round(mockStats.reduce((sum, item) => sum + item.successRate, 0) / mockStats.length);

		totalStats.value = [
			{
				id: "totalData",
				icon: "📦",
				label: "总爬取数据量",
				value: totalCount,
				trend: 12,
				color: "#409EFF"
			},
			{
				id: "successRate",
				icon: "✅",
				label: "平均成功率",
				value: avgSuccessRate,
				trend: 5,
				color: "#67C23A"
			},
			{
				id: "spiderCount",
				icon: "🕷️",
				label: "活跃爬虫数",
				value: mockStats.length,
				trend: 0,
				color: "#E6A23C"
			},
			{
				id: "updateFreq",
				icon: "⏱️",
				label: "每日更新频率",
				value: 3,
				trend: 2,
				color: "#F56C6C"
			}
		];

		// 初始化图表
		setTimeout(() => {
			initSpiderTypePie();
			initTrendLine();
		}, 100);
	} catch (error) {
		console.error("获取爬虫统计数据失败:", error);
	} finally {
		tableLoading.value = false;
	}
};

// 刷新数据
const refreshData = async () => {
	tableLoading.value = true;
	await new Promise(resolve => setTimeout(resolve, 1000));
	await fetchCrawlerStats();
};

// 查看详情
const viewDetails = (row: CrawlerDetail) => {
	console.log("查看详情:", row.spiderName);
	// 可以打开详情弹窗或导航到详情页面
};

// 查看数据
const viewData = (row: CrawlerDetail) => {
	console.log("查看数据:", row.spiderName);
	// 根据爬虫类型导航到对应的数据页面
	const routeMap: Record<string, string> = {
		"游戏爬虫": "/crawlerStats/game",
		"热门话题": "/crawlerStats/hotTopics",
		"AI工具库": "/crawlerStats/aiTools",
		"小说爬虫": "/crawlerStats/novels"
	};
	const route = routeMap[row.spiderName];
	if (route) {
		// 使用 router 导航
		// router.push(route);
	}
};

// 监听窗口大小变化
const handleResize = () => {
	spiderTypePieChart?.resize();
	trendLineChart?.resize();
};

// 生命周期
onMounted(() => {
	fetchCrawlerStats();
	window.addEventListener("resize", handleResize);
});

// 清理
onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
	spiderTypePieChart?.dispose();
	trendLineChart?.dispose();
});

import { onUnmounted } from "vue";
</script>

<style lang="scss" scoped>
.crawler-stats-container {
	padding: 20px;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	min-height: 100vh;

	// 统计卡片区域
	.stats-header {
		margin-bottom: 30px;
		animation: slideInDown 0.6s ease-out;

		.stat-card {
			background: white;
			border-radius: 12px;
			padding: 20px;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
			cursor: pointer;
			position: relative;
			overflow: hidden;

			&::before {
				content: "";
				position: absolute;
				top: 0;
				left: -100%;
				width: 100%;
				height: 100%;
				background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
				transition: left 0.6s ease-in-out;
			}

			&:hover {
				transform: translateY(-8px);
				box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

				&::before {
					left: 100%;
				}
			}

			.stat-content {
				display: flex;
				align-items: center;
				gap: 15px;

				.stat-icon {
					font-size: 32px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.stat-info {
					flex: 1;

					.stat-label {
						font-size: 12px;
						color: #909399;
						margin-bottom: 8px;
						font-weight: 500;
					}

					.stat-value {
						font-size: 28px;
						font-weight: bold;
						color: #303133;
						margin-bottom: 8px;
					}

					.stat-trend {
						font-size: 12px;
						font-weight: 500;

						&.up {
							color: #67c23a;
						}

						&.down {
							color: #f56c6c;
						}
					}
				}
			}
		}
	}

	// 图表区域
	.charts-section {
		margin-bottom: 30px;

		.chart-card {
			background: white;
			border-radius: 12px;
			overflow: hidden;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			animation: slideInUp 0.6s ease-out;

			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 20px;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
				border-bottom: 1px solid rgba(0, 0, 0, 0.05);

				.title {
					font-size: 16px;
					font-weight: bold;
				}

				.subtitle {
					font-size: 12px;
					opacity: 0.8;
					margin-left: 10px;
				}
			}

			.chart-container {
				height: 350px;
				padding: 20px;
				position: relative;

				:deep(.echarts-container) {
					width: 100% !important;
					height: 100% !important;
				}
			}
		}
	}

	// 表格区域
	.table-section {
		margin-bottom: 30px;

		.chart-card {
			animation: slideInUp 0.6s ease-out 0.2s backwards;

			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.title {
					font-size: 16px;
					font-weight: bold;
				}
			}

			.crawler-table {
				:deep(.el-table__header th) {
					background: #f5f7fa;
					font-weight: bold;
				}

				:deep(.el-table__body tr:hover > td) {
					background-color: #f0f9ff !important;
				}

				.spider-name {
					font-weight: 500;
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.count-number {
					font-weight: bold;
					font-size: 16px;
					color: #409eff;
				}

				.time {
					font-size: 12px;
					color: #909399;
				}
			}
		}
	}

	// 子路由区域
	.children-section {
		animation: slideInUp 0.6s ease-out 0.4s backwards;
	}
}

// 动画定义
@keyframes slideInDown {
	from {
		opacity: 0;
		transform: translateY(-30px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes slideInUp {
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
	.crawler-stats-container {
		padding: 15px;

		.stat-card {
			.stat-content {
				flex-direction: column;
				text-align: center;
			}
		}

		.chart-container {
			height: 280px !important;
		}
	}
}
</style>
