<template>
	<div
		class="stat-card"
		:class="{ 'cursor-pointer': clickable, 'active-spiders-card': isActiveSpiders }"
		:style="{ borderLeft: `4px solid ${color}` }"
		@click="handleClick"
	>
		<div class="stat-content">
			<div class="stat-icon" :style="{ color }">
				{{ icon }}
			</div>
			<div class="stat-info">
				<div class="stat-label">{{ label }}</div>
				<div class="stat-value">{{ value }}</div>
				<div v-if="showTrend" class="stat-trend" :class="trend > 0 ? 'up' : 'down'">
					{{ trend > 0 ? "↑" : "↓" }} {{ Math.abs(trend) }}%
				</div>
			</div>
		</div>
		<div v-if="clickable" class="stat-action">
			<i class="el-icon-arrow-right"></i>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
	icon: string;
	label: string;
	value: string | number;
	trend?: number;
	color?: string;
	clickable?: boolean;
	isActiveSpiders?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	trend: 0,
	color: "#409EFF",
	clickable: false,
	isActiveSpiders: false,
	showTrend: true
});

const emit = defineEmits<{
	click: [];
}>();

const showTrend = computed(() => {
	return props.trend !== undefined && props.trend !== 0;
});

const handleClick = () => {
	if (props.clickable) {
		emit("click");
	}
};
</script>

<style scoped lang="scss">
.stat-card {
	background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
	border-radius: 8px;
	padding: 20px;
	transition: all 0.3s ease;
	box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	position: relative;
	overflow: hidden;

	&:hover {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px);
	}

	&.cursor-pointer {
		cursor: pointer;

		&:hover {
			transform: translateY(-4px);
		}
	}

	&.active-spiders-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;

		.stat-label,
		.stat-value,
		.stat-trend {
			color: white;
		}

		.stat-icon {
			color: rgba(255, 255, 255, 0.8) !important;
		}

		&:hover {
			box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
		}
	}

	.stat-content {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.stat-icon {
		font-size: 32px;
		flex-shrink: 0;
	}

	.stat-info {
		flex: 1;
	}

	.stat-label {
		font-size: 12px;
		color: #909399;
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		transition: color 0.3s;
	}

	.stat-value {
		font-size: 28px;
		font-weight: bold;
		color: #303133;
		margin-bottom: 4px;
		transition: color 0.3s;
	}

	.stat-trend {
		font-size: 12px;
		color: #909399;

		&.up {
			color: #f56c6c;
		}

		&.down {
			color: #67c23a;
		}
	}

	.stat-action {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		opacity: 0;
		transition: opacity 0.3s, transform 0.3s;
		font-size: 18px;
	}

	&.cursor-pointer:hover .stat-action {
		opacity: 1;
		transform: translateY(-50%) translateX(4px);
	}

	// 响应式设计
	@media (max-width: 768px) {
		.stat-value {
			font-size: 24px;
		}

		.stat-icon {
			font-size: 28px;
		}
	}
}
</style>
