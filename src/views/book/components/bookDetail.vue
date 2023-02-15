<template>
	<div class="dsa">{{ content }}</div>
</template>
<script setup lang="ts" name="bookDetail">
import { BookStore } from "@/store/modules/book";

const bookStore = BookStore();
// const content = computed(() => bookStore.content);
const content = ref("123");
console.log("bookStore :>> ", bookStore);
</script>
<style lang="scss">
@import "../index.scss";
</style>
