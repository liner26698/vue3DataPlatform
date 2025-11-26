<template>
	<!-- 添加入场动画的包装容器 -->
	<div class="login-plane-animation">
		<div class="login-plane-title">
			大数据智能应用系统
			<img class="login-plane-title-line" src="@/assets/images/login_horizontal_line.png" alt="" />
		</div>
		<!-- 原有的form和其他内容保持不变 -->
		<el-form
			ref="loginFormRef"
			class="login-form"
			:model="loginForm"
			:rules="loginRules"
			size="large"
			@keyup.enter="login(loginFormRef)"
		>
			<el-form-item prop="username">
				<el-input v-model="loginForm.username" clearable placeholder="admin">
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
					placeholder="123456"
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
			<el-button :icon="CircleClose" round @click="resetForm(loginFormRef)" size="large" type="info">重置</el-button>
			<el-button :icon="UserFilled" round @click="login(loginFormRef)" size="large" type="primary" :loading="loading">
				登录
			</el-button>
			<!-- <el-button :icon="UserFilled" round @click="test()" size="large" type="primary" :loading="loading"> 测试token </el-button> -->
		</div>
	</div>
</template>

<script setup lang="ts">
// 导入必要的Vue API
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Login } from "@/api/interface";
import { CircleClose, UserFilled } from "@element-plus/icons-vue";
import { ElButton, ElForm, ElFormItem, ElIcon, ElInput } from "element-plus";
import { ElMessage } from "element-plus";
import { GlobalStore } from "@/store";
import { MenuStore } from "@/store/modules/menu";
import { TabsStore } from "@/store/modules/tabs";
import md5 from "js-md5";
import { loginApi } from "@/api/modules/login";

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
// 添加动画控制变量
const formVisible = ref(false);

onMounted(() => {
	const { userInfo, token } = globalStore;
	// 如果已有 token 和 userInfo，尝试恢复表单并自动登录
	if (token && userInfo && userInfo.userName) {
		loginForm.username = userInfo.userName;
		// 恢复密码（已加密存储）
		if (userInfo.userPwd) {
			loginForm.password = userInfo.userPwd;
		}
		// 延迟显示表单以触发动画
		setTimeout(() => {
			formVisible.value = true;
			// 如果有完整的登录信息和 token，自动登录
			if (loginForm.username && loginForm.password) {
				// 延迟自动登录，让用户看到表单加载
				setTimeout(() => {
					autoLogin();
				}, 500);
			}
		}, 100);
	} else {
		// 没有缓存时直接显示表单
		if (userInfo && userInfo.userName) {
			loginForm.username = userInfo.userName;
		}
		setTimeout(() => {
			formVisible.value = true;
		}, 100);
	}
});

// 自动登录函数
const autoLogin = async () => {
	if (!loginForm.username || !loginForm.password) return;
	loading.value = true;
	try {
		// 密码已经是 MD5 加密形式（从 store 恢复）
		const requestLoginForm: Login.ReqLoginForm = {
			username: loginForm.username,
			password: loginForm.password
		};
		const res: any = await loginApi(requestLoginForm);
		if (res?.data) {
			ElMessage.success("自动登录成功！");
			globalStore.setToken(res.data!.token);
			menuStore.setMenuList([]);
			tabStore.closeMultipleTab();
			globalStore.setUserInfo({
				userName: requestLoginForm.username,
				userPwd: requestLoginForm.password
			});
			router.push({ name: "dataScreen" });
		} else {
			ElMessage.warning("登录已过期，请重新登录");
			// 清除过期的登录信息
			globalStore.setToken("");
			globalStore.setUserInfo({ userName: "", userPwd: "" });
		}
	} catch (error) {
		console.error("自动登录失败:", error);
		ElMessage.error("自动登录失败，请手动登录");
	} finally {
		loading.value = false;
	}
};
const loading = ref<boolean>(false);
const router = useRouter();
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
				const res: any = await loginApi(requestLoginForm);
				if (res?.data) {
					ElMessage.success("登录成功！");
					// * 存储 token
					// * 登录成功之后清除上个账号的 menulist 和 tabs 数据
					globalStore.setToken(res.data!.token);
					menuStore.setMenuList([]);
					tabStore.closeMultipleTab();
					globalStore.setUserInfo({
						userName: requestLoginForm.username,
						userPwd: requestLoginForm.password
					});
					router.push({ name: "dataScreen" });
					console.log("router :>> ", router);
				} else {
					ElMessage.error(res!.message);
				}
			} finally {
				loading.value = false;
			}
		}
	});
};

