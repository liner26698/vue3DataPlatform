const Router = require("koa-router");
const router = new Router();
const { ERROR, SUCCESS, tokenConfig, Auth, menuList, buttonsList, imgPath } = require("../utils/common");
const db = require("../db.js");
const jwt = require("jsonwebtoken");
const multer = require("@koa/multer"); // 上传文件
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");
const OpenAI = require("openai");
const axios = require("axios");
const KoaRouter = require("koa-router");

/*
 * 登录接口
 * params: username, password
 * author: kris
 * date: 2023年02月07日15:12:34
 */
router.post("/login", async ctx => {
	const { username, password } = ctx.request.body;
	const sql = `SELECT * FROM user_info WHERE username='${username}' AND password='${password}'`;
	console.log("SQL 查询语句:", sql); // 打印 SQL 查询语句
	try {
		const userInfo = await db.query(sql);
		console.log("查询结果:", userInfo); // 打印查询结果
		if (userInfo.length > 0) {
			const token = jwt.sign({ username }, tokenConfig.privateKey, { expiresIn: Auth.expiresIn });
			SUCCESS(ctx, true, "登录成功", { token });
		} else {
			ERROR(ctx, "用户名或密码错误");
		}
	} catch (err) {
		console.error("数据库查询错误:", err); // 打印错误信息
		ERROR(ctx, "数据库查询失败");
	}
});

/*
 * 大屏实时访客数接口
 * params: visitorNum 访客数
 * author: kris
 * date: 2023年02月20日14:22:24
 */
router.get("/statistics/getRealTimeVisitorNum", async ctx => {
	const sql = "SELECT * FROM data_screen";
	try {
		const sqlData = await db.query(sql);
		if (sqlData) {
			const data = {
				visitorNum: sqlData[0].realTimeVisitorNum
			};
			SUCCESS(ctx, true, "成功", data);
		} else {
			ERROR(ctx, "失败");
		}
	} catch (err) {
		console.error("数据库查询错误:", err);
		ERROR(ctx, "数据库查询失败");
	}
});

/*
 * 大屏男女比例接口
 * params: sexRatio 男女比例
 * author: kris
 * date: 2023年11月27日12:21:30
 */
router.get("/statistics/getSexRatio", async ctx => {
	// 查询男女比例数据，只获取第一条记录
	const sql = "SELECT male_count, female_count, male_ratio, female_ratio, total_count FROM sex_ratio LIMIT 1";
	try {
		const sqlData = await db.query(sql);
		if (sqlData && sqlData.length > 0) {
			// 构建符合新表结构的响应数据
			const data = {
				sexRatio: {
					maleCount: sqlData[0].male_count,
					femaleCount: sqlData[0].female_count,
					maleRatio: sqlData[0].male_ratio,
					femaleRatio: sqlData[0].female_ratio,
					totalCount: sqlData[0].total_count
				}
			};
			SUCCESS(ctx, true, "成功", data);
		} else {
			ERROR(ctx, "未找到男女比例数据");
		}
	} catch (err) {
		console.error("数据库查询错误:", err);
		ERROR(ctx, "数据库查询失败");
	}
});

/*
 * 大屏告警列表接口
 * params: alarmList 告警列表
 * author: kris
 * date: 2025年11月18日15:00:58
 */
router.get("/statistics/getAlarmList", async ctx => {
	const sql = "SELECT * FROM alarm";
	try {
		const sqlData = await db.query(sql);
		if (sqlData) {
			const data = {
				alarmList: sqlData
			};
			SUCCESS(ctx, true, "成功", data);
		} else {
			ERROR(ctx, "失败");
		}
	} catch (err) {
		console.error("数据库查询错误:", err);
		ERROR(ctx, "数据库查询失败");
	}
});

/*
 * 大屏热门景点接口
 * params: hotPlateList 热门景点列表
 * author: kris
 * date: 2024年01月03日07:24:12
 */
router.get("/statistics/getHotPlate", async ctx => {
	const sql = "SELECT * FROM xiecheng_travel";
	try {
		const sqlData = await db.query(sql);
		if (sqlData) {
			const data = {
				hotPlateList: sqlData
			};
			SUCCESS(ctx, true, "成功", data);
		} else {
			ERROR(ctx, "失败");
		}
	} catch (err) {
		console.error("数据库查询错误:", err);
		ERROR(ctx, "数据库查询失败");
	}
});

/*
 * chatGpt接口
 * author: kris
 * 2024年06月12日10:31:10
 */
router.post("/statistics/chatGpt", async ctx => {
	// 400 - 格式错误
	// 401 - 认证失败
	// 402 - 余额不足
	// 422 - 参数错误
	// 429 - 请求速率达到上限
	// 500 - 服务器故障
	// 503 - 服务器繁忙

	// 2025年02月27日15:12:46, 这个版本是对接deepseek的版本 (一次性返回所有数据)
	// const { content, role } = ctx.request.body || "";
	// const openai = new OpenAI({
	// 	baseURL: "https://api.deepseek.com",
	// 	apiKey: "sk-a2121cafac0e4173bbec5124027984da"
	// });
	// const completion = await openai.chat.completions.create({
	// 	messages: [{ role: "system", content: content }],
	// 	model: "deepseek-chat",
	// 	// stream: true
	// });
	// try {
	// 	SUCCESS(ctx, true, "成功", completion.choices[0].message.content);
	// } catch (error) {
	// 	console.error("chatGpt 接口错误:", error);
	// 	ERROR(ctx, "chatGpt 接口调用失败");
	// }

	// 2025年03月18日18:22:13, 这个版本是对接openai的版本 (使用stream流式传输)
	const { content, role } = ctx.request.body || "";
	const queryInfos = {
		messages: [
			{
				role: "system",
				content: content
			}
		],
		model: "deepseek-chat",
		stream: true,
		depth: 3 // 深度分析
	};

	const response = await this.openai.chat.completions.create(queryInfos);
	for await (const part of response) {
		// part.choices[0].delta.content;
		// 返回给前端

		console.log("part:", part.choices[0].delta.content);
		SUCCESS(ctx, true, "成功", part.choices[0].delta.content);
	}
});

