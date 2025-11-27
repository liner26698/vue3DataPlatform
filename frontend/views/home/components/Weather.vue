<template>
	<div class="weather_box" v-show="showWeather">
		<div id="he-plugin-standard"></div>
	</div>
</template>

<script setup lang="ts" name="weather">
//天气与时间
const showWeather = ref(false);
const getWeather = () => {
	//  已在此定义 == window.d.ts
	// window.widget = {}
	(window as any).WIDGET = {
		CONFIG: {
			layout: "1",
			width: "450",
			height: "150",
			background: "5",
			dataColor: "FFFFFF",
			borderRadius: "10",
			key: "a47c7cf5d173443ab4e0b4fdf1b10280"
		}
	};
	let script = document.createElement("script");
	script.type = "text/javascript";
	script.src = "https://widget.qweather.net/standard/static/js/he-standard-common.js?v=2.0";
	document.getElementsByTagName("head")[0].appendChild(script);
};
getWeather();

onMounted(() => {
	setTimeout(() => {
		let _weatherDocument = document.getElementById("he-plugin-standard");
		if (_weatherDocument && _weatherDocument.childNodes.length > 0) {
			showWeather.value = true;
		}
	}, 1000);
});
</script>

<style lang="scss" scoped>
.weather_box {
	width: 450px;
	height: 150px;
	background: rgb(0 0 0 / 23%);
	border-radius: 15px;
	user-select: none;
	z-index: 1;
}
</style>
