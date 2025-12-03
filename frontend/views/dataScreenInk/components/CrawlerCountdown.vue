<template>
	<div class="crawler-countdown">
		<!-- 加载状态 -->
		<div v-if="loading" class="loading-state">
			<div class="loading-spinner"></div>
			<span class="loading-text">加载爬虫数据中...</span>
		</div>

		<!-- 空状态 -->
		<div v-else-if="crawlers.length === 0" class="empty-state">
			<span class="empty-icon">🕷️</span>
			<span class="empty-text">暂无爬虫数据</span>
		</div>

		<!-- 正常显示 -->
		<template v-else>
			<!-- 总数和导航 -->
			<div class="countdown-header">
				<div class="total-count">
					<span class="count-label">爬虫总数</span>
					<span class="count-value">{{ crawlers.length }}</span>
				</div>
				<div class="navigation">
					<button class="nav-btn prev" @click="prevCrawler" :disabled="currentIndex === 0">
						<span>◀</span>
					</button>
					<span class="page-indicator">{{ currentIndex + 1 }} / {{ crawlers.length }}</span>
					<button class="nav-btn next" @click="nextCrawler" :disabled="currentIndex === crawlers.length - 1">
						<span>▶</span>
					</button>
				</div>
			</div>

			<!-- 当前显示的爬虫卡片 -->
			<transition :name="slideDirection" mode="out-in">
				<div
					v-if="currentCrawler"
					:key="currentCrawler.id"
					class="countdown-card"
					@mouseenter="handleMouseEnter"
					@mouseleave="handleMouseLeave"
				>
					<!-- 卡片主体 -->
					<div class="card-header">
						<div class="crawler-icon" :style="{ color: currentCrawler.color }">
							{{ currentCrawler.icon }}
						</div>
						<div class="crawler-name">{{ currentCrawler.name }}</div>
						<div class="status-badge" :class="getStatusClass(currentCrawler.status)">
							{{ getStatusText(currentCrawler.status) }}
						</div>
					</div>

					<!-- 倒计时显示 或 已完成状态 -->
					<div v-if="isScheduleConfigured(currentCrawler)" class="countdown-display">
						<div v-if="formatTime(currentCrawler.nextRunTime).days !== '00'" class="time-unit">
							<span class="time-value">{{ formatTime(currentCrawler.nextRunTime).days }}</span>
							<span class="time-label">天</span>
						</div>
						<div class="time-unit">
							<span class="time-value">{{ formatTime(currentCrawler.nextRunTime).hours }}</span>
							<span class="time-label">时</span>
						</div>
						<span class="time-separator">:</span>
						<div class="time-unit">
							<span class="time-value">{{ formatTime(currentCrawler.nextRunTime).minutes }}</span>
							<span class="time-label">分</span>
						</div>
						<span class="time-separator">:</span>
						<div class="time-unit">
							<span class="time-value">{{ formatTime(currentCrawler.nextRunTime).seconds }}</span>
							<span class="time-label">秒</span>
						</div>
					</div>
					<div v-else class="completed-status">
						<span class="completed-text">已完成</span>
					</div>
					<!-- 进度条 -->
					<div v-if="isScheduleConfigured(currentCrawler)" class="progress-bar">
						<div
							class="progress-fill"
							:style="{
								width: getProgress(currentCrawler) + '%',
								background: currentCrawler.color
							}"
						></div>
					</div>
					<!-- 底部信息 -->
					<div class="card-footer">
						<span class="interval">间隔: {{ currentCrawler.interval }}</span>
					</div>
				</div>
			</transition>
		</template>

		<!-- 全局中央详情面板 -->
		<GlobalDetailPanel v-model="showDetail" :data="detailPanelData">
			<template #default>
				<div v-if="currentCrawler" class="custom-detail-content">
					<!-- 左侧统计 -->
					<div class="stats-section">
						<div class="detail-item">
							<span class="item-label">任务类型</span>
							<span class="item-value">{{ currentCrawler.type }}</span>
						</div>
						<div class="detail-item">
							<span class="item-label">目标地址</span>
							<span class="item-value url">{{ currentCrawler.url }}</span>
						</div>
						<div class="detail-item">
							<span class="item-label">执行频率</span>
							<span class="item-value">{{ currentCrawler.cron }}</span>
						</div>
						<div class="detail-item">
							<span class="item-label">成功率</span>
							<span class="item-value success">{{ currentCrawler.successRate }}%</span>
						</div>
						<div class="detail-item">
							<span class="item-label">累计执行</span>
							<span class="item-value">{{ currentCrawler.totalRuns }} 次</span>
						</div>
						<div class="detail-item">
							<span class="item-label">最近状态</span>
							<span class="item-value" :class="currentCrawler.lastStatus">
								{{ currentCrawler.lastStatus === "success" ? "✓ 成功" : "✗ 失败" }}
							</span>
						</div>
						<div class="detail-item">
							<span class="item-label">数据量</span>
							<span class="item-value">{{ currentCrawler.dataCount }} 条</span>
						</div>
						<div class="detail-item">
							<span class="item-label">平均耗时</span>
							<span class="item-value">{{ currentCrawler.avgDuration }}s</span>
						</div>
					</div>

					<!-- 右侧图表 -->
					<div class="chart-section">
						<div class="chart-title">性能指标</div>
						<div id="crawler-chart" class="chart-container"></div>
					</div>
				</div>
			</template>
		</GlobalDetailPanel>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { getCrawlerCountdownApi } from "@/api/dataScreen/index";
