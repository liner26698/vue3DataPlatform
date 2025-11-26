// 测试头条爬虫
const hotTopicsSpider = require('./server/utils/hotTopicsSpider.js');

(async () => {
  console.log('🧪 测试头条爬虫...\n');
  
  try {
    const results = await hotTopicsSpider.crawlToutiaoTrending();
    
    console.log(`\n✅ 头条爬虫测试完成！获取 ${results.length} 条\n`);
    
    if (results.length > 0) {
      console.log('前 5 条：');
      results.slice(0, 5).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.title} (rank: ${item.rank})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
})();
