<template>
	<div class="book-container w-full h-full bg-bgf8">
		<!-- 头部 -->
		<Head></Head>
		<div class="main w-full h-full pt-16">
			<div class="content w-auto h-full mx-48 flex flex-row">
				<!-- 左侧分类 -->
				<LeftClassification></LeftClassification>
				<!-- 右侧主体内容 -->
				<RightContent></RightContent>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="book">
import Head from "./components/Head.vue";
import LeftClassification from "./components/LeftClassification.vue";
import RightContent from "./components/RightContent.vue";
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
