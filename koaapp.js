// 导入koa
const Koa = require("koa");
// 创建一个koa对象
const app = new Koa();
//监听端口
const port = 3000;
app.listen(port);
console.log(`启动成功,服务端口为:${port}`);
