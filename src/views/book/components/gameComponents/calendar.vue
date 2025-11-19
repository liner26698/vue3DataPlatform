<template>
	<div class="holidays-container layout-padding">
		<el-card shadow="hover" class="layout-padding-auto">
			<div class="holidays-search mb15"></div>
			<div class="calendar">
				<el-row>
					<el-col :span="24">
						<el-calendar ref="calendarRef" v-model="calendarData">
							<template #header="{ date }">
								<span>{{ date }}</span>
								<el-button-group>
									<el-button size="default" @click="selectDate('prev-month')"> 上一月 </el-button>
									<el-button size="default" @click="selectDate('today')">今天</el-button>
									<el-button size="default" @click="selectDate('next-month')"> 下一月 </el-button>
								</el-button-group>
							</template>
							<template #date-cell="{ data }">
								<div
									class="calendar-day"
									:class="{
										'current-month': data.isCurrentMonth,
										selected: isSelected(data.day),
										'has-events': hasEvents(data.day),
										'no-events': !hasEvents(data.day)
									}"
									@click="handleDayClickIfHasEvents(data.day)"
								>
									<span class="day-number">{{ data.day.split("-").slice(2).join("") }}</span>
									<div
										:class="{
											leavebcolor: selectBcolor(data.day) == '未发售游戏',
											legalbcolor: selectBcolor(data.day) == '已发售游戏'
										}"
									></div>
								</div>
							</template>
						</el-calendar>
					</el-col>
				</el-row>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="holidays">
import { reactive, ref, inject } from "vue";
import moment from "moment";
import type { ListProps } from "./content.vue";
const emit = defineEmits(["selectDate", "dateClick"]);
const calendarRef = ref();

// 添加一个变量来存储当前月份
const currentMonth = ref(moment().format("YYYY-MM"));

// 修改 selectDate 方法，更新当前月份
const selectDate = (action: string) => {
	calendarRef.value.selectDate(action);
	currentMonth.value = moment(calendarData.value).format("YYYY-MM");
	emit("selectDate", calendarData.value);
};

// 修改 handleDayClick 方法
const handleDayClick = (date: string) => {
	const formattedDate = moment(date).format("YYYY-MM-DD");
	const gamesOnDate = allGames.value.filter(game => moment(game.time).format("YYYY-MM-DD") === formattedDate);

	if (gamesOnDate.length === 0) return;

	const onTotal = gamesOnDate.filter(game => game.player_rating).length;
	const notTotal = gamesOnDate.length - onTotal;

	emit("dateClick", {
		date,
		total: gamesOnDate.length,
		onTotal,
		notTotal
	});

	// 触发滚动到顶部
	const listContainer = document.querySelector(".list-info");
	if (listContainer) {
		listContainer.scrollTo({ top: 0, behavior: "smooth" });
	}
};

const calendarData = ref();
const holidays = reactive<{ hdate: string; datetype: string }[]>([]);
const allGames = inject<Ref<ListProps[]>>("allGamesThisMonth", ref([]));

// 修改 selectBcolor 方法
const selectBcolor = (date: string) => {
	if (!allGames.value.length || moment(date).format("YYYY-MM") !== currentMonth.value) return "";
	const game = allGames.value.find(game => moment(game.time).format("YYYY-MM-DD") === date);
	if (!game) return ""; // 如果没有游戏，返回空字符串
	return game.expected_value ? "未发售游戏" : "已发售游戏";
};

watchEffect(() => {
	holidays.length = 0;
	if (allGames.value.length) {
		holidays.push(
			...allGames.value.map(game => ({
				hdate: moment(game.time).format("YYYY-MM-DD"),
				datetype: game.expected_value ? "暂未发售游戏" : "已发售游戏"
			}))
		);
	}
});

// 修改 hasEvents 方法
const hasEvents = (date: string) => {
	if (!allGames.value) return false;
	return allGames.value.some(
		game => moment(game.time).format("YYYY-MM-DD") === date && moment(date).format("YYYY-MM") === currentMonth.value
	);
};

const isSelected = (date: string) => {
	return calendarData.value && moment(calendarData.value).format("YYYY-MM-DD") === date;
};