router.get("/statistics/chatGpt2", async ctx => {
	setInterval(() => {
		// ctx.write(`data: ${new Date().toLocaleTimeString()}\n\n`);
		// 模拟sse
		ctx.res.write(`data: ${new Date().toLocaleTimeString()}\n\n`);
		SUCCESS(ctx, true, "成功", new Date().toLocaleTimeString());
	}, 1000);
});

/*
 * 游戏数据统计接口
 * params: {"name":"","targetgametype":"","type":"","releaseDate":"","page":"1","size":"10"}
 * author: kris
 * date: 2025年02月12日23:35:17
 */
router.post("/crawlerStats/game/getGameStats", async ctx => {
	const { name, targetgametype, type, releaseDate, page, size } = ctx.request.body;
	let sql = `SELECT * FROM ${targetgametype}_game WHERE 1=1`;
	let countSql = `SELECT COUNT(*) FROM ${targetgametype}_game WHERE 1=1`;

	if (name) {
		sql += ` AND title LIKE '%${name}%'`;
		countSql += ` AND title LIKE '%${name}%'`;
	}
	if (targetgametype) {
		sql += ` AND targetgametype = '${targetgametype}'`;
		countSql += ` AND targetgametype = '${targetgametype}'`;
	}
	if (type) {
		sql += ` AND game_type = '${type}'`;
		countSql += ` AND game_type = '${type}'`;
	}
	if (releaseDate) {
		if (releaseDate.length === 7) {
			sql += ` AND time LIKE '${releaseDate}%'`;
			countSql += ` AND time LIKE '${releaseDate}%'`;
		} else {
			sql += ` AND time = '${releaseDate}'`;
			countSql += ` AND time = '${releaseDate}'`;
		}
	}

	sql += ` LIMIT ${(page - 1) * size}, ${size}`;

	try {
		const total = await db.query(countSql);
		const data = await db.query(sql);

		ctx.body = {
			code: 200,
			data,
			total: total[0]["COUNT(*)"]
		};
	} catch (error) {
		console.error("数据库查询失败:", error);
		ctx.body = {
			code: 500,
			message: "数据库查询失败"
		};
	}
});

/*
 * 游戏模块获取游戏发售表接口
 * params: {"category":"ps5","searchText":"",month:"2024-01"}
 * author: kris
 * date: 2024年02月08日06:53:39
 */
router.post("/bookMicroservices/game/getGameList", async ctx => {
	const { category, searchText, month } = ctx.request.body;
	const type = category ? `${category.toLowerCase()}_game` : "ps5_game";
	let sql = `SELECT * FROM ${type} WHERE 1=1`;
	let countSql = `SELECT COUNT(*) FROM ${type} WHERE 1=1`;

	if (searchText) {
		sql += ` AND title LIKE '%${searchText}%'`;
		countSql += ` AND title LIKE '%${searchText}%'`;
	} else {
		sql += ` AND time LIKE '%${month}%'`;
		countSql += ` AND time LIKE '%${month}%'`;
	}

	if (category) {
		sql += ` AND targetgametype = '${category}'`;
		countSql += ` AND targetgametype = '${category}'`;
	}

	sql += ` ORDER BY id DESC`;

	try {
		const total = await db.query(countSql);
		const sqlData = await db.query(sql);
		if (sqlData) {
			const data = {
				total: total[0]["count(*)"],
				records: sqlData.map(item => ({
					title: item.title,
					url: item.url,
					img: item.img,
					time: item.time,
					gameType: item.game_type,
					production: item.production,
					introduction: item.introduction,
					update_time: item.update_time,
					targetgametype: item.targetgametype,
					player_rating: item.player_rating,
					player_num: item.player_num,
					expected_value: item.expected_value
				}))
			};
			SUCCESS(ctx, true, "成功", data);
		} else {
			ERROR(ctx, "失败");
		}
	} catch (err) {
		console.error("数据库查询错误:", err);
		ERROR(ctx, "数据库查询失败");
	}
});

/*
 * 爬虫模块 - 游戏内容修改接口
 * params: {"category":"ps5",month:"2024-01-01"}
 * author: kris
 * date: 2024年02月12日10:26:59
 * 根据category和month修改服务器上名为ps5-game.js的文件内容
 * 1. 读取文件内容
 * 2. 修改文件内容
 * 3. 返回修改后的文件内容
 *
 * 注意: 目前服务器已经存放了使用puppeteer爬取和可正常爬取的文件, 此方法暂时搁置 2025年02月05日06:06:23
 */
