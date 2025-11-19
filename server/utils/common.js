const jwt = require("jsonwebtoken");

// JWT 配置
const tokenConfig = {
	privateKey: "testKey" // 确保这里有一个有效的私钥
};

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

// 获取当前时间 格式: 2023-02-07 15:12:34
const getNowDate = () => {
	const date = new Date();
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();
	return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// 对应routers的路由配置
const menuList = [
	{
		icon: "home-filled",
		title: "首页",
		path: "/home/index"
	},
	{
		icon: "message-box",
		title: "日志管理",
		path: "/logs/index"
	},
	{
		icon: "histogram",
		title: "数据大屏",
		path: "/dataScreen"
	},
	{
		icon: "reading",
		title: "小说",
		path: "/book"
	},

	{
		icon: "tickets",
		title: "照片墙",
		path: "/photo",
		children: [
			{
				path: "/photo/index",
				title: "照片墙",
				icon: "menu"
			}
		]
	},
	{
		icon: "data-analysis",
		title: "爬取数据统计",
		path: "/crawler-stats",
		children: [
			{
				path: "/crawler-stats/game",
				title: "游戏数据统计",
				icon: "menu"
			}
			// 后续可以添加更多子菜单项，如新闻数据统计、AI数据统计等
		]
	},

	{
		icon: "message-box",
		title: "抽奖",
		path: "/lottery",
		children: [
			{
				path: "/lottery/index",
				title: "抽奖",
				icon: "menu"
			}
		]
	}
];

// 按钮权限配置
const buttonsList = {
	useProTable: ["add", "batchDelete"],
	authButton: ["add", "edit", "delete", "import", "export"]
};

// 图片路径
const imgPath = "http://8.166.130.216:3000/images/";

// JWT 验证
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

module.exports = {
	ERROR,
	SUCCESS,
	getNowDate,
	menuList,
	buttonsList,
	imgPath,
	Auth,
	tokenConfig // 确保导出 tokenConfig
};