import GlobalDetailPanel from "@/components/DetailPanel/GlobalDetailPanel.vue";

interface Crawler {
	id: number;
	name: string;
	icon: string;
	color: string;
	status: "running" | "waiting" | "error";
	nextRunTime: number; // 距离下次运行的秒数
	lastRunTime: Date;
	interval: string;
	type: string;
	url: string;
	cron: string;
	successRate: number;
	totalRuns: number;
	lastStatus: "success" | "error";
	dataCount: number;
	avgDuration: number;
}

interface CrawlerResponse {
	crawlers: Crawler[];
	timestamp: string;
}

// 爬虫数据
const crawlers = ref<Crawler[]>([]);
const loading = ref(true);

// 状态变量
const currentIndex = ref(0);
const showDetail = ref(false); // 改为 showDetail，控制全局详情面板
const slideDirection = ref("slide-left");
let countdownTimer: any = null;
let autoPlayTimer: any = null;
let hoverTimer: any = null;

// 当前显示的爬虫
const currentCrawler = computed(() => {
	if (crawlers.value.length === 0) return null;
	return crawlers.value[currentIndex.value];
});

// 详情面板数据
const detailPanelData = computed(() => {
	if (!currentCrawler.value) return {};
	return {
		title: currentCrawler.value.name,
		icon: currentCrawler.value.icon,
		content: {
			任务类型: currentCrawler.value.type,
			执行频率: currentCrawler.value.cron,
			成功率: `${currentCrawler.value.successRate}%`,
			累计执行: `${currentCrawler.value.totalRuns} 次`,
			数据量: `${currentCrawler.value.dataCount} 条`,
			平均耗时: `${currentCrawler.value.avgDuration}s`
		}
	};
});

