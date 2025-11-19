<template>
	<div class="content-main overflow-hidden w-full h-full flex-auto">
		<!-- <el-empty description="换个搜索条件试试吧" style="width: 100%; height: 100%" /> -->
		<div class="container-list-box flex w-full h-full">
			<div class="list-info overflow-y-scroll w-full h-full rounded-md p-4">
				<div class="list-info-item" v-for="(item, index) in list" :key="index">
					<!-- Swiper -->
					<div class="swiper">
						<div class="swiper-wrapper">
							<div class="swiper-slide">
								<img :src="item.img" alt="游戏图片" />
								<!-- 评分 体验度 -->
								<div class="content">
									<!-- 发售的游戏包含体验和评分 -->
									<div class="rate">
										<template v-if="item.player_rating">
											<p class="flex">
												<el-rate v-model="item.player_rating2" disabled :max="5" allow-half /><el-text
													class="mx-1"
													type="warning"
													size="large"
													>{{ item.player_rating }}</el-text
												>
											</p>
											<p>
												<el-text class="mx-1" type="warning">{{ item.player_num }}</el-text>
											</p>
										</template>
										<!-- 未发售的游戏包含期待值 -->
										<template v-else>
											<p class="flex justify-end">
												<el-text class="mx-1 text-right" type="warning"
													>期待值: {{ item.expected_value || "评分人数不足" }}</el-text
												>
											</p>
											<p v-for="(x, g) in item.player_num.split(' ')" :key="g">
												<el-text class="mx-1" type="warning">{{ x }}</el-text>
											</p>
										</template>
									</div>
									<div class="title w-2/3">
										<h1 @click="toGameUrl(item.url)">
											<span class="white-point"></span>
											<el-link>
												<el-text class="mx-1" type="primary" size="large">{{ item.title }}</el-text></el-link
											>
											<span class="white-point"></span>
										</h1>
										<h5>
											发行日期： <el-text class="mx-1" type="info">{{ item.time }}</el-text>
										</h5>
										<h5>
											游戏类型： <el-text class="mx-1" type="success">{{ item.gameType }}</el-text>
										</h5>
										<h5>
											制作发行： <el-text class="mx-1" type="info">{{ item.production }}</el-text>
										</h5>
									</div>
									<p>
										{{ item.introduction }}
									</p>
								</div>
							</div>
						</div>
						<div class="swiper-pagination"></div>
					</div>
				</div>
				<!-- 暂无数据 -->
				<el-empty v-if="list.length === 0" description="暂无数据" style="width: 100%; height: 100%" />
			</div>
			<div class="widget-hotsearch w-2/4 h-full p-4" v-if="searchKey == ' '">
				<el-row :gutter="16" class="mb-5">
					<el-col :span="8">
						<div class="statistic-card">
							<el-statistic :value="gameTotal" value-style="color:#409EFF">
								<template #title>
									<div class="inline-flex items-center">{{ currentFilterDate ? "当日" : "本月" }}的游戏总数&nbsp;</div>
								</template>
							</el-statistic>
						</div>
					</el-col>

					<el-col :span="8" v-if="!showDailyStats">
						<div class="statistic-card">
							<el-statistic :value="gameOnTotal" value-style="color:#67C23A">
								<template #title>
									<div class="inline-flex items-center">{{ currentFilterDate ? "当日" : "本月" }}已发售游戏</div>
								</template>
							</el-statistic>
						</div>
					</el-col>

					<el-col :span="8" v-if="!showDailyStats">
						<div class="statistic-card">
							<el-statistic :value="gameNotTotal" value-style="color:#E6A23C">
								<template #title>
									<div class="inline-flex items-center">{{ currentFilterDate ? "当日" : "本月" }}未发售游戏</div>
								</template>
							</el-statistic>
						</div>
					</el-col>
				</el-row>
				<transition name="el-fade-in">
					<div class="mb-4" v-if="showAllButtonVisible">
						<el-button type="primary" @click="showAllGames" :disabled="isLoading">显示全部</el-button>
					</div>
				</transition>
				<calendar @select-date="selectDate" @date-click="handleDateClick" :list="list"></calendar>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, provide, watch, computed } from "vue";
import { getGameListApi } from "@/api/book/modules/game/index";
import { BookStore } from "@/store/modules/book";
import moment from "moment";
import calendar from "./calendar.vue";
import { debounce } from "lodash-es";