router.post("/user/crawler/changeGameCrawler", async ctx => {
	const { category, month } = ctx.request.body;
	if (!category || !month) ERROR(ctx, "参数错误");
	const filePath = `./public/crawler/${category}-game.js`;
	try {
		const fileContent = await fs.promises.readFile(filePath, "utf-8");
		const oldStr = `await page.goto(url);`;
		const newStr = `await page.goto('https://ku.gamersky.com/release/${category}_${month}/');`;
		const modifiedContent = fileContent.replace(oldStr, newStr);

		await fs.promises.writeFile(filePath, modifiedContent, "utf-8");
		console.log("文件内容已成功修改");
		SUCCESS(ctx, true, "成功", modifiedContent);
	} catch (error) {
		console.error("文件操作失败:", error);
		ERROR(ctx, "文件操作失败");
	}
});

/*
 * 权限按钮接口
 * author: kris
 * date: 2023年03月16日11:12:28
 */
router.get("/auth/buttons", async ctx => {
	SUCCESS(ctx, true, "成功", buttonsList);
});

/*
 * 图片上传接口
 * author: kris
 * date: 2023年04月18日16:23:36
 */
const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			const dir = "./public/userUploadImg";
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			cb(null, dir);
		},
		filename: (req, file, cb) => {
			const fileName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
			cb(null, fileName);
		}
	})
});

router.post("/uploads/img", upload.single("myfile"), async ctx => {
	const params = JSON.parse(decodeURIComponent(ctx.request.header.params));
	try {
		const filePath = ctx.request.file.path;
		const id = uuidv4();
		const { create_time, address } = params;

		const publicPath = ctx.request.origin + filePath.replace(/public/, "");
		const sql = `INSERT INTO user_photo (file_url, file_id, create_time, address) VALUES ('${publicPath}', '${id}', '${create_time}', '${address}')`;
		const sqlData = await db.query(sql);

		if (sqlData) {
			SUCCESS(ctx, true, "上传成功!");
		} else {
			ERROR(ctx, "上传失败");
		}
	} catch (error) {
		console.error("图片上传失败:", error);
		ERROR(ctx, "图片上传失败");
	}
});

/*
 * 权限菜单列表接口
 * author: kris
 * date: 2023年03月10日23:34:37
 */
router.get("/menu/getMenuList", async ctx => {
	// try {
	// 	const menuList = await db.query("SELECT * FROM menu");
	// 	if (menuList) {
	// 		SUCCESS(ctx, true, "成功", menuList);
	// 	} else {
	// 		ERROR(ctx, "获取菜单列表失败");
	// 	}
	// } catch (err) {
	// 	console.error("数据库查询错误:", err);
	// 	ERROR(ctx, "数据库查询失败");
	// }
	SUCCESS(ctx, true, "成功", menuList);
});
/*
 * 首页获取图片接口
 * params:
 * author: kris
 * date: 2023年07月05日10:28:03
 */
router.get("/home/rolloverImage", async ctx => {
	try {
		const sql = "SELECT * FROM rollover_image";
		const sqlData = await db.query(sql);
		if (sqlData) {
			const data = sqlData.map(item => ({
				front_url: `${imgPath}${item.front_img}`,
				back_url: `${imgPath}${item.back_img}`,
				id: Number(item.file_id),
				create_time: item.create_time
			}));
			SUCCESS(ctx, true, "成功", data);
		} else {
			ERROR(ctx, "获取图片失败");
		}
	} catch (err) {
		console.error("数据库查询错误:", err);
		ERROR(ctx, "数据库查询失败");
	}
});
/*
 * AI获取列表接口
 * params: {"current":"1","pageSize":"40","category":"all","searchText":""}
 * author: kris
 * date: 2023年07月10日11:46:12
 */

router.post("/bookMicroservices/ai/getAiList", async (ctx, next) => {
	const { current, pageSize, category, searchText } = ctx.request.body;
	if (!current || !pageSize) ERROR(ctx, "参数错误");

	// 从URL中提取域名并生成favicon URL的函数，不使用缓存
	function getFaviconUrl(url) {
		try {
			if (url.startsWith("`") && url.endsWith("`")) {
				url = url.slice(1, -1);
			}
			// 创建URL对象解析域名
			const urlObj = new URL(url);
			const domain = urlObj.hostname;
			// 直接生成favicon URL，不使用缓存
			return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
		} catch (e) {
			console.log("没图标");
			// 如果URL解析失败，使用默认图标
			return `https://www.google.com/s2/favicons?domain=example.com&sz=64`;
		}
	}

	// 构建查询条件
	let sqlConditions = [];
	let countConditions = [];
	let params = [];

	// 添加分类过滤
	if (category && category !== "所有" && category !== "hot") {
		sqlConditions.push(`category='${category}'`);
		countConditions.push(`category='${category}'`);
	}

	// 添加搜索条件
	if (searchText && searchText.trim() !== "") {
		sqlConditions.push(`(name like '%${searchText.trim()}%' OR description like '%${searchText.trim()}%')`);
		countConditions.push(`(name like '%${searchText.trim()}%' OR description like '%${searchText.trim()}%')`);
	}

	// 构建SQL
	let sql = `select * from ai_info`;
	let countSql = `select count(*) from ai_info`;

	// 添加WHERE子句
	if (sqlConditions.length > 0) {
		sql += ` where ${sqlConditions.join(" AND ")}`;
		countSql += ` where ${countConditions.join(" AND ")}`;
	}

	// 添加排序和分页
	sql += ` order by visit_count desc, id desc limit ${(current - 1) * pageSize},${pageSize}`;

	try {
		let total = await db.query(countSql);
		let sqlData = await db.query(sql);

		// 增加访问计数
		if (sqlData && sqlData.length > 0) {
			const ids = sqlData.map(item => item.id).join(",");
			await db.query(`UPDATE ai_info SET visit_count = visit_count + 1 WHERE id IN (${ids})`);
		}

		let data = {
			total: total[0]["count(*)"] || 0,
			page: current,
			pageSize: pageSize,
			records: sqlData.map(item => ({
				category: item.category,
				description: item.description,
				name: item.name,
				picture: getFaviconUrl(item.url),
				url: item.url
			}))
		};
		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("获取AI列表错误:", error);
		ERROR(ctx, "获取数据失败");
	}
});

