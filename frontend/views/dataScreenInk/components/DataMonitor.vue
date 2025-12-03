<template>
	<div class="data-monitor">
		<!-- 日期选择和自动播放控制 -->
		<div class="date-control">
			<div class="date-selector">
				<button
					v-for="(item, index) in trendData"
					:key="item.date"
					:class="['date-btn', { active: selectedDateIndex === index }]"
					@click="selectDate(index)"
				>
					{{ item.date.split("-").slice(1).join("-") }}
				</button>
			</div>
			<button :class="['play-btn', { playing: isAutoPlay }]" @click="toggleAutoPlay">
				{{ isAutoPlay ? "⏸ 暂停" : "▶ 自动播放" }}
			</button>
		</div>

		<!-- 数据统计卡片 -->
		<div class="monitor-cards">
			<div v-for="item in spiderStats" :key="item.spiderType" class="monitor-card">
				<div class="card-header">
					<span class="card-icon">{{ item.icon }}</span>
					<span class="card-title">{{ item.name }}</span>
				</div>
				<div class="card-stats">
					<div class="stat-item">
						<span class="stat-label">数据量</span>
						<span class="stat-value">{{ item.totalCount }}</span>
						<span class="stat-unit">条</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">成功率</span>
						<span class="stat-value">{{ item.successRate }}</span>
						<span class="stat-unit">%</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 时间序列图表 -->
		<div class="chart-container">
			<div ref="chartRef" style="width: 100%; height: 100%"></div>

			<!-- 选中日期的详情框 -->
			<div v-if="selectedTrendData" class="date-info-box">
				<div class="info-header">
					<span class="info-date">📅 {{ selectedTrendData.date }}</span>
					<button class="close-btn" @click="selectedDateIndex = -1">✕</button>
				</div>
				<div class="info-content">
					<div class="info-item">
						<span class="info-label">总数据量</span>
						<span class="info-value">{{ selectedTrendData.total }} 条</span>
					</div>
					<div class="info-item">
						<span class="info-label">成功数据</span>
						<span class="info-value">{{ selectedTrendData.success }} 条 (成功: {{ selectedTrendData.success }} 条)</span>
					</div>
					<div class="info-spiders">
						<div class="spiders-title">爬虫详情</div>
						<div v-for="(spider, key) in selectedTrendData.spiders" :key="key" class="spider-item">
							<span class="spider-name">{{ getSpiderName(key) }}</span>
							<span class="spider-count">{{ spider.dataCount }}条 (成功: {{ spider.successCount }}条)</span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- 底部数据对比 -->
		<div class="comparison-container">
			<div class="comparison-item">
				<span class="comparison-label">总爬虫数</span>
				<span class="comparison-value">{{ totalSpiders }}</span>
			</div>
			<div class="comparison-item">
				<span class="comparison-label">总数据量</span>
				<span class="comparison-value">{{ totalDataCount }}</span>
			</div>
			<div class="comparison-item">
				<span class="comparison-label">平均成功率</span>
				<span class="comparison-value">{{ avgSuccessRate }}%</span>
			</div>
			<div class="comparison-item">
				<span class="comparison-label">7日总增长</span>
				<span class="comparison-value">{{ sevenDayGrowth }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import * as echarts from "echarts";
import { getCrawlerStatsApi } from "@/api/dataScreen/index";

interface SpiderStat {
	spiderType: string;
	name: string;
	icon: string;
	totalCount: number;
	successRate: number;
}

interface TrendData {
	date: string;
	timestamp: number;
	total: number;
	success: number;
	spiders: Record<string, any>;
}

const chartRef = ref<HTMLElement>();
let chart: echarts.ECharts | null = null;
const spiderStats = ref<SpiderStat[]>([]);
const trendData = ref<TrendData[]>([]);
const selectedDateIndex = ref(-1); // -1 表示未选择
const isAutoPlay = ref(false); // 自动播放状态
let autoPlayTimer: ReturnType<typeof setInterval> | null = null;
const autoPlayInterval = ref(5000); // 每 5 秒切换一次日期

const totalSpiders = computed(() => spiderStats.value.length);
const totalDataCount = computed(() => spiderStats.value.reduce((sum, item) => sum + item.totalCount, 0));
const avgSuccessRate = computed(() => {
	if (spiderStats.value.length === 0) return 0;
	const total = spiderStats.value.reduce((sum, item) => sum + parseFloat(String(item.successRate)), 0);
	return Math.round(total / spiderStats.value.length);
});
const sevenDayGrowth = computed(() => {
	if (trendData.value.length === 0) return 0;
	// 7日总增长: 统计所有日期的总数据量之和
	const totalGrowth = trendData.value.reduce((sum, item) => sum + (item.total || 0), 0);
	return totalGrowth;
});

// 选中日期的数据
const selectedTrendData = computed(() => {
	if (selectedDateIndex.value === -1 || selectedDateIndex.value >= trendData.value.length) {
		return null;
	}
	return trendData.value[selectedDateIndex.value];
});

// 初始化图表
const initChart = () => {
	if (!chartRef.value) return;

	if (chart) {
		chart.dispose();
	}

	chart = echarts.init(chartRef.value, null, { renderer: "canvas" });

	const dates = trendData.value.map(item => item.date.split("-").slice(1).join("-"));
	const totals = trendData.value.map(item => item.total);
	const successes = trendData.value.map(item => item.success);

	const option: echarts.EChartsOption = {
		tooltip: {
			trigger: "axis",
			axisPointer: { type: "cross" },
			formatter: (params: any) => {
				if (!Array.isArray(params)) params = [params];
				let result = `<div style="font-size: 12px; color: #0ff;">📅 ${params[0]?.axisValue}<br/>`;

				params.forEach((param: any) => {
					const dataIndex = param.dataIndex;
					const item = trendData.value[dataIndex];

					result += `<span style="color: ${param.color}">● ${param.seriesName}: ${param.value} 条</span><br/>`;

					// 如果是鼠标悬停，显示详细信息
					if (item?.spiders && Object.keys(item.spiders).length > 0) {
						Object.entries(item.spiders).forEach(([key, spider]: any) => {
							const spiderName =
								key === "game" ? "游戏爬虫" : key === "hot_topics" ? "热门话题" : key === "ai_info" ? "AI工具库" : key;
							result += `&nbsp;&nbsp;├ ${spiderName}: ${spider.dataCount}条 (成功: ${spider.successCount}条)<br/>`;
						});
					}
				});
				result += `</div>`;
				return result;
			},
			backgroundColor: "rgba(0, 20, 40, 0.8)",
			borderColor: "#00ffff",
			borderWidth: 1,
			textStyle: { color: "#0ff", fontSize: 11 }
		},
		grid: {
			left: "45px",
			right: "30px",
			bottom: "35px",
			top: "10px",
			containLabel: false
		},
		xAxis: {
			type: "category",
			data: dates,
			boundaryGap: false,
			axisLine: { lineStyle: { color: "#1a4d5c" } },
			axisLabel: { color: "#0f8", fontSize: 10 },
			splitLine: { show: false }
		},
		yAxis: {
			type: "value",
			axisLine: { lineStyle: { color: "#1a4d5c" } },
			axisLabel: { color: "#0f8", fontSize: 10 },
			splitLine: { lineStyle: { color: "#1a4d5c", type: "dashed" } },
			name: "数据量(条)",
			nameTextStyle: { color: "#0f8", fontSize: 10 }
		},
		series: [
			{
				name: "总数据量",
				type: "line",
				data: totals,
				smooth: true,
				itemStyle: { color: "#00ff88", borderWidth: 2 },
				lineStyle: { color: "#00ff88", width: 2 },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: "rgba(0, 255, 136, 0.3)" },
						{ offset: 1, color: "rgba(0, 255, 136, 0.05)" }
					])
				},
				symbolSize: 5
			},
			{
				name: "成功数据",
				type: "line",
				data: successes,
				smooth: true,
				itemStyle: { color: "#ff6b35", borderWidth: 2 },
				lineStyle: { color: "#ff6b35", width: 2 },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: "rgba(255, 107, 53, 0.3)" },
						{ offset: 1, color: "rgba(255, 107, 53, 0.05)" }
					])
				},
				symbolSize: 5
			}
		]
	};

	chart.setOption(option);
};