// 获取爬虫数据
const fetchCrawlerData = async () => {
	try {
		loading.value = true;
		const res = await getCrawlerCountdownApi();

		if (res.data && (res.data as CrawlerResponse).crawlers) {
			crawlers.value = (res.data as CrawlerResponse).crawlers.map((crawler: any) => ({
				...crawler,
				lastRunTime: new Date(crawler.lastRunTime),
				status: "waiting" as const
			}));
			console.log("✅ 成功获取爬虫倒计时数据:", crawlers.value.length, "个爬虫");
		} else {
			console.warn("⚠️  API返回数据格式异常");
			crawlers.value = [
				{
					id: 0,
					name: "数据加载异常",
					icon: "⚠️",
					color: "#ff0080",
					status: "error" as const,
					nextRunTime: 0,
					lastRunTime: new Date(),
					interval: "未知",
					type: "系统异常",
					url: "无法连接",
					cron: "-",
					successRate: 0,
					totalRuns: 0,
					lastStatus: "error" as const,
					dataCount: 0,
					avgDuration: 0
				}
			];
		}
	} catch (error) {
		console.error("❌ 获取爬虫倒计时数据失败:", error);
		crawlers.value = [
			{
				id: 0,
				name: "API连接失败",
				icon: "❌",
				color: "#ff0080",
				status: "error" as const,
				nextRunTime: 0,
				lastRunTime: new Date(),
				interval: "未知",
				type: "网络错误",
				url: "服务不可用",
				cron: "-",
				successRate: 0,
				totalRuns: 0,
				lastStatus: "error" as const,
				dataCount: 0,
				avgDuration: 0
			}
		];
	} finally {
		loading.value = false;
	}
};

// ECharts 图表实例
const chartInstance = ref<any>(null);

// 初始化ECharts图表
const initChart = () => {
	if (!currentCrawler.value) return;

	const chartDom = document.getElementById("crawler-chart");
	if (!chartDom) {
		console.warn("图表容器未找到，延迟重试...");
		setTimeout(initChart, 100);
		return;
	}

	// 销毁旧实例
	if (chartInstance.value) {
		chartInstance.value.dispose();
	}

	const echarts = (window as any).echarts;
	if (!echarts) {
		console.warn("ECharts未加载");
		return;
	}

	chartInstance.value = echarts.init(chartDom, "dark");

	const option = {
		backgroundColor: "transparent",
		grid: {
			left: "10%",
			right: "10%",
			top: "15%",
			bottom: "10%",
			containLabel: true
		},
		xAxis: {
			type: "category",
			data: ["成功率", "执行次数", "数据量", "平均耗时"],
			axisLine: { lineStyle: { color: "rgba(0,255,255,0.3)" } },
			axisLabel: { color: "#7a9fb5", fontSize: 12 }
		},
		yAxis: {
			type: "value",
			axisLine: { lineStyle: { color: "rgba(0,255,255,0.3)" } },
			axisLabel: { color: "#7a9fb5", fontSize: 12 },
			splitLine: { lineStyle: { color: "rgba(0,255,255,0.1)" } }
		},
		series: [
			{
				data: [
					currentCrawler.value.successRate,
					Math.min(currentCrawler.value.totalRuns / 10, 100),
					Math.min(currentCrawler.value.dataCount / 100, 100),
					Math.min(currentCrawler.value.avgDuration * 5, 100)
				],
				type: "bar",
				itemStyle: {
					color: currentCrawler.value.color,
					shadowBlur: 15,
					shadowColor: currentCrawler.value.color
				},
				barWidth: "45%"
			}
		]
	};

	chartInstance.value.setOption(option);
};

// 上一个
const prevCrawler = () => {
	if (currentIndex.value > 0) {
		slideDirection.value = "slide-right";
		currentIndex.value--;
		resetAutoPlay();
		showDetail.value = false;
	}
};

// 下一个
const nextCrawler = () => {
	if (currentIndex.value < crawlers.value.length - 1) {
		slideDirection.value = "slide-left";
		currentIndex.value++;
		resetAutoPlay();
		showDetail.value = false;
	}
};

// 自动轮播
const autoPlay = () => {
	if (crawlers.value.length === 0) return;
	if (showDetail.value) return; // 显示详情时不轮播

	if (currentIndex.value < crawlers.value.length - 1) {
		slideDirection.value = "slide-left";
		currentIndex.value++;
	} else {
		slideDirection.value = "slide-left";
		currentIndex.value = 0;
	}
};