// 重置按钮点击事件
const resetForm = (formEl: FormInstance | undefined) => {
	if (!formEl) return;
	formEl.resetFields();
};
</script>

<style lang="scss" scoped>
* {
	user-select: none;
}

/* 登录面板入场动画 */
.login-plane-animation {
	opacity: 0;
	transform: translateY(20px);
	transition: opacity 1s ease-out, transform 1s ease-out;
	animation: fadeInUp 1s forwards 0.2s;
}

@keyframes fadeInUp {
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.login-btn {
	display: flex;
	justify-content: center;
	margin-top: 50px;

	.el-button {
		margin: 0 10px;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(144, 202, 249, 0.4);
		}

		&:active {
			transform: translateY(0);
		}
	}
}

.login-plane-title {
	width: 100%;
	height: 100px;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	font-size: 38px;
	color: #fff;
	font-weight: 700;
	margin-bottom: 50px;
	letter-spacing: 12px;
	white-space: nowrap;
	text-shadow: 0 0 10px rgba(144, 202, 249, 0.5), 0 0 20px rgba(144, 202, 249, 0.3);
	animation: glow 2s ease-in-out infinite alternate;

	img {
		width: 50%;
	}

	.login-plane-title-line {
		width: 80%;
		position: absolute;
		bottom: 0;
		animation: fadeIn 1.5s ease-out;
	}
}

@keyframes glow {
	from {
		text-shadow: 0 0 10px rgba(144, 202, 249, 0.5), 0 0 20px rgba(144, 202, 249, 0.3);
	}
	to {
		text-shadow: 0 0 15px rgba(144, 202, 249, 0.8), 0 0 30px rgba(144, 202, 249, 0.5);
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: scaleX(0.8);
	}
	to {
		opacity: 1;
		transform: scaleX(1);
	}
}

// 输入框样式与动画
:deep(.el-input) {
	transition: all 0.3s ease;
	animation: inputFadeIn 0.6s ease-out 0.5s both;
	width: 350px; // 增加固定宽度到350px，确保两个输入框长度一致
}

@keyframes inputFadeIn {
	from {
		opacity: 0;
		transform: translateX(-10px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

:deep(.el-input__inner) {
	height: 47px;
	background-color: rgb(255 255 255 / 0%);
	border: 1px solid rgba(255, 255, 255, 0.3);
	transition: all 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
	animation: breathe 4s ease-in-out infinite;
	color: #fff !important;
	padding: 0 15px; // 添加左右内边距，确保内容不紧贴边缘
	// 防止输入框在有图标的情况下被压缩
	box-sizing: border-box;

	&:focus {
		background-color: rgba(255, 255, 255, 0.05);
		border-color: #90caf9;
		box-shadow: 0 0 10px rgba(144, 202, 249, 0.5), 0 0 20px rgba(144, 202, 249, 0.3) inset;
	}
}

@keyframes breathe {
	0%,
	100% {
		background-color: rgba(255, 255, 255, 0.02);
	}
	50% {
		background-color: rgba(255, 255, 255, 0.05);
	}
}

:deep(.el-input__wrapper) {
	background-color: rgb(255 255 255 / 0%);
	border: none !important;
	box-shadow: none !important;
}

:deep(.el-form-item) {
	background-color: unset !important;
	margin-bottom: 30px !important;

	&:nth-child(2) {
		animation-delay: 0.7s;
	}
}

:deep(.el-input input) {
	color: #fff !important;
	font-family: Dosis !important;
	transition: color 0.3s ease;
}

:deep(.el-input__icon) {
	color: rgba(255, 255, 255, 0.7);
	transition: color 0.3s ease;

	&:hover {
		color: #90caf9;
	}
}

/* 为密码输入框添加额外的延迟动画 */
:deep(.el-form-item:nth-child(2) .el-input) {
	animation-delay: 0.8s;
}
:deep(.el-input__suffix) {
	position: absolute;
	right: -26px;
}
:deep(.el-form-item__error) {
	left: 38px;
	text-decoration: underline;
}
</style>
