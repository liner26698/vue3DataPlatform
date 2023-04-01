// 导入必要的包
const Koa = require("koa");
const Router = require("koa-router");
const db = require("./server/db.js"); // db: 数据库操作
const bodyParser = require("koa-bodyparser"); // bodyParser: 解析请求体
const cors = require("koa-cors"); // cors: 解决跨域问题
const port = 3000; // 服务端口
const jwt = require("jsonwebtoken"); // 用于签发、解析`token`
const tokenConfig = { privateKey: "testKey" }; // 加密密钥

// 实例化 Koa 和 Router 对象
const app = new Koa();
const router = new Router();

// 错误处理
const ERROR = (ctx, msg = "发生异常情况,请刷新重试!", code = 500) => {
	ctx.body = {
		code,
		message: msg
	};
};

// 成功处理
const SUCCESS = (ctx, flag = true, msg = null, data = null) => {
	ctx.body = {
		code: 200,
		success: flag,
		message: msg,
		data: data
	};
};

// jwt 验证
class Auth {
	static expiresIn = 60 * 60 * 24; // 授权时效24小时
	static async verifyToken(token) {
		try {
			jwt.verify(token, tokenConfig.privateKey);
			return true;
		} catch (e) {
			return false;
		}
	}
}

// 路由菜单配置
const menuList = [
	{
		icon: "home-filled",
		title: "首页",
		path: "/home/index"
	},
	{
		icon: "histogram",
		title: "数据大屏",
		path: "/dataScreen"
	},
	{
		icon: "reading",
		title: "小说",
		path: "/book",
		// children: [
		// 	{
		// 		path: "/book/detail",
		// 		title: "书籍详情",
		// 		icon: "menu"
		// 	}
		// ]
	},
	{
		icon: "message-box",
		title: "超级表格",
		path: "/proTable",
		children: [
			{
				path: "/proTable/useHooks",
				title: "使用 Hooks",
				icon: "menu"
			},
			{
				path: "/proTable/useComponent",
				title: "使用 Component",
				icon: "menu"
			}
		]
	},
	{
		icon: "data-analysis",
		title: "Dashboard",
		path: "/dashboard",
		children: [
			{
				path: "/dashboard/dataVisualize",
				title: "数据可视化",
				icon: "menu"
			},
			{
				path: "/dashboard/embedded",
				title: "内嵌页面",
				icon: "menu"
			}
		]
	},
	{
		icon: "tickets",
		title: "表单 Form",
		path: "/form",
		children: [
			{
				path: "/form/basicForm",
				title: "基础 Form",
				icon: "menu"
			},
			{
				path: "/form/validateForm",
				title: "校验 Form",
				icon: "menu"
			},
			{
				path: "/form/dynamicForm",
				title: "动态 Form",
				icon: "menu"
			}
		]
	},
	{
		icon: "trend-charts",
		title: "Echarts",
		path: "/echarts",
		children: [
			{
				path: "/echarts/waterChart",
				title: "水型图",
				icon: "menu"
			},
			{
				path: "/echarts/columnChart",
				title: "柱状图",
				icon: "menu"
			},
			{
				path: "/echarts/lineChart",
				title: "折线图",
				icon: "menu"
			},
			{
				path: "/echarts/pieChart",
				title: "饼图",
				icon: "menu"
			},
			{
				path: "/echarts/radarChart",
				title: "雷达图",
				icon: "menu"
			},
			{
				path: "/echarts/nestedChart",
				title: "嵌套环形图",
				icon: "menu"
			}
		]
	},
	{
		icon: "briefcase",
		title: "常用组件",
		path: "/assembly",
		children: [
			{
				path: "/assembly/selectIcon",
				title: "Icon 选择",
				icon: "menu"
			},
			{
				path: "/assembly/batchImport",
				title: "批量导入数据",
				icon: "menu"
			}
		]
	},
	{
		icon: "stamp",
		title: "自定义指令",
		path: "/directives",
		children: [
			{
				path: "/directives/copyDirect",
				title: "复制指令",
				icon: "menu"
			},
			{
				path: "/directives/watermarkDirect",
				title: "水印指令",
				icon: "menu"
			},
			{
				path: "/directives/dragDirect",
				title: "拖拽指令",
				icon: "menu"
			},
			{
				path: "/directives/debounceDirect",
				title: "防抖指令",
				icon: "menu"
			},
			{
				path: "/directives/throttleDirect",
				title: "节流指令",
				icon: "menu"
			},
			{
				path: "/directives/longpressDirect",
				title: "长按指令",
				icon: "menu"
			}
		]
	},
	{
		icon: "list",
		title: "菜单嵌套",
		path: "/menu",
		children: [
			{
				path: "/menu/menu1",
				title: "菜单1",
				icon: "menu"
			},
			{
				path: "/menu/menu2",
				title: "菜单2",
				icon: "menu",
				children: [
					{
						path: "/menu/menu2/menu21",
						title: "菜单2-1",
						icon: "menu"
					},
					{
						path: "/menu/menu2/menu22",
						title: "菜单2-2",
						icon: "menu",
						children: [
							{
								path: "/menu/menu2/menu22/menu221",
								title: "菜单2-2-1",
								icon: "menu"
							},
							{
								path: "/menu/menu2/menu22/menu222",
								title: "菜单2-2-2",
								icon: "menu"
							}
						]
					},
					{
						path: "/menu/menu2/menu23",
						title: "菜单2-3",
						icon: "menu"
					}
				]
			},
			{
				path: "/menu/menu3",
				title: "菜单3",
				icon: "menu"
			}
		]
	},
	{
		icon: "warning-filled",
		title: "错误页面",
		path: "/error",
		children: [
			{
				path: "/404",
				title: "404页面",
				icon: "menu"
			},
			{
				path: "/403",
				title: "403页面",
				icon: "menu"
			},
			{
				path: "/500",
				title: "500页面",
				icon: "menu"
			}
		]
	},
	{
		icon: "paperclip",
		title: "外部链接",
		path: "/link",
		children: [
			{
				path: "/link/github",
				title: "GitHub 仓库",
				icon: "menu",
				isLink: "https://github.com/liner26698/vue3DataPlatform"
			}
		]
	}
];

