#!/usr/bin/env node
/**
 * 独立爬虫测试脚本 - 诊断各平台问题
 */

const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

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

/**
 * 1. 测试百度热搜 ✅
 */
async function testBaidu() {
	console.log('\n====== 🔴 测试百度热搜 ======');
	try {
		const response = await axios.get("https://top.baidu.com/board?tab=realtime", {
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
			}
		});

		const $ = cheerio.load(response.data);
		const topics = [];

		// 百度热搜结构
		$(".horizontal-box a").each((index, element) => {
			if (topics.length >= 5) return;
			const title = $(element).text().trim();
			if (title && title.length > 2 && title.length < 100) {
				topics.push(title);
			}
		});

		if (topics.length > 0) {
			console.log(`✅ 百度成功: 获得 ${topics.length} 条数据`);
			topics.forEach((t, i) => console.log(`   ${i+1}. ${t}`));
		} else {
			console.log(`❌ 百度失败: 未获得数据`);
		}
		return topics.length > 0;
	} catch (err) {
		console.error(`❌ 百度异常:`, err.message);
		return false;
	}
}

/**
 * 2. 测试知乎热榜
 */
async function testZhihu() {
	console.log('\n====== 🔴 测试知乎热榜 ======');
	try {
		const url = "https://www.zhihu.com/hot";
		const response = await axios.get(url, {
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9",
				"Referer": "https://www.zhihu.com/",
				"Cookie": "_zap=123; z_c0=test"
			}
		});

		console.log(`   HTTP 状态: ${response.status}`);
		console.log(`   数据长度: ${response.data.length} 字节`);

		const $ = cheerio.load(response.data);
		const topics = [];
		const selectors = [
			"[role='feed'] [role='article']",
			".Card.CardBase",
			"h2 a, h3 a",
			"div[data-testid='hotItem']"
		];

		for (const selector of selectors) {
			$(selector).each((index, element) => {
				if (topics.length >= 5) return;
				const $item = $(element);
				const titleElem = $item.find("a").first();
				const title = (titleElem.text() || $item.text()).trim();

				if (title && title.length > 2 && title.length < 200) {
					topics.push(title);
				}
			});
			if (topics.length >= 5) break;
		}

		if (topics.length > 0) {
			console.log(`✅ 知乎成功: 获得 ${topics.length} 条数据`);
			topics.forEach((t, i) => console.log(`   ${i+1}. ${t.substring(0, 50)}`));
		} else {
			console.log(`⚠️  知乎未获数据 (可能被反爬或需要JS渲染)`);
			console.log(`   首 200 字符: ${response.data.substring(0, 200)}`);
		}
		return topics.length > 0;
	} catch (err) {
		console.error(`❌ 知乎异常:`, err.message);
		if (err.response) {
			console.error(`   HTTP 状态: ${err.response.status}`);
		}
		return false;
	}
}

/**
 * 3. 测试微博热搜
 */
async function testWeibo() {
	console.log('\n====== 🔴 测试微博热搜 ======');
	try {
		const response = await axios.get("https://s.weibo.com/top/summary", {
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9",
				"Referer": "https://s.weibo.com/",
				"Accept-Encoding": "gzip, deflate"
			}
		});

		console.log(`   HTTP 状态: ${response.status}`);
		console.log(`   数据长度: ${response.data.length} 字节`);

		const $ = cheerio.load(response.data);
		const topics = [];
		const selectors = ["tr:not(:first-child)", "table tr", ".tr-item"];

		for (const selector of selectors) {
			$(selector).each((index, element) => {
				if (topics.length >= 5) return;
				const $item = $(element);
				const $link = $item.find("a[href*='keyword']").first();
				let title = $link.text().trim() || $item.find("td").eq(1).text().trim();

				if (title) {
					title = title.replace(/\s+/g, " ").trim().substring(0, 100);
				}

				if (title && title.length > 2) {
					topics.push(title);
				}
			});
			if (topics.length >= 5) break;
		}

		if (topics.length > 0) {
			console.log(`✅ 微博成功: 获得 ${topics.length} 条数据`);
			topics.forEach((t, i) => console.log(`   ${i+1}. ${t}`));
		} else {
			console.log(`⚠️  微博未获数据 (可能被反爬或页面结构变更)`);
			console.log(`   首 200 字符: ${response.data.substring(0, 200)}`);
		}
		return topics.length > 0;
	} catch (err) {
		console.error(`❌ 微博异常:`, err.message);
		if (err.response) {
			console.error(`   HTTP 状态: ${err.response.status}`);
		}
		return false;
	}
}

