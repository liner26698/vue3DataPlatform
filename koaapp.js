// 首先，导入必要的包
const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const mysql = require("mysql");
const cors = require("koa-cors");

// 接下来，实例化 Koa 和 Router 对象
const app = new Koa();
const router = new Router();

// 接下来，配置 MySQL 连接信息
const connection = mysql.createConnection({
	host: "10.0.132.54",
	user: "root", //用户名
	password: "ssitg@admin1233", //密码
	database: "zjcp_isj_visitor", // 数据库名称
	port: "3306" //端口号
});

// 然后，使用 bodyParser 中间件处理请求数据：
app.use(bodyParser());

// 处理跨域
app.use(cors());
app.use(async (ctx, next) => {
	ctx.set("Access-Control-Allow-Origin", "*");
	await next();
});

// 启动 Koa 服务
app.use(router.routes());

const port = 3000;
app.listen(port);
console.log(`启动成功,服务端口为:${port}`);

/*
 * *********************************************** API ***********************************************
 */

// 错误处理
const ERROR = (ctx, msg) => {
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
	// connection.connect();
	await new Promise((resolve, reject) => {
		connection.query(`SELECT * FROM user_info WHERE username='${username}' AND password='${password}'`, (req, res) => {
			let params = {};

			// 如果请求失败，返回错误信息
			if (req) {
				reject(req);
			} else {
				// 如果请求成功，返回成功信息
				if (res.length > 0) {
					params = {
						success: true,
						message: "成功!",
						data: res
					};
					resolve(params);
				} else {
					// 如果没有查询到数据，返回错误信息
					params = {
						success: false,
						message: "用户名或密码错误!"
					};
					resolve(params);
				}
			}
		});
	})
		.then(result => {
			ctx.body = result;
			SUCCESS(ctx, result.success, result.message, result.data);
		})
		.catch(err => {
			ERROR(ctx, err);
		});
});