// 按钮权限配置
const buttonsList = {
	useProTable: ["add", "batchDelete"],
	authButton: ["add", "edit", "delete", "import", "export"]
};

// 配置 MySQL 连接信息 db.js 使用 bodyParser 中间件处理请求数据
app.use(bodyParser());

// 处理跨域
// app.use(cors());
app.use(
	cors({
		origin: function (ctx) {
			//设置允许来自指定域名请求
			// return 'http://xxx'; //只允许http://localhost:8080这个域名的请求
			return "*";
			// return ctx.header.origin
		},
		// maxAge: 5, //指定本次预检请求的有效期，单位为秒。
		credentials: false, //是否允许发送Cookie
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], //设置所允许的HTTP请求方法
		allowHeaders: ["Content-Type", "Authorization", "Accept"], //设置服务器支持的所有头信息字段
		exposeHeaders: ["WWW-Authenticate", "Server-Authorization"] //设置获取其他自定义字段
	})
);
app.use(async (ctx, next) => {
	ctx.set("Access-Control-Allow-Origin", "*");
	// 判断token有没过期
	if (ctx.request.url != "/login" && ctx.request.url != "/test") {
		let token = ctx.request.header["x-access-token"];
		if (token) {
			try {
				let result = await jwt.verify(token, tokenConfig.privateKey);
				let nowDate = new Date().getTime();
				let exp = result.exp;
				if (result && nowDate > exp * 1000) {
					ERROR(ctx, "token已过期", 599);
				} else {
					await next();
				}
			} catch (error) {
				ERROR(ctx, "token已过期", 599);
			}
		} else {
			ERROR(ctx, "token不存在", 599);
		}
	} else {
		await next();
	}
});

// 启动 Koa 服务
app.use(router.routes());
app.listen(port);
console.log(`启动成功,服务端口为:${port}`);

/*
 * *********************************************** API ***********************************************
 */

/*
 * 登录接口
 * params: username, password
 * author: kris
 * date: 2023年02月07日15:12:34
 */
router.post("/login", async (ctx, next) => {
	const { username, password } = ctx.request.body;
	let sql = `SELECT * FROM user_info WHERE username='${username}' AND password='${password}'`;
	let userInfo = await db.query(sql);
	let params = {};
	let token = "";
	if (!userInfo) ERROR(ctx);
	if (userInfo.length > 0) {
		token = jwt.sign({ username, password }, tokenConfig.privateKey, {
			expiresIn: Auth.expiresIn
		});
		params = Object.assign({}, userInfo[0], { token });
		SUCCESS(ctx, true, "成功", params);
	} else {
		ERROR(ctx, "用户名或密码错误!");
	}
});
/*
 * 大屏实时访客数接口
 * params: visitorNum 访客数
 * author: kris
 * date: 2023年02月20日14:22:24
 */

router.get("/statistics/getRealTimeVisitorNum", async (ctx, next) => {
	let sql = "select * from data_screen";
	let sqlData = await db.query(sql);
	if (sqlData) {
		let data = {
			visitorNum: sqlData[0].realTimeVisitorNum
		};
		SUCCESS(ctx, true, "成功", data);
	} else {
		ERROR(ctx, "失败");
	}
});

/*
 * 测试Token接口
 * params: true 未过期 false 已过期
 */
router.post("/testToken", async (ctx, next) => {
	const { token } = ctx.request.body;
	if (token) {
		try {
			let result = await jwt.verify(token, tokenConfig.privateKey);
			let nowDate = new Date().getTime();
			let exp = result.exp;
			if (result && nowDate > exp * 1000) {
				SUCCESS(ctx, false, "token已过期");
			} else {
				SUCCESS(ctx, true, "成功");
			}
		} catch (error) {
			SUCCESS(ctx, false, "token已过期");
		}
	}
});

/*
 * 权限菜单列表接口
 * author: kris
 * date: 2023年03月10日23:34:37
 */
router.get("/menu/getMenuList", async (ctx, next) => {
	SUCCESS(ctx, true, "成功", menuList);
});

/*
 * 权限按钮接口
 * author: kris
 * date: 2023年03月16日11:12:28
 */
router.get("/auth/buttons", async (ctx, next) => {
	SUCCESS(ctx, true, "成功", buttonsList);
});
