<template>
	<div class="dataScreen-container">
		<chat></chat>
		<screenButton></screenButton>
		<div class="dataScreen" ref="dataScreenRef">
			<div class="dataScreen-header">
				<div class="header-lf">
					<span class="header-screening" @click="handleTo">首页</span>
				</div>
				<div class="header-ct">
					<div class="header-ct-title">
						<span>大数据智能应用系统</span>
						<div class="header-ct-warning">平台高峰预警信息（{{ alarmTotal }}条）</div>
					</div>
				</div>
				<div class="header-rg">
					<span class="header-download" @click="changeShowWarning">预警详情</span>
					<span class="header-time">当前时间：{{ time }}</span>
				</div>
			</div>
			<div class="dataScreen-main">
				<div class="dataScreen-lf">
					<div class="dataScreen-top">
						<div class="dataScreen-main-title">
							<span>实时游客统计</span>
							<img src="./images/dataScreen-title.png" alt="" />
						</div>
						<!-- chart区域 -->
						<div class="dataScreen-main-chart">
							<RealTimeAccessChart ref="RealTimeAccessRef" :realTimeVisitorNum="realTimeVisitorNum" />
						</div>
					</div>
					<div class="dataScreen-center">
						<div class="dataScreen-main-title">
							<span>男女比例</span>
							<img src="./images/dataScreen-title.png" alt="" />
						</div>
						<!-- chart区域 -->
						<div class="dataScreen-main-chart">
							<MaleFemaleRatioChart ref="MaleFemaleRatioRef" />
						</div>
					</div>
					<div class="dataScreen-bottom">
						<div class="dataScreen-main-title">
							<span>年龄比例</span>
							<img src="./images/dataScreen-title.png" alt="" />
						</div>
						<!-- chart区域 -->
						<div class="dataScreen-main-chart">
							<AgeRatioChart ref="AgeRatioRef" />
						</div>
					</div>
				</div>
				<div class="dataScreen-ct">
					<div class="dataScreen-map">
						<div class="dataScreen-map-title">景区实时客流量</div>
						<template v-if="isShowWarning">
							<vue3-seamless-scroll :list="alarmData" class="scroll" :step="0.2" :hover="true" :limitScrollNum="3">
								<div>
									<div v-for="item in alarmData" :key="item.id">
										<img src="./images/dataScreen-alarm.png" alt="" />
										<span class="map-alarm sle">{{ item.label }} 预警：{{ item.warnMsg }}</span>
									</div>
								</div>
							</vue3-seamless-scroll>
						</template>
						<mapChart ref="MapchartRef" />
					</div>
					<div class="dataScreen-cb">
						<div class="dataScreen-main-title">
							<span>未来30天游客量趋势图</span>
							<img src="./images/dataScreen-title.png" alt="" />
						</div>
						<!-- chart区域 -->
						<div class="dataScreen-main-chart">
							<OverNext30Chart ref="OverNext30Ref" />
						</div>
					</div>
				</div>
				<div class="dataScreen-rg">
					<div class="dataScreen-top">
						<div class="dataScreen-main-title">
							<span>旅游热门推荐</span>
							<img src="./images/dataScreen-title.png" alt="" />
						</div>
						<!-- chart区域 -->
						<div class="dataScreen-main-chart">
							<HotPlateChart ref="HotPlateRef" />
						</div>
					</div>
					<div class="dataScreen-center">
						<div class="dataScreen-main-title">
							<span>年度游客量对比</span>
							<img src="./images/dataScreen-title.png" alt="" />
						</div>
						<!-- chart区域 -->
						<div class="dataScreen-main-chart">
							<AnnualUseChart ref="AnnualUseRef" />
						</div>
					</div>
					<div class="dataScreen-bottom">
						<div class="dataScreen-main-title">
							<span>预约渠道数据统计</span>
							<img src="./images/dataScreen-title.png" alt="" />
						</div>
						<!-- chart区域 -->
						<div class="dataScreen-main-chart">
							<PlatformSourceChart ref="PlatformSourceRef" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { HOME_URL } from "@/config/config";
