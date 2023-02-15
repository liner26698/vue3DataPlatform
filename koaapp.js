// 导入必要的包
const Koa = require("koa");
const Router = require("koa-router");
const db = require("./server/db.js"); // db: 数据库操作
const bodyParser = require("koa-bodyparser"); // bodyParser: 解析请求体
const cors = require("koa-cors"); // cors: 解决跨域问题
const port = 3000; // 服务端口

// 实例化 Koa 和 Router 对象
const app = new Koa();
const router = new Router();

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
	await next();
});

// 启动 Koa 服务
app.use(router.routes());
app.listen(port);
console.log(`启动成功,服务端口为:${port}`);

/*
 * *********************************************** API ***********************************************
 */

// 错误处理
const ERROR = (ctx, msg = "发生异常情况,请刷新重试!") => {
	ctx.body = {
		code: 500,
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

/*
 * 登录接口
 * params: username, password
 * author: kris
 * date: 2023年02月07日15:12:34
 */
router.post("/login", async (ctx, next) => {
	// 获取请求参数
	const { username, password } = ctx.request.body;
	let sql = `SELECT * FROM user_info WHERE username='${username}' AND password='${password}'`;
	let data = await db.query(sql);
	if (!data) ERROR(ctx);
	if (data.length > 0) {
		SUCCESS(ctx, true, "成功", data);
	} else {
		ERROR(ctx, "用户名或密码错误!");
	}
});

/*
 * 测试get接口
 */

router.get("/test", async (ctx, next) => {
	let sql = "select * from user_info";
	let data = await db.query(sql);
	if (data) {
		SUCCESS(ctx, true, "成功", data);
	} else {
		ERROR(ctx, "失败");
	}
});
