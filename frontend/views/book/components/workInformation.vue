<template>
	<div class="chapter-list flex flex-col h-full">
		<div class=" ">
			<h5 class="text-lg font-serif font-black">简介</h5>
			<div class="p-2 shadow-sm rounded-md mt-3">
				<div class="chapter-type text-right">
					<el-tag class="mx-1" effect="dark" round> {{ currentDetail.type }} </el-tag>
					<el-tag class="mx-1" effect="dark" type="success" round> {{ currentDetail.status }} </el-tag>
				</div>
				<div class="chapter-item mt-3">
					<div class="brief-introduction indent-8 text-sm antialiased">{{ currentDetail.desc }}</div>
				</div>
			</div>
		</div>
		<div class="flex-1 mt-10">
			<div class="chapter-item mt-3" v-if="relatedList.length > 0">
				<h5 class="text-lg font-serif font-black">相关推荐</h5>
				<div class="p-2 shadow-sm rounded-md mt-3">
					<div class="related">
						<!-- vif解决第一张图片不显示 (数据没同步) -->
						<el-carousel :interval="8000" type="card" height="160px" @change="relatedimgChange2" v-if="relatedList.length > 0">
							<el-carousel-item v-for="item in relatedList" :key="item.Id">
								<el-image :src="item.Img" @click.stop="relatedimgClick(item)" />
							</el-carousel-item>
						</el-carousel>
					</div>
					<div class="other-info">
						<h3 class="text-center">{{ otherInfo.Name }} - {{ otherInfo.Author }}</h3>
						<h4 class="brief-introduction indent-8 text-sm antialiased">{{ otherInfo.Desc }}</h4>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="workInformation">
import { onMounted } from "vue";

interface WorkInformationProps {
	relatedList: any;
	otherInfo: any;
	currentDetail: any;
}

// 默认值
const props = withDefaults(defineProps<WorkInformationProps>(), {
	relatedList: [],
	otherInfo: {},
	currentDetail: {}
});
const emit = defineEmits(["relatedimgChange"]); //获取父组件的方法emit
// 相关书籍点击事件
const relatedimgClick = async (item: object) => {
	console.log("item :>> ", item);
};
const relatedimgChange2 = (index: number) => {
	emit("relatedimgChange", index);
};

onMounted(() => {
	console.log("props :>> ", props);
});
</script>