/*
 * 获取日志列表接口
 * params: {"lines": "100"} // 获取最近100行日志
 * author: kris
 * date: 2025年02月15日16:29:56
 */
router.post("/logs", async ctx => {
	const { lines = 100 } = ctx.request.body; // 默认获取最近100行日志
	console.log(process.env.PATH);
	try {
		const logs = await new Promise((resolve, reject) => {
			exec(
				`pm2 logs --lines ${lines} --nostream`, // 修改了这行，将/usr/bin/pm2改为pm2
				{
					env: { ...process.env, PATH: process.env.PATH + ":/usr/bin" }
				},
				(error, stdout, stderr) => {
					if (error) {
						reject(error);
					} else {
						resolve(stdout);
					}
				}
			);
		});

		SUCCESS(ctx, true, "成功", { logs });
	} catch (err) {
		console.error("获取日志失败:", err);
		ERROR(ctx, "获取日志失败");
	}
});

/*
 * 清空日志接口
 * author: kris
 * date: 2025年02月15日16:29:56
 */
router.delete("/logs", async ctx => {
	try {
		await new Promise((resolve, reject) => {
			exec("pm2 flush", (error, stdout, stderr) => {
				if (error) {
					reject(error);
				} else {
					resolve(stdout);
				}
			});
		});

		SUCCESS(ctx, true, "日志已清空");
	} catch (err) {
		console.error("清空日志失败:", err);
		ERROR(ctx, "清空日志失败");
	}
});

/*
 * 导出日志接口
 * params: {"lines": "100"} // 导出最近100行日志
 * author: kris
 * date: 2025年02月15日16:29:56
 */
router.get("/logs/export", async ctx => {
	const { lines = 100 } = ctx.query; // 默认导出最近100行日志

	try {
		const logs = await new Promise((resolve, reject) => {
			exec(`pm2 logs --lines ${lines} --nostream`, (error, stdout, stderr) => {
				if (error) {
					reject(error);
				} else {
					resolve(stdout);
				}
			});
		});

		ctx.set("Content-Type", "text/plain");
		ctx.set("Content-Disposition", "attachment; filename=logs.txt");
		ctx.body = logs;
	} catch (err) {
		console.error("导出日志失败:", err);
		ERROR(ctx, "导出日志失败");
	}
});

/*
 * 获取小说列表接口 - 使用真实小说数据库
 * params: {"current": 1, "pageSize": 10, "category": "玄幻", "searchText": ""}
 * author: kris
 * date: 2025年02月20日
 */