/**
 * 4. 测试B站热门
 */
async function testBilibili() {
	console.log('\n====== 🔴 测试B站热门 ======');
	try {
		const response = await axios.get("https://www.bilibili.com/", {
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
				"Referer": "https://www.bilibili.com/"
			}
		});

		console.log(`   HTTP 状态: ${response.status}`);
		console.log(`   数据长度: ${response.data.length} 字节`);

		const $ = cheerio.load(response.data);
		const topics = [];
		const selectors = ["h3 a", ".title", "[class*='title'] a", "a[title]"];

		for (const selector of selectors) {
			$(selector).each((index, element) => {
				if (topics.length >= 5) return;
				const title = ($(element).text() || $(element).attr("title") || "").trim();

				if (title && title.length > 2 && title.length < 120) {
					topics.push(title.substring(0, 100));
				}
			});
			if (topics.length >= 5) break;
		}

		if (topics.length > 0) {
			console.log(`✅ B站成功: 获得 ${topics.length} 条数据`);
			topics.forEach((t, i) => console.log(`   ${i+1}. ${t}`));
		} else {
			console.log(`⚠️  B站未获数据`);
		}
		return topics.length > 0;
	} catch (err) {
		console.error(`❌ B站异常:`, err.message);
		return false;
	}
}

/**
 * 5. 测试抖音热点
 */
async function testDouyin() {
	console.log('\n====== 🔴 测试抖音热点 ======');
	try {
		const response = await axios.get("https://www.douyin.com/", {
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9",
				"Referer": "https://www.douyin.com/"
			}
		});

		console.log(`   HTTP 状态: ${response.status}`);
		console.log(`   数据长度: ${response.data.length} 字节`);

		// 检查是否包含真实内容
		if (response.data.includes('<noscript>') || response.data.length < 5000) {
			console.log(`⚠️  抖音返回最小化HTML (需要JavaScript渲染)`);
			console.log(`   数据特征: 包含 <noscript> 标签或数据极少`);
			return false;
		}

		const $ = cheerio.load(response.data);
		const topics = [];
		const selectors = [
			"[class*='hot'] a",
			"[class*='trending'] a",
			"h2 a, h3 a",
			"a[title]"
		];

		for (const selector of selectors) {
			$(selector).each((index, element) => {
				if (topics.length >= 5) return;
				const title = ($(element).text() || $(element).attr("title") || "").trim();

				if (title && title.length > 2 && title.length < 200) {
					topics.push(title.substring(0, 100));
				}
			});
			if (topics.length >= 5) break;
		}

		if (topics.length > 0) {
			console.log(`✅ 抖音成功: 获得 ${topics.length} 条数据`);
			topics.forEach((t, i) => console.log(`   ${i+1}. ${t}`));
		} else {
			console.log(`⚠️  抖音未获数据 (HTML 获取但无有效内容)`);
		}
		return topics.length > 0;
	} catch (err) {
		console.error(`❌ 抖音异常:`, err.message);
		return false;
	}
}

/**
 * 主函数
 */
async function main() {
	console.log('\n🔍 热搜爬虫诊断工具\n' + '='.repeat(50));

	const results = {
		baidu: await testBaidu(),
		zhihu: await testZhihu(),
		weibo: await testWeibo(),
		bilibili: await testBilibili(),
		douyin: await testDouyin()
	};

	console.log('\n' + '='.repeat(50));
	console.log('📊 诊断总结:');
	Object.entries(results).forEach(([platform, success]) => {
		const icon = success ? '✅' : '❌';
		console.log(`   ${icon} ${platform}: ${success ? '可爬取' : '无法爬取'}`);
	});

	const successCount = Object.values(results).filter(v => v).length;
	console.log(`\n总体: ${successCount}/5 平台可爬取`);
	console.log('');
	process.exit(successCount === 5 ? 0 : 1);
}

main().catch(console.error);
