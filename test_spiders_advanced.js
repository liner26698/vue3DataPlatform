#!/usr/bin/env node
/**
 * 更激进的爬虫测试 - 使用更完整的请求头和多策略
 */

const axios = require('axios');
const cheerio = require('cheerio');

// 添加 File 全局 polyfill
global.File = class {
	constructor(bits, filename, options) {
		this.bits = bits;
		this.filename = filename;
		this.options = options || {};
		this.size = bits.reduce((size, bit) => size + bit.length, 0);
		this.type = this.options.type || '';
	}
};

// 创建带有完整请求头的 axios 实例
function createAxiosInstance() {
	return axios.create({
		timeout: 15000,
		headers: {
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
			'Cache-Control': 'max-age=0',
			'DNT': '1',
			'Sec-Ch-Ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
			'Sec-Ch-Ua-Mobile': '?0',
			'Sec-Ch-Ua-Platform': '"Windows"',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'none',
			'Upgrade-Insecure-Requests': '1',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
		}
	});
}

/**
 * 测试百度 - 改进版
 */
async function testBaiduAdvanced() {
	console.log('\n====== 🔴 测试百度 (改进策略) ======');
	try {
		// 尝试移动版
		const urls = [
			"https://top.baidu.com/board?tab=realtime",
			"https://www.baidu.com/s?wd=百度热搜",
			"https://m.baidu.com/"
		];

		for (const url of urls) {
			try {
				console.log(`   尝试: ${url}`);
				const response = await createAxiosInstance().get(url);
				console.log(`   ✓ HTTP 200, 数据 ${response.data.length} 字节`);

				const $ = cheerio.load(response.data);
				const topics = [];

				// 多个选择器尝试
				const selectors = [
					".horizontal-box a",
					"[class*='hot'] a",
					".item-box a",
					"a[href*='wd=']"
				];

				for (const sel of selectors) {
					$(sel).each((i, el) => {
						if (topics.length >= 3) return;
						const text = $(el).text().trim();
						if (text && text.length > 2 && text.length < 100) {
							topics.push(text);
						}
					});
					if (topics.length > 0) break;
				}

				if (topics.length > 0) {
					console.log(`✅ 百度成功 (${url}): ${topics.length} 条`);
					topics.forEach((t, i) => console.log(`     ${i+1}. ${t}`));
					return true;
				}
			} catch (err) {
				console.log(`   ✗ ${err.message.substring(0, 50)}`);
			}
		}

		console.log(`❌ 百度所有URL都失败`);
		return false;
	} catch (err) {
		console.error(`❌ 百度异常:`, err.message);
		return false;
	}
}

/**
 * 测试知乎 - 改进版
 */
async function testZhihuAdvanced() {
	console.log('\n====== 🔴 测试知乎 (改进策略) ======');
	try {
		// 知乎的热搜可能需要从不同端点
		const urls = [
			{ url: "https://www.zhihu.com/hot", referer: "https://www.zhihu.com/" },
			{ url: "https://api.zhihu.com/moments?action=feed", referer: "https://www.zhihu.com/" }
		];

		for (const {url, referer} of urls) {
			try {
				console.log(`   尝试: ${url}`);
				const response = await axios.create({
					timeout: 10000,
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
						'Referer': referer,
						'X-Requested-With': 'XMLHttpRequest'
					}
				}).get(url);

				console.log(`   ✓ HTTP ${response.status}, 数据 ${response.data.length} 字节`);

				// 如果是 JSON
				if (typeof response.data === 'object') {
					console.log(`   💡 返回 JSON 格式 (API 响应)`);
					return false; // 跳过，这不是 HTML
				}

				const $ = cheerio.load(response.data);
				const topics = [];

				$("h2 a, h3 a, [class*='title'] a").each((i, el) => {
					if (topics.length >= 3) return;
					const text = $(el).text().trim();
					if (text && text.length > 2 && text.length < 200) {
						topics.push(text);
					}
				});

				if (topics.length > 0) {
					console.log(`✅ 知乎成功 (${url}): ${topics.length} 条`);
					topics.forEach((t, i) => console.log(`     ${i+1}. ${t.substring(0, 50)}`));
					return true;
				}
			} catch (err) {
				const status = err.response?.status || err.message;
				console.log(`   ✗ ${status}`);
			}
		}

		console.log(`❌ 知乎所有URL都失败`);
		return false;
	} catch (err) {
		console.error(`❌ 知乎异常:`, err.message);
		return false;
	}
}

/**
 * 测试微博 - 改进版
 */
async function testWeiboAdvanced() {
	console.log('\n====== 🔴 测试微博 (改进策略) ======');
	try {
		const urls = [
			"https://s.weibo.com/top/summary",
			"https://s.weibo.com/weibo?q=%E7%A7%91%E6%8A%95"
		];

		for (const url of urls) {
			try {
				console.log(`   尝试: ${url}`);
				const response = await axios.create({
					timeout: 10000,
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
						'Referer': 'https://s.weibo.com/',
						'Accept': 'text/html,application/xhtml+xml'
					}
				}).get(url);

				console.log(`   ✓ HTTP ${response.status}, 数据 ${response.data.length} 字节`);

				// 检查是否是登录页
				if (response.data.includes('login') || response.data.includes('visitor')) {
					console.log(`   💡 被重定向到登录/访客页面`);
					continue;
				}

				const $ = cheerio.load(response.data);
				const topics = [];

				// 更精准的微博选择器
				$("tr:not(:first-child) td:nth-child(2)").each((i, el) => {
					if (topics.length >= 3) return;
					const text = $(el).text().trim();
					if (text && text.length > 2 && text.length < 100) {
						topics.push(text);
					}
				});

				if (topics.length > 0) {
					console.log(`✅ 微博成功 (${url}): ${topics.length} 条`);
					topics.forEach((t, i) => console.log(`     ${i+1}. ${t}`));
					return true;
				}
			} catch (err) {
				console.log(`   ✗ ${err.message.substring(0, 50)}`);
			}
		}

		console.log(`❌ 微博所有URL都失败`);
		return false;
	} catch (err) {
		console.error(`❌ 微博异常:`, err.message);
		return false;
	}
}

/**
 * 主函数
 */
async function main() {
	console.log('\n🔍 热搜爬虫诊断 (改进策略)\n' + '='.repeat(50));

	const results = {
		baidu: await testBaiduAdvanced(),
		zhihu: await testZhihuAdvanced(),
		weibo: await testWeiboAdvanced()
	};

	console.log('\n' + '='.repeat(50));
	console.log('📊 诊断总结:');
	Object.entries(results).forEach(([platform, success]) => {
		const icon = success ? '✅' : '❌';
		console.log(`   ${icon} ${platform}: ${success ? '可爬取' : '无法爬取'}`);
	});

	console.log('\n💡 分析:');
	const failed = Object.entries(results).filter(([_, s]) => !s).map(([p]) => p);
	if (failed.length > 0) {
		console.log(`   失败的平台需要 Puppeteer (JavaScript 渲染)`);
		console.log(`   或实现代理/Cookie 管理器`);
	}
	console.log('');
}

main().catch(console.error);
