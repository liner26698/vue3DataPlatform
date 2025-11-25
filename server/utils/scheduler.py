#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
定时任务调度器 - APScheduler 版本
支持后台运行爬虫任务
"""

import schedule
import time
import subprocess
import os
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/dataPlatform/logs/scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 爬虫脚本路径
SPIDER_PATH = '/home/dataPlatform/server/utils/hot_topics_spider.py'
LOG_PATH = '/home/dataPlatform/logs'

def ensure_log_dir():
    """确保日志目录存在"""
    os.makedirs(LOG_PATH, exist_ok=True)

def run_spider():
    """运行爬虫任务"""
    logger.info("="*60)
    logger.info("开始执行爬虫任务...")
    logger.info("="*60)
    
    try:
        # 运行Python爬虫脚本
        result = subprocess.run(
            ['python3', SPIDER_PATH],
            capture_output=True,
            text=True,
            timeout=300  # 5分钟超时
        )
        
        if result.returncode == 0:
            logger.info("✅ 爬虫任务执行成功")
            logger.info(result.stdout)
        else:
            logger.error("❌ 爬虫任务执行失败")
            logger.error(result.stderr)
    except subprocess.TimeoutExpired:
        logger.error("❌ 爬虫任务执行超时（>5分钟）")
    except Exception as e:
        logger.error(f"❌ 爬虫任务执行异常: {e}")
    
    logger.info("="*60 + "\n")

def schedule_tasks():
    """安排定时任务"""
    logger.info("初始化定时任务调度器...")
    
    # 每天 00:00、12:00、18:00 执行爬虫
    schedule.every().day.at("00:00").do(run_spider)
    schedule.every().day.at("12:00").do(run_spider)
    schedule.every().day.at("18:00").do(run_spider)
    
    logger.info("✅ 定时任务已安排:")
    logger.info("  - 每天 00:00 执行")
    logger.info("  - 每天 12:00 执行")
    logger.info("  - 每天 18:00 执行\n")

def main():
    """主循环"""
    ensure_log_dir()
    
    logger.info("╔" + "="*58 + "╗")
    logger.info("║  热门话题爬虫定时调度器  " + " "*32 + "║")
    logger.info("╚" + "="*58 + "╝\n")
    
    schedule_tasks()
    
    logger.info("⏰ 调度器启动，等待定时任务...")
    logger.info(f"当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # 每60秒检查一次是否有待执行的任务
    except KeyboardInterrupt:
        logger.info("\n⏹ 调度器已停止")
    except Exception as e:
        logger.error(f"❌ 调度器出错: {e}")

if __name__ == '__main__':
    main()
