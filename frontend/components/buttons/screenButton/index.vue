<template>
	<!-- 悬浮按钮 -->
	<div class="container" :class="{ 'animate-float': !isAnimating, 'guide-animation': isAnimating }" :style="animationStyle">
		<el-tooltip class="box-item" raw-content effect="dark" content="<p> <b>CTRL + B 召唤AI</b> </p>" placement="left-start">
			<i
				:class="[isTrue ? 'fa fa-reddit' : 'fa fa-reddit-square']"
				id="apple"
				@mouseenter="changeClass()"
				@mouseleave="changeClass()"
				@click="showChatGPT()"
			></i>
		</el-tooltip>

		<!-- 引导提示 -->
		<div v-if="showTooltip" class="guide-tooltip">
			<span class="tooltip-text">AI助手已就绪</span>
			<span class="tooltip-arrow"></span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive } from "vue";
import { GlobalStore } from "@/store";
const globalStore = GlobalStore();

// 响应式状态
let isTrue = ref(true);
const isAnimating = ref(false);
const showTooltip = ref(false);
const animationStyle = reactive({
	transform: "",
	opacity: 1,
	transition: ""
});

// 处理按钮样式切换
const changeClass = () => {
	isTrue.value = !isTrue.value;
};

// 显示/隐藏AI聊天窗口
const showChatGPT = () => {
	globalStore.chatGPT.show = !globalStore.chatGPT.show;
	// 点击后隐藏引导提示
	if (showTooltip.value) {
		showTooltip.value = false;
	}
};

// 执行引导动画
const runGuideAnimation = () => {
	// 检查是否已经显示过引导
	const hasShownGuide = localStorage.getItem("ai-assistant-guide-shown");
	if (hasShownGuide) {
		return;
	}

	// 设置为动画中状态
	isAnimating.value = true;

	// 初始位置：页面中心
	animationStyle.transform = "translate(-50%, -50%) scale(1.5)";
	animationStyle.opacity = 1;

	// 延迟开始动画
	setTimeout(() => {
		// 动画第一阶段：缩小并开始移动
		animationStyle.transform = "translate(-50%, -50%) scale(1)";
		animationStyle.transition = "transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

		// 第二阶段：移动到右下角
		setTimeout(() => {
			animationStyle.transform = "translate(0, 0) scale(1)";
			animationStyle.transition = "transform 1.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)";

			// 动画结束，显示提示文字
			setTimeout(() => {
				isAnimating.value = false;
				showTooltip.value = true;

				// 3秒后隐藏提示
				setTimeout(() => {
					showTooltip.value = false;
				}, 3000);

				// 记录已经显示过引导
				localStorage.setItem("ai-assistant-guide-shown", "true");
			}, 1200);
		}, 1000);
	}, 500);
};

// 键盘快捷键处理
const handleKeyDown = (e: KeyboardEvent) => {
	try {
		// CTRL + B 显示/隐藏AI窗口 (添加metaKey支持Mac的Command键)
		if ((e.ctrlKey || e.metaKey) && e.key === "b") {
			e.preventDefault();
			showChatGPT();
		}
	} catch (error) {
		console.error("处理快捷键时出错:", error);
	}
};

// 生命周期钩子
onMounted(() => {
	// 添加键盘事件监听
	document.addEventListener("keydown", handleKeyDown);
	// 运行引导动画
	runGuideAnimation();
});

onBeforeUnmount(() => {
	// 移除键盘事件监听
	document.removeEventListener("keydown", handleKeyDown);
});
</script>

<style lang="scss" scoped>
.container {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100px;
	width: 100px;
	position: absolute;
	bottom: 10px;
	right: 10px;
	z-index: 9999;
	cursor: pointer;
}

// 引导动画状态
.guide-animation {
	position: fixed;
	left: 50%;
	top: 50%;
	pointer-events: none; // 动画期间不响应点击
	z-index: 10001;
}

// 悬浮动画
.animate-float {
	animation: float 3s ease-in-out infinite;
}

@keyframes float {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10px);
	}
}

#apple {
	font-size: 40px;
	background-color: #18191f;
	color: #fff;
	box-shadow: 2px 2px 2px #00000080, 10px 1px 12px #00000080, 2px 2px 10px #00000080, 2px 2px 3px #00000080,
		inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080;
	border-radius: 29px;
	padding: 5px 5px;
	margin: 0 40px;
	animation: animate 3s linear infinite;
	text-shadow: 0 0 50px #0072ff, 0 0 100px #0072ff, 0 0 150px #0072ff, 0 0 200px #0072ff;
	transition: all 0.3s ease-in-out;

	&:hover {
		transform: scale(1.1);
		box-shadow: 0 0 25px rgba(0, 114, 255, 0.6), 2px 2px 2px #00000080, 10px 1px 12px #00000080, 2px 2px 10px #00000080,
			2px 2px 3px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080,
			inset 2px 2px 10px #00000080;
	}
}

// 彩虹色动画
@keyframes animate {
	from {
		filter: hue-rotate(0deg);
		box-shadow: 0 0 5px rgba(0, 114, 255, 0.5), 2px 2px 2px #00000080, 10px 1px 12px #00000080, 2px 2px 10px #00000080,
			2px 2px 3px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080,
			inset 2px 2px 10px #00000080;
	}
	50% {
		filter: hue-rotate(180deg);
		box-shadow: 0 0 20px rgba(255, 69, 0, 0.6), 2px 2px 2px #00000080, 10px 1px 12px #00000080, 2px 2px 10px #00000080,
			2px 2px 3px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080,
			inset 2px 2px 10px #00000080;
	}
	to {
		filter: hue-rotate(360deg);
		box-shadow: 0 0 5px rgba(0, 114, 255, 0.5), 2px 2px 2px #00000080, 10px 1px 12px #00000080, 2px 2px 10px #00000080,
			2px 2px 3px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080, inset 2px 2px 10px #00000080,
			inset 2px 2px 10px #00000080;
	}
}

// 引导提示样式
.guide-tooltip {
	position: absolute;
	left: -100px;
	top: 50%;
	transform: translateY(-50%);
	background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
	color: white;
	padding: 12px 16px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	animation: tooltipSlideIn 0.3s ease-out;
	white-space: nowrap;
	z-index: 10002;

	&::before {
		content: "";
		position: absolute;
		right: -8px;
		top: 50%;
		transform: translateY(-50%);
		border-left: 8px solid #096dd9;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
	}

	// 脉冲动画
	animation: tooltipSlideIn 0.3s ease-out, pulse 2s ease-in-out infinite;
}

@keyframes tooltipSlideIn {
	from {
		opacity: 0;
		transform: translateY(-50%) translateX(20px);
	}
	to {
		opacity: 1;
		transform: translateY(-50%) translateX(0);
	}
}

@keyframes pulse {
	0%,
	100% {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}
	50% {
		box-shadow: 0 4px 20px rgba(24, 144, 255, 0.6);
	}
}

.fa-reddit,
.fa-reddit-square {
	transition: all 0.3s ease-in-out;
}
</style>
