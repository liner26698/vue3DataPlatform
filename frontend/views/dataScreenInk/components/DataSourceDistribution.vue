<template>
	<div class="data-pipeline-container">
		<!-- 顶部统计信息 -->
		<div class="pipeline-header">
			<div class="header-stat">
				<span class="stat-label">总数据量</span>
				<span class="stat-value">{{ totalCount }}</span>
			</div>
			<div class="header-divider"></div>
			<div class="header-stat">
				<span class="stat-label">活跃源</span>
				<span class="stat-value">{{ dataSources.length }}</span>
			</div>
			<div class="header-divider"></div>
			<div class="header-stat">
				<span class="stat-label">平均流速</span>
				<span class="stat-value">{{ avgFlowRate }}</span>
			</div>
		</div>

		<!-- 管道区域 -->
		<div class="pipeline-area">
			<div
				v-for="(source, index) in dataSources"
				:key="index"
				class="pipeline"
				@mouseenter="hoveredIndex = index"
				@mouseleave="hoveredIndex = -1"
			>
				<!-- 管道背景 -->
				<div class="pipe-background"></div>

				<!-- 数据流动层 -->
				<div class="pipe-content" :style="{ '--flow-height': source.percent + '%' }">
					<!-- 流动的数据球 -->
					<div
						v-for="i in Math.ceil(source.percent / 10)"
						:key="i"
						class="data-ball"
						:style="{
							backgroundColor: source.color,
							animationDelay: i * 0.2 + 's',
							animationDuration: (100 - source.percent) / 20 + 1 + 's'
						}"
					></div>

					<!-- 填充渐变 -->
					<div class="pipe-fill" :style="{ backgroundColor: source.color }"></div>
				</div>

				<!-- 管道边框 -->
				<div class="pipe-border"></div>

				<!-- 源信息 -->
				<div class="pipe-info">
					<div class="info-icon">{{ source.icon }}</div>
					<div class="info-text">
						<div class="info-name">{{ source.name }}</div>
						<div class="info-count">{{ source.count }}</div>
					</div>
					<div class="info-percent">{{ source.percent }}%</div>
				</div>

				<!-- 悬停详情 -->
				<div v-if="hoveredIndex === index" class="pipe-hover-detail">
					<div class="detail-row">
						<span class="detail-label">数据量:</span>
						<span class="detail-value">{{ source.count }}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">占比:</span>
						<span class="detail-value">{{ source.percent }}%</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">状态:</span>
						<span class="detail-value active">● 活跃</span>
					</div>
				</div>

				<!-- 流速指示 -->
				<div class="flow-indicator" :style="{ height: source.percent + '%' }">
					<div class="flow-label">{{ Math.round(source.count / 100) }}K/s</div>
				</div>
			</div>
		</div>

		<!-- 底部图例 -->
		<div class="pipeline-footer">
			<div class="legend-title">数据源管道</div>
			<div class="legend-items">
				<div v-for="(source, idx) in dataSources" :key="idx" class="legend-item">
					<div class="legend-color" :style="{ backgroundColor: source.color }"></div>
					<span class="legend-name">{{ source.name }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface DataSource {
	name: string;
	icon: string;
	count: number;
	percent: number;
	color: string;
}

const hoveredIndex = ref(-1);

// 模拟数据源
const dataSources = ref<DataSource[]>([
	{ name: "小说站点", icon: "📚", count: 4523, percent: 28, color: "#00ff00" },
	{ name: "论坛社区", icon: "💬", count: 3821, percent: 24, color: "#00ffff" },
	{ name: "热点新闻", icon: "📰", count: 3156, percent: 20, color: "#ff00ff" },
	{ name: "游戏平台", icon: "🎮", count: 2847, percent: 18, color: "#ffff00" },
	{ name: "视频网站", icon: "🎬", count: 1653, percent: 10, color: "#ff0080" }
]);

const totalCount = computed(() => {
	return dataSources.value.reduce((sum, source) => sum + source.count, 0);
});

const avgFlowRate = computed(() => {
	const avg = Math.round(totalCount.value / dataSources.value.length / 100);
	return avg + "K/s";
});
</script>

<style lang="scss" scoped>
.data-pipeline-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	padding: 15px;
	background: linear-gradient(135deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 255, 255, 0.05) 100%);
	border-radius: 8px;
	overflow: visible;
	gap: 12px;
}

