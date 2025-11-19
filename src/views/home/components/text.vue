<!-- 颜色渐变文字 -->
<template>
	<h3 class="t_span t_loader">
		<span
			v-for="(item, index) in textObject.content"
			:key="index"
			:style="{
				color: textObject.color,
				fontSize: textObject.fontSize + 'px',
				fontWeight: textObject.fontWeight,
				textAlign: textObject.textAlign
			}"
			>{{ item }}</span
		>
	</h3>
</template>

<script setup lang="ts" name="home">
interface textProps {
	content: any; // 内容
	fontSize?: string; // 字体大小
	color?: string; // 字体颜色
	fontWeight?: any; // 字体粗细
	textAlign?: any; // 字体对齐方式
}

const textObject = withDefaults(defineProps<textProps>(), {
	content: "",
	fontSize: "30",
	color: "#333",
	fontWeight: 500,
	textAlign: "left"
});
</script>

<style scoped lang="scss">
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	font-family: "ROBOTO", sans-serif;
}

.nav,
.slider {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100vh;
	position: relative;
	background-color: #1e1f26;
	text-align: center;
	padding: 0 2em;
}

.nav h1,
.slider h1 {
	font-family: "Josefin Sans", sans-serif;
	font-size: 5vw;
	margin: 0;
	padding-bottom: 0.5rem;
	letter-spacing: 0.3rem;
	color: #03dac6;
	transition: all 0.3s ease;
	z-index: 3;
}
h1:hover {
	transform: translate3d(0, -10px, 22px);
	color: #ff0266;
}

.slider h2 {
	font-size: 2vw;
	letter-spacing: 0.3rem;
	font-family: "ROBOTO", sans-serif;
	font-weight: 300;
	color: #faebd7;
	z-index: 4;
}
h3.t_span {
	font-size: 2vw;
	letter-spacing: 0.7em;
	font-family: "ROBOTO", sans-serif;
	font-weight: 300;
	color: #faebd7;
	z-index: 4;
	user-select: none;
}
span:hover {
	color: #ff0266;
	font-weight: 500;
	font-size: 2.2vw;
}

a {
	text-decoration: none;
}

.nav-container {
	display: flex;
	flex-direction: row;
	position: absolute;
	bottom: 0;
	width: 100%;
	height: 75px;
	box-shadow: 20px 20px 50px rgba(0, 0, 0, 0.5);
	background: #1e1f26;
	z-index: 10;
	transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.nav-container--top-first {
	position: fixed;
	top: 75px;
	transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.nav-container--top-second {
	position: fixed;
	top: 0;
}
.nav-tab {
	display: flex;
	justify-content: center;
	align-items: center;
	flex: 1;
	color: #03dac6;
	letter-spacing: 0.1rem;
	transition: all 0.5s ease;
	font-size: 2vw;
}

.nav-tab:hover {
	color: #1e1f26;
	background: #03dac6;
	transition: all 0.5s ease;
}

.nav-tab-slider {
	position: absolute;
	bottom: 0;
	width: 0;
	height: 2px;
	background: #03dac6;
	transition: left 0.3s ease;
}
.background {
	position: absolute;
	height: 90vh;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: auto;
}
.background {
	position: absolute;
	height: 100vh;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 0;
}
.t_loader span {
	color: #faebd7;
	text-shadow: 0 0 0 #faebd7;
	-webkit-animation: loading 1s ease-in-out infinite alternate;
}

@-webkit-keyframes loading {
	to {
		text-shadow: 20px 0 70px #ff0266;
		color: #ff0266;
	}
}
.t_loader span:nth-child(2) {
	-webkit-animation-delay: 0.1s;
}
.t_loader span:nth-child(3) {
	-webkit-animation-delay: 0.2s;
}
.t_loader span:nth-child(4) {
	-webkit-animation-delay: 0.3s;
}
.t_loader span:nth-child(5) {
	-webkit-animation-delay: 0.4s;
}
.t_loader span:nth-child(6) {
	-webkit-animation-delay: 0.5s;
}
.t_loader span:nth-child(7) {
	-webkit-animation-delay: 0.6s;
}
.t_loader span:nth-child(8) {
	-webkit-animation-delay: 0.7s;
}
.t_loader span:nth-child(9) {
	-webkit-animation-delay: 0.8s;
}

.t_loader span:nth-child(10) {
	-webkit-animation-delay: 0.9s;
}
.t_loader span:nth-child(11) {
	-webkit-animation-delay: 1s;
}
.t_loader span:nth-child(12) {
	-webkit-animation-delay: 1.1s;
}
.t_loader span:nth-child(13) {
	-webkit-animation-delay: 1.2s;
}
.t_loader span:nth-child(14) {
	-webkit-animation-delay: 1.3s;
}
.t_loader span:nth-child(15) {
	-webkit-animation-delay: 1.4s;
}
.t_loader span:nth-child(16) {
	-webkit-animation-delay: 1.5s;
}
.t_loader span:nth-child(17) {
	-webkit-animation-delay: 1.6s;
}
.t_loader span:nth-child(18) {
	-webkit-animation-delay: 1.7s;
}
.t_loader span:nth-child(19) {
	-webkit-animation-delay: 1.8s;
}
.t_loader span:nth-child(20) {
	-webkit-animation-delay: 1.9s;
}
.t_loader span:nth-child(21) {
	-webkit-animation-delay: 2s;
}
.t_loader span:nth-child(22) {
	-webkit-animation-delay: 2.1s;
}
.t_loader span:nth-child(23) {
	-webkit-animation-delay: 2.2s;
}
.t_loader span:nth-child(24) {
	-webkit-animation-delay: 2.3s;
}
.t_loader span:nth-child(25) {
	-webkit-animation-delay: 2.4s;
}
.t_loader span:nth-child(26) {
	-webkit-animation-delay: 2.5s;
}
.t_loader span:nth-child(27) {
	-webkit-animation-delay: 2.6s;
}
.t_loader span:nth-child(28) {
	-webkit-animation-delay: 2.7s;
}
.t_loader span:nth-child(29) {
	-webkit-animation-delay: 2.8s;
}
.t_loader span:nth-child(30) {
	-webkit-animation-delay: 2.9s;
}
.t_loader span:nth-child(31) {
	-webkit-animation-delay: 3s;
}
</style>
