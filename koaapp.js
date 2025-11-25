const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("koa-cors");
const { ERROR } = require("./server/utils/common");
const router = require("./server/routes");
const bookApi = require("./server/routes/bookApi");

const app = new Koa();
const port = 3001;

// 使用中间件
app.use(bodyParser());
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
	})
);

// 错误处理
app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		ERROR(ctx, err.message);
	}
});

// 路由 - 小说模块API优先级更高
app.use(bookApi.routes());
app.use(router.routes());

// 启动服务
app.listen(port, () => {
	console.log(`启动成功,服务端口为:${port}`);
});
