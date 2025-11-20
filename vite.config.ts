import { defineConfig, loadEnv, ConfigEnv, UserConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { wrapperEnv } from "./src/utils/getEnv";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import VueSetupExtend from "vite-plugin-vue-setup-extend";
import eslintPlugin from "vite-plugin-eslint";
import vueJsx from "@vitejs/plugin-vue-jsx";
// import importToCDN from "vite-plugin-cdn-import";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import vueSetupExtend from "vite-plugin-vue-setup-extend-plus";

// @see: https://vitejs.dev/config/
export default defineConfig((mode: ConfigEnv): UserConfig => {
	const env = loadEnv(mode.mode, process.cwd()); // loadEnv(mode, root)
	const viteEnv = wrapperEnv(env);
	console.log("viteEnv :>> ", viteEnv);
	return {
		resolve: {
			alias: {
				"@": resolve(__dirname, "./src"),
				"@images": resolve(__dirname, "./src/assets/images"),
				"vue-i18n": "vue-i18n/dist/vue-i18n.cjs.js"
			}
		},
		// base: "/test/",
		base: "/",
		// global css
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: `@import "@/styles/var.scss";`
				}
			}
		},
		// server config
		server: {
			host: "0.0.0.0", // 服务器主机名，如果允许外部访问，可设置为"0.0.0.0"
			port: viteEnv.VITE_PORT,
			open: viteEnv.VITE_OPEN,
			cors: true,
			// https: false,
			// 代理跨域（mock 不需要配置，这里只是个事列）
			proxy: {
				"/api": {
					secure: false,
					// target: "http://8.166.130.216:3000", // 发布环境
					target: "http://127.0.0.1:3001", // 本地开发测试环境
					// target: "http://127.0.0.1:3000", // 发布正式环境
					// target: viteEnv.VITE_APP_ENV === "production" ? "http://8.166.130.216:3000" : "http://127.0.0.1:3000",
					changeOrigin: true,
					rewrite: path => path.replace(/^\/api/, "")
				},
				"/bookApi": {
					secure: false,
					target: "http://127.0.0.1:3001",
					changeOrigin: true,
					rewrite: path => path.replace(/^\/bookApi/, "")
				},
				"/shuapi": {
					secure: false, // * 是否开启https
					target: "http://shuapi.jiaston.com",
					changeOrigin: true,
					rewrite: path => path.replace(/^\/shuapi/, "")
				}
				// 以上接口调用异常，可尝试使用以下接口 2023年05月10日11:42:14
			}
		},
		// plugins
		plugins: [
			vue(),
			vueSetupExtend(),
			createHtmlPlugin({
				inject: {
					data: {
						title: viteEnv.VITE_GLOB_APP_TITLE
					}
				}
			}),
			// * EsLint 报错信息显示在浏览器界面上
			eslintPlugin(),
			// * vite 可以使用 jsx/tsx 语法
			vueJsx(),
			// * name 可以写在 script 标签上
			VueSetupExtend(),
			// * demand import element（如果使用了cdn引入,没必要使用element自动导入了）
			AutoImport({
				resolvers: [ElementPlusResolver()],
				dts: "types/auto-imports.d.ts", // 生成配置文件，如果是ts项目，通常我们会把声明文件放在根目录/types中，注意，这个文件夹需要先建好，否则可能导致等下无法往里生成auto-imports.d.ts文件
				// imports: ["vue", "vue-router", "pinia"],
				imports: ["vue", "vue-router", "vue-i18n", "@vueuse/head", "@vueuse/core"],
				eslintrc: {
					enabled: false, // 默认false, true启用。生成一次就可以，避免每次工程启动都生成，一旦生成配置文件之后，最好把enable关掉，即改成false。否则这个文件每次会在重新加载的时候重新生成，这会导致eslint有时会找不到这个文件。当需要更新配置文件的时候，再重新打开
					filepath: "./.eslintrc-auto-import.json", // 生成json文件,可以不配置该项，默认就是将生成在根目录
					globalsPropValue: true
				}
			}),
			Components({
				resolvers: [ElementPlusResolver()]
			}),
			// * cdn 引入（vue、element-plus）
			// importToCDN({
			// 	modules: [
			// 		{
			// 			name: "vue",
			// 			var: "Vue",
			// 			path: "https://unpkg.com/vue@next"
			// 		},
			// 		{
			// 			name: "element-plus",
			// 			var: "ElementPlus",
			// 			path: "https://unpkg.com/element-plus",
			// 			css: "https://unpkg.com/element-plus/dist/index.css"
			// 		}
			// 	]
			// }),
			// * 是否生成包预览
			viteEnv.VITE_REPORT && visualizer(),
			// * gzip compress
			viteEnv.VITE_BUILD_GZIP &&
				viteCompression({
					verbose: true, // * 是否在控制台输出压缩信息
					disable: false, // * 是否禁用插件
					threshold: 10240, // * 文件大小大于该值时启用压缩
					algorithm: "gzip", // * 压缩算法
					ext: ".gz" // * 压缩文件后缀
				})
		],
		// build configure
		build: {
			outDir: "dist",
			minify: "terser",
			terserOptions: {
				// delete console/debugger
				compress: {
					drop_console: viteEnv.VITE_DROP_CONSOLE, // * 是否删除 console
					drop_debugger: false // * 是否删除 debugger
				}
			},
			rollupOptions: {
				output: {
					// Static resource classification and packaging
					chunkFileNames: "assets/js/[name]-[hash].js",
					entryFileNames: "assets/js/[name]-[hash].js",
					assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
				}
			}
		}
	};
});
