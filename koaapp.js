const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("koa-cors");
const { ERROR } = require("./server/utils/common");
const router = require("./server/routes");
const bookApi = require("./server/routes/bookApi");
const { startScheduledTasks } = require("./server/utils/cronScheduler");

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

// 启动热门话题爬虫定时任务
console.log("\n🚀 正在启动热门话题爬虫定时任务...");
try {
	startScheduledTasks();
	console.log("✅ 爬虫定时任务已启动\n");
} catch (error) {
	console.error("⚠️ 爬虫定时任务启动失败:", error.message);
}

// 启动服务
app.listen(port, () => {
	console.log(`✅ 服务启动成功，端口: ${port}`);
});
