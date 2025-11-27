<template>
	<!-- left classification -->
	<div class="left-classification">
		<p class="text-xs opacity-40 mb-0 pt-1">分类</p>
		<div class="classification-list mt-2 w-full">
			<div
				v-for="(cItem, cIndex) in classificationList"
				:key="cIndex"
				class="classification-item"
				@click="currentLeft(cItem)"
				:class="{ 'text-c50': currentItem === cItem.label }"
			>
				<span>{{ cItem.label }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { BookStore } from "@/store/modules/book";

const bookStore = BookStore();
let classificationList: any = ref([]);
let currentItem: any = ref("");
const currentLeft = (cItem: any) => {
	currentItem.value = cItem.label;
	bookStore.setCurrentTabLabel(cItem.label);
};

onMounted(() => {
	classificationList.value = bookStore.classificationList;
	currentItem.value = classificationList.value[0].label;
	bookStore.setCurrentTabLabel(classificationList.value[0].label);
});

watch(
	() => bookStore.classificationList,
	() => {
		classificationList.value = bookStore.classificationList;
		currentItem.value = classificationList.value[0].label;
	}
);
</script>
<style lang="scss" scoped>
@import "../index.scss";
</style>