import { randomNum } from "@/utils/util";
import { useRouter } from "vue-router";
import { useTime } from "@/hooks/useTime";
import { ECharts } from "echarts";
import mapChart from "./components/chinaMapChart.vue";
import chat from "./components/chat.vue";
import AgeRatioChart from "./components/AgeRatioChart.vue";
import AnnualUseChart from "./components/AnnualUseChart.vue";
import HotPlateChart from "./components/HotPlateChart.vue";
import MaleFemaleRatioChart from "./components/MaleFemaleRatioChart.vue";
import OverNext30Chart from "./components/OverNext30Chart.vue";
import PlatformSourceChart from "./components/PlatformSourceChart.vue";
import RealTimeAccessChart from "./components/RealTimeAccessChart.vue";
import { Vue3SeamlessScroll } from "vue3-seamless-scroll";
import { realTimeVisitorApi, realTimeVisitorSexApi, alarmListApi, hotPlateApi } from "@/api/dataScreen/modules/index";
import screenButton from "@/components/buttons/screenButton/index.vue";
import { GlobalStore } from "@/store";
/* 引入警告数据 */
// import alarmList from "./assets/alarmList.json";
// let alarmList: any = [];
const alarmTotal = ref(0);
/* 获取最外层盒子 */
const dataScreenRef = ref<HTMLElement | null>(null);
/* 预警详情开关 */
const isShowWarning = ref(false);
const globalStore = GlobalStore();

onMounted(async () => {
	// 初始化时为外层盒子加上缩放属性，防止刷新界面时就已经缩放
	if (dataScreenRef.value) {
		dataScreenRef.value.style.transform = `scale(${getScale()}) translate(-50%, -50%)`;
		dataScreenRef.value.style.width = `1920px`;
		dataScreenRef.value.style.height = `1080px`;
	}
	/* 初始化echarts和获取基础数据接口*/
	initCharts();
	initData();
	/* 初始化chatGPT */
	globalStore.chatGPT.show = false;
	// 为浏览器绑定事件
	window.addEventListener("resize", resize);
});