// 获取爬虫图标
const getSpiderIcon = (type: string): string => {
	const iconMap: Record<string, string> = {
		game: "🎮",
		hot_topics: "🔥",
		ai_info: "🤖"
	};
	return iconMap[type] || "🕷️";
};

// 获取爬虫名称
const getSpiderName = (key: string): string => {
	const nameMap: Record<string, string> = {
		game: "游戏爬虫",
		hot_topics: "热门话题",
		ai_info: "AI工具库"
	};
	return nameMap[key] || key;
};

// 选择日期
const selectDate = (index: number) => {
	selectedDateIndex.value = index;
	// 选择日期后停止自动播放
	if (isAutoPlay.value) {
		toggleAutoPlay();
	}
};

// 切换自动播放
const toggleAutoPlay = () => {
	isAutoPlay.value = !isAutoPlay.value;

	if (isAutoPlay.value) {
		// 从第一个开始
		selectedDateIndex.value = 0;

		autoPlayTimer = setInterval(() => {
			selectedDateIndex.value = (selectedDateIndex.value + 1) % trendData.value.length;
		}, autoPlayInterval.value);
	} else {
		// 停止自动播放
		if (autoPlayTimer) {
			clearInterval(autoPlayTimer);
			autoPlayTimer = null;
		}
	}
};

