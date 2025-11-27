/**
 * 游戏爬虫 - 统一爬取 PS5 和 PC 游戏
 * 数据来源: 游民星空 (ku.gamersky.com)
 *
 * 安装依赖: npm install axios cheerio puppeteer mysql2/promise
 *
 * 使用方式:
 * 1. 直接运行: node gameSpider.js
 * 2. 定时任务: 由 cronScheduler 调用 runGameSpiders()
 *
 * author: kris
 * date: 2025年11月26日
 */

const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const db = require("../db.js");

// 游戏类型配置
const GAME_TYPES = ["ps5", "pc"];

/**
 * 获取当前时间 格式为: yyyy-MM-dd HH:mm:ss
 */
function getNowFormatDate() {
	const date = new Date();
	const year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hours = date.getHours();
	let minutes = date.getMinutes();
	let seconds = date.getSeconds();

	if (month < 10) month = "0" + month;
	if (day < 10) day = "0" + day;
	if (hours < 10) hours = "0" + hours;
	if (minutes < 10) minutes = "0" + minutes;
	if (seconds < 10) seconds = "0" + seconds;

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期月份
 */
function formatDateMonth(dateStr) {
	dateStr = dateStr.trim();

	const yearMonthRegex = /(\d{4})[年](\d{1,2})[月]/;
	const fullDateRegex = /(\d{4})-(\d{2})-(\d{2})/;

	if (yearMonthRegex.test(dateStr)) {
		const match = dateStr.match(yearMonthRegex);
		let year = match[1];
		let month = match[2];

		if (month.length === 1) {
			month = "0" + month;
		}

		return `${year}-${month}`;
	}

	if (fullDateRegex.test(dateStr)) {
		return dateStr;
	}

	return dateStr;
}

/**
 * 获取爬取的页面时间 格式为: yyyyMM
 */
function getNowTime() {
	const date = new Date();
	let month = date.getMonth() + 1;

	if (month < 10) {
		month = "0" + month;
	}

	const currentdate = date.getFullYear() + month;
	return currentdate;
}

/**
 * 爬取单个游戏类型的数据
 */
async function crawlGameType(targetGameType) {
	let browser;
	try {
		console.log(`\n🎮 正在爬取 ${targetGameType.toUpperCase()} 游戏...`);

		const browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"]
		});

		const page = await browser.newPage();
		const nowTime = getNowTime();
		const url = `https://ku.gamersky.com/release/${targetGameType}_${nowTime}/`;

		console.log(`   📄 访问: ${url}`);
		await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });

		const bodyHandle = await page.$("body");
		const html = await page.evaluate(body => body.innerHTML, bodyHandle);

		const $ = cheerio.load(html);
		const games = [];

		$(".Mid")
			.find("div.Mid_L > ul li")
			.each((index, item) => {
				const title = $(item).find(".tit a").text();
				const url = $(item).find(".img a").attr("href");
				const img = $(item).find(".img a img").attr("src");
				let time = $(item).find(".PF_1 div:nth-child(3)").text().split("：")[1] || "";
				const gameType = $(item).find(".PF_1 div:nth-child(4) a").text();
				const production = $(item).find(".PF_1 div:nth-child(5)").text().split("：")[1] || "";
				const introduction = $(item).find(".PF_1 div.Intr > p").text().trim();
				const playerRating = $(item).find(".PF_2 > div > div.PF2-con .wjnum .num").text();
				const playerRatingPeopleNum = $(item).find(".PF_2 > div > div.PF2-txt > div").text();
				const expectedValue = $(item).find(".PF2-con .qdnum .num").text();
				const updateTime = getNowFormatDate();

				time = formatDateMonth(time);

				if (title) {
					games.push({
						title,
						url: url || "",
						img: img || "",
						time,
						gameType,
						production,
						introduction,
						update_time: updateTime,
						playerRating,
						playerRatingPeopleNum,
						expectedValue,
						targetGameType
					});
				}
			});

		await bodyHandle.dispose();
		await browser.close();

		console.log(`   ✅ ${targetGameType.toUpperCase()} 爬取成功: ${games.length} 条`);
		return games;
	} catch (error) {
		if (browser) {
			try {
				await browser.close();
			} catch (e) {}
		}
		console.error(`   ❌ ${targetGameType.toUpperCase()} 爬取失败:`, error.message);
		return [];
	}
}