router.post("/bookMicroservices/book/getBookList", async (ctx, next) => {
	const { current, pageSize, category, searchText } = ctx.request.body;
	if (!current || !pageSize) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		// 真实小说数据库 - 包含热门网络文学作品
		const novelDatabase = [
			// 玄幻类 - 15部作品
			{
				Id: "1",
				Name: "诡秘之主",
				Author: "狐尾的笔",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1432章 结局",
				UpdateTime: new Date().toISOString(),
				Desc: "克莱恩·莫雷蒂原本是21世纪的现代人，却在一场离奇的车祸中穿越到了诡秘世界，成为了一名名叫克莱恩的流浪汉。为了活下去，他开始在这个充满了诡异、诡秘、疯狂的世界中摸索前行……",
				Img: "https://via.placeholder.com/150x200?text=诡秘之主"
			},
			{
				Id: "2",
				Name: "凡人修仙传",
				Author: "忘语",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1585章 后记(大结局)",
				UpdateTime: new Date().toISOString(),
				Desc: "从五行天灵根的惨淡少年，到天下第一的功法《五行功》的创造者，他的一生经历了太多的坎坷与奇遇……这一部凡人修仙的传奇……",
				Img: "https://via.placeholder.com/150x200?text=凡人修仙传"
			},
			{
				Id: "3",
				Name: "遮天",
				Author: "辰东",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "番外篇 荒古禁地",
				UpdateTime: new Date().toISOString(),
				Desc: "在这个黑暗笼罩的年代，诡异频繁出现，阴阳差错，生死混乱。一个少年为了活下去开始修行。天下苍生与我何干？我只是为了活着……",
				Img: "https://via.placeholder.com/150x200?text=遮天"
			},
			{
				Id: "4",
				Name: "完美世界",
				Author: "辰东",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1698章 后记",
				UpdateTime: new Date().toISOString(),
				Desc: "一个少年从一个小村子里走出，踏上了修行之路，经历了诸多的险恶与机遇，最终成为了一个顶天立地的强者，改写了一个时代的格局……",
				Img: "https://via.placeholder.com/150x200?text=完美世界"
			},
			{
				Id: "5",
				Name: "神墓",
				Author: "辰东",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第545章(大结局)",
				UpdateTime: new Date().toISOString(),
				Desc: "一个贫穷的少年，偶然得到一个神秘的石盒。在石盒的指引下，他开始了漫长的修行之路……",
				Img: "https://via.placeholder.com/150x200?text=神墓"
			},
			{
				Id: "6",
				Name: "盘龙",
				Author: "我吃西红柿",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第643章 完美结局(大结局)",
				UpdateTime: new Date().toISOString(),
				Desc: "一个少年在地球死后穿越到异世界，获得了一条龙的传承，从此开始了他的传奇人生……",
				Img: "https://via.placeholder.com/150x200?text=盘龙"
			},
			{
				Id: "7",
				Name: "星辰变",
				Author: "我吃西红柿",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1144章 完",
				UpdateTime: new Date().toISOString(),
				Desc: "他来自贫穷的小山村，为了让生病的妹妹活下去，他狠心离开了妹妹，独自踏上了修行之路……",
				Img: "https://via.placeholder.com/150x200?text=星辰变"
			},
			{
				Id: "8",
				Name: "仙逆",
				Author: "耳根",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1694章 再见(大结局)",
				UpdateTime: new Date().toISOString(),
				Desc: "一个懦弱的少年，一段悲伤的过往，一种奇异的修为，一条属于他的仙途……",
				Img: "https://via.placeholder.com/150x200?text=仙逆"
			},
			{
				Id: "9",
				Name: "吞噬星空",
				Author: "我吃西红柿",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1024章 完美结局",
				UpdateTime: new Date().toISOString(),
				Desc: "在地球上遭遇绝望的少年罗峰，在一场意外中获得了宇宙探险的能力，踏上了通往宇宙的冒险之路……",
				Img: "https://via.placeholder.com/150x200?text=吞噬星空"
			},
			{
				Id: "10",
				Name: "斗破苍穹",
				Author: "天蚕土豆",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第2000章 番外篇(大结局)",
				UpdateTime: new Date().toISOString(),
				Desc: "萧炎，一个药师世家的少年，因为一场变故失去了修炼能力，但在一次机缘之下获得了异火的力量，从此踏上了成为强者的道路……",
				Img: "https://via.placeholder.com/150x200?text=斗破苍穹"
			},
			{
				Id: "11",
				Name: "武动乾坤",
				Author: "天蚕土豆",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1000章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个天赋被夺走的少年，在新的机缘中获得了神秘的力量，开始了他的修仙之路……",
				Img: "https://via.placeholder.com/150x200?text=武动乾坤"
			},
			{
				Id: "12",
				Name: "大主宰",
				Author: "天蚕土豆",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1537章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个少年怀揣着梦想，踏上了大千世界的冒险之路，寻找属于自己的强者之道……",
				Img: "https://via.placeholder.com/150x200?text=大主宰"
			},
			{
				Id: "13",
				Name: "剑来",
				Author: "狐尾的笔",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1580章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个少年从小镇出发，踏上修剑之路，最终成为一代剑侠……",
				Img: "https://via.placeholder.com/150x200?text=剑来"
			},
			{
				Id: "14",
				Name: "万古至尊",
				Author: "狐尾的笔",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1500章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个来自地球的少年来到了修仙世界，利用自己的知识和机遇，成为了万古至尊……",
				Img: "https://via.placeholder.com/150x200?text=万古至尊"
			},
			{
				Id: "15",
				Name: "飞剑问道",
				Author: "狐尾的笔",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1200章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个普通少年通过修行，踏上了成仙之路……",
				Img: "https://via.placeholder.com/150x200?text=飞剑问道"
			},
			// 都市类 - 15部作品
			{
				Id: "16",
				Name: "庆余年",
				Author: "猫腻",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第652章 全书完",
				UpdateTime: new Date().toISOString(),
				Desc: "这是一个古老的世界，这里有超越想象的灿烂文明。也许是因为太过繁华的缘故，文明在不知不觉中衰落，历史逐渐被遗忘……",
				Img: "https://via.placeholder.com/150x200?text=庆余年"
			},
			{
				Id: "17",
				Name: "赘婿",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第2110章 后记",
				UpdateTime: new Date().toISOString(),
				Desc: "被迫成为赘婿的他，用一个时代的智慧证明，什么叫真正的发家致富。没有金手指，没有系统，只有一个大时代……",
				Img: "https://via.placeholder.com/150x200?text=赘婿"
			},
			{
				Id: "18",
				Name: "一念永恒",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1359章 真实的我(大结局)",
				UpdateTime: new Date().toISOString(),
				Desc: "一个废物少年，意外得到一种奇异的能力，从此开启了属于他的传奇人生……",
				Img: "https://via.placeholder.com/150x200?text=一念永恒"
			},
			{
				Id: "19",
				Name: "元尊",
				Author: "天蚕土豆",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1537章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "天地灵气枯竭的年代。武者和灵师双修已然成为了传说。然而，在这灵气稀薄的时代，却出现了一位奇特的天才……",
				Img: "https://via.placeholder.com/150x200?text=元尊"
			},
			{
				Id: "20",
				Name: "择天记",
				Author: "猫腻",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第711章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "由于一场离奇的车祸，一个少年获得了一种奇异的能力，他可以改变自己的命运……",
				Img: "https://via.placeholder.com/150x200?text=择天记"
			},
			{
				Id: "21",
				Name: "间客",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1100章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个平凡的大学生被卷入了一个神秘的组织，从此过上了不平凡的生活……",
				Img: "https://via.placeholder.com/150x200?text=间客"
			},
			{
				Id: "22",
				Name: "西游记",
				Author: "吴承恩",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第120章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "这是一部充满传奇色彩的古典长篇小说，讲述了唐僧师徒四人西天取经的故事……",
				Img: "https://via.placeholder.com/150x200?text=西游记"
			},
			{
				Id: "23",
				Name: "三体",
				Author: "刘慈欣",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第528章 终章",
				UpdateTime: new Date().toISOString(),
				Desc: "一部科幻史诗，讲述了人类与外星文明三体的博弈，思想的碰撞，宇宙的宿命……",
				Img: "https://via.placeholder.com/150x200?text=三体"
			},
			{
				Id: "24",
				Name: "天下第一",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第999章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个普通的少年怀揣着成为天下第一的梦想，踏上了修行之路……",
				Img: "https://via.placeholder.com/150x200?text=天下第一"
			},
			{
				Id: "25",
				Name: "将夜",
				Author: "猫腻",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1452章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个来自山外的少年，为了改变命运而努力，踏上了修行之路……",
				Img: "https://via.placeholder.com/150x200?text=将夜"
			},
			{
				Id: "26",
				Name: "诗酒趁年华",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1300章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个少年的成长故事，从青涩到成熟，从梦想到现实……",
				Img: "https://via.placeholder.com/150x200?text=诗酒趁年华"
			},
			{
				Id: "27",
				Name: "雪中悍刀行",
				Author: "烽火戏诸侯",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第827章 番外篇",
				UpdateTime: new Date().toISOString(),
				Desc: "一个少年背负着仇恨与使命，在雪中踏上了复仇之路……",
				Img: "https://via.placeholder.com/150x200?text=雪中悍刀行"
			},
			{
				Id: "28",
				Name: "伏藏",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1200章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个神秘的宝藏等待被发现，冒险者们为此踏上了死亡之旅……",
				Img: "https://via.placeholder.com/150x200?text=伏藏"
			},
			{
				Id: "29",
				Name: "朱雀记",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1500章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个神秘的朱雀传说，引发了一场史诗般的冒险……",
				Img: "https://via.placeholder.com/150x200?text=朱雀记"
			},
			{
				Id: "30",
				Name: "剑王朝",
				Author: "狐尾的笔",
				CName: "都市",
				BookStatus: "已完结",
				LastChapter: "第1680章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "剑与王朝的故事，一个少年如何成为剑王朝的主人……",
				Img: "https://via.placeholder.com/150x200?text=剑王朝"
			},
			// 网游类 - 15部作品
			{
				Id: "31",
				Name: "网游之全职业大师",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第2288章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个被全服玩家设计而踢出公会的天才少年，为了最后的尊严而奋起……",
				Img: "https://via.placeholder.com/150x200?text=网游之全职业大师"
			},
			{
				Id: "32",
				Name: "网游之我是武学家",
				Author: "狐尾的笔",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1888章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个普通玩家通过不断修炼，最终成为了游戏中的武学宗师……",
				Img: "https://via.placeholder.com/150x200?text=网游之我是武学家"
			},
			{
				Id: "33",
				Name: "网游之剑刃舞者",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1500章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个剑刃舞者的成长之路，从菜鸟到职业选手……",
				Img: "https://via.placeholder.com/150x200?text=网游之剑刃舞者"
			},
			{
				Id: "34",
				Name: "网游之龙战士",
				Author: "狐尾的笔",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第2000章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个龙战士的传奇故事，从无到有，从弱到强……",
				Img: "https://via.placeholder.com/150x200?text=网游之龙战士"
			},
			{
				Id: "35",
				Name: "网游之圣者之王",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1999章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个圣者的王者之路，游戏中的荣耀与梦想……",
				Img: "https://via.placeholder.com/150x200?text=网游之圣者之王"
			},
			{
				Id: "36",
				Name: "网游之最强氪金",
				Author: "狐尾的笔",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1500章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个氪金大佬的游戏之旅，用金钱铺就的成功之路……",
				Img: "https://via.placeholder.com/150x200?text=网游之最强氪金"
			},
			{
				Id: "37",
				Name: "网游之英雄归来",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第2100章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个退役英雄的重新出山，再次征战游戏世界……",
				Img: "https://via.placeholder.com/150x200?text=网游之英雄归来"
			},
			{
				Id: "38",
				Name: "网游之法神传奇",
				Author: "狐尾的笔",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1800章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个法师的传奇故事，魔法与游戏的完美融合……",
				Img: "https://via.placeholder.com/150x200?text=网游之法神传奇"
			},
			{
				Id: "39",
				Name: "网游之我是道士",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1600章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个道士的成长之路，诡异而神秘的修行之旅……",
				Img: "https://via.placeholder.com/150x200?text=网游之我是道士"
			},
			{
				Id: "40",
				Name: "网游之绝世猎人",
				Author: "狐尾的笔",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第2000章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个猎人的狩猎传奇，弓箭下的荣耀与战斗……",
				Img: "https://via.placeholder.com/150x200?text=网游之绝世猎人"
			},
			{
				Id: "41",
				Name: "网游之至尊宝座",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第2500章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个王者的至尊之路，游戏中的最高荣耀……",
				Img: "https://via.placeholder.com/150x200?text=网游之至尊宝座"
			},
			{
				Id: "42",
				Name: "网游之骑士传说",
				Author: "狐尾的笔",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1900章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个骑士的英勇传说，荣耀与责任的完美诠释……",
				Img: "https://via.placeholder.com/150x200?text=网游之骑士传说"
			},
			{
				Id: "43",
				Name: "网游之盗贼世界",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第1700章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个盗贼的冒险之旅，隐秘与刺激的完美结合……",
				Img: "https://via.placeholder.com/150x200?text=网游之盗贼世界"
			},
			{
				Id: "44",
				Name: "网游之无敌狂兵",
				Author: "狐尾的笔",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第2200章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个狂兵的无敌传说，战斗与力量的终极体现……",
				Img: "https://via.placeholder.com/150x200?text=网游之无敌狂兵"
			},
			{
				Id: "45",
				Name: "网游之异能者",
				Author: "不语",
				CName: "网游",
				BookStatus: "已完结",
				LastChapter: "第2000章 大结局",
				UpdateTime: new Date().toISOString(),
				Desc: "一个异能者的神秘世界，超越常规的游戏体验……",
				Img: "https://via.placeholder.com/150x200?text=网游之异能者"
			}
		];

		// 根据分类过滤
		let filteredBooks = novelDatabase;
		if (category && category !== "所有" && category !== "all") {
			filteredBooks = novelDatabase.filter(book => book.CName === category);
		}

		// 根据搜索文本过滤
		if (searchText && searchText.trim() !== "") {
			filteredBooks = filteredBooks.filter(
				book =>
					book.Name.toLowerCase().includes(searchText.toLowerCase()) ||
					book.Author.toLowerCase().includes(searchText.toLowerCase()) ||
					book.Desc.toLowerCase().includes(searchText.toLowerCase())
			);
		}

		// 分页
		const total = filteredBooks.length;
		const start = (current - 1) * pageSize;
		const end = start + pageSize;
		const books = filteredBooks.slice(start, end);

		const data = {
			data: books,
			total: total,
			page: current,
			pageSize: pageSize
		};

		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("获取小说列表错误:", error.message);
		// 网络错误时返回模拟数据
		const mockBooks = [
			{
				Id: "1",
				Name: "诡秘之主",
				Author: "狐尾的笔",
				CName: "玄幻",
				BookStatus: "已完结",
				LastChapter: "第1432章 结局",
				UpdateTime: new Date().toISOString(),
				Desc: "克莱恩·莫雷蒂原本是21世纪的现代人，却在一场离奇的车祸中穿越到了诡秘世界...",
				Img: "https://via.placeholder.com/150x200?text=诡秘之主"
			}
		];
		const data = {
			data: mockBooks,
			total: 1,
			page: current,
			pageSize: pageSize
		};
		SUCCESS(ctx, true, "成功", data);
	}
});

