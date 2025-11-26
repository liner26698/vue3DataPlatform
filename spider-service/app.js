#!/usr/bin/env node

/**
 * 独立爬虫微服务 - 启动文件
 * 
 * 功能:
 * - 独立于主应用运行，不阻塞API服务
 * - 定时执行热门话题爬虫任务
 * - 与主数据库共享数据
 * - 自动错误恢复和日志记录
 * 
 * 使用:
 *   npm start              启动爬虫服务
 *   npm run dev            开发模式（热重启）
 * 
 * 环境变量:
 *   DB_HOST     数据库主机 (default: localhost)
 *   DB_USER     数据库用户 (default: root)
 *   DB_PASSWORD 数据库密码 (default: root)
 *   DB_NAME     数据库名称 (default: data_platform)
 *   DB_PORT     数据库端口 (default: 3306)
 *   LOG_LEVEL   日志级别 (default: info)
 * 
 * author: kris
 * date: 2025年11月26日
 */

// 加载环境变量
require('dotenv').config();

const { startScheduledTasks, runNow } = require('./utils/cronScheduler');

console.log('\n' + '='.repeat(50));
console.log('🚀 独立爬虫微服务启动');
console.log('='.repeat(50) + '\n');

// 启动定时任务
console.log('🚀 正在启动热门话题爬虫定时任务...');
try {
	startScheduledTasks();
	console.log('✅ 爬虫定时任务已启动\n');
} catch (error) {
	console.error('⚠️ 爬虫定时任务启动失败:', error.message);
	process.exit(1);
}

// 启动服务后，立即执行一次爬虫任务（用于测试和初始化）
console.log('⏳ 2秒后执行首次爬虫任务...\n');
setTimeout(() => {
	console.log('\n📡 启动时自动运行爬虫任务...');
	runNow().catch(err => {
		console.error('⚠️ 首次爬虫执行出错:', err.message);
		// 不退出，继续运行定时任务
	});
}, 2000);

// 优雅关闭
process.on('SIGINT', () => {
	console.log('\n\n⛔ 收到关闭信号，正在优雅关闭...\n');
	const { stopAllTasks } = require('./utils/cronScheduler');
	stopAllTasks();
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('\n\n⛔ 收到终止信号，正在优雅关闭...\n');
	const { stopAllTasks } = require('./utils/cronScheduler');
	stopAllTasks();
	process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
	console.error('\n❌ 未捕获的异常:', error);
	console.error('爬虫服务将继续运行定时任务...\n');
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('\n❌ 未处理的 Promise 拒绝:', reason);
	console.error('爬虫服务将继续运行定时任务...\n');
});

console.log('✅ 爬虫服务已启动，按 Ctrl+C 停止\n');
