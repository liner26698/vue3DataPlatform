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
// const novelFetcher = require("../utils/novelFetcher.js");
// const novelDataManager = require("../utils/novelDataManager.js");
// const biqugeSpider = require("../utils/biqugeSpider.js");
// const kanshuhouSpider = require("../utils/kanshuhouSpider.js");
const OpenAI = require("openai");
const axios = require("axios");
const KoaRouter = require("koa-router");

/**
 * 分类名称转换为看书猴分类ID
 * 对应关系: 1-玄幻, 2-言情, 3-武侠, 5-都市等
 */
function getCategoryId(categoryName) {
	const categoryMap = {
		玄幻: "1",
		玄幻小说: "1",
		言情: "2",
		言情小说: "2",
		武侠: "3",
		武侠小说: "3",
		仙侠: "4",
		仙侠小说: "4",
		都市: "5",
		都市小说: "5",
		军事: "6",
		军事小说: "6",
		历史: "7",
		历史小说: "7",
		游戏: "8",
		游戏小说: "8",
		竞技: "9",
		竞技小说: "9",
		科幻: "10",
		科幻小说: "10",
		悬疑: "11",
		悬疑小说: "11",
		灵异: "12",
		灵异小说: "12"
	};

	return categoryMap[categoryName] || "1"; // 默认返回玄幻
}

/**
 * 从看书猴爬虫的结果转换为API需要的格式
 */
function convertKanshouhouNovelToFormat(novel) {
	return {
		Id: novel.Id,
		Name: novel.Name,
		Author: novel.Author,
		Desc: novel.Desc,
		Img: novel.Img,
		href: novel.href,
		Source: novel.Source || "kanshuhou",
		CName: novel.categoryName || "其他" // 分类名称
	};
}

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
 * chatGpt接口 - DeepSeek API
 * author: kris
 * 2024年06月12日10:31:10
 */