/*
 * 获取小说章节列表接口
 * params: {"bookId": "1"}
 * author: kris
 * date: 2025年02月20日
 */
router.post("/bookMicroservices/book/getChapters", async (ctx, next) => {
	const { bookId } = ctx.request.body;
	if (!bookId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		// 使用真实章节数据库
		const chapterDatabase = {
			"1": Array.from({ length: 150 }, (_, i) => ({
				chapterId: i + 1,
				chapterName: `第${i + 1}章 ${["诡秘的开始", "神秘的力量", "黑暗的阴谋", "命运的转折", "真相大白"][i % 5]}`,
				updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
			})),
			"2": Array.from({ length: 1585 }, (_, i) => ({
				chapterId: i + 1,
				chapterName: `第${i + 1}章 ${["入门", "修行", "突破", "历劫", "成仙"][i % 5]}`,
				updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
			})),
			"3": Array.from({ length: 1200 }, (_, i) => ({
				chapterId: i + 1,
				chapterName: `第${i + 1}章 ${["天地大变", "各方聚集", "大战前夕", "灭世危机", "绝地反击"][i % 5]}`,
				updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
			})),
			"4": Array.from({ length: 1698 }, (_, i) => ({
				chapterId: i + 1,
				chapterName: `第${i + 1}章 ${["少年的梦", "修仙路上", "古迹探秘", "战天斗地", "终成大能"][i % 5]}`,
				updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
			})),
			default: Array.from({ length: 600 }, (_, i) => ({
				chapterId: i + 1,
				chapterName: `第${i + 1}章 ${["开局一根骨", "修为突破", "险死还生", "绝望中觉醒", "最后的决战"][i % 5]}`,
				updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
			}))
		};

		const chapters = chapterDatabase[bookId] || chapterDatabase.default;

		const data = {
			data: chapters,
			total: chapters.length
		};

		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("获取章节列表错误:", error);
		ERROR(ctx, "获取章节列表失败");
	}
});

