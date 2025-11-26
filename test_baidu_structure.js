#!/usr/bin/env node
/**
 * 百度热搜爬虫改进版 - 正确提取热搜内容
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testBaiduCorrect() {
	try {
		console.log('测试百度热搜 - 查找正确的 HTML 结构...\n');

		const response = await axios.get("https://top.baidu.com/board?tab=realtime", {
			timeout: 15000,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
			}
		});

		const $ = cheerio.load(response.data);

		// 打印前 1000 个字符，寻找结构
		console.log('HTML 前 1000 字符:');
		console.log(response.data.substring(0, 1000));
		console.log('\n...\n');

		// 尝试多个选择器
		const selectors = {
			'tbody tr': 0,
			'.horizontal-box': 0,
			'[role="article"]': 0,
			'.card': 0,
			'[class*="item"]': 0,
			'a[href*="keyword"]': 0,
			'.list-item': 0,
			'.hot-title': 0
		};

		console.log('选择器匹配结果:');
		for (const [selector, _] of Object.entries(selectors)) {
			const count = $(selector).length;
			console.log(`  ${selector}: ${count} 个`);
		}

		// 尝试获取前5条数据
		console.log('\n尝试提取内容:');
		const topics = [];

		// 方法1: tbody 行
		$('tbody tr').each((i, el) => {
			if (topics.length >= 5) return;
			const cells = $(el).find('td');
			if (cells.length >= 2) {
				const text = $(cells[1]).text().trim();
				if (text && text.length > 2) {
					topics.push(text);
					console.log(`  方法1-${i}: ${text}`);
				}
			}
		});

		// 方法2: 所有 a 标签
		if (topics.length === 0) {
			$('a').each((i, el) => {
				if (topics.length >= 5) return;
				const text = $(el).text().trim();
				if (text && text.length > 2 && text.length < 100 && !text.includes('<')) {
					topics.push(text);
					console.log(`  方法2-${i}: ${text}`);
				}
			});
		}

		console.log(`\n总共获得: ${topics.length} 条数据`);

	} catch (err) {
		console.error('错误:', err.message);
	}
}

testBaiduCorrect();
