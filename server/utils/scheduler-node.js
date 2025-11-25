#!/usr/bin/env node
/**
 * 简单的爬虫定时调度器 - Node.js 版本
 * 使用 node-cron 定时执行爬虫任务
 * 
 * 安装: npm install node-cron
 * 运行: node scheduler-node.js
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 爬虫脚本路径
const SPIDER_PATH = path.join(__dirname, 'utils/hotTopicsSpider.js');
const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'spider-scheduler.log');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message) {
    const timestamp = new Date().toLocaleString('zh-CN');
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function runSpider() {
    log('═══════════════════════════════════════════════════════════');
    log('开始执行爬虫任务...');
    log('═══════════════════════════════════════════════════════════');
    
    // 运行爬虫
    exec(`node ${SPIDER_PATH}`, (error, stdout, stderr) => {
        if (error) {
            log(`❌ 爬虫执行失败: ${error.message}`);
            if (stderr) log(`错误输出: ${stderr}`);
        } else {
            log(`✅ 爬虫执行成功`);
            if (stdout) {
                // 只记录关键信息
                const lines = stdout.split('\n');
                lines.forEach(line => {
                    if (line.includes('✅') || line.includes('❌') || line.includes('💾') || line.includes('⏰')) {
                        log(`  ${line}`);
                    }
                });
            }
        }
        log('═══════════════════════════════════════════════════════════\n');
    });
}

// 启动调度器
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        热门话题爬虫定时调度器 (Node.js版本)               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

log('初始化定时任务调度器...');

// 每天 00:00、12:00、18:00 执行爬虫
cron.schedule('0 0 0 * * *', () => {
    log('⏰ 触发定时任务: 凌晨 00:00');
    runSpider();
});

cron.schedule('0 0 12 * * *', () => {
    log('⏰ 触发定时任务: 中午 12:00');
    runSpider();
});

cron.schedule('0 0 18 * * *', () => {
    log('⏰ 触发定时任务: 傍晚 18:00');
    runSpider();
});

log('✅ 定时任务已安排:');
log('  - 每天 00:00 执行');
log('  - 每天 12:00 执行');
log('  - 每天 18:00 执行\n');

log(`⏰ 调度器启动，等待定时任务...`);
log(`📝 日志文件: ${LOG_FILE}\n`);

// 优雅关闭
process.on('SIGTERM', () => {
    log('⏹ 调度器收到SIGTERM信号，准备关闭...');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('⏹ 调度器被中断，准备关闭...');
    process.exit(0);
});