const changeShowWarning = () => {
	isShowWarning.value = !isShowWarning.value;
};
/* 声明echarts实例 */
interface ChartProps {
	[key: string]: ECharts | null;
}
const dataScreen: ChartProps = reactive({
	chart1: null,
	chart2: null,
	chart3: null,
	chart4: null,
	chart5: null,
	chart6: null,
	chart7: null,
	mapChart: null
});
/* 获取子组件的ref */
interface ChartExpose {
	initChart: (params: any) => ECharts;
}
const RealTimeAccessRef = ref<ChartExpose>();
const AgeRatioRef = ref<ChartExpose>();
const AnnualUseRef = ref<ChartExpose>();
const HotPlateRef = ref<ChartExpose>();
const MaleFemaleRatioRef = ref<ChartExpose>();
const OverNext30Ref = ref<ChartExpose>();
const PlatformSourceRef = ref<ChartExpose>();
const MapchartRef = ref<ChartExpose>();
/* 初始化 charts参数 */
let realTimeVisitorNum = ref("0");
let ageData = [
	{
		value: 200,
		name: "10岁以下",
		percentage: "16%"
	},
	{
		value: 110,
		name: "10 - 18岁",
		percentage: "8%"
	},
	{
		value: 150,
		name: "18 - 30岁",
		percentage: "12%"
	},
	{
		value: 310,
		name: "30 - 40岁",
		percentage: "24%"
	},
	{
		value: 2,
		name: "40 - 60岁",
		percentage: "1%"
	},
	{
		value: 260,
		name: "60岁以上",
		percentage: "20%"
	}
];
let alarmData: any = [];
let hotData: any = [];
let platFromData = [
	{
		value: 40,
		name: "智慧文旅平台",
		percentage: "40%"
	},
	{
		value: 10,
		name: "携程",
		percentage: "10%"
	},
	{
		value: 20,
		name: "飞猪",
		percentage: "20%"
	},
	{
		value: 30,
		name: "其他渠道",
		percentage: "30%"
	}
];
let annualData = [
	{
		label: new Date().getFullYear() - 2 + "年",
		value: ["184", "90", "120", "0", "30", "100", "80", "40", "20", "510", "350", "180"]
	},
	{
		label: new Date().getFullYear() - 1 + "年",
		value: ["118", "509", "366", "162", "380", "123", "321", "158", "352", "474", "154", "22"]
	},
	{
		label: new Date().getFullYear() + "年",
		value: ["548", "259", "113", "90", "69", "512", "23", "49", "28", "420", "313", "156"]
	}
];
let mapData = [
	{
		fromName: "北京",
		toName: "上海",
		coords: [
			[116.4551, 40.2539],
			[121.4648, 31.2891]
		]
	},
	{
		fromName: "上海",
		toName: "北京",
		coords: [
			[121.4648, 31.2891],
			[116.4551, 40.2539]
		]
	},
	{
		fromName: "北京",
		toName: "广州",
		coords: [
			[116.4551, 40.2539],
			[113.5107, 23.2196]
		]
	},
	{
		fromName: "广州",
		toName: "北京",
		coords: [
			[113.5107, 23.2196],
			[116.4551, 40.2539]
		]
	},
	{
		fromName: "北京",
		toName: "成都",
		coords: [
			[116.4551, 40.2539],
			[103.9526, 30.7617]
		]
	},
	{
		fromName: "成都",
		toName: "北京",
		coords: [
			[103.9526, 30.7617],
			[116.4551, 40.2539]
		]
	},
	{
		fromName: "成都",
		toName: "新疆维吾尔自治区",
		coords: [
			[103.9526, 30.7617],
			[85.294711, 41.371801]
		]
	},
	{
		fromName: " 新疆维吾尔自治区",
		toName: "成都",
		coords: [
			[85.294711, 41.371801],
			[103.9526, 30.7617]
		]
	}
];
/* 初始化数据 */
const initData = () => {
	// 获取实时游客统计数据
	getRealTimeVisitorApi();
	// 获取实时游客性别比例数据
	getRealTimeVisitorSexApi();
	// 获取告警数据
	getAlarmListApi();
	// 获取旅游热门推荐数据
	getHotPlateApi();
};

/* 初始化 echarts */
const initCharts = (): void => {
	dataScreen.chart1 = RealTimeAccessRef.value?.initChart(0.5) as ECharts;
	dataScreen.chart2 = AgeRatioRef.value?.initChart(ageData) as ECharts;
	dataScreen.chart3 = AnnualUseRef.value?.initChart({
		data: annualData,
		unit: annualData.map(val => val.label),
		columns: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
		colors: ["#FFA600", "#007AFE", "#FF4B7A"]
	}) as ECharts;

	dataScreen.chart6 = OverNext30Ref.value?.initChart({
		unit: ["访问量"],
		data: new Array(30).fill("").map(val => {
			val = randomNum(1, 20000);
			return val;
		})
	}) as ECharts;
	dataScreen.chart7 = PlatformSourceRef.value?.initChart({
		data: platFromData,
		colors: ["#078dbc", "#6ad40b", "#6172fc", "#1786ff", "#ffbe2f", "#4dc89d", "#b797df", "#ffd3aa"]
	}) as ECharts;
	dataScreen.mapChart = MapchartRef.value?.initChart(mapData) as ECharts;
};

/* 根据浏览器大小推断缩放比例 */
const getScale = (width = 1920, height = 1080) => {
	// 为什么要除以width和height? 为了保持宽高比例
	let ww = window.innerWidth / width;
	let wh = window.innerHeight / height;
	console.log("ww :>> ", ww);
	console.log("wh :>> ", wh);
	return ww < wh ? ww : wh;
};

/* 浏览器监听 resize 事件 */
const resize = () => {
	if (dataScreenRef.value) {
		dataScreenRef.value.style.transform = `scale(${getScale()}) translate(-50%, -50%)`;
	}
	// 使用了 scale 的echarts其实不需要需要重新计算缩放比例
	Object.values(dataScreen).forEach(chart => {
		chart && chart.resize();
	});
};