// ============ 顶部统计 ============
.pipeline-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 20px;
	padding: 10px 15px;
	background: rgba(0, 255, 0, 0.08);
	border: 1px solid rgba(0, 255, 0, 0.2);
	border-radius: 6px;
	backdrop-filter: blur(10px);

	.header-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;

		.stat-label {
			font-size: 11px;
			color: rgba(0, 255, 255, 0.6);
			letter-spacing: 0.5px;
			text-transform: uppercase;
		}

		.stat-value {
			font-size: 16px;
			font-weight: bold;
			color: #00ff00;
			text-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
			letter-spacing: 1px;
		}
	}

	.header-divider {
		width: 1px;
		height: 30px;
		background: linear-gradient(to bottom, transparent, rgba(0, 255, 0, 0.3), transparent);
	}
}

// ============ 管道区域 ============
.pipeline-area {
	flex: 1;
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 12px;
	padding: 10px 0;
	min-height: 0;
	overflow: visible;
	position: relative;
}

.pipeline {
	position: relative;
	display: flex;
	flex-direction: column;
	height: 100%;
	cursor: pointer;
	transition: all 0.3s ease;
	z-index: 1;

	&:hover {
		z-index: 100;
	}

	// 管道背景
	.pipe-background {
		position: absolute;
		width: 100%;
		height: 100%;
		background: linear-gradient(180deg, rgba(0, 255, 0, 0.05), rgba(0, 255, 255, 0.05));
		border: 2px solid rgba(0, 255, 0, 0.15);
		border-radius: 8px;
		z-index: 1;
	}

	// 管道内容（数据流）
	.pipe-content {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--flow-height);
		z-index: 2;
		border-radius: 6px;
		overflow: hidden;

		// 数据球
		.data-ball {
			position: absolute;
			width: 12px;
			height: 12px;
			border-radius: 50%;
			left: 50%;
			transform: translateX(-50%);
			box-shadow: 0 0 8px currentColor;
			animation: dataBallFloat linear infinite;

			@keyframes dataBallFloat {
				0% {
					bottom: -20px;
					opacity: 0;
				}
				10% {
					opacity: 1;
				}
				90% {
					opacity: 1;
				}
				100% {
					bottom: 100%;
					opacity: 0;
				}
			}
		}

		// 填充渐变
		.pipe-fill {
			position: absolute;
			width: 100%;
			height: 100%;
			opacity: 0.3;
			filter: blur(1px);
		}
	}

	// 管道边框
	.pipe-border {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 2px solid rgba(0, 255, 0, 0.3);
		border-radius: 8px;
		z-index: 3;
		pointer-events: none;
		box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.1);
	}

	// 管道信息
	.pipe-info {
		position: relative;
		z-index: 4;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		padding: 10px;
		text-align: center;

		.info-icon {
			font-size: 24px;
			margin-bottom: 4px;
			filter: drop-shadow(0 0 5px rgba(0, 255, 0, 0.6));
			transition: all 0.3s ease;
		}

		.info-text {
			flex: 1;
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 2px;

			.info-name {
				font-size: 11px;
				color: #00ffff;
				font-weight: bold;
				letter-spacing: 0.5px;
				white-space: nowrap;
			}

			.info-count {
				font-size: 12px;
				color: #00ff00;
				font-weight: bold;
				text-shadow: 0 0 5px rgba(0, 255, 0, 0.6);
			}
		}

		.info-percent {
			font-size: 14px;
			font-weight: bold;
			color: #ffff00;
			text-shadow: 0 0 5px rgba(255, 255, 0, 0.6);
			margin-top: 4px;
		}
	}

	// 流速指示
	.flow-indicator {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 3px;
		background: linear-gradient(to top, rgba(0, 255, 0, 0.6), transparent);
		border-radius: 2px;
		z-index: 5;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 5px;

		.flow-label {
			font-size: 8px;
			color: #00ff00;
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			letter-spacing: 1px;
			white-space: nowrap;
			opacity: 0;
			transition: opacity 0.3s ease;
		}
	}

	// 悬停详情
	.pipe-hover-detail {
		position: absolute;
		left: 50%;
		top: -65px;
		transform: translateX(-50%);
		background: linear-gradient(135deg, rgba(0, 255, 0, 0.15), rgba(0, 255, 255, 0.1));
		border: 1px solid rgba(0, 255, 0, 0.4);
		border-radius: 6px;
		padding: 8px 12px;
		z-index: 1000;
		white-space: nowrap;
		box-shadow: 0 0 15px rgba(0, 255, 0, 0.3), inset 0 0 10px rgba(0, 255, 0, 0.05);
		pointer-events: none;
		animation: slideDown 0.3s ease-out forwards;

		.detail-row {
			display: flex;
			gap: 8px;
			font-size: 11px;
			margin-bottom: 4px;

			&:last-child {
				margin-bottom: 0;
			}

			.detail-label {
				color: rgba(0, 255, 255, 0.7);
				letter-spacing: 0.5px;
			}

			.detail-value {
				color: #00ff00;
				font-weight: bold;
				text-shadow: 0 0 5px rgba(0, 255, 0, 0.6);

				&.active {
					color: #00ff00;
					letter-spacing: 1px;
				}
			}
		}

		@keyframes slideDown {
			from {
				opacity: 0;
				transform: translateX(-50%) translateY(-10px);
			}
			to {
				opacity: 1;
				transform: translateX(-50%) translateY(0);
			}
		}
	}

	// 悬停效果
	&:hover {
		z-index: 100;

		.pipe-border {
			border-color: rgba(0, 255, 0, 0.6);
			box-shadow: 0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 15px rgba(0, 255, 0, 0.1);
		}

		.pipe-content {
			.pipe-fill {
				opacity: 0.5;
				filter: blur(0);
			}
		}

		.pipe-info {
			.info-icon {
				transform: scale(1.2);
			}
		}

		.flow-indicator {
			.flow-label {
				opacity: 1;
			}
		}
	}
}

