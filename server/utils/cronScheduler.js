/**
 * 定时爬虫任务管理
 * 使用 node-cron 实现定时任务
 * 
 * 安装: npm install node-cron
 * 
 * Cron 表达式说明:
 * 秒  分  时  日  月  周
 * 
 * 示例:
 * - 每隔6小时执行一次（00:00, 06:00, 12:00, 18:00）: '0 0 0/6 * * *'
 * - 每天 00:00 执行: '0 0 0 * * *'
 * - 每30分钟执行一次: '0 0/30 * * * *'
 * 
 * author: kris
 * date: 2025年11月25日
 */

// Node 18 polyfill for undici compatibility
if (typeof global.File === 'undefined') {
	global.File = class File {
		constructor(bits, filename, options) {
			this.bits = bits;
			this.filename = filename;
			this.options = options;
		}
	};
}

const cron = require("node-cron");
const { runAllSpiders } = require("./hotTopicsSpider");

// 任务配置
const TASKS = [
	{
		name: "热门话题爬虫 - 每天凌晨",
		schedule: "0 0 0 * * *", // 每天 00:00:00 执行
		enabled: true
	},
	{
		name: "热门话题爬虫 - 每天中午",
		schedule: "0 0 12 * * *", // 每天 12:00:00 执行
		enabled: true
	},
	{
		name: "热门话题爬虫 - 每天傍晚",
		schedule: "0 0 18 * * *", // 每天 18:00:00 执行
		enabled: true
	}
];

// 存储任务句柄
const scheduledTasks = [];

/**
 * 启动所有定时任务
 */
function startScheduledTasks() {
	console.log("\n========== 启动定时爬虫任务 ==========\n");

	TASKS.forEach(task => {
		if (task.enabled) {
			const scheduledTask = cron.schedule(task.schedule, async () => {
				console.log(`\n⏰ [${new Date().toLocaleString()}] 触发任务: ${task.name}`);
				try {
					await runAllSpiders();
				} catch (error) {
					console.error(`❌ 任务执行失败: ${error.message}`);
				}
			});

			scheduledTasks.push(scheduledTask);
			console.log(`✅ 已注册任务: ${task.name}`);
			console.log(`   执行周期: ${task.schedule}\n`);
		}
	});

	console.log("========== 定时任务启动完成 ==========\n");
}

/**
 * 停止所有定时任务
 */
function stopScheduledTasks() {
	console.log("\n========== 停止定时爬虫任务 ==========\n");

	scheduledTasks.forEach((task, index) => {
		task.stop();
		console.log(`✅ 已停止任务 ${index + 1}`);
	});

	scheduledTasks.length = 0;
	console.log("\n========== 所有任务已停止 ==========\n");
}

/**
 * 手动触发爬虫（测试用）
 */
async function runNow() {
	console.log("\n========== 手动触发爬虫 ==========\n");
	try {
		await runAllSpiders();
		console.log("✅ 手动爬虫执行成功");
	} catch (error) {
		console.error("❌ 手动爬虫执行失败:", error.message);
	}
}

module.exports = {
	startScheduledTasks,
	stopScheduledTasks,
	runNow
};
