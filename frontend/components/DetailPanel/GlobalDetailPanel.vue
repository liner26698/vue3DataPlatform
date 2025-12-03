<template>
	<teleport to="body">
		<!-- 全屏半透明背景覆盖 -->
		<transition name="detail-overlay-fade">
			<div v-if="isVisible" class="detail-overlay" @click="closePanel"></div>
		</transition>

		<!-- 中央详情面板 -->
		<transition name="detail-center-zoom">
			<div v-if="isVisible" class="detail-center-panel" @mouseenter="isMouseInPanel = true" @mouseleave="isMouseInPanel = false">
				<!-- 面板头部 -->
				<div class="panel-header">
					<div class="header-left">
						<span v-if="detailData.icon" class="header-icon">{{ detailData.icon }}</span>
						<h2 class="header-title">{{ detailData.title }}</h2>
					</div>
					<button class="close-button" @click="closePanel">✕</button>
				</div>

				<!-- 面板内容 -->
				<div class="panel-body">
					<slot :data="detailData">
						<!-- 默认渲染插槽 -->
						<div class="default-content">
							<div v-for="(value, key) in detailData.content" :key="key" class="content-item">
								<span class="item-label">{{ key }}</span>
								<span class="item-value">{{ value }}</span>
							</div>
						</div>
					</slot>
				</div>

				<!-- 扫描线装饰 -->
				<div class="panel-scan"></div>
			</div>
		</transition>
	</teleport>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";

interface DetailData {
	title?: string;
	icon?: string;
	content?: Record<string, any>;
	[key: string]: any;
}

const props = defineProps<{
	modelValue: boolean;
	data: DetailData;
}>();

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
}>();

const isMouseInPanel = ref(false);

const isVisible = computed(() => props.modelValue);

const closePanel = () => {
	emit("update:modelValue", false);
};

const detailData = computed(() => props.data || {});
</script>

<script lang="ts">
import { computed } from "vue";

export default {
	name: "GlobalDetailPanel"
};
</script>

<style scoped lang="scss">
// 全屏半透明背景
.detail-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(5px);
	z-index: 9998;
	cursor: pointer;
}

// 中央详情面板
.detail-center-panel {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 90%;
	max-width: 900px;
	max-height: 90vh;
	background: rgba(5, 15, 28, 0.99);
	border: 3px solid #00ffff;
	backdrop-filter: blur(15px);
	z-index: 9999;
	box-shadow: 0 0 100px rgba(0, 255, 255, 0.8), inset 0 0 50px rgba(0, 255, 255, 0.15);
	clip-path: polygon(
		0 30px,
		30px 0,
		calc(100% - 30px) 0,
		100% 30px,
		100% calc(100% - 30px),
		calc(100% - 30px) 100%,
		30px 100%,
		0 calc(100% - 30px)
	);
	display: flex;
	flex-direction: column;
	overflow: hidden;

	.panel-header {
		padding: 35px 45px;
		background: linear-gradient(90deg, rgba(0, 255, 255, 0.25) 0%, transparent 100%);
		border-bottom: 2px solid rgba(0, 255, 255, 0.3);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;

		.header-left {
			display: flex;
			align-items: center;
			gap: 20px;

			.header-icon {
				font-size: 52px;
				filter: drop-shadow(0 0 15px #ff6b35);
				animation: icon-glow 2s ease-in-out infinite;
			}

			.header-title {
				font-size: 32px;
				font-weight: 700;
				color: #e0f7ff;
				text-transform: uppercase;
				letter-spacing: 2px;
				margin: 0;
				text-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
			}
		}

		.close-button {
			width: 52px;
			height: 52px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(0, 255, 255, 0.1);
			border: 2px solid rgba(0, 255, 255, 0.4);
			border-radius: 0;
			color: #7a9fb5;
			font-size: 32px;
			cursor: pointer;
			transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
			clip-path: polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%);

			&:hover {
				background: rgba(255, 0, 128, 0.15);
				border-color: #ff0080;
				color: #ff0080;
				transform: rotate(90deg) scale(1.1);
				box-shadow: 0 0 20px rgba(255, 0, 128, 0.6);
			}
		}
	}

	.panel-body {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 45px;

		// 美化滚动条
		&::-webkit-scrollbar {
			width: 10px;
		}

		&::-webkit-scrollbar-track {
			background: rgba(0, 0, 0, 0.3);
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(0, 255, 255, 0.4);
			border-radius: 5px;

			&:hover {
				background: rgba(0, 255, 255, 0.6);
				box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
			}
		}

		.default-content {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
			gap: 30px;

			.content-item {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				padding-bottom: 20px;
				border-bottom: 1px solid rgba(0, 255, 255, 0.15);

				.item-label {
					color: #7a9fb5;
					font-weight: 600;
					font-size: 15px;
					min-width: 120px;
				}

				.item-value {
					color: #e0f7ff;
					font-weight: 600;
					font-size: 15px;
					max-width: 180px;
					text-align: right;
					word-break: break-word;
				}
			}
		}
	}

	// 扫描线动画
	.panel-scan {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(180deg, transparent 0%, rgba(0, 255, 255, 0.08) 50%, transparent 100%);
		animation: panel-scan 4s linear infinite;
		pointer-events: none;
	}
}

// 动画定义
@keyframes icon-glow {
	0%,
	100% {
		filter: drop-shadow(0 0 15px #ff6b35);
	}
	50% {
		filter: drop-shadow(0 0 25px #ff6b35);
	}
}

@keyframes panel-scan {
	0% {
		transform: translateY(-100%);
	}
	100% {
		transform: translateY(100%);
	}
}

// 背景渐出动画
.detail-overlay-fade-enter-active,
.detail-overlay-fade-leave-active {
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-overlay-fade-enter-from,
.detail-overlay-fade-leave-to {
	opacity: 0;
}

// 中央面板缩放进/出动画
.detail-center-zoom-enter-active {
	transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.detail-center-zoom-leave-active {
	transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-center-zoom-enter-from {
	opacity: 0;
	transform: translate(-50%, -50%) scale(0.5) rotateX(20deg);
}

.detail-center-zoom-leave-to {
	opacity: 0;
	transform: translate(-50%, -50%) scale(0.8);
}
</style>
