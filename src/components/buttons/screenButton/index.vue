<template>
	<!-- 悬浮按钮 -->
	<div class="container">
		<el-tooltip
			class="box-item"
			raw-content
			effect="dark"
			content="<p><span><strong>CTRL + B</strong> 召唤AI</span></p> <p><span><strong>ESC</strong> 关闭窗口</span></p>"
			placement="left-start"
		>
			<i
				:class="[isTrue ? 'fa fa-reddit' : 'fa fa-reddit-square']"
				id="apple"
				@mouseenter="changeClass()"
				@mouseleave="changeClass()"
				@click="showChatGPT()"
			></i>
		</el-tooltip>
	</div>
</template>

<script setup lang="ts">
import { GlobalStore } from "@/store";
const globalStore = GlobalStore();

let isTrue = ref(true);
const changeClass = () => {
	isTrue.value = !isTrue.value;
};
const showChatGPT = () => {
	globalStore.chatGPT.show = !globalStore.chatGPT.show;
};
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
	transition: all 3s ease-in-out;

	&:hover {
		animation: animate 3s linear infinite;
		transition: all 3s ease-in-out;
	}
}
.fa-reddit,
.fa-reddit-square {
	transition: all 3s ease-in-out;
}

@keyframes animate {
	from {
		filter: hue-rotate(0deg);
	}
	to {
		filter: hue-rotate(360deg);
	}
}
</style>
