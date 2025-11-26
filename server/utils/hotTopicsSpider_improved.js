/**
 * 改进的热搜爬虫 - 真实爬取，失败返回空
 * 支持: 百度、知乎、微博、B站、抖音
 */

const axios = require('axios');
const cheerio = require('cheerio');

// File polyfill
if (!global.File) {
	global.File = class {
		constructor(bits, filename, options) {
			this.bits = bits;
			this.filename = filename;
			this.options = options || {};
		}
	};
}

/**
 * 通用请求配置
 */
const httpClient = axios.create({
	timeout: 12000,
	validateStatus: () => true // 不抛出 4xx/5xx
});

/**
 * 1. 百度热搜 - 改进版
 */
async function crawlBaiduTrending() {
	console.log('🔍 爬取百度热搜...');
	try {
		// 先试百度热搜板块 API
		const response = await httpClient.get('https://top.baidu.com/board?tab=realtime', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Referer': 'https://www.baidu.com/'
			}
		});

		if (response.status !== 200) {
			console.log(`   ✗ HTTP ${response.status}`);
			return [];
		}

		const $ = cheerio.load(response.data);
		const topics = [];

		// 方法1: 从 thead + tbody 提取
		$('tbody tr').each((idx, el) => {
			if (topics.length >= 15) return;
			const cells = $(el).find('td');
			if (cells.length >= 2) {
				const rank = $(cells[0]).text().trim();
				const title = $(cells[1]).text().trim();
				const heat = $(cells[2]).text().trim();

				if (title && title.length > 2) {
					topics.push({
						platform: 'baidu',
						rank: parseInt(rank) || topics.length + 1,
						title,
						category: '热搜',
						heat: parseInt(heat) || (100 - topics.length) * 100000,
						trend: 'stable',
						tags: ['百度', '热搜'],
						url: `https://www.baidu.com/s?wd=${encodeURIComponent(title)}`,
						description: title,
						is_active: 1
					});
				}
			}
		});

		if (topics.length > 0) {
			console.log(`   ✓ 成功: ${topics.length} 条`);
			return topics;
		}

		console.log('   ✗ 未提取到数据');
		return [];

	} catch (err) {
		console.error(`   ✗ 异常: ${err.message.substring(0, 50)}`);
		return [];
	}
}

/**
 * 2. 知乎热榜
 */
async function crawlZhihuTrending() {
	console.log('🔍 爬取知乎热榜...');
	try {
		// 知乎已启用 403 防爬虫，即使使用完整头也会被拦截
		// 需要 Puppeteer 或 Selenium 来绕过
		const response = await httpClient.get('https://www.zhihu.com/hot', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Accept-Language': 'zh-CN,zh;q=0.9',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Referer': 'https://www.zhihu.com/',
				'Cookie': 'z_c0=test'
			}
		});

		if (response.status === 403) {
			console.log(`   ✗ 被拒绝 (403 Forbidden)`);
			console.log(`   💡 知乎已启用反爬虫，需要 Puppeteer 或代理`);
			return [];
		}

		if (response.status !== 200) {
			console.log(`   ✗ HTTP ${response.status}`);
			return [];
		}

		// 如果返回了 HTML，尝试解析
		const topics = [];
		const $ = cheerio.load(response.data);

		$('h2 a, h3 a, [class*="title"] a').each((idx, el) => {
			if (topics.length >= 15) return;
			const text = $(el).text().trim();
			if (text && text.length > 2 && text.length < 200) {
				topics.push({
					platform: 'zhihu',
					rank: topics.length + 1,
					title: text,
					category: '热榜',
					heat: (100 - topics.length) * 50000,
					trend: 'stable',
					tags: ['知乎', '热榜'],
					url: 'https://www.zhihu.com/hot',
					description: text,
					is_active: 1
				});
			}
		});

		if (topics.length > 0) {
			console.log(`   ✓ 成功: ${topics.length} 条`);
			return topics;
		}

		console.log('   ✗ 未提取到数据');
		return [];

	} catch (err) {
		console.error(`   ✗ 异常: ${err.message.substring(0, 50)}`);
		return [];
	}
}

/**
 * 3. 微博热搜 - 需要 Cookie 和模拟登录
 */
async function crawlWeiboTrending() {
	console.log('🔍 爬取微博热搜...');
	try {
		const response = await httpClient.get('https://s.weibo.com/top/summary', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Referer': 'https://s.weibo.com/',
				'Accept': 'text/html,application/xhtml+xml'
			}
		});

		if (response.status !== 200) {
			console.log(`   ✗ HTTP ${response.status}`);
			return [];
		}

		// 检查是否被重定向到登录页
		if (response.data.includes('login') || response.data.includes('visitor')) {
			console.log(`   ✗ 被重定向到登录/访客页面`);
			console.log(`   💡 微博需要登录态或 Cookie，需要 Puppeteer`);
			return [];
		}

		const topics = [];
		const $ = cheerio.load(response.data);

		$('tr:not(:first-child) td:nth-child(2)').each((idx, el) => {
			if (topics.length >= 15) return;
			const text = $(el).text().trim();
			if (text && text.length > 2 && text.length < 100) {
				topics.push({
					platform: 'weibo',
					rank: topics.length + 1,
					title: text,
					category: '热搜',
					heat: (100 - topics.length) * 100000,
					trend: 'up',
					tags: ['微博', '热搜'],
					url: `https://s.weibo.com/weibo?q=${encodeURIComponent(text)}`,
					description: text,
					is_active: 1
				});
			}
		});

		if (topics.length > 0) {
			console.log(`   ✓ 成功: ${topics.length} 条`);
			return topics;
		}

		console.log('   ✗ 未提取到数据');
		return [];

	} catch (err) {
		console.error(`   ✗ 异常: ${err.message.substring(0, 50)}`);
		return [];
	}
}

