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
const novelFetcher = require("../utils/novelFetcher"); // 引入小说数据模块

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
 * date: 2025年11月20日 - 集成真实小说数据源
 */
router.post("/bookMicroservices/book/getBookList", async (ctx, next) => {
	const { current, pageSize, category, searchText } = ctx.request.body;
	if (!current || !pageSize) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[API] getBookList 搜索: ${searchText || '热门'}`);
		
		// 获取真实小说数据（异步）
		let books = await novelFetcher.searchNovels(searchText || "诡秘", 1);

		// 如果搜索结果为空，使用默认小说列表
		if (!books || books.length === 0) {
			console.log("[API] 爬虫无结果，使用模拟数据");
			books = [
				{
					Id: "1",
					Name: "诡秘之主",
					Author: "狐尾的笔",
					CName: "玄幻",
					BookStatus: "已完结",
					LastChapter: "第1432章",
					UpdateTime: new Date().toISOString(),
					Desc: "克莱恩·莫雷蒂原本是21世纪的现代人，穿越到诡秘世界...",
					Img: "https://via.placeholder.com/150x200?text=诡秘之主"
				}
			];
		}

		// 根据分类过滤
		if (category && category !== "所有" && category !== "all") {
			books = books.filter(book => book.CName === category);
		}

		// 分页
		const total = books.length;
		const start = (current - 1) * pageSize;
		const end = start + pageSize;
		const paginatedBooks = books.slice(start, end);

		const data = {
			data: paginatedBooks,
			total: total,
			page: current,
			pageSize: pageSize
		};

		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("获取小说列表错误:", error.message);
		ERROR(ctx, "获取小说列表失败");
	}
});

/*
 * 获取小说章节列表接口
 * params: {"bookId": "1"}
 * author: kris
 * date: 2025年11月21日
 */
router.post("/bookMicroservices/book/getChapters", async (ctx, next) => {
	const { bookId } = ctx.request.body;
	if (!bookId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[API] getChapters: ${bookId}`);
		
		// 获取真实章节列表
		const chapters = await novelFetcher.fetchChaptersFromBiquge(bookId);

		if (!chapters || chapters.length === 0) {
			console.log("[API] 无法获取章节，返回模拟数据");
			// 返回模拟数据
			const mockChapters = Array.from({ length: 10 }, (_, i) => ({
				chapterId: i + 1,
				chapterName: `第${i + 1}章 故事开始`,
				updateTime: new Date().toISOString()
			}));
			return SUCCESS(ctx, true, "成功", { data: mockChapters, total: mockChapters.length });
		}

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
 * date: 2025年11月21日
 */
router.post("/bookMicroservices/book/getChapterContent", async (ctx, next) => {
	const { bookId, chapterId } = ctx.request.body;
	if (!bookId || !chapterId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[API] getChapterContent: ${bookId}/${chapterId}`);
		
		// 获取真实章节内容
		const content = await novelFetcher.fetchChapterContentFromBiquge(bookId, chapterId);

		if (!content || !content.content) {
			console.log("[API] 无法获取内容，返回模拟数据");
			// 返回模拟数据
			return SUCCESS(ctx, true, "成功", {
				title: `第${chapterId}章 故事继续`,
				content: "　　这是一个充满奇幻的世界。主人公在这个世界中踏上了冒险的征途。\n\n　　经过许多磨难后，他逐渐成长，变得更加强大。\n\n　　新的挑战又在前方等待着他。"
			});
		}

		SUCCESS(ctx, true, "成功", content);
	} catch (error) {
		console.error("获取章节内容错误:", error);
		ERROR(ctx, "获取章节内容失败");
	}
});

module.exports = router;
