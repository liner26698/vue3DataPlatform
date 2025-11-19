<!-- 照片墙 首页 -->
<template>
	<div class="home-box">
		<grid />
	</div>
</template>

<script setup lang="ts">
import grid from "./components/grid.vue";
</script>

<style lang="scss" scoped>
.home-box {
	height: 100%;
	background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
	overflow: hidden;
}
</style>
