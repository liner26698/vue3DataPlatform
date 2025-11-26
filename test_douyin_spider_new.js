// 测试改进后的抖音爬虫
const hotTopicsSpider = require('./server/utils/hotTopicsSpider.js');

(async () => {
  console.log('🧪 测试改进的抖音爬虫（Puppeteer 模式）...\n');
  
  try {
    const results = await hotTopicsSpider.crawlDouyinTrending();
    
    console.log('\n✅ 抖音爬虫测试完成！');
    console.log(`📊 获取到 ${results.length} 条热点\n`);
    
    if (results.length > 0) {
      console.log('🎯 前 10 条热点：');
      results.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
      });
    } else {
      console.log('⚠️  暂无数据');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
})();
