<template>
	<div class="hot-topics-ranking">
		<!-- 显示模式切换 -->
		<div class="mode-switcher">
			<div
				v-for="mode in ['流动列表', '网格卡片', '对比分析']"
				:key="mode"
				class="mode-btn"
				:class="{ active: currentMode === mode }"
				@click="switchMode(mode)"
			>
				<span class="mode-icon">
					{{ mode === "流动列表" ? "📋" : mode === "网格卡片" ? "📦" : "📊" }}
				</span>
				<span class="mode-label">{{ mode }}</span>
			</div>
		</div>

		<!-- 模式内容容器 - 带滑动动画 -->
		<transition :name="'slide-' + modeDirection" mode="out-in">
			<!-- 模式1: 流动列表 - 排名榜单 -->
			<div v-if="currentMode === '流动列表'" class="mode-content flowing-list" :key="'flowing-list'">
				<vue3-seamless-scroll :list="sortedTopics" class="scroll-wrapper" :step="0.3" :hover="true" :limitScrollNum="4">
					<div class="topic-list">
						<div v-for="(topic, index) in sortedTopics" :key="topic.id" class="topic-item">
							<!-- 排名编号 -->
							<div class="rank-number">
								<span class="rank-value">{{ index + 1 }}</span>
								<span class="rank-icon" v-if="index < 3">
									{{ index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉" }}
								</span>
							</div>

							<!-- 话题内容 -->
							<div class="topic-content">
								<div class="topic-header">
									<h3 class="topic-title">{{ topic.title }}</h3>
									<div class="topic-meta">
										<span class="meta-item hot-value">
											<i>🔥</i>
											{{ formatNumber(topic.hotValue) }}
										</span>
										<span class="meta-item trend" :class="getTrendClass(topic.trend)">
											<i>{{ topic.trend > 0 ? "📈" : "📉" }}</i>
											{{ Math.abs(topic.trend) }}%
										</span>
										<span class="meta-item source">{{ topic.source }}</span>
									</div>
								</div>

								<!-- 话题描述 -->
								<p class="topic-description">{{ topic.description }}</p>

								<!-- 进度条 -->
								<div class="topic-progress">
									<div
										class="progress-fill"
										:style="{
											width: (topic.hotValue / maxHotValue) * 100 + '%',
											background: `linear-gradient(90deg, ${topic.color}, ${topic.colorLight})`
										}"
									>
										<span class="progress-text">{{ Math.round((topic.hotValue / maxHotValue) * 100) }}%</span>
									</div>
								</div>

								<!-- 标签 -->
								<div class="topic-tags">
									<span v-for="tag in topic.tags" :key="tag" class="tag">{{ tag }}</span>
								</div>
							</div>

							<!-- 右侧数据卡 -->
							<div class="topic-stats">
								<div class="stat-item">
									<div class="stat-label">讨论</div>
									<div class="stat-value">{{ formatNumber(topic.discussions) }}</div>
								</div>
								<div class="stat-item">
									<div class="stat-label">分享</div>
									<div class="stat-value">{{ formatNumber(topic.shares) }}</div>
								</div>
								<div class="stat-item">
									<div class="stat-label">参与</div>
									<div class="stat-value">{{ formatNumber(topic.participants) }}</div>
								</div>
							</div>
						</div>
					</div>
				</vue3-seamless-scroll>
			</div>

			<!-- 模式2: 网格卡片 - 视觉冲击 -->
			<div v-else-if="currentMode === '网格卡片'" class="mode-content grid-cards" :key="'grid-cards'">
				<vue3-seamless-scroll :list="topicsForGrid" class="scroll-wrapper" :step="0.2" :hover="true" :limitScrollNum="3">
					<div class="cards-grid">
						<div
							v-for="(topic, index) in topicsForGrid"
							:key="topic.id"
							class="card-item"
							:style="{
								'--color': topic.color,
								'--color-light': topic.colorLight
							}"
						>
							<!-- 排名徽章 -->
							<div class="card-rank">
								<span class="rank-num">{{ index + 1 }}</span>
							</div>

							<!-- 热度条 -->
							<div class="card-heat-bar">
								<div
									class="heat-fill"
									:style="{
										width: (topic.hotValue / maxHotValue) * 100 + '%',
										background: `linear-gradient(90deg, ${topic.color}, ${topic.colorLight})`
									}"
								></div>
							</div>

							<!-- 卡片主体 -->
							<div class="card-body">
								<h3 class="card-title">{{ topic.title }}</h3>

								<!-- 主要数据 -->
								<div class="card-main-data">
									<div class="data-block hot">
										<span class="data-icon">🔥</span>
										<div>
											<div class="data-label">热度</div>
											<div class="data-value">{{ formatNumber(topic.hotValue) }}</div>
										</div>
									</div>
									<div class="data-block trend" :class="getTrendClass(topic.trend)">
										<span class="data-icon">{{ topic.trend > 0 ? "📈" : "📉" }}</span>
										<div>
											<div class="data-label">变化</div>
											<div class="data-value">{{ Math.abs(topic.trend) }}%</div>
										</div>
									</div>
								</div>

								<!-- 趋势图 -->
								<div class="card-sparkline">
									<svg :viewBox="`0 0 ${topic.sparkline.length} 20`" preserveAspectRatio="none">
										<polyline
											:points="generateSparklinePoints(topic.sparkline)"
											:stroke="topic.color"
											stroke-width="1"
											fill="none"
										/>
									</svg>
								</div>

								<!-- 来源和标签 -->
								<div class="card-footer">
									<span class="source-badge">{{ topic.source }}</span>
									<span class="participants-badge">{{ formatNumber(topic.participants) }}人</span>
								</div>
							</div>
						</div>
					</div>
				</vue3-seamless-scroll>
			</div>

			<!-- 模式3: 对比分析 - 数据洞察 -->
			<div v-else-if="currentMode === '对比分析'" class="mode-content comparison-analysis" :key="'comparison-analysis'">
				<vue3-seamless-scroll :list="sortedTopics" class="scroll-wrapper" :step="0.25" :hover="true" :limitScrollNum="2">
					<div class="analysis-container">
						<!-- 顶部排名 -->
						<div class="top-ranking">
							<div class="ranking-title">🏆 TOP 3 排名</div>
							<div class="ranking-items">
								<div v-for="(topic, index) in sortedTopics.slice(0, 3)" :key="topic.id" class="rank-item">
									<div class="rank-medal">
										{{ index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉" }}
									</div>
									<div class="rank-info">
										<div class="rank-title">{{ topic.title }}</div>
										<div class="rank-meta">
											<span>热度: {{ formatNumber(topic.hotValue) }}</span>
											<span>变化: {{ topic.trend > 0 ? "+" : "" }}{{ topic.trend }}%</span>
										</div>
									</div>
									<div class="rank-heat-bar">
										<div
											class="heat-fill"
											:style="{
												width: (topic.hotValue / maxHotValue) * 100 + '%',
												background: `linear-gradient(90deg, ${topic.color}, ${topic.colorLight})`
											}"
										></div>
									</div>
								</div>
							</div>
						</div>

						<!-- 多维度对比 -->
						<div class="multi-dimension">
							<!-- 热度对比 -->
							<div class="dimension-chart">
								<div class="chart-title">📊 热度对比</div>
								<div class="chart-bars">
									<div v-for="topic in sortedTopics.slice(0, 5)" :key="`heat-${topic.id}`" class="bar-item">
										<div class="bar-label">{{ topic.title.slice(0, 8) }}</div>
										<div class="bar-track">
											<div
												class="bar-fill"
												:style="{
													width: (topic.hotValue / maxHotValue) * 100 + '%',
													background: `linear-gradient(90deg, ${topic.color}, ${topic.colorLight})`
												}"
											>
												{{ formatNumber(topic.hotValue) }}
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- 参与度对比 -->
							<div class="dimension-chart">
								<div class="chart-title">👥 参与度对比</div>
								<div class="chart-bars">
									<div v-for="topic in sortedTopicsByParticipants.slice(0, 5)" :key="`part-${topic.id}`" class="bar-item">
										<div class="bar-label">{{ topic.title.slice(0, 8) }}</div>
										<div class="bar-track">
											<div
												class="bar-fill"
												:style="{
													width: (topic.participants / maxParticipants) * 100 + '%',
													background: `linear-gradient(90deg, ${topic.color}, ${topic.colorLight})`
												}"
											>
												{{ formatNumber(topic.participants) }}
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- 分享热度对比 -->
							<div class="dimension-chart">
								<div class="chart-title">🔗 分享热度对比</div>
								<div class="chart-bars">
									<div v-for="topic in sortedTopicsByShares.slice(0, 5)" :key="`share-${topic.id}`" class="bar-item">
										<div class="bar-label">{{ topic.title.slice(0, 8) }}</div>
										<div class="bar-track">
											<div
												class="bar-fill"
												:style="{
													width: (topic.shares / maxShares) * 100 + '%',
													background: `linear-gradient(90deg, ${topic.color}, ${topic.colorLight})`
												}"
											>
												{{ formatNumber(topic.shares) }}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- 统计概览 -->
						<div class="stats-overview">
							<div class="overview-item">
								<div class="overview-icon">📈</div>
								<div class="overview-label">总热度</div>
								<div class="overview-value">{{ formatNumber(totalHeat) }}</div>
							</div>
							<div class="overview-item">
								<div class="overview-icon">👥</div>
								<div class="overview-label">总参与</div>
								<div class="overview-value">{{ formatNumber(totalParticipants) }}</div>
							</div>
							<div class="overview-item">
								<div class="overview-icon">💬</div>
								<div class="overview-label">总讨论</div>
								<div class="overview-value">{{ formatNumber(totalDiscussions) }}</div>
							</div>
							<div class="overview-item">
								<div class="overview-icon">🌐</div>
								<div class="overview-label">来源数</div>
								<div class="overview-value">{{ uniqueSources }}</div>
							</div>
						</div>
					</div>
				</vue3-seamless-scroll>
			</div>
		</transition>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Vue3SeamlessScroll } from "vue3-seamless-scroll";

