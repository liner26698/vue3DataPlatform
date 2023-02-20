import { createApp } from "vue";
import App from "./App.vue";
// reset style sheet
import "@/styles/reset.scss";
// CSS common style sheet
import "@/styles/common.scss";
// iconfont css
import "@/assets/iconfont/iconfont.scss";
// font css
import "@/assets/fonts/font.scss";
// element plus
import ElementPlus from "element-plus";
// element icons
import * as Icons from "@element-plus/icons-vue";
// element css
import "element-plus/dist/index.css";
// element dark
import "element-plus/theme-chalk/dark/css-vars.css";
// custom element dark
import "@/styles/element-dark.scss";
// custom element css
import "@/styles/element.scss";
// custom directives
import directives from "@/directives/index";
// vue Router
import router from "@/routers/index";
// i18n
import I18n from "@/language/index";
// pinia store
import pinia from "@/store/index";
// tailwindcss
import "@/assets/css/tailwind.css";
// svg icons
import SvgIcon from "./components/SvgIcon/SvgIcon.vue";
import "@/assets/iconfont/iconfont.js";
const app = createApp(App);

// 注册element Icons组件
Object.keys(Icons).forEach(key => {
	app.component(key, Icons[key as keyof typeof Icons]);
});

app.component("SvgIcon", SvgIcon);
app.use(router).use(I18n).use(pinia).use(directives).use(ElementPlus).mount("#app");
