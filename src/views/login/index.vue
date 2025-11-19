<template>
	<div class="login-container flx-center">
		<!-- 星空背景 -->
		<ThreeLogin></ThreeLogin>

		<!-- 登录表单 -->
		<div class="loginform-box">
			<LoginForm></LoginForm>
		</div>
	</div>
</template>

<script setup lang="ts" name="login">
import LoginForm from "./components/LoginForm.vue";
import ThreeLogin from "./threeLogin.vue";

onMounted(() => {
	console.clear();
	console.log("%c初始化完成...", "color:red;font-weight:bold;");
	console.log(
		"%c此项目使用技术栈包括 # Vue 3.2 + TypeScript + Pinia + Vite2 + Element-Plus + ThreeJs + Koa2 + mysql. --SSR服务端渲染待开发中... ",
		"color:red;font-weight:bold;"
	);
});
</script>

<style scoped lang="scss">
.loginform-box {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	width: 400px;
	height: 440px;
	z-index: 10000;
}
</style>
