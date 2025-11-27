import router from "@/routers/router";
import NProgress from "@/config/nprogress";
import { HOME_URL } from "@/config/config";
import { AuthStore } from "@/store/modules/auth";
import { GlobalStore } from "@/store";
import { AxiosCanceler } from "@/api/helper/axiosCancel";

const axiosCanceler = new AxiosCanceler();

// * 初始化 pinia state - 从 localStorage 恢复已保存的状态
function initializeStore() {
	const globalStore = GlobalStore();
	const authStore = AuthStore();

	// 尝试从 localStorage 恢复 GlobalState
	const globalStateJson = localStorage.getItem("GlobalState");
	if (globalStateJson) {
		try {
			const globalState = JSON.parse(globalStateJson);
			if (globalState.token) {
				globalStore.setToken(globalState.token);
			}
			if (globalState.userInfo) {
				globalStore.setUserInfo(globalState.userInfo);
			}
			if (globalState.language) {
				globalStore.updateLanguage(globalState.language);
			}
			if (globalState.themeConfig) {
				globalStore.setThemeConfig(globalState.themeConfig);
			}
			if (globalState.assemblySize) {
				globalStore.setAssemblySizeSize(globalState.assemblySize);
			}
		} catch (e) {
			console.warn("Failed to restore GlobalState from localStorage:", e);
		}
	}

	// 尝试从 localStorage 恢复 AuthState
	const authStateJson = localStorage.getItem("AuthState");
	if (authStateJson) {
		try {
			const authState = JSON.parse(authStateJson);
			if (authState.authButtons) {
				authStore.setAuthButtons(authState.authButtons);
			}
			if (authState.authRouter) {
				authStore.setAuthRouter(authState.authRouter);
			}
		} catch (e) {
			console.warn("Failed to restore AuthState from localStorage:", e);
		}
	}
}

// 在第一次路由导航前初始化
let initialized = false;

// * 路由拦截 beforeEach
router.beforeEach((to, from, next) => {
	// 首次进入时初始化 store
	if (!initialized) {
		initializeStore();
		initialized = true;
	}
	NProgress.start();
	// * 在跳转路由之前，清除所有的请求
	axiosCanceler.removeAllPending();

	// * 判断当前路由是否需要访问权限
	if (!to.matched.some(record => record.meta.requiresAuth)) return next();

	// * 判断是否有Token
	const globalStore = GlobalStore();
	if (!globalStore.token) {
		// 没有 token 时跳转到登录页
		if (to.path !== "/login") {
			next({
				path: "/login"
			});
		} else {
			next();
		}
		NProgress.done();
		return;
	}

	// * 如果有 Token 访问登录页，重定向到首页
	if (to.path === "/login") {
		next(HOME_URL);
		NProgress.done();
		return;
	}

	const authStore = AuthStore();
	// * Dynamic Router(动态路由，根据后端返回的菜单数据生成的一维数组)
	const dynamicRouter = authStore.dynamicRouter;
	// * Static Router(静态路由，必须配置首页地址，否则不能进首页获取菜单、按钮权限等数据)，获取数据的时候会loading，所有配置首页地址也没问题
	const staticRouter = [HOME_URL, "/403", "/login"];
	const routerList = dynamicRouter.concat(staticRouter);

	// * 如果访问的地址没有在路由表中重定向到403页面
	if (routerList.indexOf(to.path) !== -1) return next();
	next({
		path: "/403"
	});
});

router.afterEach(() => {
	NProgress.done();
});

export default router;