/**
 * 保存游戏数据到数据库
 */
async function saveGamesToDatabase(games) {
	if (!games || games.length === 0) {
		console.log("⚠️  没有游戏数据需要保存");
		return;
	}

	try {
		let insertCount = 0;
		let updateCount = 0;

		for (const game of games) {
			const checkSql = `
				SELECT id FROM game_info 
				WHERE title = ? AND targetgametype = ?
				LIMIT 1
			`;

			const existing = await db.query(checkSql, [game.title, game.targetGameType]);

			if (existing && existing.length > 0) {
				// 更新现有记录
				const updateSql = `
					UPDATE game_info 
					SET url = ?, img = ?, time = ?, game_type = ?, production = ?, 
					    introduction = ?, update_time = ?, player_rating = ?,
					    player_rating2 = ?, player_num = ?, expected_value = ?
					WHERE id = ?
				`;

				await db.query(updateSql, [
					game.url,
					game.img,
					game.time,
					game.gameType,
					game.production,
					game.introduction,
					game.update_time,
					game.playerRating,
					game.playerRatingPeopleNum,
					game.playerRatingPeopleNum,
					game.expectedValue,
					existing[0].id
				]);

				updateCount++;
			} else {
				// 插入新记录
				const insertSql = `
					INSERT INTO game_info 
					(title, url, img, time, game_type, production, introduction, 
					 update_time, targetgametype, player_rating, player_rating2, player_num, expected_value)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`;

				await db.query(insertSql, [
					game.title,
					game.url,
					game.img,
					game.time,
					game.gameType,
					game.production,
					game.introduction,
					game.update_time,
					game.targetGameType,
					game.playerRating,
					game.playerRatingPeopleNum,
					game.playerRatingPeopleNum,
					game.expectedValue
				]);

				insertCount++;
			}
		}

		console.log(`\n💾 数据保存完成: 新增 ${insertCount} 条, 更新 ${updateCount} 条`);
	} catch (error) {
		console.error("❌ 保存数据库失败:", error.message);
	}
}

/**
 * 记录爬虫任务日志
 */
async function logCrawlerTask(platform, status, totalCount, errorMessage = null, duration = 0) {
	try {
		const sql = `
			INSERT INTO crawler_logs 
			(spider_type, platform, status, total_count, error_message, duration_ms)
			VALUES (?, ?, ?, ?, ?, ?)
		`;

		await db.query(sql, ["game", platform, status, totalCount, errorMessage, duration]);
	} catch (error) {
		console.error("❌ 记录爬虫日志失败:", error.message);
	}
}

/**
 * 主函数 - 执行所有游戏爬虫
 */
async function runGameSpiders() {
	console.log("\n========== 游戏爬虫开始 ==========");
	console.log(`⏰ 开始时间: ${new Date().toLocaleString()}\n`);

	const startTime = Date.now();
	const allGames = [];

	for (const gameType of GAME_TYPES) {
		const platformStartTime = Date.now();
		try {
			const games = await crawlGameType(gameType);
			const duration = Date.now() - platformStartTime;

			allGames.push(...games);
			await logCrawlerTask(gameType, "success", games.length, null, duration);
		} catch (error) {
			const duration = Date.now() - platformStartTime;
			console.error(`❌ ${gameType} 爬虫错误:`, error.message);
			await logCrawlerTask(gameType, "failed", 0, error.message, duration);
		}
	}

	// 保存所有游戏数据
	await saveGamesToDatabase(allGames);

	const totalTime = Date.now() - startTime;
	console.log(`\n========== 爬虫执行完成 ==========`);
	console.log(`⏰ 结束时间: ${new Date().toLocaleString()}`);
	console.log(`⌛ 总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
	console.log(`📊 共爬取: ${allGames.length} 条游戏\n`);

	return allGames;
}

// 如果直接运行此文件
if (require.main === module) {
	runGameSpiders()
		.then(() => {
			console.log("✅ 游戏爬虫任务完成");
			process.exit(0);
		})
		.catch(error => {
			console.error("❌ 游戏爬虫任务失败:", error);
			process.exit(1);
		});
}

module.exports = {
	runGameSpiders,
	fetchGameData: runGameSpiders // 别名，用于 API 调用
};
