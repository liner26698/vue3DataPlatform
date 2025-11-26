// 测试完整爬虫流程
const hotTopicsSpider = require('./server/utils/hotTopicsSpider.js');

(async () => {
  console.log('🧪 测试完整爬虫流程（所有 5 个平台）...\n');
  
  try {
    const allTopics = await hotTopicsSpider.runAllSpiders();
    
    console.log('\n✅ 爬虫测试完成！\n');
    console.log(`📊 总计获取: ${allTopics.length} 条热搜`);
    
    // 按平台统计
    const byPlatform = {};
    allTopics.forEach(item => {
      if (!byPlatform[item.platform]) {
        byPlatform[item.platform] = [];
      }
      byPlatform[item.platform].push(item);
    });
    
    console.log('\n📋 各平台统计：');
    for (const [platform, items] of Object.entries(byPlatform)) {
      console.log(`  • ${platform}: ${items.length} 条`);
    }
    
    // 显示各平台的前 2 条
    console.log('\n📝 各平台详情：');
    for (const [platform, items] of Object.entries(byPlatform)) {
      console.log(`\n${platform}:`);
      items.slice(0, 2).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.title}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