/**
 * 4. B站热门 - 返回首页视频
 */
async function crawlBilibiliTrending() {
	console.log('🔍 爬取B站热门...');
	try {
		const response = await httpClient.get('https://www.bilibili.com/', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Accept-Language': 'zh-CN,zh;q=0.9',
				'Referer': 'https://www.bilibili.com/'
			}
		});

		if (response.status !== 200) {
			console.log(`   ✗ HTTP ${response.status}`);
			return [];
		}

		const topics = [];
		const $ = cheerio.load(response.data);

		$('h3 a, [class*="title"] a, a[title]').each((idx, el) => {
			if (topics.length >= 15) return;
			const text = ($(el).text() || $(el).attr('title') || '').trim();
			if (text && text.length > 2 && text.length < 120) {
				topics.push({
					platform: 'bilibili',
					rank: topics.length + 1,
					title: text.substring(0, 100),
					category: '热门',
					heat: (100 - topics.length) * 75000,
					trend: 'stable',
					tags: ['B站', '视频'],
					url: $(el).attr('href') ? ($(el).attr('href').startsWith('http') ? $(el).attr('href') : 'https://www.bilibili.com' + $(el).attr('href')) : 'https://www.bilibili.com',
					description: text.substring(0, 100),
					is_active: 1
				});
			}
		});

		if (topics.length > 0) {
			console.log(`   ✓ 成功: ${topics.length} 条`);
			return topics;
		}

		console.log('   ✗ 未提取到数据');
		return [];

	} catch (err) {
		console.error(`   ✗ 异常: ${err.message.substring(0, 50)}`);
		return [];
	}
}

/**
 * 5. 抖音热点
 */
async function crawlDouyinTrending() {
	console.log('🔍 爬取抖音热点...');
	try {
		const response = await httpClient.get('https://www.douyin.com/', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
				'Accept-Language': 'zh-CN,zh;q=0.9',
				'Referer': 'https://www.douyin.com/'
			}
		});

		if (response.status !== 200) {
			console.log(`   ✗ HTTP ${response.status}`);
			return [];
		}

		// 抖音大量使用 JavaScript，静态爬虫几乎无法获取内容
		// 返回的 HTML 通常只包含 <noscript> 提示
		if (response.data.includes('<noscript>') && response.data.length < 10000) {
			console.log(`   ✗ 返回 JavaScript 渲染页面（无静态内容）`);
			console.log(`   💡 抖音需要 Puppeteer/Selenium 来执行 JavaScript`);
			return [];
		}

		const topics = [];
		const $ = cheerio.load(response.data);

		$('[class*="hot"] a, [class*="trending"] a, h2 a').each((idx, el) => {
			if (topics.length >= 15) return;
			const text = ($(el).text() || $(el).attr('title') || '').trim();
			if (text && text.length > 2 && text.length < 200) {
				topics.push({
					platform: 'douyin',
					rank: topics.length + 1,
					title: text.substring(0, 100),
					category: '热点',
					heat: (100 - topics.length) * 80000,
					trend: 'stable',
					tags: ['抖音', '热点'],
					url: $(el).attr('href') ? 'https://www.douyin.com' + $(el).attr('href') : 'https://www.douyin.com',
					description: text.substring(0, 100),
					is_active: 1
				});
			}
		});

		if (topics.length > 0) {
			console.log(`   ✓ 成功: ${topics.length} 条`);
			return topics;
		}

		console.log('   ✗ 未提取到数据');
		return [];

	} catch (err) {
		console.error(`   ✗ 异常: ${err.message.substring(0, 50)}`);
		return [];
	}
}

/**
 * 执行所有爬虫
 */
async function crawlAll() {
	console.log('\n' + '='.repeat(60));
	console.log('🌍 热搜爬虫 - 开始执行');
	console.log('='.repeat(60) + '\n');

	const results = [];

	results.push(...await crawlBaiduTrending());
	results.push(...await crawlZhihuTrending());
	results.push(...await crawlWeiboTrending());
	results.push(...await crawlBilibiliTrending());
	results.push(...await crawlDouyinTrending());

	console.log('\n' + '='.repeat(60));
	console.log(`📊 总计: ${results.length} 条真实热搜数据`);
	console.log('='.repeat(60) + '\n');

	return results;
}

// 导出函数
module.exports = {
	crawlBaiduTrending,
	crawlZhihuTrending,
	crawlWeiboTrending,
	crawlBilibiliTrending,
	crawlDouyinTrending,
	crawlAll
};

// 直接运行测试
if (require.main === module) {
	crawlAll()
		.then(results => {
			console.log('结果样本:');
			results.slice(0, 5).forEach((item, i) => {
				console.log(`${i+1}. [${item.platform}] ${item.title}`);
			});
		})
		.catch(console.error);
}
