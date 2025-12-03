<template>
	<div class="dataScreen-container">
		<div class="dataScreen" ref="dataScreenRef">
			<!-- Header -->
			<div class="dataScreen-header">
				<div class="header-lf">
					<div class="header-btn" @click="handleToHome">← RETURN</div>
				</div>
				<div class="header-ct">
					<div class="header-ct-title">INTELLIGENT DATA PLATFORM</div>
					<div class="header-ct-subtitle">// 智能爬虫监控 & 数据可视化系统 //</div>
				</div>
				<div class="header-rg">
					<div class="header-time">{{ time }}</div>
				</div>
			</div>

			<!-- Main Content -->
			<div class="dataScreen-main">
				<!-- Left Panel -->
				<div class="dataScreen-lf">
					<!-- 爬虫倒计时 -->
					<div class="cyber-panel" style="height: 280px">
						<div class="cyber-panel-title">
							<span class="title-icon">⏱</span>
							爬虫倒计时
						</div>
						<div class="cyber-panel-content" style="padding: 10px">
							<CrawlerCountdown />
						</div>
					</div>

					<!-- 爬虫状态统计 -->
					<div class="cyber-panel" style="flex: 1">
						<div class="cyber-panel-title">
							<span class="title-icon">📊</span>
							爬虫统计
						</div>
						<div class="cyber-panel-content">
							<CrawlerStats />
						</div>
					</div>
				</div>

				<!-- Center Panel -->
				<div class="dataScreen-ct">
					<!-- 最热话题排行榜 -->
					<div class="cyber-panel" style="flex: 1">
						<div class="cyber-panel-title">
							<span class="title-icon">🔥</span>
							热门话题排行
						</div>
						<div class="cyber-panel-content">
							<HotTopicsRanking />
						</div>
					</div>

					<!-- 数据来源分布 -->
					<div class="cyber-panel" style="height: 320px">
						<div class="cyber-panel-title">
							<span class="title-icon">🌐</span>
							数据来源分布
						</div>
						<div class="cyber-panel-content">
							<DataSourceDistribution />
						</div>
					</div>
				</div>

				<!-- Right Panel -->
				<div class="dataScreen-rg">
					<!-- 数据监控面板 -->
					<div class="cyber-panel" style="flex: 1">
						<div class="cyber-panel-title">
							<span class="title-icon">📈</span>
							数据监控
						</div>
						<div class="cyber-panel-content">
							<DataMonitor />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useTime } from "@/hooks/useTime";
import { HOME_URL } from "@/config/config";
import CrawlerCountdown from "./components/CrawlerCountdown.vue";
import CrawlerStats from "./components/CrawlerStats.vue";
import DataMonitor from "./components/DataMonitor.vue";
import HotTopicsRanking from "./components/HotTopicsRanking.vue";
import DataSourceDistribution from "./components/DataSourceDistribution.vue";

const router = useRouter();
const dataScreenRef = ref<HTMLElement | null>(null);

// 时间处理
const { nowTime } = useTime();
const time = ref(nowTime.value);
let timer: any = null;

// 适配缩放
const getScale = (width = 1920, height = 1080) => {
	let ww = window.innerWidth / width;
	let wh = window.innerHeight / height;
	return ww < wh ? ww : wh;
};

const resize = () => {
	if (dataScreenRef.value) {
		dataScreenRef.value.style.transform = `scale(${getScale()}) translate(-50%, -50%)`;
	}
};

onMounted(() => {
	if (dataScreenRef.value) {
		dataScreenRef.value.style.transform = `scale(${getScale()}) translate(-50%, -50%)`;
		dataScreenRef.value.style.width = `1920px`;
		dataScreenRef.value.style.height = `1080px`;
	}
	window.addEventListener("resize", resize);

	timer = setInterval(() => {
		time.value = useTime().nowTime.value;
	}, 1000);
});

onBeforeUnmount(() => {
	window.removeEventListener("resize", resize);
	clearInterval(timer);
});

const handleToHome = () => {
	router.replace(HOME_URL);
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
