const { crawlZhihuTrending } = require('./server/utils/hotTopicsSpider');

(async () => {
  console.log('='.repeat(70));
  console.log('测试知乎爬虫（Puppeteer + Cheerio）');
  console.log('='.repeat(70));
  
  try {
    const topics = await crawlZhihuTrending();
    console.log(`\n✅ 爬虫完成！`);
    console.log(`📊 获取数据：${topics.length} 条热榜\n`);
    
    if (topics.length > 0) {
      console.log('前 10 条热榜：');
      topics.slice(0, 10).forEach(t => {
        console.log(`  ${t.rank}. ${t.title}`);
      });
    } else {
      console.log('❌ 未能获取数据');
    }
  } catch (err) {
    console.error('❌ 错误：', err.message);
  }
  
  process.exit(0);
})();