// 重置自动轮播
const resetAutoPlay = () => {
	if (autoPlayTimer) {
		clearInterval(autoPlayTimer);
	}
	autoPlayTimer = setInterval(autoPlay, 5000);
};

// 鼠标移入 - 显示详情面板
const handleMouseEnter = () => {
	if (hoverTimer) {
		clearTimeout(hoverTimer);
	}

	hoverTimer = setTimeout(() => {
		if (!showDetail.value) {
			console.log("🔍 打开详情面板 - currentCrawler:", currentCrawler.value?.name);
			showDetail.value = true;

			// 暂停自动轮播
			if (autoPlayTimer) {
				clearInterval(autoPlayTimer);
				autoPlayTimer = null;
			}

			// 延迟初始化图表
			setTimeout(() => {
				initChart();
			}, 500);
		}
	}, 300);
};

// 鼠标移出
const handleMouseLeave = () => {
	if (hoverTimer) {
		clearTimeout(hoverTimer);
		hoverTimer = null;
	}

	// 不立即关闭，用户可能移动到全局详情面板
	setTimeout(() => {
		console.log("❌ 鼠标离开卡片");
	}, 100);
};

// 格式化时间 - 支持显示天数和小时
const formatTime = (seconds: number) => {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	return {
		days: String(days).padStart(2, "0"),
		hours: String(hours).padStart(2, "0"),
		minutes: String(minutes).padStart(2, "0"),
		seconds: String(secs).padStart(2, "0")
	};
};

// 获取状态类名
const getStatusClass = (status: string) => {
	return `status-${status}`;
};

// 获取状态文本
const getStatusText = (status: string) => {
	const map: Record<string, string> = {
		running: "运行中",
		waiting: "等待中",
		error: "异常"
	};
	return map[status] || status;
};

// 检查爬虫是否有配置的执行时间
const isScheduleConfigured = (crawler: Crawler): boolean => {
	return !!(crawler.cron && crawler.cron !== "未配置" && crawler.nextRunTime > 0);
};

// 计算进度 - 根据下次运行时间和调度频率来计算
const getProgress = (crawler: Crawler) => {
	// 根据爬虫名称推断总周期时间
	let totalSeconds = 86400; // 默认每天

	if (crawler.name === "热门话题") {
		totalSeconds = 43200; // 12小时一次（3个时间点）
	} else if (crawler.name === "游戏爬虫") {
		totalSeconds = 86400; // 每24小时一次
	} else if (crawler.name === "AI工具库") {
		totalSeconds = 86400; // 手动
	}

	const elapsed = totalSeconds - crawler.nextRunTime;
	return Math.min(100, (elapsed / totalSeconds) * 100);
};

// 倒计时逻辑 - 每秒递减，正确显示距离下次执行时间的倒计时
const updateCountdown = () => {
	crawlers.value.forEach(crawler => {
		if (crawler.nextRunTime > 0) {
			crawler.nextRunTime--;
		} else {
			// 倒计时完成，立即重新获取最新数据以获得正确的下次运行时间
			crawler.status = "running";
			setTimeout(() => {
				crawler.status = "waiting";
				// 触发数据刷新以获得正确的下次运行时间
				fetchCrawlerData();
			}, 2000);
		}
	});
};

onMounted(async () => {
	await fetchCrawlerData();
	countdownTimer = setInterval(updateCountdown, 1000);
	autoPlayTimer = setInterval(autoPlay, 5000);
	setInterval(fetchCrawlerData, 5 * 60 * 1000);
});

onBeforeUnmount(() => {
	if (countdownTimer) {
		clearInterval(countdownTimer);
	}
	if (autoPlayTimer) {
		clearInterval(autoPlayTimer);
	}
	if (hoverTimer) {
		clearTimeout(hoverTimer);
	}
	if (chartInstance.value) {
		chartInstance.value.dispose();
	}
});
</script>

