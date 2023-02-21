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