interface Topic {
	id: number;
	title: string;
	hotValue: number;
	trend: number; // 百分比变化
	source: string;
	description: string;
	discussions: number;
	shares: number;
	participants: number;
	tags: string[];
	color: string;
	colorLight: string;
	sparkline: number[]; // 趋势数据
}

// 虚拟数据
const mockTopics = (): Topic[] => [
	{
		id: 1,
		title: "AI大模型突破性进展：新算法刷新性能记录",
		hotValue: 98500,
		trend: 45,
		source: "微博热搜",
		description: "一项革命性的深度学习算法在今日发布，成功将模型准确度提升至新的高度，业界评论这将改变AI格局...",
		discussions: 125000,
		shares: 89000,
		participants: 450000,
		tags: ["AI", "科技", "突破"],
		color: "#ff6b35",
		colorLight: "#ff9966",
		sparkline: [30, 45, 52, 48, 65, 72, 80, 88, 95, 98]
	},
	{
		id: 2,
		title: "春节档电影预售火爆，票房预期超50亿",
		hotValue: 87600,
		trend: 32,
		source: "抖音热点",
		description: "今年春节档电影阵容强大，预售期间票房表现亮眼，多部影片的预售数据创历史新高...",
		discussions: 98000,
		shares: 76000,
		participants: 380000,
		tags: ["娱乐", "电影", "春节"],
		color: "#00ffff",
		colorLight: "#66ffff",
		sparkline: [25, 35, 42, 50, 58, 65, 72, 78, 83, 87]
	},
	{
		id: 3,
		title: "NASA宣布火星基地建设新计划，2030年前实现着陆",
		hotValue: 76200,
		trend: 28,
		source: "知乎热议",
		description: "美国宇航局发布了详细的火星探索路线图，包括基地建设、科学研究等关键节点的时间安排...",
		discussions: 65000,
		shares: 52000,
		participants: 290000,
		tags: ["航天", "科学", "探索"],
		color: "#00ff88",
		colorLight: "#66ffbb",
		sparkline: [20, 28, 35, 42, 50, 58, 65, 71, 75, 76]
	},
	{
		id: 4,
		title: "区块链与Web3生态迎来政策利好，多国出台支持措施",
		hotValue: 64800,
		trend: -8,
		source: "微博热搜",
		description: "继多个国家表示积极态度后，又有新兴经济体宣布支持区块链和Web3发展的政策框架...",
		discussions: 52000,
		shares: 41000,
		participants: 210000,
		tags: ["区块链", "政策", "经济"],
		color: "#ff0080",
		colorLight: "#ff6ba6",
		sparkline: [75, 72, 70, 68, 65, 62, 63, 64, 64, 65]
	},
	{
		id: 5,
		title: "全球气候高峰会召开，各国承诺碳中和时间表",
		hotValue: 58900,
		trend: 15,
		source: "环保论坛",
		description: "来自世界各地的领导人聚集一堂，就气候变化问题进行深入讨论，制定了详细的碳减排计划...",
		discussions: 45000,
		shares: 34000,
		participants: 180000,
		tags: ["环保", "气候", "全球"],
		color: "#ffff00",
		colorLight: "#ffff66",
		sparkline: [40, 42, 44, 46, 48, 52, 55, 58, 59, 59]
	},
	{
		id: 6,
		title: "新型医疗技术突破，癌症治疗方案有重大进展",
		hotValue: 52300,
		trend: 22,
		source: "医疗新闻",
		description: "医学研究团队宣布了一项突破性的治疗方案，在临床试验中显示出显著的疗效和安全性...",
		discussions: 38000,
		shares: 29000,
		participants: 150000,
		tags: ["医疗", "健康", "科学"],
		color: "#ff00ff",
		colorLight: "#ff66ff",
		sparkline: [28, 32, 35, 38, 42, 45, 48, 50, 51, 52]
	},
	{
		id: 7,
		title: "电子竞技职业联赛年度总决赛圆满落幕，新冠军诞生",
		hotValue: 45600,
		trend: 12,
		source: "游戏媒体",
		description: "年度电竞盛典在万众瞩目下落幕，新的世界冠军团队成功卫冕，创造了历史纪录...",
		discussions: 32000,
		shares: 24000,
		participants: 120000,
		tags: ["电竞", "游戏", "体育"],
		color: "#00ddff",
		colorLight: "#66eeff",
		sparkline: [35, 37, 39, 41, 43, 44, 45, 45, 46, 46]
	},
	{
		id: 8,
		title: "科技巨头宣布新一代芯片架构，性能翻倍提升",
		hotValue: 39200,
		trend: 8,
		source: "科技博客",
		description: "业界领先的芯片制造商推出了全新的处理器设计，相比上代产品性能提升显著，能效比也大幅改善...",
		discussions: 25000,
		shares: 18000,
		participants: 95000,
		tags: ["芯片", "科技", "硬件"],
		color: "#ff9900",
		colorLight: "#ffbb33",
		sparkline: [20, 22, 24, 26, 30, 33, 36, 38, 39, 39]
	}
];