<style scoped lang="scss">
.crawler-countdown {
	display: flex;
	flex-direction: column;
	height: 100%;
	position: relative;
	overflow: visible !important;
}

// 加载状态
.loading-state,
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	gap: 15px;

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(0, 255, 255, 0.2);
		border-top-color: #00ffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-text,
	.empty-text {
		font-size: 13px;
		color: #7a9fb5;
		letter-spacing: 0.5px;
	}

	.empty-icon {
		font-size: 48px;
		opacity: 0.5;
		filter: grayscale(1);
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.countdown-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 15px;
	padding: 0 5px;

	.total-count {
		display: flex;
		align-items: center;
		gap: 8px;

		.count-label {
			font-size: 11px;
			color: #7a9fb5;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.count-value {
			font-size: 18px;
			font-weight: 700;
			font-family: "Orbitron", "Courier New", monospace;
			color: #ff6b35;
			text-shadow: 0 0 8px rgba(255, 107, 53, 0.6);
			padding: 2px 8px;
			background: rgba(255, 107, 53, 0.1);
			border: 1px solid rgba(255, 107, 53, 0.3);
			border-radius: 2px;
		}
	}

	.navigation {
		display: flex;
		align-items: center;
		gap: 8px;

		.nav-btn {
			width: 28px;
			height: 28px;
			background: rgba(0, 255, 255, 0.1);
			border: 1px solid rgba(0, 255, 255, 0.3);
			color: #00ffff;
			cursor: pointer;
			transition: all 0.3s;
			clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 12px;

			&:hover:not(:disabled) {
				background: rgba(0, 255, 255, 0.2);
				border-color: #00ffff;
				box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
				transform: scale(1.05);
			}

			&:disabled {
				opacity: 0.3;
				cursor: not-allowed;
			}
		}

		.page-indicator {
			font-size: 11px;
			color: #7a9fb5;
			font-family: "Courier New", monospace;
			min-width: 40px;
			text-align: center;
		}
	}
}

.countdown-card {
	position: relative;
	background: rgba(10, 20, 35, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	padding: 12px 15px;
	cursor: pointer;
	transition: all 0.3s ease;
	overflow: visible;
	z-index: 1;

	// 机械切角
	clip-path: polygon(
		0 8px,
		8px 0,
		calc(100% - 8px) 0,
		100% 8px,
		100% calc(100% - 8px),
		calc(100% - 8px) 100%,
		8px 100%,
		0 calc(100% - 8px)
	);

	&:hover {
		border-color: rgba(0, 255, 255, 0.5);
		background: rgba(10, 20, 35, 0.8);
		box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
		transform: translateX(-3px);
		z-index: 1;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;

		.crawler-icon {
			font-size: 20px;
			filter: drop-shadow(0 0 5px currentColor);
		}

		.crawler-name {
			flex: 1;
			font-size: 13px;
			font-weight: 600;
			color: #e0f7ff;
			letter-spacing: 0.5px;
		}

		.status-badge {
			padding: 2px 8px;
			font-size: 11px;
			border-radius: 2px;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.5px;

			&.status-running {
				background: rgba(0, 255, 127, 0.2);
				color: #00ff7f;
				border: 1px solid rgba(0, 255, 127, 0.4);
			}

			&.status-waiting {
				background: rgba(0, 255, 255, 0.2);
				color: #00ffff;
				border: 1px solid rgba(0, 255, 255, 0.4);
			}

			&.status-error {
				background: rgba(255, 0, 128, 0.2);
				color: #ff0080;
				border: 1px solid rgba(255, 0, 128, 0.4);
			}
		}
	}

	.countdown-display {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 5px;
		margin: 15px 0;

		.time-unit {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2px;

			.time-value {
				font-size: 24px;
				font-weight: 700;
				font-family: "Orbitron", "Courier New", monospace;
				color: #ff6b35;
				text-shadow: 0 0 5px rgba(255, 107, 53, 0.8), 0 0 10px rgba(255, 107, 53, 0.5);
				letter-spacing: 2px;
			}

			.time-label {
				font-size: 10px;
				color: #7a9fb5;
				text-transform: uppercase;
			}
		}

		.time-separator {
			font-size: 20px;
			color: #00ffff;
			margin: 0 3px;
			animation: blink 2s infinite;
		}
	}

	.progress-bar {
		height: 3px;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 2px;
		overflow: hidden;
		margin: 10px 0;

		.progress-fill {
			height: 100%;
			transition: width 1s linear;
			box-shadow: 0 0 10px currentColor;
			position: relative;

			&::after {
				content: "";
				position: absolute;
				top: 0;
				right: 0;
				width: 20px;
				height: 100%;
				background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5));
				animation: progress-shimmer 2s infinite;
			}
		}
	}

	.completed-status {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 15px 0;

		.completed-text {
			font-size: 20px;
			font-weight: 600;
			color: #00ff88;
			text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
			letter-spacing: 1px;
			text-transform: uppercase;
		}
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: #7a9fb5;
		margin-top: 8px;
		justify-content: flex-end;

		span {
			display: flex;
			align-items: center;
		}
	}
}

