/**
 * 热门话题爬虫定时任务启动脚本
 * 用途: 独立运行爬虫定时任务
 * 运行: node server/scheduleCrawler.js
 */

const { startScheduledTasks, stopScheduledTasks } = require("./utils/cronScheduler");

console.log("\n========================================");
console.log("🚀 热门话题爬虫定时任务服务启动中...");
console.log("========================================\n");

// 启动所有定时任务
try {
  startScheduledTasks();
  console.log("✅ 定时任务已启动！\n");
  console.log("📅 定时计划:");
  console.log("  - 每天 00:00:00 (凌晨执行一次)");
  console.log("  - 每天 12:00:00 (中午执行一次)");
  console.log("  - 每天 18:00:00 (傍晚执行一次)\n");
  console.log("💾 爬取数据将保存到: hot_topics 表");
  console.log("📝 执行日志将记录到: crawler_logs 表\n");
  console.log("按 Ctrl+C 可停止服务\n");
} catch (error) {
  console.error("❌ 启动定时任务失败:", error);
  process.exit(1);
}

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n\n⛔ 收到关闭信号，正在停止定时任务...");
  stopScheduledTasks();
  console.log("✅ 定时任务已停止");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n⛔ 收到终止信号，正在停止定时任务...");
  stopScheduledTasks();
  console.log("✅ 定时任务已停止");
  process.exit(0);
});