// ============ 底部图例 ============
.pipeline-footer {
	display: flex;
	align-items: center;
	gap: 15px;
	padding: 10px 15px;
	background: rgba(0, 255, 0, 0.05);
	border: 1px solid rgba(0, 255, 0, 0.15);
	border-radius: 6px;
	flex-shrink: 0;
	height: 45px;

	.legend-title {
		font-size: 12px;
		color: #00ffff;
		font-weight: bold;
		letter-spacing: 0.5px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.legend-items {
		display: flex;
		gap: 20px;
		flex: 1;
		flex-wrap: nowrap;
		align-items: center;
		overflow: hidden;

		.legend-item {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 11px;
			flex-shrink: 0;

			.legend-color {
				width: 12px;
				height: 12px;
				border-radius: 2px;
				box-shadow: 0 0 8px currentColor;
				flex-shrink: 0;
			}

			.legend-name {
				color: rgba(0, 255, 255, 0.7);
				letter-spacing: 0.5px;
				white-space: nowrap;
			}
		}
	}
}

// 响应式设计
@media (max-width: 1600px) {
	.pipeline-area {
		grid-template-columns: repeat(5, 1fr);
		gap: 10px;
	}

	.pipeline {
		.pipe-info {
			.info-icon {
				font-size: 20px;
			}

			.info-text {
				.info-name {
					font-size: 10px;
				}

				.info-count {
					font-size: 11px;
				}
			}

			.info-percent {
				font-size: 12px;
			}
		}
	}
}

// 自定义滚动条
::-webkit-scrollbar {
	width: 4px;
}

::-webkit-scrollbar-track {
	background: rgba(0, 255, 0, 0.05);
}

::-webkit-scrollbar-thumb {
	background: rgba(0, 255, 0, 0.3);
	border-radius: 2px;

	&:hover {
		background: rgba(0, 255, 0, 0.5);
	}
}
</style>