/* 全屏 */
// const fullScreen = () => {
// 	if (dataScreenRef.value) {
// 		dataScreenRef.value.requestFullscreen();
// 	}
// };

/* 获取当前时间 */
const { nowTime } = useTime();
let timer: any = null;
let time: Ref<string> = ref(nowTime.value);
timer = setInterval(() => {
	time.value = useTime().nowTime.value;
}, 1000);

/* 跳转home */
const router = useRouter();
const handleTo = async (): Promise<void> => {
	try {
		await router.replace(HOME_URL);
	} catch (e) {
		console.warn("跳转首页失败:", e);
	}
};

const getRealTimeVisitorApi = async () => {
	let res: any = await realTimeVisitorApi();
	if (res) {
		realTimeVisitorNum.value = String(res.data?.visitorNum);
	}
};

const getAlarmListApi = async () => {
	try {
		let res: any = await alarmListApi();
		if (res && res.success && res.data && res.data.alarmList) {
			// 清空现有数据
			alarmData = [];

			// 处理新数据
			for (const i of res.data.alarmList) {
				if (i && i.id && i.area && i.content) {
					alarmData.push({
						id: i.id,
						warnMsg: i.content,
						label: i.area
					});
				}
			}

			// 更新告警总数
			alarmTotal.value = res.data.alarmList.length;

			// 显示告警信息
			isShowWarning.value = alarmTotal.value > 0;
		} else {
			console.warn("告警数据格式异常:", res);
			// 设置默认模拟数据，确保页面有内容展示
			setDefaultAlarmData();
		}
	} catch (error) {
		console.error("加载告警数据失败:", error);
		// 发生错误时也显示默认数据
		setDefaultAlarmData();
	}
};

// 添加默认数据函数，当接口调用失败时使用
const setDefaultAlarmData = () => {
	alarmData = [
		{ id: 1, warnMsg: "系统初始化中，正在加载告警数据...", label: "系统" },
		{ id: 2, warnMsg: "欢迎使用大数据智能应用系统", label: "提示" }
	];
	alarmTotal.value = alarmData.length;
	isShowWarning.value = true;
};

const getHotPlateApi = async () => {
	let res: any = await hotPlateApi();
	if (res) {
		res.data.hotPlateList.slice(0, 5).forEach((val: any) => {
			// 5位数随机
			let random = Number(randomNum(10000, 99999).toFixed(0));
			// 百分比为随机数除以100000
			let percentage = ((random / 100000) * 100).toFixed(0) + "%";

			let data = {
				name: val.title,
				src: val.src,
				value: random,
				percentage: percentage,
				maxValue: 100000
			};
			hotData.push({
				...data
			});
		});
		dataScreen.chart4 = HotPlateRef.value?.initChart({
			data: hotData,
			colors: ["#1089E7", "#F57474", "#56D0E3", "#F8B448", "#8B78F6"]
		}) as ECharts;
	}
};

const getRealTimeVisitorSexApi = async () => {
	let res: any = await realTimeVisitorSexApi();
	if (res) {
		const total = res.data.sexRatio.maleCount + res.data.sexRatio.femaleCount;
		const manPercentage = ((res.data.sexRatio.maleCount / total) * 1).toFixed(1);
		const womanPercentage = ((res.data.sexRatio.femaleCount / total) * 1).toFixed(1);
		dataScreen.chart5 = MaleFemaleRatioRef.value?.initChart({
			man: manPercentage,
			woman: womanPercentage
		}) as ECharts;
	}
};

/* 销毁时触发 */
onBeforeUnmount(() => {
	window.removeEventListener("resize", resize);
	clearInterval(timer);
	// 每次离开页面时，清空echarts实例，不然会出现无法显示的问题
	Object.values(dataScreen).forEach(val => {
		try {
			val?.dispose();
		} catch (e) {
			console.warn("ECharts dispose error:", e);
		}
	});
});
</script>
<style lang="scss" scoped>
@import "./index.scss";
</style>