// 响应式数据
const topics = ref<Topic[]>(mockTopics());
const currentMode = ref("流动列表");
const modeDirection = ref("left"); // 'left' 或 'right' - 控制切换动画方向
let autoSwitchTimer: ReturnType<typeof setInterval> | null = null;
const modes = ["流动列表", "网格卡片", "对比分析"];

// 自动切换模式
const autoSwitchMode = () => {
	const currentIndex = modes.indexOf(currentMode.value);
	const nextIndex = (currentIndex + 1) % modes.length;
	currentMode.value = modes[nextIndex];
};

// 计算属性
const sortedTopics = computed(() => {
	return [...topics.value].sort((a, b) => b.hotValue - a.hotValue);
});

const sortedTopicsByParticipants = computed(() => {
	return [...topics.value].sort((a, b) => b.participants - a.participants);
});

const sortedTopicsByShares = computed(() => {
	return [...topics.value].sort((a, b) => b.shares - a.shares);
});

const topicsForGrid = computed(() => {
	return sortedTopics.value.slice(0, 9);
});

const maxHotValue = computed(() => {
	return Math.max(...topics.value.map(t => t.hotValue), 1);
});

const maxParticipants = computed(() => {
	return Math.max(...topics.value.map(t => t.participants), 1);
});

const maxShares = computed(() => {
	return Math.max(...topics.value.map(t => t.shares), 1);
});

