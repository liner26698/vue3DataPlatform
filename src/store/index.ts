// defineStore, createPinia 是 pinia 的两个核心函数, 用于创建 Store 实体和创建 pinia 实例
import { defineStore, createPinia } from "pinia";
import { GlobalState, ThemeConfigProp, UserInfoState } from "./interface";
import piniaPersist from "pinia-plugin-persist"; // 引入 piniaPersist 插件
import piniaPersistConfig from "@/config/piniaPersist"; // 引入 piniaPersist 配置

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
			isDark: false
		},
		chatGPT: {
			show: false,
			authorization: "Bearer 78b8378cf021866327f554c6da83f28a.EPjpv5PirdYo4Czt",
			contentType: "application/json",
			urls: "https://api.deepseek.com",
			key: "sk-a2121cafac0e4173bbec5124027984da",
			name: "DeepSeek ChatGPT",
			model: "R1"
		},
		headerTabList: [
			{
				label: "AI",
				value: "login"
			},
			{
				label: "小说",
				value: "book"
			},
			{
				label: "游戏",
				value: "game"
			},
			{
				label: "其他",
				value: "other"
			}
		]
	}),
	// getters: 返回对象的函数
	getters: {},
	// actions: 返回对象的函数
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
	// 持久化配置
	persist: piniaPersistConfig("GlobalState")
});

// piniaPersist(持久化)
const pinia = createPinia(); // 创建一个 pinia 实例
pinia.use(piniaPersist); // 使用 piniaPersist 插件

export default pinia;