// 添加 handleDayClickIfHasEvents 方法
const handleDayClickIfHasEvents = (date: string) => {
	if (hasEvents(date)) {
		handleDayClick(date);
	}
};
</script>
<style scoped lang="scss">
.holidays-container {
	background-color: rgb(248, 250, 252);
	padding: 20px;
	border-radius: 12px;
	box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

:deep(.el-card__body) {
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow: auto;
	padding: 0px;
}

.el-col-12 {
	flex: 0 0 auto;
}

//时间选择器
.demo-date-picker {
	display: flex;
	height: 100%;
	width: 100%;
	padding: 0;
	flex-wrap: wrap;
	border: solid 1px var(--el-border-color);
	// border-radius: 5px;
	// border-radius: 0px 10px 10px 0px;
}

.demo-date-picker .block {
	padding: 30px 0;
	text-align: center;
	border-right: solid 1px var(--el-border-color);
	flex: 1;
}

.demo-date-picker .block:last-child {
	border-right: none;
}

.demo-date-picker .demonstration {
	display: block;
	color: var(--el-text-color-secondary);
	font-size: 14px;
	font-weight: 700;
	margin-bottom: 15px;
	text-align: left;
	margin-left: 14%;
	margin-top: 5%;
}

:deep(.el-date-editor.el-input, .el-date-editor.el-input__wrapper) {
	width: 73%;
}

.selectS {
	width: 73%;
}

//保存按钮
.save-btn {
	width: 72%;
	height: 40px;
	margin-top: 60%;
}
// 选中日期样式
.is-selected {
	color: #1989fa;
}
// 暂时未知样式
.workbcolor {
	margin: auto;
	text-align: center;
	width: 40px;
	height: 20px;
	border-radius: 20px;
	// background-color: #1989fa;
	background-color: red;
	margin-top: 5px;
}
// 调休节假日样式
.leavebcolor {
	background-color: #e6a23c;
	box-shadow: 0 0 8px rgba(230, 162, 60, 0.6);
}
// 已发售游戏样式
.legalbcolor {
	background-color: #67c23a;
	box-shadow: 0 0 8px rgba(103, 194, 58, 0.6);
}
:deep(.el-calendar__header) {
	background-color: rgba(255, 255, 255, 0.9);
	padding: 16px;
	border-radius: 8px;
	margin-bottom: 16px;
	box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
	font-size: 18px;
	font-weight: bold;
}

:deep(.el-calendar__body) {
	// 修改主题部分
	padding: 0px;
}

:deep(.el-calendar-table) {
	thead {
		th {
			background-color: #9400d3;
			color: #ffffff;
			padding: 12px;
			font-weight: bold;
			border-radius: 4px;
			box-shadow: 0 0 8px rgba(148, 0, 211, 0.6);
		}
	}
	.is-selected {
		.el-calendar-day {
			// 选中日期格子的颜色
			// background-color: #a3cffcad;
			.calendar-time {
				color: #1989fa;
				font-weight: 700;
				font-size: 20px;
			}
		}
	}
	.el-calendar-day {
		height: 80px;
		p {
			color: #333;
		}
	}
}

//调整说明样式
.desh {
	padding: 2px;
	margin-top: 5px;
	display: flex;
	font-size: 14px;
	color: #808080;
	font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
}

.calendar-day {
	cursor: pointer;
	padding: 8px;
	min-height: 40px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0 0 8px rgba(0, 255, 255, 0.2);

	&:hover {
		background-color: rgba(255, 0, 255, 0.1);
		transform: translateY(-2px);
		box-shadow: 0 0 12px rgba(255, 0, 255, 0.5);
	}

	&.selected {
		color: #0d0d0d;
		transform: scale(1.05);
		box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
	}

	&.has-events {
		animation: pulse 3s infinite;
	}

	&.no-events {
		opacity: 0.5;
		cursor: not-allowed;
		background: rgba(255, 255, 255, 0.7);
		box-shadow: none;
	}
}

@keyframes pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.3);
	}
	70% {
		box-shadow: 0 0 0 10px rgba(0, 255, 255, 0);
	}
	100% {
		box-shadow: 0 0 0 0 rgba(0, 255, 255, 0);
	}
}

.day-number {
	font-size: 14px;
	font-weight: bold;
	color: #333;
	transition: all 0.3s ease;
}

.leavebcolor,
.legalbcolor {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	margin-top: 4px;
	transition: all 0.3s ease;
	box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.leavebcolor {
	box-shadow: 0 0 8px rgba(255, 0, 255, 0.6);
}

.legalbcolor {
	box-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
}

.no-events {
	pointer-events: none;
	opacity: 0.5;
	cursor: not-allowed;
	background: rgba(255, 255, 255, 0.7);
	box-shadow: none;
}
</style>