const totalHeat = computed(() => {
	return topics.value.reduce((sum, t) => sum + t.hotValue, 0);
});

const totalParticipants = computed(() => {
	return topics.value.reduce((sum, t) => sum + t.participants, 0);
});

const totalDiscussions = computed(() => {
	return topics.value.reduce((sum, t) => sum + t.discussions, 0);
});

const uniqueSources = computed(() => {
	return new Set(topics.value.map(t => t.source)).size;
});

// 方法
const switchMode = (mode: string) => {
	const modes = ["流动列表", "网格卡片", "对比分析"];
	const currentIndex = modes.indexOf(currentMode.value);
	const nextIndex = modes.indexOf(mode);

	// 判断切换方向
	modeDirection.value = nextIndex > currentIndex ? "left" : "right";

	currentMode.value = mode;
	// 重置计时器
	if (autoSwitchTimer) {
		clearInterval(autoSwitchTimer);
	}
	autoSwitchTimer = setInterval(autoSwitchMode, 20000);
};

const formatNumber = (num: number): string => {
	if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
	if (num >= 1000) return (num / 1000).toFixed(1) + "K";
	return num.toString();
};

const getTrendClass = (trend: number): string => {
	return trend >= 0 ? "up" : "down";
};

const generateSparklinePoints = (data: number[]): string => {
	const maxVal = Math.max(...data);
	const minVal = Math.min(...data);
	const range = maxVal - minVal || 1;

	return data
		.map((val, idx) => {
			const x = idx;
			const y = 20 - ((val - minVal) / range) * 18;
			return `${x},${y}`;
		})
		.join(" ");
};

// 生命周期
onMounted(() => {
	// 启动 20 秒自动切换
	autoSwitchTimer = setInterval(autoSwitchMode, 20000);
});

