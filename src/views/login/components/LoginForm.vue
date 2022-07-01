<template>
	<div class="login-plane-title">
		大数据展示平台
		<img class="login-plane-title-line" src="@/assets/images/login_horizontal_line.png" alt="" />
	</div>
	<el-form
		ref="loginFormRef"
		class="login-form"
		:model="loginForm"
		:rules="loginRules"
		size="large"
		@keyup.enter="login(loginFormRef)"
	>
		<el-form-item prop="username">
			<el-input v-model="loginForm.username" clearable placeholder="用户名：admin / user" autofocus>
				<template #prefix>
					<el-icon class="el-input__icon"><user /></el-icon>
				</template>
			</el-input>
		</el-form-item>
		<el-form-item prop="password">
			<el-input
				type="password"
				v-model="loginForm.password"
				clearable
				placeholder="密码：123456"
				show-password
				autocomplete="new-password"
			>
				<template #prefix>
					<el-icon class="el-input__icon"><lock /></el-icon>
				</template>
			</el-input>
		</el-form-item>
	</el-form>
	<div class="login-btn">
		<el-button :icon="CircleClose" round @click="resetForm(loginFormRef)" size="large">重置</el-button>
		<el-button :icon="UserFilled" round @click="login(loginFormRef)" size="large" type="primary" :loading="loading">
			登录
		</el-button>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { Login } from "@/api/interface";
import { CircleClose, UserFilled } from "@element-plus/icons-vue";
import type { ElForm } from "element-plus";
import { ElMessage } from "element-plus";
import { loginApi } from "@/api/modules/login";
import { GlobalStore } from "@/store";
import { MenuStore } from "@/store/modules/menu";
import { TabsStore } from "@/store/modules/tabs";
import md5 from "js-md5";

interface ParentProps {
	age?: string;
	address?: string[];
	obj?: {
		username: string;
		password: string;
	};
}
const globalStore = GlobalStore();
const menuStore = MenuStore();
const tabStore = TabsStore();
// 定义 formRef（校验规则）
type FormInstance = InstanceType<typeof ElForm>; // 获取 ElForm 的实例类型
const loginFormRef = ref<FormInstance>(); // 创建 formRef 引用
const loginRules = reactive({
	// 创建 formRef 校验规则
	username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
	password: [{ required: true, message: "请输入密码", trigger: "blur" }]
});
// 登录表单数据
const loginForm = reactive<Login.ReqLoginForm>({
	username: "",
	password: ""
});
onMounted(() => {
	const { userInfo } = globalStore;
	if (userInfo) {
		loginForm.username = userInfo.userName;
		loginForm.password = "123456";
	}
});
const loading = ref<boolean>(false);
const router = useRouter();
const _props = withDefaults(defineProps<ParentProps>(), {
	age: "18",
	address: () => ["广东省"],
	obj: () => {
		return {
			username: "admin",
			password: "123456"
		};
	}
});

// 登录按钮点击事件
const login = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.validate(async valid => {
		if (valid) {
			loading.value = true;
			try {
				const requestLoginForm: Login.ReqLoginForm = {
					username: loginForm.username,
					password: md5(loginForm.password)
				};
				const res = await loginApi(requestLoginForm);
				// * 存储 token
				globalStore.setToken(res.data!.access_token);
				// * 登录成功之后清除上个账号的 menulist 和 tabs 数据
				menuStore.setMenuList([]);
				tabStore.closeMultipleTab();
				ElMessage.success("登录成功！");
				globalStore.setUserInfo({
					userName: requestLoginForm.username,
					userPwd: requestLoginForm.password
				});
				router.push({ name: "dataScreen" });
			} finally {
				loading.value = false;
			}
		}
	});
};

// 重置按钮点击事件
const resetForm = (formEl: FormInstance | undefined) => {
	console.log("_props :>> ", _props);
	if (!formEl) return;
	formEl.resetFields();
};
</script>

<style lang="scss" scoped>
* {
	user-select: none;
}

.login-btn {
	display: flex;
	justify-content: center;
	margin-top: 50px;
}
.login-plane-title {
	width: 100%;
	height: 100px;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	font-size: 40px;
	color: #fff;
	font-weight: 700;
	margin-bottom: 50px;
	letter-spacing: 12px;
	img {
		width: 50%;
	}
	.login-plane-title-line {
		width: 80%;
		position: absolute;
		bottom: 0;
	}
}
// 设置el-input_inner

:deep(.el-input__inner) {
	height: 47px;
	background-color: rgb(255 255 255 / 0%);
}
:deep(.el-input__wrapper) {
	background-color: rgb(255 255 255 / 0%);
}

:deep(.el-form-item) {
	background-color: unset !important;
}
:deep(.el-input input) {
	color: #fff !important;
	font-family: Dosis !important;
}
</style>