export interface ListProps {
	title: string;
	url: string;
	img: string;
	time: string;
	gameType: string;
	production: string;
	introduction: string;
	update_time: string;
	targetgametype: string;
	player_rating: string;
	player_rating2: string;
	player_num: string;
	expected_value: string;
}

const bookStore = BookStore();
const searchKey = computed(() => bookStore.searchInfo.key);
const leftTabLabel = computed(() => bookStore.leftTabLabel);
const monthTime = ref(new Date());
const currentMonthTime = ref(moment(monthTime.value).format("yyyy-MM"));
const gameTotal = ref(0);
const gameOnTotal = ref(0);
const gameNotTotal = ref(0);
const list = ref<ListProps[]>([]);
const allGames = ref<ListProps[]>([]);
const currentFilterDate = ref<string | null>(null);
const showAllButtonVisible = ref(false);
const showDailyStats = ref(false);
const isLoading = ref(false);

const params = ref({
	category: leftTabLabel.value,
	month: currentMonthTime.value,
	searchText: searchKey.value?.trim() || "" // 使用可选链和逻辑或运算符
});

const fetchGames = async () => {
	const res = (await getGameListApi(params.value)) as { data: { records: ListProps[] } };
	if (res) {
		allGames.value = [...res.data.records];
		list.value = [...allGames.value];
		updateGameStats();
	}
};

const updateGameStats = () => {
	gameTotal.value = list.value.length;
	gameOnTotal.value = list.value.filter(game => game.player_rating).length;
	gameNotTotal.value = gameTotal.value - gameOnTotal.value;
};

const handleDateClick = (data: { date: string; total: number; onTotal: number; notTotal: number }) => {
	currentFilterDate.value = moment(data.date).format("YYYY-MM-DD");
	showAllButtonVisible.value = true;
	showDailyStats.value = true;
	gameTotal.value = data.total;
	gameOnTotal.value = data.onTotal;
	gameNotTotal.value = data.notTotal;
	list.value = allGames.value.filter(game => moment(game.time).format("YYYY-MM-DD") === currentFilterDate.value);
};

const showAllGames = debounce(async () => {
	isLoading.value = true; // 开始加载
	currentFilterDate.value = null;
	showAllButtonVisible.value = false;
	showDailyStats.value = false;
	list.value = [...allGames.value];
	updateGameStats();

	// 触发滚动到顶部
	const listContainer = document.querySelector(".list-info");
	if (listContainer) {
		listContainer.scrollTo({ top: 0, behavior: "smooth" });
	}

	// 模拟加载完成
	setTimeout(() => {
		isLoading.value = false; // 结束加载
	}, 500); // 500ms 加载时间
}, 500);

const selectDate = (val: string) => {
	currentMonthTime.value = moment(val).format("yyyy-MM");
	params.value.month = currentMonthTime.value;
	fetchGames();
};

const toGameUrl = (url: string) => {
	window.open(url, "_blank");
};

onMounted(fetchGames);
watch(searchKey, newKey => {
	params.value.searchText = newKey;
	fetchGames();
});
watch(leftTabLabel, () => {
	params.value.category = leftTabLabel.value;
	fetchGames();
});

provide("allGamesThisMonth", allGames);
</script>
<style lang="scss" scoped>
@import "../../index.scss";
@import url("https://fonts.googleapis.com/css2?family=Raleway:wght@200;300;400;500;600&display=swap");
.is-guttered {
	text-align: center;
}
:deep(.el-statistic__content) {
	color: #67c23a;
}
.swiper {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
	font-family: "Raleway", sans-serif;
}

body {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	background: #fff;
	min-height: 100vh;
	width: 100%;
	overflow: hidden;
}

main {
	display: grid;
	grid-template-columns: 1fr;
	width: 100%;
	place-items: center;
	min-height: 100vh;
	padding: 0 100px;
}

/* SWIPER */

.swiper {
	max-width: 750px;
	// aspect-ratio: 5/3;
	z-index: 10;
	margin-bottom: 20px;
}

.swiper-pagination {
	transform: translateY(-10px);
	z-index: 10;
	--swiper-pagination-color: #7edd90;
	--swiper-pagination-bullet-size: 12px;
	--swiper-pagination-bullet-horizontal-gap: 5px;
}