onBeforeUnmount(() => {
	// 组件卸载时清理计时器
	if (autoSwitchTimer) {
		clearInterval(autoSwitchTimer);
	}
});
</script>

<style scoped lang="scss">
.hot-topics-ranking {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;

	// 模式切换器
	.mode-switcher {
		display: flex;
		gap: 12px;
		margin-bottom: 15px;
		justify-content: center;
		padding: 0 20px;

		.mode-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 16px;
			background: rgba(0, 255, 255, 0.08);
			border: 1px solid rgba(0, 255, 255, 0.2);
			color: #7a9fb5;
			cursor: pointer;
			transition: all 0.3s ease;
			border-radius: 4px;
			font-size: 13px;
			font-weight: 500;

			.mode-icon {
				font-size: 16px;
			}

			.mode-label {
				letter-spacing: 1px;
			}

			&:hover {
				background: rgba(0, 255, 255, 0.15);
				border-color: rgba(0, 255, 255, 0.4);
				color: #00ffff;
				transform: translateY(-2px);
				box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
			}

			&.active {
				background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 107, 53, 0.1));
				border-color: #00ffff;
				color: #00ffff;
				box-shadow: 0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(0, 255, 255, 0.1);
				text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);

				.mode-icon {
					filter: drop-shadow(0 0 4px currentColor);
					animation: bounce 0.5s ease;
				}
			}
		}
	}

	.mode-content {
		flex: 1;
		overflow: hidden;
		padding-right: 10px;

		.scroll-wrapper {
			height: 100%;
			overflow: hidden;
		}

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

	// ===== 模式1: 流动列表 =====
	.flowing-list {
		.topic-list {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.topic-item {
			display: flex;
			align-items: center;
			gap: 15px;
			padding: 12px 15px;
			background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 107, 53, 0.02) 100%);
			border: 1px solid rgba(0, 255, 255, 0.15);
			border-radius: 4px;
			cursor: pointer;
			transition: all 0.3s ease;
			animation: slideIn 0.5s ease backwards;
			animation-delay: var(--delay);
			position: relative;
			overflow: hidden;

			// 背景发光效果
			&::before {
				content: "";
				position: absolute;
				top: -50%;
				left: -50%;
				width: 200%;
				height: 200%;
				background: radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%);
				animation: rotate 20s linear infinite;
				pointer-events: none;
			}

			&:hover {
				border-color: rgba(0, 255, 255, 0.4);
				background: linear-gradient(135deg, rgba(0, 255, 255, 0.12) 0%, rgba(255, 107, 53, 0.05) 100%);
				box-shadow: 0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 15px rgba(0, 255, 255, 0.05);
				transform: translateX(5px);

				.rank-number {
					transform: scale(1.2) rotateZ(-15deg);
				}

				.topic-progress .progress-fill {
					animation: pulse 0.6s ease;
				}
			}

			// 排名编号
			.rank-number {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				min-width: 50px;
				height: 50px;
				background: radial-gradient(circle, rgba(255, 107, 53, 0.3) 0%, rgba(255, 107, 53, 0.1) 100%);
				border: 2px solid rgba(255, 107, 53, 0.5);
				border-radius: 8px;
				transition: all 0.3s ease;
				position: relative;
				z-index: 1;

				.rank-value {
					font-size: 22px;
					font-weight: 700;
					color: #ff6b35;
					font-family: "Orbitron", monospace;
					text-shadow: 0 0 8px rgba(255, 107, 53, 0.6);
				}

				.rank-icon {
					font-size: 12px;
					margin-top: 2px;
				}
			}

			// 话题内容
			.topic-content {
				flex: 1;
				min-width: 0;
				position: relative;
				z-index: 1;

				.topic-header {
					display: flex;
					align-items: center;
					gap: 12px;
					margin-bottom: 8px;

					.topic-title {
						font-size: 14px;
						font-weight: 600;
						color: #e0f7ff;
						margin: 0;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						flex: 1;
						text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
					}

					.topic-meta {
						display: flex;
						align-items: center;
						gap: 8px;
						flex-shrink: 0;

						.meta-item {
							display: flex;
							align-items: center;
							gap: 3px;
							font-size: 12px;
							white-space: nowrap;

							i {
								font-style: normal;
							}

							&.hot-value {
								color: #ff6b35;
								font-weight: 600;
							}

							&.trend {
								font-weight: 600;

								&.up {
									color: #00ff7f;
								}

								&.down {
									color: #ff6b9d;
								}
							}

							&.source {
								color: #7a9fb5;
								font-size: 11px;
								background: rgba(0, 255, 255, 0.1);
								padding: 2px 8px;
								border-radius: 2px;
							}
						}
					}
				}

				.topic-description {
					font-size: 12px;
					color: #7a9fb5;
					margin: 0 0 8px 0;
					line-height: 1.4;
					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 1;
					-webkit-box-orient: vertical;
				}

				.topic-progress {
					height: 6px;
					background: rgba(0, 0, 0, 0.4);
					border-radius: 3px;
					overflow: hidden;
					margin-bottom: 8px;
					position: relative;

					.progress-fill {
						height: 100%;
						display: flex;
						align-items: center;
						justify-content: center;
						transition: width 0.6s ease;
						box-shadow: 0 0 10px currentColor;
						position: relative;

						.progress-text {
							font-size: 10px;
							color: #fff;
							font-weight: 600;
							opacity: 0;
							position: absolute;
						}

						&::after {
							content: "";
							position: absolute;
							top: 0;
							right: 0;
							width: 20px;
							height: 100%;
							background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5));
							animation: shimmer 1.5s infinite;
						}
					}
				}

				.topic-tags {
					display: flex;
					gap: 6px;
					flex-wrap: wrap;

					.tag {
						font-size: 11px;
						padding: 2px 8px;
						background: rgba(0, 255, 255, 0.1);
						border: 1px solid rgba(0, 255, 255, 0.2);
						border-radius: 2px;
						color: #00ffff;
						white-space: nowrap;
					}
				}
			}

			// 右侧数据卡
			.topic-stats {
				display: flex;
				gap: 12px;
				flex-shrink: 0;
				position: relative;
				z-index: 1;

				.stat-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 2px;
					min-width: 60px;
					padding: 8px 10px;
					background: rgba(0, 255, 255, 0.08);
					border: 1px solid rgba(0, 255, 255, 0.2);
					border-radius: 4px;
					text-align: center;

					.stat-label {
						font-size: 11px;
						color: #7a9fb5;
						text-transform: uppercase;
					}

					.stat-value {
						font-size: 13px;
						font-weight: 700;
						color: #00ffff;
						font-family: "Orbitron", monospace;
						text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
					}
				}
			}
		}
	}

	// ===== 模式2: 网格卡片 =====
	.grid-cards {
		.cards-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 15px;
		}

		.card-item {
			position: relative;
			background: linear-gradient(135deg, rgba(0, 255, 255, 0.08) 0%, rgba(255, 107, 53, 0.03) 100%);
			border: 1px solid rgba(0, 255, 255, 0.15);
			border-radius: 6px;
			padding: 12px;
			cursor: pointer;
			transition: all 0.3s ease;
			animation: cardZoom 0.5s ease backwards;
			overflow: hidden;
			display: flex;
			flex-direction: column;

			&::before {
				content: "";
				position: absolute;
				top: -50%;
				left: -50%;
				width: 200%;
				height: 200%;
				background: radial-gradient(circle, var(--color, #00ffff) 0%, transparent 70%);
				opacity: 0.1;
				animation: rotate 20s linear infinite;
				pointer-events: none;
			}

			&:nth-child(1) {
				animation-delay: 0s;
			}
			&:nth-child(2) {
				animation-delay: 0.05s;
			}
			&:nth-child(3) {
				animation-delay: 0.1s;
			}
			&:nth-child(4) {
				animation-delay: 0.15s;
			}
			&:nth-child(5) {
				animation-delay: 0.2s;
			}
			&:nth-child(6) {
				animation-delay: 0.25s;
			}
			&:nth-child(7) {
				animation-delay: 0.3s;
			}
			&:nth-child(8) {
				animation-delay: 0.35s;
			}
			&:nth-child(9) {
				animation-delay: 0.4s;
			}

			&:hover {
				border-color: var(--color, #00ffff);
				background: linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(255, 107, 53, 0.08) 100%);
				box-shadow: 0 0 25px rgba(0, 255, 255, 0.25), inset 0 0 20px rgba(0, 255, 255, 0.08);
				transform: translateY(-8px);

				.card-body {
					transform: scale(1.02);
				}

				.card-rank {
					animation: float 0.6s ease;
				}
			}

			// 排名徽章
			.card-rank {
				position: absolute;
				top: 8px;
				right: 8px;
				width: 32px;
				height: 32px;
				background: radial-gradient(circle, var(--color, #00ffff) 20%, transparent 70%);
				border: 1.5px solid var(--color, #00ffff);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 700;
				color: #fff;
				text-shadow: 0 0 6px var(--color, #00ffff);
				transition: all 0.3s ease;
				z-index: 10;

				.rank-num {
					font-family: "Orbitron", monospace;
					font-size: 14px;
				}
			}

			// 热度条
			.card-heat-bar {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 3px;
				background: rgba(0, 0, 0, 0.3);
				border-radius: 6px 6px 0 0;
				overflow: hidden;

				.heat-fill {
					height: 100%;
					box-shadow: 0 0 10px currentColor;
					transition: width 0.8s ease;
				}
			}

			// 卡片主体
			.card-body {
				display: flex;
				flex-direction: column;
				gap: 10px;
				position: relative;
				z-index: 1;
				transition: all 0.3s ease;
				flex: 1;

				.card-title {
					font-size: 13px;
					font-weight: 600;
					color: #e0f7ff;
					margin: 0;
					line-height: 1.3;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
					text-shadow: 0 0 4px rgba(0, 255, 255, 0.3);
				}

				.card-main-data {
					display: flex;
					gap: 8px;

					.data-block {
						flex: 1;
						display: flex;
						gap: 6px;
						align-items: center;
						padding: 8px;
						background: rgba(0, 0, 0, 0.3);
						border: 1px solid rgba(0, 255, 255, 0.2);
						border-radius: 4px;
						font-size: 11px;

						.data-icon {
							font-size: 14px;
						}

						> div {
							display: flex;
							flex-direction: column;
							gap: 2px;

							.data-label {
								color: #7a9fb5;
								font-size: 10px;
							}

							.data-value {
								font-weight: 600;
								font-family: "Orbitron", monospace;
							}
						}

						&.hot > div .data-value {
							color: #ff6b35;
						}

						&.trend > div .data-value {
							&.up {
								color: #00ff7f;
							}

							&.down {
								color: #ff6b9d;
							}
						}
					}
				}

				.card-sparkline {
					height: 30px;
					margin: 5px 0;

					svg {
						width: 100%;
						height: 100%;
						filter: drop-shadow(0 0 2px currentColor);
					}
				}

				.card-footer {
					display: flex;
					gap: 6px;
					font-size: 10px;

					.source-badge {
						flex: 1;
						padding: 4px 8px;
						background: rgba(0, 255, 255, 0.1);
						border: 1px solid rgba(0, 255, 255, 0.2);
						border-radius: 2px;
						color: #00ffff;
						text-align: center;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					.participants-badge {
						padding: 4px 8px;
						background: rgba(255, 107, 53, 0.1);
						border: 1px solid rgba(255, 107, 53, 0.2);
						border-radius: 2px;
						color: #ff6b35;
						white-space: nowrap;
					}
				}
			}
		}
	}

	// ===== 模式3: 对比分析 =====
	.comparison-analysis {
		.analysis-container {
			display: flex;
			flex-direction: column;
			gap: 20px;
			padding: 0 5px;
		}

		// TOP 3 排名
		.top-ranking {
			background: linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(0, 255, 255, 0.08) 100%);
			border: 1px solid rgba(0, 255, 255, 0.2);
			border-radius: 6px;
			padding: 15px;
			animation: slideUp 0.6s ease;

			.ranking-title {
				font-size: 15px;
				font-weight: 700;
				color: #ff6b35;
				margin-bottom: 12px;
				text-shadow: 0 0 8px rgba(255, 107, 53, 0.5);
				letter-spacing: 1px;
			}

			.ranking-items {
				display: flex;
				flex-direction: column;
				gap: 10px;

				.rank-item {
					display: flex;
					align-items: center;
					gap: 12px;
					padding: 10px;
					background: rgba(0, 0, 0, 0.2);
					border: 1px solid rgba(0, 255, 255, 0.1);
					border-radius: 4px;
					transition: all 0.3s ease;

					&:hover {
						background: rgba(0, 0, 0, 0.3);
						border-color: rgba(0, 255, 255, 0.3);
						transform: translateX(3px);
					}

					.rank-medal {
						font-size: 22px;
						min-width: 30px;
						text-align: center;
					}

					.rank-info {
						flex: 1;
						min-width: 0;

						.rank-title {
							font-size: 13px;
							font-weight: 600;
							color: #e0f7ff;
							margin-bottom: 3px;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
						}

						.rank-meta {
							display: flex;
							gap: 12px;
							font-size: 11px;
							color: #7a9fb5;

							span {
								white-space: nowrap;
							}
						}
					}

					.rank-heat-bar {
						width: 80px;
						height: 6px;
						background: rgba(0, 0, 0, 0.4);
						border-radius: 3px;
						overflow: hidden;

						.heat-fill {
							height: 100%;
							box-shadow: 0 0 8px currentColor;
							transition: width 0.8s ease;
						}
					}
				}
			}
		}

		// 多维度对比
		.multi-dimension {
			display: grid;
			grid-template-columns: 1fr;
			gap: 15px;

			.dimension-chart {
				background: linear-gradient(135deg, rgba(0, 255, 255, 0.08) 0%, rgba(255, 107, 53, 0.03) 100%);
				border: 1px solid rgba(0, 255, 255, 0.15);
				border-radius: 6px;
				padding: 15px;
				animation: slideUp 0.6s ease;
				animation-delay: 0.1s;

				.chart-title {
					font-size: 13px;
					font-weight: 700;
					color: #00ffff;
					margin-bottom: 12px;
					text-shadow: 0 0 6px rgba(0, 255, 255, 0.4);
					letter-spacing: 1px;
				}

				.chart-bars {
					display: flex;
					flex-direction: column;
					gap: 8px;

					.bar-item {
						display: flex;
						align-items: center;
						gap: 10px;

						.bar-label {
							width: 70px;
							font-size: 11px;
							color: #7a9fb5;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							flex-shrink: 0;
						}

						.bar-track {
							flex: 1;
							height: 20px;
							background: rgba(0, 0, 0, 0.3);
							border-radius: 3px;
							overflow: hidden;
							position: relative;

							.bar-fill {
								height: 100%;
								display: flex;
								align-items: center;
								justify-content: flex-end;
								padding-right: 6px;
								font-size: 10px;
								color: #fff;
								font-weight: 600;
								transition: width 0.8s ease;
								box-shadow: 0 0 10px currentColor;
								position: relative;

								&::after {
									content: "";
									position: absolute;
									top: 0;
									right: 0;
									width: 15px;
									height: 100%;
									background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4));
									animation: shimmer 1.5s infinite;
								}
							}
						}
					}
				}
			}
		}

		// 统计概览
		.stats-overview {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 12px;
			animation: slideUp 0.6s ease 0.2s backwards;

			.overview-item {
				background: linear-gradient(135deg, rgba(0, 255, 255, 0.12) 0%, rgba(255, 107, 53, 0.06) 100%);
				border: 1px solid rgba(0, 255, 255, 0.2);
				border-radius: 6px;
				padding: 15px;
				text-align: center;
				transition: all 0.3s ease;
				cursor: pointer;

				&:hover {
					border-color: rgba(0, 255, 255, 0.4);
					background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 107, 53, 0.1) 100%);
					box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
					transform: translateY(-4px);

					.overview-icon {
						transform: scale(1.15) rotateZ(10deg);
					}
				}

				.overview-icon {
					font-size: 28px;
					margin-bottom: 8px;
					transition: all 0.3s ease;
					display: block;
				}

				.overview-label {
					font-size: 11px;
					color: #7a9fb5;
					margin-bottom: 6px;
					text-transform: uppercase;
					letter-spacing: 1px;
				}

				.overview-value {
					font-size: 18px;
					font-weight: 700;
					color: #00ffff;
					font-family: "Orbitron", monospace;
					text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
				}
			}
		}
	}
}

