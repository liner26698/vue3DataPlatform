<!-- grid 图片展示 -->
<template>
	<div
		class="photo-container"
		v-loading="loading"
		element-loading-text="加载中..."
		:element-loading-spinner="loadingSvg"
		element-loading-svg-view-box="-10, -10, 50, 50"
		body
	>
		<div class="grid" style="display: block">
			<div class="grid--item">
				<div class="img imgbg1"></div>
				<div class="container">
					<h2>BB</h2>
					<div class="desc">This is her favorite dog</div>
				</div>
			</div>
			<div class="grid--item" @click="showParallaxPhotoCarousel()">
				<div class="img imgbg2"></div>
				<div class="container">
					<h2>Sweet</h2>
					<div class="desc">Sexy and Sweet Time</div>
				</div>
			</div>
			<div class="grid--item">
				<div class="img imgbg3"></div>
				<div class="container">
					<h2>佳兆业</h2>
					<div class="desc">A place to live together</div>
				</div>
			</div>
			<div class="grid--item">
				<div class="img imgbg4"></div>
				<div class="container">
					<h2>Horse</h2>
					<div class="desc">Warm little nest</div>
				</div>
			</div>
			<div class="grid--item">
				<div class="img imgbg5"></div>
				<div class="container">
					<h2>莲花公园</h2>
					<div class="desc">Fly a kite together</div>
				</div>
			</div>
			<div class="grid--item">
				<div class="img imgbg6"></div>
				<div class="container">
					<h2>汕尾</h2>
					<div class="desc">A place to travel</div>
				</div>
			</div>
			<div class="grid--item">
				<div class="img imgbg7"></div>
				<div class="container">
					<h2>潮汕</h2>
					<div class="desc">The place where she grew up</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { loadingSvg } from "@/utils/svg";
const loading = ref(false);
const showParallaxPhotoCarousel = () => {
	loading.value = true;
	console.log("showParallaxPhotoCarousel");
};
</script>

<style scoped lang="scss">
.photo-container {
	width: 100%;
	height: 100%;
	overflow: hidden;
	animation: fadeIn 8s both;
}
.grid {
	padding: 370px;
	margin: 0 auto;
	// max-width: 1200px;
	width: 100%;
	height: 100%;
	overflow: scroll;
	padding-top: 20px;
	padding-bottom: 20px;
	opacity: 0.8;
}
@keyframes fadeIn {
	0% {
		opacity: 0;
		transform: translatey(40px);
	}
	100% {
		opacity: 1;
	}
}
.grid--item {
	position: relative;
	// margin-top: -65px;
	margin-top: -8%;
	margin-right: 5px;
	margin-left: 5px;
	width: calc(33.33% - 10px);
	float: left;
	transition: all 0.5s;
	overflow: hidden;
	-webkit-clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	-webkit-shape-outside: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	cursor: pointer;
}
.grid--item:before {
	display: block;
	padding-top: 112.5%;
	content: "";
}
.grid--item:nth-child(1),
.grid--item:nth-child(2) {
	margin-top: 0;
}
.grid--item:nth-child(7n-1),
.grid--item:nth-child(1) {
	// margin-left: 138px;
	margin-left: 17.2%;
}

.img {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background-position: center center;
	background-size: cover;
	overflow: hidden;
	-webkit-clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
}
.imgbg1 {
	background-image: url(../../../assets/images/home/girl1.jpg);
	background-repeat: no-repeat;
}
.imgbg2 {
	background-image: url(../../../assets/images/home/girl2.PNG);
	background-repeat: no-repeat;
}
.imgbg3 {
	background-image: url(../../../assets/images/home/girl3.JPG);
	background-repeat: no-repeat;
}
.imgbg4 {
	background-image: url(../../../assets/images/home/girl4.JPG);
	background-repeat: no-repeat;
}
.imgbg5 {
	background-image: url(../../../assets/images/home/girl5.JPG);
	background-repeat: no-repeat;
}
.imgbg6 {
	background-image: url(../../../assets/images/home/girl6.JPG);
	background-repeat: no-repeat;
}
.imgbg7 {
	background-image: url(../../../assets/images/home/girl7.JPG);
	background-repeat: no-repeat;
}
.img:before,
.img:after {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	content: "";
	opacity: 0;
	transition: opacity 0.5s;
}
.img:before {
	background: rgba(128, 0, 128, 0.25);
}
.img:after {
	background: linear-gradient(to top, transparent, rgba(0, 0, 0, 0.5), transparent);
}

.container {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 100%;
	opacity: 0;
	text-align: center;
	color: white;
	will-change: transform;
	backface-visibility: hidden;
	transform: translate(-50%, -50%) scale(0.9);
	transition: all 0.5s;
	-webkit-shape-outside: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	shape-outside: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
}

h1,
h2 {
	// font-family: &quot;Arapey&quot;;
	font-style: italic;
	font-weight: 400;
}

h1 {
	margin-top: 90px;
	text-align: center;
	font-size: 56px;
	color: #242424;
}

h2 {
	font-size: 32px;
}
h2:before,
h2:after {
	display: inline-block;
	margin: 0 0.5em;
	width: 0.75em;
	height: 0.03em;
	background: turquoise;
	content: "";
	vertical-align: middle;
	transition: all 0.3s;
}

.desc {
	margin: 1em 0 0;
	// font-family: &quot;ATC Overlook&quot;;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	font-weight: bold;
	font-size: 11px;
	line-height: 1.5;
	color: turquoise;
}

.grid--item:hover .img:before,
.grid--item:hover .img:after,
.grid--item:hover .container {
	opacity: 1;
}
.grid--item:hover .container {
	transform: translate(-50%, -50%) scale(1);
}
</style>
