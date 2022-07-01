import { defineStore } from "pinia";
import { GlobalState, ThemeConfigProp, UserInfoState } from "./interface";
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persist";
import piniaPersistConfig from "@/config/piniaPersist";

// defineStore 调用后返回一个函数，调用该函数获得 Store 实体
export const GlobalStore = defineStore({
	// id: 必须的，在所有 Store 中唯一
	id: "GlobalState",
	// state: 返回对象的函数
	state: (): GlobalState => ({
		// token
		token: "",
		// userInfo
		userInfo: {
			userName: "",
			userPwd: ""
		},
		// element组件大小
		assemblySize: "default",
		// language
		language: "",
		// themeConfig
		themeConfig: {
			// 默认 primary 主题颜色
			primary: "#409eff",
			// 是否开启深色模式
			isDark: true
		}
	}),
	getters: {},
	actions: {
		// setToken
		setToken(token: string) {
			this.token = token;
		},
		// setUserInfo
		setUserInfo(userInfo: UserInfoState) {
			this.userInfo = userInfo;
		},
		// setAssemblySizeSize
		setAssemblySizeSize(assemblySize: string) {
			this.assemblySize = assemblySize;
		},
		// updateLanguage
		updateLanguage(language: string) {
			this.language = language;
		},
		// setThemeConfig
		setThemeConfig(themeConfig: ThemeConfigProp) {
			this.themeConfig = themeConfig;
		}
	},
	persist: piniaPersistConfig("GlobalState")
});

// piniaPersist(持久化)
const pinia = createPinia();
pinia.use(piniaPersist);

export default pinia;
