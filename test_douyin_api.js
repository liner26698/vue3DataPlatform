// 测试天行数据抖音热搜 API
const axios = require('axios');

async function testDouyinAPI() {
  try {
    console.log('🧪 测试天行数据抖音 API...\n');
    
    // 尝试用演示 key（通常不能用，但值得尝试）
    const apiUrl = 'https://apis.tianapi.com/douyinhot/index';
    const demoKey = 'demo'; // 或者试试空的
    
    console.log(`📍 API 地址: ${apiUrl}`);
    console.log(`🔑 尝试 Key: ${demoKey}\n`);
    
    const response = await axios.get(apiUrl, {
      params: {
        key: demoKey
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('✅ 响应状态码:', response.status);
    console.log('✅ 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.code === 0 && response.data.data) {
      console.log(`\n✨ API 可用！获取到 ${response.data.data.length} 条抖音热搜`);
      response.data.data.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.positionName || item.title || item.name}`);
      });
    } else {
      console.log('\n❌ API 返回错误:', response.data.msg || '未知错误');
    }
    
  } catch (error) {
    console.log('❌ 请求失败:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   数据:', error.response.data);
    } else {
      console.log('   错误信息:', error.message);
    }
    
    console.log('\n💡 建议:');
    console.log('   1. 到 https://www.tianapi.com/ 注册获取免费 API Key');
    console.log('   2. 抖音 API 可能需要付费');
    console.log('   3. 如果无法使用，继续用爬虫方式');
  }
}

testDouyinAPI();