.swiper-slide {
	position: relative;
	display: grid;
	grid-template-columns: 40% 60%;
	place-items: center;
	gap: 15px;
	padding: 20px 40px 20px 20px;
	border-radius: 14px;
	border: 2px solid rgba(255, 255, 255, 0.1);
	background: #fff;
	// box-shadow: inset 18px 18px 8px rgba(0, 0, 0, 0.2), inset -10px -18px 8px rgba(255, 255, 255, 0.1);
	box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}
.rate {
	position: absolute;
	top: 21px;
	right: 10px;
	text-align: right;
}
.swiper-slide > img {
	width: 80%;
	height: 80%;
	border-radius: 30px;
	border: 2px solid #fff;
	filter: grayscale(40%);
}

.content {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start;
	gap: 25px;
	color: #fff;
}

.title > h1 {
	display: flex;
	align-items: center;
	gap: 8px;
	letter-spacing: 0.2rem;
	font-size: 1.3rem;
	color: #6b7280;
	max-width: 280px;
	padding-bottom: 20px;
}

.title > h5 {
	line-height: 2;
	letter-spacing: 0.05rem;
	color: #6b7280;
	font-size: 0.9rem;
}

.content > p {
	line-height: 1.5;
	color: #6b7280;
	font-size: 1rem;
}

.white-point {
	display: inline-flex;
	width: 4px;
	height: 4px;
	border-radius: 50%;
	background-color: #484848;
}

/* ANIMATED BACKGROUND */

.particles {
	position: absolute;
	display: flex;
	z-index: 1;
	padding: 0 10px;
	z-index: 5;
}

.particles span {
	position: relative;
	bottom: 30px;
	width: 30px;
	height: 30px;
	background: #7edd90;
	box-shadow: 0 0 0 10px #7edd9044, 0 0 50px #7edd90, -100px 0 #475c9a99, 100px 0 #475c9a99;
	margin: 0 4px;
	border-radius: 50%;
	animation: animate calc(190s / var(--i)) ease infinite;
}

.particles span:nth-child(2n) {
	background: #475c9a;
	box-shadow: 0 0 0 10px #475c9a44, 0 0 50px #475c9a, -100px 0 #7edd9099, 100px 0 #7edd9099;
}

.particles span:nth-child(3n) {
	background: #9a4772;
	box-shadow: 0 0 0 10px #9a477244, 0 0 50px #9a4772, -100px 0 #7edd9099, 100px 0 #7edd9099;
}

@keyframes animate {
	0% {
		transform: translateY(120vh) scale(0) rotate(180deg);
	}

	20% {
		transform: translateY(100vh) scale(1) rotate(0deg);
	}

	100% {
		transform: translateY(-120vh) scale(0.5) rotate(360deg);
	}
}

@media (max-width: 800px) {
	main {
		padding: 0 0;
	}

	.swiper {
		max-width: 650px;
	}
}

:global(h2#card-usage ~ .example .example-showcase) {
	background-color: var(--el-fill-color) !important;
}

.el-statistic {
	--el-statistic-content-font-size: 28px;
}

.statistic-card {
	height: 100%;
	padding: 20px;
	border-radius: 4px;
	background-color: var(--el-bg-color-overlay);
}

.statistic-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	font-size: 12px;
	color: var(--el-text-color-regular);
	margin-top: 16px;
}

.statistic-footer .footer-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.statistic-footer .footer-item span:last-child {
	display: inline-flex;
	align-items: center;
	margin-left: 4px;
}

.green {
	color: var(--el-color-success);
}
.red {
	color: var(--el-color-error);
}

.el-button {
	width: 100%;
	margin-bottom: 20px;
	background-color: #7edd90;
	border-color: #7edd90;
	color: #fff;
	transition: all 0.3s ease;

	&:hover {
		background-color: #6bcb80;
		border-color: #6bcb80;
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	&:active {
		transform: translateY(0);
		box-shadow: none;
	}
}

.el-fade-in-enter-active,
.el-fade-in-leave-active {
	transition: all 0.3s cubic-bezier(0.3, 1.3, 0.3, 1);
}

.el-fade-in-enter-from,
.el-fade-in-leave-to {
	opacity: 0;
	transform: scaleY(0);
}
</style>