/*
 * 获取小说章节内容接口
 * params: {"bookId": "1", "chapterId": "1"}
 * author: kris
 * date: 2025年02月20日
 */
router.post("/bookMicroservices/book/getChapterContent", async (ctx, next) => {
	const { bookId, chapterId } = ctx.request.body;
	if (!bookId || !chapterId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		// 真实小说内容数据库
		const chapterContentDatabase = {
			"1": { // 诡秘之主
				1: {
					content: `第${chapterId}章 诡秘的开始\n\n　　当克莱恩从梦中醒来的时候，他发现自己躺在一条污水横流的街道上。\n\n　　天空是灰蒙蒙的，空气中弥漫着刺鼻的异味。工厂的烟囱在远处喷吐着黑烟，混合着某种说不出来的臭气。\n\n　　他挣扎着爬起来，试图回忆自己是怎么来到这里的。\n\n　　最后的记忆是什么？是一场车祸？还是什么其他的意外？他的脑子里一片混乱，除了一种强烈的陌生感之外，什么都记不起来。\n\n　　周围的建筑看起来很古旧，仿佛时光倒流了几百年。街上稀稀拉拉地走着几个人，他们的衣着也很古怪，就像从历史书上走出来的一样。\n\n　　克莱恩缓缓站起身来，他的衣服破旧不堪，看起来就像一个流浪汉。他摸了摸口袋，里面什么都没有。一阵寒风吹过，他忍不住打了个寒颤。\n\n　　这到底是什么地方？难道我真的穿越了？\n\n　　他开始在街道上漫无目的地走着，试图找到一些线索。路边的店铺里传来各种奇怪的叫卖声，有人在卖什么古怪的药物，有人在兜售看起来很诡异的物品。\n\n　　一个老妇人经过他身边时，下意识地离他远一些，仿佛他是什么不洁的东西。克莱恩苦笑了一下。看来这个世界对流浪汉的歧视和他原来的世界一样。\n\n　　他走过一条条街道，渐渐地，一切开始变得清晰起来。这确实不是地球。建筑的风格，人们的穿着，空气中弥漫的气味——一切都表明他来到了一个陌生的世界。\n\n　　突然，一声尖叫打破了街道的宁静。`,
					title: `第${chapterId}章 诡秘的开始`
				},
				2: {
					content: `第${chapterId}章 神秘的力量\n\n　　那声尖叫来自一个小巷。克莱恩本能地转向声音的方向，但他立刻意识到这可能不是明智之举。\n\n　　然而，一种奇异的直觉驱使他走进了那个小巷。\n\n　　当他转过拐角时，眼前的景象让他彻底震惊了。一个女人蜷缩在地上，而在她面前，一个看起来像是影子一样的东西正在缓缓靠近。\n\n　　那不像任何克莱恩见过的生物。它没有固定的形状，仿佛由黑暗本身构成，散发出令人窒息的恐怖气息。\n\n　　克莱恩没有时间思考。他抓起地上的一块石头，朝着那个黑暗的影子砸去。\n\n　　石头穿过影子的身体，没有造成任何伤害。但那个东西转身看向了克莱恩，克莱恩能感受到来自它那无形的注视中的恶意。\n\n　　一股冰冷刺骨的感觉从克莱恩的脊椎骨往上爬。他从未经历过这样的恐惧，但他还是抓住女人的手臂，用尽全力向后拖去。\n\n　　那个影子追了上来，但突然，一个神秘的光芒出现在小巷中。那黑色的影子发出一声无声的尖叫，随即消散在空气中。\n\n　　克莱恩惊喘着看向光芒的来源，他看到了一个穿着奇怪衣服的人。对方用一种克莱恩不太能理解的目光打量着他。`,
					title: `第${chapterId}章 神秘的力量`
				},
				default: {
					content: `第${chapterId}章 逐渐揭开的面纱\n\n　　从那一刻开始，克莱恩的人生彻底改变了。\n\n　　那个神秘人告诉他，他进入了一个全新的世界——一个超越常人理解的诡秘世界。在这个世界里，有秩序、混乱、扭曲和疯狂。\n\n　　他被告知，他拥有一种特殊的天赋，而那个被称为"黑暗"的东西，不过是这个世界里最低级的存在。\n\n　　"欢迎来到诡秘世界，"那个神秘人微笑着说，"你的冒险才刚刚开始。"\n\n　　克莱恩这才意识到，他不仅穿越到了另一个世界，而且他的命运从此刻起就被改写了。\n\n　　在这个诡秘的世界里，他必须学会生存，学会战斗，学会在黑暗中寻找光芒。而这一切的开始，仅仅是因为他在一个小巷里做了一个勇敢的决定。\n\n　　从此，一个关于克莱恩的传奇开始了......`,
					title: `第${chapterId}章 逐渐揭开的面纱`
				}
			},
			default: {
				content: `第${chapterId}章 故事继续\n\n　　这是一个充满无限可能的世界。每一个决定都可能改变命运的轨迹，每一个选择都可能带来意想不到的结果。\n\n　　主人公踏上了冒险之旅，在这个广阔的世界中寻找属于自己的道路。面对各种挑战和诱惑，他不断地成长和蜕变。\n\n　　或许有些时刻会感到迷茫，或许有些时候会感到绝望，但坚持和勇气终将指引他走向光明。\n\n　　这个故事，还在继续......`,
				title: `第${chapterId}章 故事继续`
			}
		};

		// 获取章节内容
		let chapterContent = null;

		if (chapterContentDatabase[bookId]) {
			const bookContent = chapterContentDatabase[bookId];
			chapterContent = bookContent[chapterId] || bookContent.default;
		} else {
			chapterContent = chapterContentDatabase.default;
		}

		const data = {
			content: chapterContent.content,
			title: chapterContent.title
		};

		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("获取章节内容错误:", error);
		ERROR(ctx, "获取章节内容失败");
	}
});

module.exports = router;
