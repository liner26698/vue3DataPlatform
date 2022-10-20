<template>
	<!-- left classification -->
	<div class="left-classification">
		<p class="text-xs opacity-40 mb-0 pt-1">分类</p>
		<div class="classification-list mt-2 w-full">
			<div v-for="(cItem, cIndex) in classificationList" :key="cIndex" class="classification-item">
				<span>{{ cItem.label }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const classificationList = [
	{
		label: "全部资源",
		value: "all"
	},
	{
		label: "玄幻",
		value: "xuanhuan"
	},
	{
		label: "修真",
		value: "xiuzhen"
	},
	{
		label: "都市",
		value: "dushi"
	},
	{
		label: "历史",
		value: "lishi"
	},
	{
		label: "网游",
		value: "wangyou"
	},
	{
		label: "科幻",
		value: "kehuan"
	},
	{
		label: "灵异",
		value: "lingyi"
	},
	{
		label: "其他",
		value: "other"
	}
];
</script>
<style lang="scss" scoped>
@import "../index.scss";
</style>