router.post("/statistics/chatGpt", async ctx => {
	try {
		const { content, role } = ctx.request.body || {};

		if (!content) {
			ERROR(ctx, "content 参数不能为空");
			return;
		}

		// 从环境变量或配置获取 API Key
		const apiKey = process.env.DEEPSEEK_API_KEY || "sk-a2121cafac0e4173bbec5124027984da";

		const openai = new OpenAI({
			baseURL: "https://api.deepseek.com/v1",
			apiKey: apiKey
		});

		const completion = await openai.chat.completions.create({
			messages: [
				{
					role: "system",
					content: content
				}
			],
			model: "deepseek-chat"
		});

		const responseText = completion.choices[0]?.message?.content || "无响应内容";
		SUCCESS(ctx, true, "成功", responseText);
	} catch (error) {
		console.error("chatGpt 接口错误:", error.message);
		ERROR(ctx, "chatGpt 接口调用失败: " + error.message);
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
 * 热门话题接口
 * params: platform (可选) - 指定平台 douyin/baidu/zhihu/weibo/bilibili
 * author: kris
 * date: 2025年11月25日
 */
router.post("/statistics/getHotTopics", async ctx => {
	try {
		// 从数据库获取所有平台的热门话题（每个平台最多20条）
		// 排序：按平台分组，每个平台按最新时间排序
		const sql = `
			SELECT 
				id, platform, \`rank\`, title, category, heat, trend, tags, url, description, created_at
			FROM hot_topics
			WHERE is_active = 1
			ORDER BY platform, created_at DESC, \`rank\`
		`;

		const dbTopics = await db.query(sql);

		// 按平台分组，每个平台限制20条（最新的排前面）
		const groupedTopics = {
			baidu: [],
			weibo: [],
			bilibili: [],
			douyin: []
		};

		dbTopics.forEach(topic => {
			if (groupedTopics[topic.platform] && groupedTopics[topic.platform].length < 20) {
				groupedTopics[topic.platform].push({
					title: topic.title,
					category: topic.category,
					heat: topic.heat,
					trend: topic.trend,
					tags: topic.tags ? JSON.parse(topic.tags) : [],
					url: topic.url,
					platform: topic.platform,
					description: topic.description
				});
			}
		});

		// 如果数据库中没有数据，返回空数组（由定时任务填充）
		if (dbTopics.length === 0) {
			console.log("📡 数据库中暂无话题数据，请手动运行爬虫或等待定时任务执行");
		}

		// 返回数据（无论是从数据库还是爬虫得到的）
		SUCCESS(ctx, true, "成功获取热门话题", { topics: groupedTopics });
	} catch (err) {
		console.error("获取热门话题失败:", err);
		ERROR(ctx, "获取热门话题失败");
	}
});

router.post("/statistics/getHotTopicsByPlatform", async ctx => {
	const { platform } = ctx.request.body || {};
	try {
		if (!platform) {
			ERROR(ctx, "平台参数不能为空");
			return;
		}

		// 从数据库获取指定平台的热门话题，按最新时间排序
		const sql = `
			SELECT 
				id, \`rank\`, title, category, heat, trend, tags, url, description
			FROM hot_topics
			WHERE is_active = 1 
			AND platform = ?
			ORDER BY created_at DESC, \`rank\` ASC
			LIMIT 20
		`;

		const topics = await db.query(sql, [platform]);

		// 格式化数据
		const formattedTopics = topics.map(topic => ({
			title: topic.title,
			category: topic.category,
			heat: topic.heat,
			trend: topic.trend,
			tags: topic.tags ? JSON.parse(topic.tags) : [],
			url: topic.url,
			platform: platform,
			description: topic.description
		}));

		if (formattedTopics.length === 0) {
			console.log(`⚠️  数据库中没有 ${platform} 的话题数据，使用默认模拟数据`);
			const mockTopics = {
				douyin: [
					{ title: "明年小目标: 学会Vue 3开发", heat: 2500000, category: "科技", trend: "up", platform: "douyin" },
					{ title: "年轻人的新烦恼：996工作制", heat: 2100000, category: "生活", trend: "up", platform: "douyin" }
				],
				baidu: [
					{ title: "2024年度流行趋势总结", heat: 3200000, category: "社会", trend: "up", platform: "baidu" },
					{ title: "人工智能发展新突破", heat: 2800000, category: "科技", trend: "up", platform: "baidu" }
				],
				zhihu: [{ title: "如何有效学习编程？", heat: 2600000, category: "教育", trend: "up", platform: "zhihu" }],
				weibo: [{ title: "名人微博话题讨论", heat: 3800000, category: "娱乐", trend: "up", platform: "weibo" }],
				bilibili: [{ title: "热门UP主最新视频发布", heat: 2700000, category: "动画", trend: "up", platform: "bilibili" }]
			};

			const data = mockTopics[platform] || [];
			SUCCESS(ctx, true, "成功（使用模拟数据）", { topics: data });
		} else {
			SUCCESS(ctx, true, "成功", { topics: formattedTopics });
		}
	} catch (err) {
		console.error("获取平台热门话题失败:", err);
		ERROR(ctx, "获取平台热门话题失败");
	}
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
	const type = "game_info"; // 统一使用 game_info 表
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
 * 清空日志接口 - 仅清空页面数据，不删除服务器日志
 * author: kris
 * date: 2025年02月15日16:29:56
 */
router.delete("/logs", async ctx => {
	try {
		// 只返回成功，不实际清空服务器日志
		SUCCESS(ctx, true, "日志已清空（页面数据）");
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

		// 返回 JSON 格式，前端处理成 CSV
		const logLines = logs.split("\n").filter(line => line.trim());
		SUCCESS(ctx, true, "导出成功", logLines);
	} catch (err) {
		console.error("导出日志失败:", err);
		ERROR(ctx, "导出日志失败");
	}
});

/*
 * 获取小说列表接口 - 优先使用笔趣阁爬虫获取真实数据
 * params: {"current": 1, "pageSize": 10, "category": "玄幻", "searchText": ""}
 * author: kris
 * date: 2025年11月21日 - 集成笔趣阁爬虫获取真实小说数据
 */
router.post("/bookMicroservices/book/getBookList", async (ctx, next) => {
	const { current, pageSize, category, searchText } = ctx.request.body;
	if (!current || !pageSize) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[API] getBookList 搜索: ${searchText || "首页分类"}, 分类: ${category || "所有"}`);

		let books = [];

		// 新策略: 优先使用看书猴爬虫 (kanshuhouSpider) 获取数据
		if (searchText && searchText.trim() !== "") {
			// 有搜索词时，使用看书猴搜索
			console.log(`[API] 使用看书猴爬虫搜索: ${searchText}`);
			try {
				const searchResult = await kanshuhouSpider.getNovelsByKeyword(searchText, current);
				books = searchResult.novels || [];
			} catch (err) {
				console.log("[API] 看书猴搜索失败，尝试使用比格爬虫");
				books = await biqugeSpider.searchNovels(searchText);
			}
		} else if (category && category !== "所有" && category !== "all") {
			// 有分类时，使用看书猴按分类获取
			console.log(`[API] 使用看书猴爬虫获取分类: ${category}`);
			try {
				const categoryId = getCategoryId(category);
				books = await kanshuhouSpider.getNovelsByCategory(categoryId, current);
				if (!Array.isArray(books)) {
					books = books.novels || [];
				}
			} catch (err) {
				console.log("[API] 看书猴分类获取失败，降级到本地数据");
				books = await novelFetcher.getAllNovels();
			}
		} else {
			// 没有搜索词也没有分类，获取首页推荐 (聚合多个分类的内容)
			console.log("[API] 获取首页推荐内容 (多分类聚合)");
			try {
				let homePageBooks = [];
				const categories = ["1", "2", "3", "5"]; // 玄幻、言情、武侠、都市

				for (const catId of categories) {
					try {
						const catBooks = await kanshuhouSpider.getNovelsByCategory(catId, 1);
						if (Array.isArray(catBooks)) {
							homePageBooks = homePageBooks.concat(catBooks);
						}
					} catch (err) {
						console.log(`[API] 分类 ${catId} 获取失败`);
					}
				}

				if (homePageBooks.length > 0) {
					books = homePageBooks;
					console.log(`[API] 首页推荐聚合了 ${books.length} 部小说`);
				} else {
					console.log("[API] 看书猴首页推荐失败，降级到本地数据");
					books = await novelFetcher.getAllNovels();
				}
			} catch (err) {
				console.log("[API] 首页推荐获取失败:", err.message);
				books = await novelFetcher.getAllNovels();
			}
		}

		// 如果还是没有数据，最后才用本地数据
		if (!books || books.length === 0) {
			console.log("[API] 所有远程数据源都失败，使用本地数据");
			books = await novelFetcher.getAllNovels();
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
	let { bookId, novelHref } = ctx.request.body;
	if (!bookId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[API] getChapters: ${bookId}, novelHref: ${novelHref}`);

		// 快速路径：如果没有novelHref，直接返回本地数据而不进行任何网络请求
		if (!novelHref) {
			console.log("[API] novelHref未提供，使用本地模拟数据");
			const mockChapters = [];
			for (let i = 1; i <= 100; i++) {
				const themes = ["冒险之旅", "力量增长", "命运转折", "奇遇相逢", "真相大白"];
				mockChapters.push({
					chapterId: i.toString(),
					chapterName: `第${i}章 ${themes[i % themes.length]}`,
					chapterHref: `/read/${bookId}/${i + 100000}.html`,
					updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
				});
			}
			return SUCCESS(ctx, true, "成功", { data: mockChapters, total: 100 });
		}

		// 有novelHref，使用爬虫获取真实数据
		let chapters = [];
		console.log("[API] 使用看书猴爬虫获取章节");
		try {
			const result = await kanshuhouSpider.getNovelChapters(novelHref, 1);
			if (result && result.length > 0) {
				chapters = result;
				console.log(`[API] 看书猴爬虫成功获取 ${chapters.length} 个章节`);
				// 规范化并返回
				const normalizedChapters = chapters.map((ch, idx) => ({
					chapterId: ch.chapterId || (idx + 1).toString(),
					chapterName: ch.chapterName || ch.name || "未知章节",
					chapterHref: ch.href || ch.chapterHref || `/read/${bookId}/${idx + 1}.html`,
					updateTime: ch.updateTime || new Date().toISOString()
				}));
				return SUCCESS(ctx, true, "成功", { data: normalizedChapters, total: normalizedChapters.length });
			}
		} catch (err) {
			console.log("[API] 爬虫获取失败:", err.message);
		}

		// 如果爬虫失败，返回本地模拟数据
		console.log("[API] 爬虫失败，返回模拟数据");
		const mockChapters = [];
		for (let i = 1; i <= 100; i++) {
			const themes = ["冒险之旅", "力量增长", "命运转折", "奇遇相逢", "真相大白"];
			mockChapters.push({
				chapterId: i.toString(),
				chapterName: `第${i}章 ${themes[i % themes.length]}`,
				chapterHref: `/read/${bookId}/${i + 100000}.html`,
				updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString()
			});
		}
		return SUCCESS(ctx, true, "成功", { data: mockChapters, total: 100 });
	} catch (error) {
		console.error("获取章节列表错误:", error);
		ERROR(ctx, "获取章节列表失败");
	}
});

/*
 * 获取小说章节内容接口
 * params: {"bookId": "1", "chapterId": "1", "chapterHref": "/book/1/1.html"}
 * author: kris
 * date: 2025年11月21日
 */
router.post("/bookMicroservices/book/getChapterContent", async (ctx, next) => {
	const { bookId, chapterId, chapterHref } = ctx.request.body;
	if (!bookId || !chapterId) {
		ERROR(ctx, "参数错误");
		return;
	}

	try {
		console.log(`[API] getChapterContent: ${bookId}/${chapterId}, chapterHref: ${chapterHref}`);

		let content = null;

		// 如果提供了章节href，优先使用看书猴爬虫获取真实内容
		if (chapterHref && !chapterHref.startsWith("/local/")) {
			try {
				// 1️⃣ 首选：看书猴爬虫 (现在可用)
				console.log("[API] 使用看书猴爬虫获取章节内容");
				content = await kanshuhouSpider.getChapterContent(chapterHref);

				// 如果获取到内容，直接返回
				if (content && content.content && content.content.length > 50) {
					console.log("[API] 看书猴爬虫成功获取章节内容");
					return SUCCESS(ctx, true, "成功", content);
				}
			} catch (err1) {
				console.log("[API] 看书猴爬虫获取失败，尝试笔趣阁");
			}

			try {
				// 2️⃣ 备选：笔趣阁爬虫
				console.log("[API] 使用笔趣阁爬虫获取章节内容");
				content = await biqugeSpider.fetchChapterContent(chapterHref);

				// 如果爬虫返回错误内容（含"获取失败"）则降级
				if (content && content.content && content.content.includes("获取失败")) {
					throw new Error("笔趣阁爬虫返回失败");
				}

				if (content && content.content && content.content.length > 50) {
					console.log("[API] 笔趣阁爬虫成功获取章节内容");
					return SUCCESS(ctx, true, "成功", content);
				}
			} catch (err2) {
				console.log("[API] 笔趣阁爬虫也失败，降级到本地数据");
			}
		}

		// 3️⃣ 本地数据或所有爬虫都失败
		try {
			console.log("[API] 从本地数据库获取章节内容");
			content = await novelFetcher.fetchChapterContentFromBiquge(bookId, chapterId);

			if (content && content.content && content.content.length > 50) {
				console.log("[API] 本地数据获取成功");
				return SUCCESS(ctx, true, "成功", content);
			}
		} catch (err3) {
			console.log("[API] 本地数据获取失败");
		}

		// 4️⃣ 最后手段：返回默认模拟数据
		console.log("[API] 所有数据源都失败，返回默认数据");
		return SUCCESS(ctx, true, "成功", {
			title: `第${chapterId}章 故事继续`,
			content:
				"　　这是一个充满奇幻的世界。主人公在这个世界中踏上了冒险的征途。\n\n　　经过许多磨难后，他逐渐成长，变得更加强大。\n\n　　新的挑战又在前方等待着他。"
		});
	} catch (error) {
		console.error("获取章节内容错误:", error);
		ERROR(ctx, "获取章节内容失败");
	}
});

/**
 * 获取看书猴的分类列表
 * author: kris
 * date: 2025年11月21日
 */
router.post("/bookMicroservices/book/getCategories", async (ctx, next) => {
	try {
		console.log("[API] 获取分类列表");
		const categories = await kanshuhouSpider.getCategories();

		if (!categories || categories.length === 0) {
			// 返回默认分类作为备用
			const defaultCategories = [
				{ id: "1", name: "玄幻小说", href: "/sort/1/1/" },
				{ id: "2", name: "奇幻小说", href: "/sort/2/1/" },
				{ id: "5", name: "都市小说", href: "/sort/5/1/" },
				{ id: "10", name: "科幻小说", href: "/sort/10/1/" },
				{ id: "3", name: "武侠小说", href: "/sort/3/1/" }
			];
			console.log("[API] 爬虫获取失败，使用默认分类");
			SUCCESS(ctx, true, "成功（使用默认分类）", defaultCategories);
			return;
		}

		console.log(`[API] 获取到 ${categories.length} 个分类`);
		SUCCESS(ctx, true, "成功", categories);
	} catch (error) {
		console.error("[API] 获取分类错误:", error);
		ERROR(ctx, "获取分类失败");
	}
});

/**
 * 获取指定分类的小说列表
 * params: categoryId, page
 * author: kris
 * date: 2025年11月21日
 */
router.post("/bookMicroservices/book/getNovelsByCategory", async (ctx, next) => {
	const { categoryId, page = 1, pageSize = 20 } = ctx.request.body;

	if (!categoryId) {
		ERROR(ctx, "参数错误：缺少categoryId");
		return;
	}

	try {
		console.log(`[API] 获取分类 ${categoryId} 的小说 (第${page}页)`);
		const novels = await kanshuhouSpider.getNovelsByCategory(categoryId, page);

		if (!novels || novels.length === 0) {
			console.log("[API] 爬虫无结果");
			ERROR(ctx, "无法获取该分类的小说");
			return;
		}

		const total = novels.length;
		const paginatedNovels = novels.slice(0, pageSize);

		const data = {
			data: paginatedNovels,
			total: total,
			page: page,
			pageSize: pageSize
		};

		console.log(`[API] 返回 ${paginatedNovels.length} 部小说`);
		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("[API] 获取分类小说错误:", error.message);
		ERROR(ctx, "获取小说列表失败");
	}
});

/**
 * 从看书猴搜索小说
 * params: keyword
 * author: kris
 * date: 2025年11月21日
 */
router.post("/bookMicroservices/book/searchFromKanshuhou", async (ctx, next) => {
	const { keyword, page = 1, pageSize = 20 } = ctx.request.body;

	if (!keyword || keyword.trim() === "") {
		ERROR(ctx, "参数错误：缺少搜索关键词");
		return;
	}

	try {
		console.log(`[API] 从看书猴搜索: ${keyword}`);

		// 使用第一个分类进行搜索（看书猴目前没有搜索接口，所以用分类作为演示）
		// 实际应用中可以扩展为全文搜索
		const categories = await kanshuhouSpider.getCategories();
		let allNovels = [];

		// 从前3个分类获取数据并搜索
		for (let i = 0; i < Math.min(3, categories.length); i++) {
			const categoryNovels = await kanshuhouSpider.getNovelsByCategory(categories[i].id, 1);

			// 按关键词过滤
			const filtered = categoryNovels.filter(novel => novel.Name.includes(keyword) || novel.Author.includes(keyword));

			allNovels = allNovels.concat(filtered);
		}

		if (!allNovels || allNovels.length === 0) {
			console.log("[API] 搜索无结果");
			const data = {
				data: [],
				total: 0,
				page: page,
				pageSize: pageSize
			};
			SUCCESS(ctx, true, "成功（无结果）", data);
			return;
		}

		const total = allNovels.length;
		const start = (page - 1) * pageSize;
		const end = start + pageSize;
		const paginatedNovels = allNovels.slice(start, end);

		const data = {
			data: paginatedNovels,
			total: total,
			page: page,
			pageSize: pageSize
		};

		console.log(`[API] 搜索找到 ${total} 部小说`);
		SUCCESS(ctx, true, "成功", data);
	} catch (error) {
		console.error("[API] 搜索错误:", error.message);
		ERROR(ctx, "搜索失败");
	}
});

/**
 * 获取爬虫倒计时数据接口
 * 返回所有爬虫的下次运行时间、倒计时等信息
 * author: kris
 * date: 2025年11月28日
 */
/**
 * 将Cron表达式转换为中文描述
 * 格式: 秒 分 时 日 月 周 (0-59 0-59 0-23 1-31 1-12 0-6)
 */
function parseCronToChinese(cronExpr, scheduleTime) {
	if (!cronExpr) {
		return scheduleTime || "未配置";
	}

	// 解析 Cron 表达式 (格式: 秒 分 时 日 月 周)
	const parts = cronExpr.trim().split(/\s+/);
	if (parts.length < 5) {
		return cronExpr;
	}

	const [sec, min, hour, day, month, dow] = parts;

	// ==================== 精准的Cron表达式匹配 ====================

	// 每N小时执行 (格式: 0 0 */N * * * 或 0 0 0/N * * *)
	if (
		(hour.startsWith("*/") || hour.startsWith("0/")) &&
		min === "0" &&
		sec === "0" &&
		day === "*" &&
		month === "*" &&
		(dow === "*" || dow === "?")
	) {
		const intervalStr = hour.includes("/") ? hour.split("/")[1] : null;
		if (intervalStr) {
			const interval = parseInt(intervalStr);
			if (!isNaN(interval)) {
				return `每${interval}小时执行一次`;
			}
		}
	}

	// 每日指定时间 (格式: 0 M H * * *)
	if (day === "*" && month === "*" && (dow === "*" || dow === "?")) {
		if (sec === "0" && !hour.includes("/") && !hour.includes(",")) {
			const hourNum = parseInt(hour);
			const minNum = parseInt(min);

			if (!isNaN(hourNum) && !isNaN(minNum)) {
				const hourStr = String(hourNum).padStart(2, "0");
				const minStr = String(minNum).padStart(2, "0");
				return `每日${hourStr}:${minStr}执行`;
			}
		}
	}

	// 每小时N分钟执行
	if (hour === "*" && day === "*" && month === "*" && (dow === "*" || dow === "?")) {
		if (sec === "0") {
			const minNum = parseInt(min);
			if (!isNaN(minNum)) {
				const minStr = String(minNum).padStart(2, "0");
				return `每小时${minStr}分执行`;
			}
		}
	}

	// 每N分钟执行
	if (min.startsWith("*/") && hour === "*" && day === "*" && month === "*" && (dow === "*" || dow === "?")) {
		if (sec === "0") {
			const interval = parseInt(min.substring(2));
			if (!isNaN(interval)) {
				return `每${interval}分钟执行一次`;
			}
		}
	}

	// 每N秒执行
	if (sec.startsWith("*/") && min === "*" && hour === "*" && day === "*" && month === "*") {
		const interval = parseInt(sec.substring(2));
		if (!isNaN(interval)) {
			return `每${interval}秒执行一次`;
		}
	}

	// 每月指定日期
	if (month === "*" && (dow === "*" || dow === "?")) {
		if (sec === "0" && !day.startsWith("*")) {
			const dayNum = parseInt(day);
			if (!isNaN(dayNum)) {
				const hourNum = parseInt(hour);
				const minNum = parseInt(min);
				if (!isNaN(hourNum) && !isNaN(minNum)) {
					const hourStr = String(hourNum).padStart(2, "0");
					const minStr = String(minNum).padStart(2, "0");
					return `每月${dayNum}号${hourStr}:${minStr}执行`;
				}
			}
		}
	}

	// 每周指定日期
	const dayOfWeekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
	if (dow !== "*" && dow !== "?" && day === "*" && month === "*") {
		if (sec === "0") {
			const daysArr = dow.split(",").map(d => {
				const dayNum = parseInt(d);
				return dayOfWeekMap[dayNum] || d;
			});
			const hourNum = parseInt(hour);
			const minNum = parseInt(min);
			if (!isNaN(hourNum) && !isNaN(minNum)) {
				const hourStr = String(hourNum).padStart(2, "0");
				const minStr = String(minNum).padStart(2, "0");
				return `每周${daysArr.join("、")}${hourStr}:${minStr}执行`;
			}
		}
	}

	// 默认返回原始表达式
	return cronExpr;
}

router.post("/statistics/getCrawlerCountdown", async (ctx, next) => {
	try {
		// 从 crawler_config 表查询爬虫配置
		let configs = [];

		try {
			// 尝试查询 source_url 字段（新表结构）
			const configSqlWithUrl = `
				SELECT 
					id,
					spider_name,
					table_name,
					schedule_time,
					schedule_frequency,
					cron_expression,
					source_code_path,
					platform_name,
					source_url,
					description,
					enabled,
					created_at,
					updated_at
				FROM crawler_config 
				WHERE enabled = 1
				ORDER BY id ASC
			`;
			configs = await db.query(configSqlWithUrl);
		} catch (e) {
			// 如果 source_url 字段不存在，使用旧表结构查询
			console.warn("source_url 字段不存在，使用备用查询方案");
			const configSqlWithoutUrl = `
				SELECT 
					id,
					spider_name,
					table_name,
					schedule_time,
					schedule_frequency,
					cron_expression,
					source_code_path,
					platform_name,
					NULL as source_url,
					description,
					enabled,
					created_at,
					updated_at
				FROM crawler_config 
				WHERE enabled = 1
				ORDER BY id ASC
			`;
			configs = await db.query(configSqlWithoutUrl);
		}

		if (!configs || configs.length === 0) {
			ERROR(ctx, "未找到爬虫配置");
			return;
		}

		// 从 crawler_logs 查询最近的运行记录
		let logs = [];

		if (configs && configs.length > 0) {
			const logSql = `
				SELECT 
					spider_type,
					status,
					total_count,
					created_at,
					duration_ms as duration
				FROM crawler_logs 
				WHERE spider_type IN (${configs.map(() => "?").join(",")})
				ORDER BY created_at DESC
			`;

			const logParams = configs.map(c => {
				// 映射表名到 spider_type
				if (c.table_name === "game_info") return "game";
				if (c.table_name === "hot_topics") return "hot_topics";
				if (c.table_name === "ai_info") return "ai_info";
				return c.spider_name;
			});

			try {
				logs = await db.query(logSql, logParams);
			} catch (e) {
				console.warn("爬虫日志查询失败，使用默认数据", e.message);
			}
		}

		// 预先查询各爬虫的实际数据数量
		let dataCountMap = {
			game: 0,
			hot_topics: 0,
			ai_info: 0
		};

		try {
			const gameCountResult = await db.query("SELECT COUNT(*) as count FROM game_info");
			dataCountMap.game = gameCountResult[0]?.count || 0;
		} catch (e) {
			console.warn("game_info 计数失败:", e.message);
		}

		try {
			const topicsCountResult = await db.query("SELECT COUNT(*) as count FROM hot_topics WHERE is_active = 1");
			dataCountMap.hot_topics = topicsCountResult[0]?.count || 0;
		} catch (e) {
			console.warn("hot_topics 计数失败:", e.message);
		}

		try {
			const aiCountResult = await db.query("SELECT COUNT(*) as count FROM ai_info");
			dataCountMap.ai_info = aiCountResult[0]?.count || 0;
		} catch (e) {
			console.warn("ai_info 计数失败:", e.message);
		}

		// 为每个配置生成倒计时数据
		const crawlerData = configs.map((config, index) => {
			// 根据表名确定spider_type
			let spiderType = config.spider_name;
			if (config.table_name === "game_info") spiderType = "game";
			else if (config.table_name === "hot_topics") spiderType = "hot_topics";
			else if (config.table_name === "ai_info") spiderType = "ai_info";

			// 查找该爬虫的最近运行记录
			const recentLogs = logs.filter(log => log.spider_type === spiderType);
			const lastLog = recentLogs[0];

			// 计算下次运行时间和倒计时
			let nextRunTime = 0;
			let lastRunTime = lastLog ? new Date(lastLog.created_at) : new Date(Date.now() - 1000 * 60 * 60);
			let status = "waiting";
			let successRate = 95.0;
			let totalRuns = recentLogs.length;
			let lastStatus = "success";
			let dataCount = 0;
			let avgDuration = 0;

			// 根据 cron 表达式计算下次运行时间
			const scheduleTime = config.schedule_time || "";
			const now = new Date();

			if (scheduleTime.includes(",")) {
				// 多个时间点（如 00:00, 12:00, 18:00）
				const times = scheduleTime.split(",").map(t => t.trim());
				let nextTime = null;

				for (const time of times) {
					const [hours, minutes] = time.split(":").map(Number);
					const scheduleDate = new Date(now);
					scheduleDate.setHours(hours, minutes, 0, 0);

					if (scheduleDate > now) {
						if (!nextTime || scheduleDate < nextTime) {
							nextTime = scheduleDate;
						}
					}
				}

				// 如果今天没有未来的时间点，使用明天的第一个时间点
				if (!nextTime) {
					const [hours, minutes] = times[0].split(":").map(Number);
					nextTime = new Date(now);
					nextTime.setDate(nextTime.getDate() + 1);
					nextTime.setHours(hours, minutes, 0, 0);
				}

				nextRunTime = Math.floor((nextTime - now) / 1000);
			} else if (scheduleTime.match(/^\d{2}:\d{2}$/)) {
				// 单个时间点（如 03:00）
				const [hours, minutes] = scheduleTime.split(":").map(Number);
				const scheduleDate = new Date(now);
				scheduleDate.setHours(hours, minutes, 0, 0);

				if (scheduleDate <= now) {
					scheduleDate.setDate(scheduleDate.getDate() + 1);
				}

				nextRunTime = Math.floor((scheduleDate - now) / 1000);
			} else {
				// 默认1小时后
				nextRunTime = 3600;
			}

			// 从日志计算成功率、数据量和平均耗时
			if (recentLogs.length > 0) {
				const successCount = recentLogs.filter(log => log.status === "success").length;
				successRate = parseFloat(((successCount / recentLogs.length) * 100).toFixed(1));
				lastStatus = lastLog.status === "success" ? "success" : "error";
				status = lastLog.status === "success" ? "waiting" : "error";

				// 数据量从实际数据表中获取
				dataCount = dataCountMap[spiderType] || 0;

				// 计算平均耗时（毫秒转秒）
				if (recentLogs.length > 0) {
					const totalDuration = recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
					avgDuration = parseFloat((totalDuration / recentLogs.length / 1000).toFixed(2)); // 转为秒
				}
			} else {
				// 没有日志的情况下，仍然从数据表获取数据量
				dataCount = dataCountMap[spiderType] || 0;
			}

			// 图标映射
			const iconMap = {
				游戏爬虫: "🎮",
				热门话题: "🔥",
				AI工具库: "🤖",
				小说爬虫: "📚"
			};

			// 颜色映射
			const colorMap = {
				游戏爬虫: "#00ffff",
				热门话题: "#ff6b35",
				AI工具库: "#ffff00",
				小说爬虫: "#ff0080"
			};

			return {
				id: config.id,
				name: config.spider_name,
				icon: iconMap[config.spider_name] || "🕷️",
				color: colorMap[config.spider_name] || "#00ffff",
				status: status,
				nextRunTime: nextRunTime,
				lastRunTime: lastRunTime,
				interval: config.schedule_frequency || "未知",
				type: config.platform_name || "数据采集",
				url: config.source_url || "/",
				cron: parseCronToChinese(config.cron_expression, scheduleTime),
				successRate: successRate,
				totalRuns: totalRuns,
				lastStatus: lastStatus,
				dataCount: dataCount,
				avgDuration: avgDuration
			};
		});

		SUCCESS(ctx, true, "成功获取爬虫倒计时数据", {
			crawlers: crawlerData,
			timestamp: new Date()
		});
	} catch (error) {
		console.error("[API] 获取爬虫倒计时数据错误:", error);
		ERROR(ctx, "获取爬虫倒计时数据失败");
	}
});

/**
 * 获取爬虫统计数据接口
 * 返回所有爬虫的统计信息：总条数、成功率、最后更新时间等
 * author: kris
 * date: 2025年02月20日
 */
router.post("/statistics/getCrawlerStats", async (ctx, next) => {
	try {
		// 1. 游戏爬虫 - 从统一的 game_info 表查询
		let gameTotalCount = 0;
		let gameLastUpdate = null;
		let gameSuccessRate = 0;
		try {
			// 从 game_info 表查询总数
			const gameCountSql = "SELECT COUNT(*) as count FROM game_info";
			const gameCountResult = await db.query(gameCountSql);
			gameTotalCount = gameCountResult[0]?.count || 0;

			// 获取最后更新时间
			const gameTimeSql = "SELECT MAX(update_time) as lastUpdate FROM game_info";
			const gameTimeResult = await db.query(gameTimeSql);
			gameLastUpdate = gameTimeResult[0]?.lastUpdate;

			// 从 crawler_logs 获取游戏爬虫的成功率
			try {
				const gameSuccessRateSql = `
					SELECT 
						SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
					FROM crawler_logs 
					WHERE spider_type = 'game'
				`;
				const gameRateResult = await db.query(gameSuccessRateSql);
				gameSuccessRate = gameRateResult[0]?.success_rate ? parseFloat(gameRateResult[0].success_rate).toFixed(1) : 100;
			} catch (e) {
				console.warn("游戏成功率查询失败", e.message);
				gameSuccessRate = gameTotalCount > 0 ? 100 : 0;
			}
		} catch (e) {
			console.warn("游戏表查询失败", e.message);
			gameTotalCount = 0;
		}

		// 2. 热门话题爬虫
		let hotTopicsTotalCount = 0;
		let topicsLastUpdate = null;
		let hotTopicsSuccessRate = 0;
		try {
			const hotTopicsCountSql = `SELECT COUNT(*) as total FROM hot_topics WHERE is_active = 1`;
			const hotTopicsStats = await db.query(hotTopicsCountSql);
			hotTopicsTotalCount = hotTopicsStats[0]?.total || 0;

			const topicsTimeSql = `SELECT MAX(updated_at) as lastUpdate FROM hot_topics`;
			const topicsTimeResult = await db.query(topicsTimeSql);
			topicsLastUpdate = topicsTimeResult[0]?.lastUpdate;

			// 从 crawler_logs 获取热门话题爬虫的成功率
			try {
				const topicsSuccessRateSql = `
					SELECT 
						SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
					FROM crawler_logs 
					WHERE spider_type = 'hot_topics'
				`;
				const topicsRateResult = await db.query(topicsSuccessRateSql);
				hotTopicsSuccessRate = topicsRateResult[0]?.success_rate ? parseFloat(topicsRateResult[0].success_rate).toFixed(1) : 0;
			} catch (e) {
				console.warn("热门话题成功率查询失败", e.message);
				hotTopicsSuccessRate = 0;
			}
		} catch (e) {
			console.warn("热门话题表查询失败", e.message);
		}

		// 3. AI工具爬虫
		let aiToolsTotalCount = 0;
		let aiLastUpdate = null;
		let aiSuccessRate = 0;
		try {
			const aiToolsCountSql = `SELECT COUNT(*) as total FROM ai_info`;
			const aiToolsStats = await db.query(aiToolsCountSql);
			aiToolsTotalCount = aiToolsStats[0]?.total || 0;

			const aiTimeSql = `SELECT MAX(update_time) as lastUpdate FROM ai_info`;
			const aiTimeResult = await db.query(aiTimeSql);
			aiLastUpdate = aiTimeResult[0]?.lastUpdate;

			// 从 crawler_logs 获取 AI 工具爬虫的成功率
			try {
				const aiSuccessRateSql = `
					SELECT 
						SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
					FROM crawler_logs 
					WHERE spider_type = 'ai_tools' OR spider_type = 'ai_info'
				`;
				const aiRateResult = await db.query(aiSuccessRateSql);
				aiSuccessRate = aiRateResult[0]?.success_rate ? parseFloat(aiRateResult[0].success_rate).toFixed(1) : 0;
			} catch (e) {
				console.warn("AI工具成功率查询失败", e.message);
				aiSuccessRate = 0;
			}
		} catch (e) {
			console.warn("AI工具表查询失败", e.message);
		}

		// 4. 从 crawler_config 表查询爬虫配置
		let configMap = {};
		try {
			const configSql = `SELECT spider_name, table_name, schedule_time, schedule_frequency, source_code_path, platform_name, description FROM crawler_config WHERE enabled = 1`;
			const configs = await db.query(configSql);
			configs.forEach(config => {
				configMap[config.spider_name] = {
					tableName: config.table_name,
					scheduleTime: config.schedule_time,
					scheduleFrequency: config.schedule_frequency,
					sourceCode: config.source_code_path,
					platformName: config.platform_name,
					description: config.description
				};
			});
		} catch (e) {
			console.warn("爬虫配置表查询失败，将使用默认值", e.message);
			// 如果配置表查询失败，使用默认值
			configMap = {
				游戏爬虫: {
					tableName: "game_info",
					scheduleTime: "03:00",
					scheduleFrequency: "每天凌晨",
					sourceCode: "server/utils/gameSpider.js",
					platformName: "PS5/PC Game",
					description: "爬取游戏平台数据"
				},
				热门话题: {
					tableName: "hot_topics",
					scheduleTime: "00:00, 12:00, 18:00",
					scheduleFrequency: "每天三次",
					sourceCode: "server/utils/hotTopicsSpider.js",
					platformName: "Baidu/Weibo/Bilibili",
					description: "爬取热门话题数据"
				},
				AI工具库: {
					tableName: "ai_info",
					scheduleTime: "未配置",
					scheduleFrequency: "手动",
					sourceCode: "server/utils/aiToolsSpider.js",
					platformName: "多源AI工具聚合",
					description: "爬取AI工具信息"
				}
			};
		}

		// 5. 计算总数（只统计三种爬虫）
		const totalCount = gameTotalCount + hotTopicsTotalCount + aiToolsTotalCount;

		// 5.5. 计算每个爬虫的平均执行时间（duration）和执行次数（runCount）
		let gameDuration = 0;
		let topicsDuration = 0;
		let aiDuration = 0;

		let gameRunCount = 0;
		let topicsRunCount = 0;
		let aiRunCount = 0;

		try {
			const gameDurationSql = `
				SELECT AVG(duration_ms) as avg_duration, COUNT(*) as run_count FROM crawler_logs 
				WHERE spider_type = 'game'
			`;
			const gameDurationResult = await db.query(gameDurationSql);
			gameDuration = gameDurationResult[0]?.avg_duration ? Math.round(gameDurationResult[0].avg_duration) : 0;
			gameRunCount = gameDurationResult[0]?.run_count || 0;
		} catch (e) {
			console.warn("游戏爬虫 duration 查询失败", e.message);
		}

		try {
			const topicsDurationSql = `
				SELECT AVG(duration_ms) as avg_duration, COUNT(*) as run_count FROM crawler_logs 
				WHERE spider_type = 'hot_topics'
			`;
			const topicsDurationResult = await db.query(topicsDurationSql);
			topicsDuration = topicsDurationResult[0]?.avg_duration ? Math.round(topicsDurationResult[0].avg_duration) : 0;
			topicsRunCount = topicsDurationResult[0]?.run_count || 0;
		} catch (e) {
			console.warn("热门话题 duration 查询失败", e.message);
		}

		try {
			const aiDurationSql = `
				SELECT AVG(duration_ms) as avg_duration, COUNT(*) as run_count FROM crawler_logs 
				WHERE spider_type IN ('ai_tools', 'ai_info')
			`;
			const aiDurationResult = await db.query(aiDurationSql);
			aiDuration = aiDurationResult[0]?.avg_duration ? Math.round(aiDurationResult[0].avg_duration) : 0;
			aiRunCount = aiDurationResult[0]?.run_count || 0;
		} catch (e) {
			console.warn("AI 工具 duration 查询失败", e.message);
		}

		// 6. 构建爬虫统计数据（从配置和数据库查询结果组合）
		const crawlerStats = [
			{
				spiderName: "游戏爬虫",
				platformName: configMap["游戏爬虫"]?.platformName || "PS5/PC Game",
				totalCount: gameTotalCount,
				successRate: gameTotalCount > 0 ? gameSuccessRate : 0,
				duration: gameDuration,
				runCount: gameRunCount,
				lastUpdateTime: gameLastUpdate || new Date(),
				status: "active",
				sourceCode: configMap["游戏爬虫"]?.sourceCode || "server/utils/gameSpider.js",
				description: configMap["游戏爬虫"]?.description || "爬取游戏平台数据",
				tableName: configMap["游戏爬虫"]?.tableName || "game_info",
				scheduleTime: configMap["游戏爬虫"]?.scheduleTime || "03:00",
				scheduleFrequency: configMap["游戏爬虫"]?.scheduleFrequency || "每天凌晨"
			},
			{
				spiderName: "热门话题",
				platformName: configMap["热门话题"]?.platformName || "Baidu/Weibo/Bilibili",
				totalCount: hotTopicsTotalCount,
				successRate: hotTopicsTotalCount > 0 ? hotTopicsSuccessRate : 0,
				duration: topicsDuration,
				runCount: topicsRunCount,
				lastUpdateTime: topicsLastUpdate || new Date(),
				status: "active",
				sourceCode: configMap["热门话题"]?.sourceCode || "server/utils/hotTopicsSpider.js",
				description: configMap["热门话题"]?.description || "爬取热门话题数据",
				tableName: configMap["热门话题"]?.tableName || "hot_topics",
				scheduleTime: configMap["热门话题"]?.scheduleTime || "00:00, 12:00, 18:00",
				scheduleFrequency: configMap["热门话题"]?.scheduleFrequency || "每天三次"
			},
			{
				spiderName: "AI工具库",
				platformName: configMap["AI工具库"]?.platformName || "多源AI工具聚合",
				totalCount: aiToolsTotalCount,
				successRate: aiToolsTotalCount > 0 ? aiSuccessRate : 0,
				duration: aiDuration,
				runCount: aiRunCount,
				lastUpdateTime: aiLastUpdate || new Date(),
				status: "active",
				sourceCode: configMap["AI工具库"]?.sourceCode || "server/utils/aiToolsSpider.js",
				description: configMap["AI工具库"]?.description || "爬取AI工具信息",
				tableName: configMap["AI工具库"]?.tableName || "ai_info",
				scheduleTime: configMap["AI工具库"]?.scheduleTime || "未配置",
				scheduleFrequency: configMap["AI工具库"]?.scheduleFrequency || "手动"
			}
		];

		// 7. 计算总统计
		const successRates = crawlerStats.filter(c => c.totalCount > 0).map(c => c.successRate);
		const avgSuccessRate =
			successRates.length > 0 ? (successRates.reduce((a, b) => a + parseFloat(b), 0) / successRates.length).toFixed(1) : 0;

		const totalStats = {
			totalDataCount: totalCount,
			avgSuccessRate: avgSuccessRate,
			activeSpidersCount: crawlerStats.filter(c => c.totalCount > 0).length,
			dailyUpdateFreq: 3
		};

		// 8. 从 crawler_logs 查询所有历史趋势数据（按爬虫类型分类）
		let trendData = [];
		try {
			const trendMap = {};

			// 1. 从 crawler_logs 获取 hot_topics 的数据（包括所有数据，不只是7天）
			const hotTopicsSql = `
				SELECT 
					DATE_FORMAT(created_at, '%Y-%m-%d') as date,
					SUM(total_count) as total_data,
					SUM(CASE WHEN status = 'success' THEN total_count ELSE 0 END) as success_count,
					COUNT(*) as run_count
				FROM crawler_logs 
				WHERE spider_type = 'hot_topics'
				GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
				ORDER BY date ASC
			`;

			const hotTopicsResult = await db.query(hotTopicsSql);
			hotTopicsResult.forEach(row => {
				if (!trendMap[row.date]) {
					trendMap[row.date] = {
						date: row.date,
						timestamp: Math.floor(new Date(row.date).getTime() / 1000),
						spiders: {}
					};
				}
				if (trendMap[row.date]) {
					trendMap[row.date].spiders["hot_topics"] = {
						dataCount: parseInt(row.total_data) || 0,
						successCount: parseInt(row.success_count) || 0,
						runCount: row.run_count || 0
					};
				}
			});

			// 2. 从游戏爬虫日志获取 game 的数据（只查询有爬虫执行记录的日期）
			const gameCountByDateSql = `
				SELECT 
					DATE_FORMAT(created_at, '%Y-%m-%d') as date,
					SUM(total_count) as total_data,
					SUM(CASE WHEN status = 'success' THEN total_count ELSE 0 END) as success_count,
					COUNT(*) as run_count
				FROM crawler_logs
				WHERE spider_type = 'game'
				GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
				ORDER BY date ASC
			`;
			try {
				const gameResult = await db.query(gameCountByDateSql);
				gameResult.forEach(row => {
					if (!trendMap[row.date]) {
						trendMap[row.date] = {
							date: row.date,
							timestamp: Math.floor(new Date(row.date).getTime() / 1000),
							spiders: {}
						};
					}
					trendMap[row.date].spiders["game"] = {
						dataCount: parseInt(row.total_data) || 0,
						successCount: parseInt(row.success_count) || 0,
						runCount: row.run_count || 0
					};
				});
			} catch (e) {
				console.warn("游戏数据趋势查询失败", e.message);
			}

			// 3. 从 AI 爬虫日志获取 ai_info 的数据（只查询有爬虫执行记录的日期）
			const aiCountByDateSql = `
				SELECT 
					DATE_FORMAT(created_at, '%Y-%m-%d') as date,
					SUM(total_count) as total_data,
					SUM(CASE WHEN status = 'success' THEN total_count ELSE 0 END) as success_count,
					COUNT(*) as run_count
				FROM crawler_logs
				WHERE spider_type = 'ai_info'
				GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
				ORDER BY date ASC
			`;

			try {
				const aiResult = await db.query(aiCountByDateSql);
				aiResult.forEach(row => {
					// 对于 AI 数据，检查日期是否已在 trendMap 中
					if (!trendMap[row.date]) {
						trendMap[row.date] = {
							date: row.date,
							timestamp: Math.floor(new Date(row.date).getTime() / 1000),
							spiders: {}
						};
					}
					trendMap[row.date].spiders["ai_info"] = {
						dataCount: parseInt(row.total_data) || 0,
						successCount: parseInt(row.success_count) || 0,
						runCount: row.run_count || 0
					};
				});
			} catch (e) {
				console.warn("AI数据趋势查询失败", e.message);
			}

			// 转换为数组格式（显示所有有数据的日期，按日期排序），并计算该天的总数据
			trendData = Object.values(trendMap)
				.sort((a, b) => new Date(a.date) - new Date(b.date))
				.map(item => {
					const totalDataCount = Object.values(item.spiders).reduce((sum, spider) => sum + spider.dataCount, 0);
					const totalSuccessCount = Object.values(item.spiders).reduce((sum, spider) => sum + spider.successCount, 0);

					return {
						date: item.date,
						timestamp: item.timestamp,
						total: totalDataCount,
						success: totalSuccessCount,
						spiders: item.spiders
					};
				});

			// 打印趋势数据用于调试
			console.log("🔍 [趋势数据] 返回的数据条数:", trendData.length);
			console.log("🔍 [趋势数据] 日期范围:", trendData.length > 0 ? `${trendData[0].date} 到 ${trendData[trendData.length - 1].date}` : "无数据");
			console.log("🔍 [趋势数据] 最后 5 天数据:", trendData.slice(-5).map(d => `${d.date}: ${d.total}条`));
		} catch (e) {
			console.warn("趋势数据查询失败，使用基础结构", e.message);

			// 降级处理：如果查询失败，返回基本的日期结构
			for (let i = 6; i >= 0; i--) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				const dateStr = date.toISOString().split("T")[0];
				trendData.push({
					date: dateStr,
					timestamp: Math.floor(date.getTime() / 1000),
					total: 0,
					success: 0,
					spiders: {}
				});
			}
		}

		SUCCESS(ctx, true, "成功获取爬虫统计数据", {
			crawlers: crawlerStats,
			totalStats: totalStats,
			trendData: trendData,
			timestamp: new Date()
		});
	} catch (error) {
		console.error("[API] 获取爬虫统计数据错误:", error);
		ERROR(ctx, "获取爬虫统计数据失败");
	}
});

// 快速版本的爬虫倒计时 API（简化版，防止卡顿）
router.post("/statistics/getCrawlerCountdownFast", async (ctx, next) => {
	try {
		// 快速查询：只查爬虫配置和统计数据，不进行复杂计算
		let configs = [];
		try {
			const sql = `SELECT id, spider_name, table_name, schedule_time, schedule_frequency, cron_expression, source_url FROM crawler_config WHERE enabled = 1 LIMIT 10`;
			configs = await db.query(sql);
		} catch (e) {
			console.warn("快速查询爬虫配置失败:", e.message);
		}

		if (!configs || configs.length === 0) {
			ERROR(ctx, "未找到爬虫配置");
			return;
		}

		// 计算下次运行时间(以秒为单位)的辅助函数
		const calculateNextRunTime = scheduleTime => {
			const now = new Date();
			let nextRunTime = 0;

			if (!scheduleTime || scheduleTime === "未配置") {
				return 3600; // 默认1小时后
			}

			if (scheduleTime.includes(",")) {
				// 多个时间点（如 00:00, 12:00, 18:00）
				const times = scheduleTime.split(",").map(t => t.trim());
				let nextTime = null;

				for (const time of times) {
					const [hours, minutes] = time.split(":").map(Number);
					const scheduleDate = new Date(now);
					scheduleDate.setHours(hours, minutes, 0, 0);

					if (scheduleDate > now) {
						if (!nextTime || scheduleDate < nextTime) {
							nextTime = scheduleDate;
						}
					}
				}

				// 如果今天没有未来的时间点，使用明天的第一个时间点
				if (!nextTime) {
					const [hours, minutes] = times[0].split(":").map(Number);
					nextTime = new Date(now);
					nextTime.setDate(nextTime.getDate() + 1);
					nextTime.setHours(hours, minutes, 0, 0);
				}

				nextRunTime = Math.floor((nextTime - now) / 1000);
			} else if (scheduleTime.match(/^\d{2}:\d{2}$/)) {
				// 单个时间点（如 03:00）
				const [hours, minutes] = scheduleTime.split(":").map(Number);
				const scheduleDate = new Date(now);
				scheduleDate.setHours(hours, minutes, 0, 0);

				if (scheduleDate <= now) {
					scheduleDate.setDate(scheduleDate.getDate() + 1);
				}

				nextRunTime = Math.floor((scheduleDate - now) / 1000);
			} else {
				nextRunTime = 3600; // 默认1小时
			}

			return nextRunTime;
		};

		// 快速查询统计信息
		const crawlerData = [];
		for (const config of configs) {
			const spiderType = config.table_name === "game_info" ? "game" : config.table_name;

			try {
				// 并行查询日志和数据计数
				const [logResult, countResult] = await Promise.all([
					db.query(
						`SELECT AVG(duration_ms) as avg_duration, COUNT(*) as run_count FROM crawler_logs WHERE spider_type = ? LIMIT 100`,
						[spiderType]
					),
					db.query(`SELECT COUNT(*) as count FROM ${config.table_name}`)
				]);

				const avgDuration = logResult[0]?.avg_duration ? parseFloat((logResult[0].avg_duration / 1000).toFixed(2)) : 0;
				const runCount = logResult[0]?.run_count || 0;
				const dataCount = countResult[0]?.count || 0;

				// 正确计算倒计时
				const nextRunTime = calculateNextRunTime(config.schedule_time);

				crawlerData.push({
					id: config.id,
					name: config.spider_name,
					icon: { 游戏爬虫: "🎮", 热门话题: "🔥", AI工具库: "🤖" }[config.spider_name] || "🕷️",
					color: { 游戏爬虫: "#00ffff", 热门话题: "#ff6b35", AI工具库: "#ffff00" }[config.spider_name] || "#00ffff",
					status: "waiting",
					nextRunTime: nextRunTime,
					lastRunTime: new Date(),
					interval: config.schedule_frequency || "未知",
					type: "数据采集",
					url: config.source_url || "/",
					cron: config.schedule_time || "未配置",
					successRate: 100,
					totalRuns: runCount,
					lastStatus: "success",
					dataCount: dataCount,
					avgDuration: avgDuration
				});
			} catch (e) {
				console.warn(`查询 ${config.spider_name} 失败:`, e.message);
			}
		}

		SUCCESS(ctx, true, "成功获取爬虫倒计时数据", {
			crawlers: crawlerData,
			timestamp: new Date()
		});
	} catch (error) {
		console.error("[API] 快速获取爬虫倒计时数据错误:", error);
		ERROR(ctx, "获取爬虫倒计时数据失败");
	}
});

module.exports = router;