// ===== 动画定义 =====
@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateX(-20px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(15px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@keyframes shimmer {
	0% {
		transform: translateX(-100%);
	}
	100% {
		transform: translateX(100%);
	}
}

@keyframes pulse {
	0%,
	100% {
		box-shadow: 0 0 10px currentColor;
	}
	50% {
		box-shadow: 0 0 20px currentColor;
	}
}

@keyframes float {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-3px);
	}
}

@keyframes bounce {
	0%,
	100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.3);
	}
}

// 左滑动画 - 新模式从右进入
.slide-left-enter-active,
.slide-left-leave-active {
	transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
	opacity: 0;
	transform: translateX(100%);
}

.slide-left-leave-to {
	opacity: 0;
	transform: translateX(-100%);
}

// 右滑动画 - 新模式从左进入
.slide-right-enter-active,
.slide-right-leave-active {
	transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-right-enter-from {
	opacity: 0;
	transform: translateX(-100%);
}

.slide-right-leave-to {
	opacity: 0;
	transform: translateX(100%);
}

// Transition 动画
.list-enter-active,
.list-leave-active,
.card-enter-active,
.card-leave-active {
	transition: all 0.3s ease;
}

.list-enter-from {
	opacity: 0;
	transform: translateX(-15px);
}

.list-leave-to {
	opacity: 0;
	transform: translateX(15px);
}

.card-enter-from {
	opacity: 0;
	transform: scale(0.8);
}

.card-leave-to {
	opacity: 0;
	transform: scale(0.8);
}
</style>
