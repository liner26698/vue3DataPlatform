const { crawlWeiboTrending } = require('./server/utils/hotTopicsSpider');

(async () => {
  console.log('='.repeat(70));
  console.log('测试微博爬虫（Puppeteer + Cheerio）');
  console.log('='.repeat(70));
  
  try {
    const topics = await crawlWeiboTrending();
    console.log(`\n✅ 爬虫完成！`);
    console.log(`📊 获取数据：${topics.length} 条热搜\n`);
    
    if (topics.length > 0) {
      console.log('前 15 条热搜：');
      topics.forEach(t => {
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