// 获取数据
const fetchData = async () => {
	try {
		const response: any = await getCrawlerStatsApi();
		if (response?.data) {
			// 处理爬虫统计数据
			spiderStats.value = (response.data.crawlers || []).map((crawler: any) => {
				// 从名称推断 spiderType
				let spiderType = "unknown";
				if (crawler.spiderName.includes("游戏")) {
					spiderType = "game";
				} else if (crawler.spiderName.includes("热门")) {
					spiderType = "hot_topics";
				} else if (crawler.spiderName.includes("AI")) {
					spiderType = "ai_info";
				}

				return {
					spiderType: spiderType,
					name: crawler.spiderName,
					icon: getSpiderIcon(spiderType),
					totalCount: crawler.totalCount || 0,
					successRate: parseFloat(String(crawler.successRate || 0)).toFixed(1)
				};
			});

			// 处理趋势数据
			trendData.value = response.data.trendData || [];

			// 初始化/更新图表
			if (chart) {
				initChart();
			} else {
				// 等待 DOM 渲染
				setTimeout(initChart, 100);
			}
		}
	} catch (error) {
		console.error("获取数据失败:", error);
	}
};

// 处理窗口缩放
const handleResize = () => {
	if (chart) {
		chart.resize();
	}
};

let dataRefreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
	fetchData();
	// 每 90 秒刷新一次数据
	dataRefreshInterval = setInterval(fetchData, 90000);

	window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
	if (dataRefreshInterval) {
		clearInterval(dataRefreshInterval);
	}
	if (autoPlayTimer) {
		clearInterval(autoPlayTimer);
	}
	window.removeEventListener("resize", handleResize);
	if (chart) {
		chart.dispose();
	}
});
</script>

