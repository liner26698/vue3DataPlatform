/**
 * 定时任务调度器 - 独立爬虫服务
 * 使用 node-cron 定时执行爬虫任务
 */

const cron = require('node-cron');
const { runAllSpiders } = require('./hotTopicsSpider');
const { runGameSpiders } = require('./gameSpider');
const { runAiSpider } = require('./aiSpider');

let scheduledTasks = [];

/**
 * 启动定时爬虫任务
 */
function startScheduledTasks() {
	console.log('\n========== 启动定时爬虫任务 ==========\n');

	// 任务配置 - 每天凌晨、中午、傍晚各执行一次
	const taskConfigs = [
		{
			name: '游戏发售表爬虫 - 每天凌晨1点',
			schedule: '0 0 1 * * *',  // 每天 01:00:00
			description: '更新 PS5 / PC 游戏发售表',
			handler: runGameSpiders
		},
		{
			name: 'AI工具爬虫 - 每天凌晨2点',
			schedule: '0 0 2 * * *',  // 每天 02:00:00
			description: '更新 AI 工具库（ai-bot.cn）',
			handler: runAiSpider
		},
		{
			name: '热门话题爬虫 - 每天凌晨',
			schedule: '0 0 0 * * *',  // 每天 00:00:00
			description: '凌晨更新热门话题',
			handler: runAllSpiders
		},
		{
			name: '热门话题爬虫 - 每天中午',
			schedule: '0 0 12 * * *',  // 每天 12:00:00
			description: '中午更新热门话题',
			handler: runAllSpiders
		},
		{
			name: '热门话题爬虫 - 每天傍晚',
			schedule: '0 0 18 * * *',  // 每天 18:00:00
			description: '傍晚更新热门话题',
			handler: runAllSpiders
		}
	];

	// 注册任务
	taskConfigs.forEach(config => {
		try {
			const handler = config.handler || runAllSpiders;
			const task = cron.schedule(config.schedule, async () => {
				console.log(`\n🔔 ${config.name} 触发 - ${config.description}`);
				console.log(`⏰ 执行时间: ${new Date().toLocaleString()}`);
				
				try {
					await handler();
					console.log(`✅ ${config.name} 执行成功\n`);
				} catch (error) {
					console.error(`❌ ${config.name} 执行失败:`, error.message);
				}
			});

			scheduledTasks.push({
				name: config.name,
				task: task,
				schedule: config.schedule
			});

			console.log(`✅ 已注册任务: ${config.name}`);
			console.log(`   执行周期: ${config.schedule}\n`);

		} catch (error) {
			console.error(`❌ 注册任务失败 ${config.name}:`, error.message);
		}
	});

	console.log('========== 定时任务启动完成 ==========\n');
}

/**
 * 手动触发爬虫（用于测试）
 */
async function runNow() {
	console.log('\n========== 手动触发爬虫 ==========\n');
	try {
		await runAllSpiders();
		console.log('✅ 热门话题爬虫执行成功\n');
	} catch (error) {
		console.error('❌ 热门话题爬虫执行失败:', error.message);
	}

	try {
		await runGameSpiders();
		console.log('✅ 游戏爬虫执行成功\n');
	} catch (error) {
		console.error('❌ 游戏爬虫执行失败:', error.message);
	}

	try {
		await runAiSpider();
		console.log('✅ AI工具爬虫执行成功\n');
	} catch (error) {
		console.error('❌ AI工具爬虫执行失败:', error.message);
	}
}

/**
 * 停止所有定时任务
 */
function stopAllTasks() {
	console.log('\n⛔ 停止所有定时任务...');
	scheduledTasks.forEach(({ name, task }) => {
		task.stop();
		console.log(`✅ 已停止: ${name}`);
	});
	scheduledTasks = [];
	console.log('✅ 所有定时任务已停止\n');
}

module.exports = {
	startScheduledTasks,
	runNow,
	stopAllTasks,
	getScheduledTasks: () => scheduledTasks
};
