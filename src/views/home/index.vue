<!-- 首页 -->
<template>
	<div class="home-box">
		<!-- 导航 -->
		<headerNav></headerNav>
		<div>
			<!-- <video
				class="dplayer-video dplayer-video-current"
				webkit-playsinline=""
				crossorigin="anonymous"
				preload="metadata"
				src="blob:https://www.ycmdy.com/5ca11f90-9054-47b8-895c-119224937c32"
			></video> -->
		</div>
	</div>
</template>

<script setup lang="ts">
import headerNav from "./components/header.vue";
</script>

<style lang="scss" scoped>
.home-box {
	height: 100%;
	overflow: hidden;
}
</style>