// 详情面板内容样式（用于全局组件中的插槽）
.custom-detail-content {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 40px;
	width: 100%;
	height: 100%;

	.stats-section {
		display: flex;
		flex-direction: column;
		gap: 25px;
		padding-right: 20px;
		border-right: 1px solid rgba(0, 255, 255, 0.15);
		overflow-y: auto;

		&::-webkit-scrollbar {
			width: 6px;
		}

		&::-webkit-scrollbar-track {
			background: rgba(0, 0, 0, 0.2);
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(0, 255, 255, 0.3);
			border-radius: 3px;

			&:hover {
				background: rgba(0, 255, 255, 0.5);
			}
		}
	}

	.chart-section {
		display: flex;
		flex-direction: column;
		gap: 20px;

		.chart-title {
			font-size: 18px;
			font-weight: 600;
			color: #00ffff;
			text-transform: uppercase;
			letter-spacing: 1.5px;
			text-align: center;
			text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
		}

		.chart-container {
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(0, 255, 255, 0.2);
			border-radius: 4px;
			min-height: 350px;
		}
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		font-size: 15px;
		padding-bottom: 20px;
		border-bottom: 1px solid rgba(0, 255, 255, 0.15);

		&:last-child {
			border-bottom: none;
			padding-bottom: 0;
		}

		.item-label {
			color: #7a9fb5;
			font-weight: 600;
			min-width: 100px;
			font-size: 14px;
		}

		.item-value {
			color: #e0f7ff;
			font-weight: 600;
			max-width: 200px;
			text-align: right;
			line-height: 1.8;
			word-break: break-word;

			&.url {
				font-family: "Courier New", monospace;
				font-size: 12px;
				color: #00ffff;
			}

			&.success {
				color: #00ff7f;
				text-shadow: 0 0 8px rgba(0, 255, 127, 0.6);
				font-weight: 700;
			}

			&.error {
				color: #ff0080;
				text-shadow: 0 0 8px rgba(255, 0, 128, 0.6);
				font-weight: 700;
			}
		}
	}
}

// 动画定义
@keyframes blink {
	0%,
	49%,
	100% {
		opacity: 1;
	}
	50%,
	99% {
		opacity: 0.3;
	}
}

@keyframes progress-shimmer {
	0% {
		transform: translateX(-20px);
	}
	100% {
		transform: translateX(300px);
	}
}

// 左右切换动画
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
	transition: all 0.4s ease;
}

.slide-left-enter-from {
	opacity: 0;
	transform: translateX(30px);
}

.slide-left-leave-to {
	opacity: 0;
	transform: translateX(-30px);
}

.slide-right-enter-from {
	opacity: 0;
	transform: translateX(-30px);
}

.slide-right-leave-to {
	opacity: 0;
	transform: translateX(30px);
}
</style>