<style lang="scss" scoped>
.data-monitor {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 0;

	// 日期控制栏
	.date-control {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		background: rgba(0, 20, 40, 0.5);
		border: 1px solid rgba(0, 255, 255, 0.2);
		border-radius: 4px;
		overflow-x: auto;

		.date-selector {
			display: flex;
			gap: 6px;
			flex: 1;
			overflow-x: auto;

			&::-webkit-scrollbar {
				height: 4px;
			}

			&::-webkit-scrollbar-thumb {
				background: rgba(0, 255, 255, 0.3);
				border-radius: 2px;
			}
		}

		.date-btn {
			padding: 6px 12px;
			background: rgba(0, 255, 255, 0.1);
			border: 1px solid rgba(0, 255, 255, 0.3);
			color: #7a9fb5;
			border-radius: 3px;
			cursor: pointer;
			white-space: nowrap;
			font-size: 12px;
			transition: all 0.3s ease;

			&:hover {
				background: rgba(0, 255, 255, 0.15);
				color: #00ffff;
				border-color: rgba(0, 255, 255, 0.5);
			}

			&.active {
				background: rgba(0, 255, 255, 0.3);
				color: #00ffff;
				border-color: #00ffff;
				box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
			}
		}

		.play-btn {
			padding: 6px 16px;
			background: rgba(255, 107, 53, 0.2);
			border: 1px solid rgba(255, 107, 53, 0.4);
			color: #ff6b35;
			border-radius: 3px;
			cursor: pointer;
			font-size: 12px;
			white-space: nowrap;
			transition: all 0.3s ease;

			&:hover {
				background: rgba(255, 107, 53, 0.3);
				border-color: rgba(255, 107, 53, 0.6);
				box-shadow: 0 0 10px rgba(255, 107, 53, 0.2);
			}

			&.playing {
				background: rgba(0, 255, 127, 0.2);
				border-color: rgba(0, 255, 127, 0.4);
				color: #00ff7f;
				box-shadow: 0 0 15px rgba(0, 255, 127, 0.3);
			}
		}
	}

	.monitor-cards {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;

		.monitor-card {
			flex: 1;
			min-width: 140px;
			background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 100, 255, 0.05) 100%);
			border: 1px solid rgba(0, 255, 255, 0.2);
			border-radius: 6px;
			padding: 10px;
			display: flex;
			flex-direction: column;
			gap: 8px;
			transition: all 0.3s ease;

			&:hover {
				background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 100, 255, 0.1) 100%);
				border-color: rgba(0, 255, 255, 0.4);
				box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
				transform: translateY(-2px);
			}

			.card-header {
				display: flex;
				align-items: center;
				gap: 6px;

				.card-icon {
					font-size: 18px;
				}

				.card-title {
					font-size: 12px;
					color: rgba(0, 255, 255, 0.8);
					font-weight: 600;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}

			.card-stats {
				display: flex;
				gap: 6px;
				flex-wrap: wrap;

				.stat-item {
					flex: 1;
					min-width: 55px;
					display: flex;
					flex-direction: column;
					gap: 2px;

					.stat-label {
						font-size: 9px;
						color: rgba(0, 255, 255, 0.5);
						text-transform: uppercase;
					}

					.stat-value {
						font-size: 16px;
						color: #00ff88;
						font-weight: bold;
						text-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
					}

					.stat-unit {
						font-size: 9px;
						color: rgba(0, 255, 255, 0.5);
					}
				}
			}
		}
	}

	.chart-container {
		flex: 1;
		min-height: 320px;
		background: linear-gradient(135deg, rgba(0, 255, 255, 0.03) 0%, rgba(0, 100, 255, 0.03) 100%);
		border: 1px solid rgba(0, 255, 255, 0.15);
		border-radius: 6px;
		padding: 0;
		overflow: hidden;
		position: relative;

		// 详情框
		.date-info-box {
			position: absolute;
			top: 20px;
			left: 20px;
			background: rgba(0, 20, 40, 0.95);
			border: 2px solid rgba(0, 255, 255, 0.4);
			border-radius: 8px;
			padding: 16px;
			min-width: 280px;
			max-width: 350px;
			box-shadow: 0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.05);
			z-index: 10;
			animation: slideIn 0.3s ease;

			.info-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 12px;
				padding-bottom: 10px;
				border-bottom: 1px solid rgba(0, 255, 255, 0.2);

				.info-date {
					font-size: 14px;
					color: #00ffff;
					font-weight: 600;
					text-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
					letter-spacing: 0.5px;
				}

				.close-btn {
					background: rgba(255, 0, 128, 0.2);
					border: 1px solid rgba(255, 0, 128, 0.3);
					color: #ff0080;
					width: 24px;
					height: 24px;
					border-radius: 3px;
					cursor: pointer;
					font-size: 12px;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.2s ease;

					&:hover {
						background: rgba(255, 0, 128, 0.3);
						border-color: rgba(255, 0, 128, 0.5);
					}
				}
			}

			.info-content {
				display: flex;
				flex-direction: column;
				gap: 10px;

				.info-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					font-size: 12px;

					.info-label {
						color: rgba(0, 255, 255, 0.6);
						text-transform: uppercase;
						font-weight: 600;
						letter-spacing: 0.5px;
						min-width: 80px;
					}

					.info-value {
						color: #00ff88;
						font-weight: 600;
						text-shadow: 0 0 6px rgba(0, 255, 136, 0.3);
						text-align: right;
					}
				}

				.info-spiders {
					margin-top: 8px;
					padding-top: 10px;
					border-top: 1px solid rgba(0, 255, 255, 0.15);

					.spiders-title {
						font-size: 11px;
						color: #00ffff;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: 0.5px;
						margin-bottom: 8px;
					}

					.spider-item {
						display: flex;
						justify-content: space-between;
						font-size: 11px;
						padding: 6px;
						background: rgba(0, 0, 0, 0.3);
						border-radius: 3px;
						margin-bottom: 4px;

						.spider-name {
							color: rgba(0, 255, 255, 0.7);
							font-weight: 600;
						}

						.spider-count {
							color: #ff6b35;
							text-align: right;
						}

						&:last-child {
							margin-bottom: 0;
						}
					}
				}
			}

			@keyframes slideIn {
				from {
					opacity: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}
		}
	}

	.comparison-container {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;

		.comparison-item {
			background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 107, 53, 0.05) 100%);
			border: 1px solid rgba(0, 255, 255, 0.15);
			border-radius: 6px;
			padding: 12px;
			display: flex;
			flex-direction: column;
			gap: 6px;
			align-items: center;
			justify-content: center;
			transition: all 0.3s ease;

			&:hover {
				background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%);
				border-color: rgba(0, 255, 255, 0.3);
				box-shadow: 0 0 12px rgba(0, 255, 255, 0.15);
			}

			.comparison-label {
				font-size: 11px;
				color: rgba(0, 255, 255, 0.6);
				text-transform: uppercase;
				letter-spacing: 0.5px;
			}

			.comparison-value {
				font-size: 20px;
				color: #00ff88;
				font-weight: bold;
				text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
			}
		}
	}
}
</style>
