<template>
	<div class="dataScreen-container">
		<div class="dataScreen" ref="dataScreenRef">
			<!-- Header -->
			<div class="dataScreen-header">
				<div class="header-lf">
					<div class="header-btn" @click="handleToHome">返回首页</div>
				</div>
				<div class="header-ct">
					<div class="header-ct-title">大数据智能监测平台</div>
					<div class="header-ct-subtitle">Big Data Intelligent Monitoring Platform</div>
				</div>
				<div class="header-rg">
					<div class="header-time">{{ time }}</div>
				</div>
			</div>

			<!-- Main Content -->
			<div class="dataScreen-main">
				<!-- Left Panel -->
				<div class="dataScreen-lf">
					<div class="ink-panel" style="flex: 1">
						<div class="ink-panel-title">实时数据监控</div>
						<div class="ink-panel-content">
							<!-- Placeholder for Chart 1 -->
							<div style="color: #fff; text-align: center; padding-top: 20px">图表区域 1</div>
						</div>
					</div>
					<div class="ink-panel" style="flex: 1">
						<div class="ink-panel-title">用户画像分析</div>
						<div class="ink-panel-content">
							<!-- Placeholder for Chart 2 -->
							<div style="color: #fff; text-align: center; padding-top: 20px">图表区域 2</div>
						</div>
					</div>
					<div class="ink-panel" style="flex: 1">
						<div class="ink-panel-title">渠道来源统计</div>
						<div class="ink-panel-content">
							<!-- Placeholder for Chart 3 -->
							<div style="color: #fff; text-align: center; padding-top: 20px">图表区域 3</div>
						</div>
					</div>
				</div>

				<!-- Center Panel (Map) -->
				<div class="dataScreen-ct">
					<div class="dataScreen-map">
						<div class="map-title">全国业务分布图</div>
						<!-- Map Component will go here -->
						<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: rgba(0, 255, 213, 0.5); font-size: 24px; border: 1px dashed rgba(0, 255, 213, 0.3);">
							地图核心展示区
						</div>
					</div>
					<div class="ink-panel dataScreen-cb">
						<div class="ink-panel-title">未来30天趋势预测</div>
						<div class="ink-panel-content">
							<!-- Placeholder for Bottom Chart -->
							<div style="color: #fff; text-align: center; padding-top: 20px">趋势图表区域</div>
						</div>
					</div>
				</div>

				<!-- Right Panel -->
				<div class="dataScreen-rg">
					<div class="ink-panel" style="flex: 1">
						<div class="ink-panel-title">热门榜单排行</div>
						<div class="ink-panel-content">
							<!-- Placeholder for Chart 4 -->
							<div style="color: #fff; text-align: center; padding-top: 20px">图表区域 4</div>
						</div>
					</div>
					<div class="ink-panel" style="flex: 1">
						<div class="ink-panel-title">年度数据对比</div>
						<div class="ink-panel-content">
							<!-- Placeholder for Chart 5 -->
							<div style="color: #fff; text-align: center; padding-top: 20px">图表区域 5</div>
						</div>
					</div>
					<div class="ink-panel" style="flex: 1">
						<div class="ink-panel-title">实时预警信息</div>
						<div class="ink-panel-content">
							<!-- Placeholder for Chart 6 -->
							<div style="color: #fff; text-align: center; padding-top: 20px">预警列表区域</div>
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
