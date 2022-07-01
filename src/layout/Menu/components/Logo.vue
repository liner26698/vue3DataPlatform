<template>
	<div class="logo flx-center">
		<!-- <img src="@/assets/images/logo.svg" alt="logo" /> -->
		<!-- <span v-show="!isCollapse">后台管理系统</span> -->
	</div>
</template>

<script setup lang="ts">
defineProps<{ isCollapse: boolean }>();
</script>

<style scoped lang="scss">
@import "../index.scss";
</style>
