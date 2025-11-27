<template>
	<el-table :data="data" stripe style="width: 100%">
		<el-table-column type="index" label="序号" width="80" />
		<!-- <el-table-column prop="img" label="游戏图标" width="120">
			<template #default="scope">
				<img :src="scope.row.img" alt="游戏图标" class="game-icon" />
			</template>
		</el-table-column> -->
		<el-table-column prop="title" label="游戏名称" />
		<el-table-column prop="targetgametype" label="游戏平台" />
		<el-table-column prop="game_type" label="游戏类型" />
		<el-table-column prop="time" label="发行日期" />
		<el-table-column prop="update_time" label="更新日期" />
		<el-table-column prop="player_rating" label="评分" />
		<el-table-column prop="player_num" label="其他" />
	</el-table>
	<el-pagination
		class="pagination"
		:current-page="pagination.current"
		:page-size="pagination.size"
		:page-sizes="[20, 50, 100]"
		:total="pagination.total"
		layout="total, sizes, prev, pager, next, jumper"
		@current-change="$emit('page-change', $event)"
		@size-change="$emit('size-change', $event)"
	/>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps({
	data: Array,
	pagination: {
		type: Object,
		default: () => ({
			current: 1,
			size: 20,
			total: 0
		})
	}
});
console.log("props :>> ", props);
const emits = defineEmits(["page-change", "size-change"]);
console.log("emits :>> ", emits);
</script>

<style scoped>
.game-icon {
	width: 50px;
	height: 50px;
	border-radius: 8px;
}

.pagination {
	margin-top: 20px;
	text-align: right;
}
</style>
