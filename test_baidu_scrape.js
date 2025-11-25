/**
 * 测试从百度首页爬取数据
 */
const superagent = require("superagent");
const cheerio = require("cheerio");

async function testBaiduScrape() {
	try {
		console.log("🔍 正在从百度首页爬取数据...\n");
		
		const url = "https://www.baidu.com/";
		
		const response = await superagent
			.get(url)
			.set({
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept-Language": "zh-CN,zh;q=0.9",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Referer": "https://www.baidu.com/"
			})
			.timeout(10000);

		const html = response.text;
		
		// 检查响应体大小
		console.log(`📊 HTML 响应大小: ${html.length} 字符`);
		
		// 查找 hotsearch-item 的出现次数
		const itemCount = (html.match(/hotsearch-item/g) || []).length;
		console.log(`📌 hotsearch-item 出现次数: ${itemCount}\n`);
		
		// 尝试解析
		const $ = cheerio.load(html);
		const items = $("li.hotsearch-item");
		
		console.log(`✅ 通过 cheerio 找到 ${items.length} 个热搜项\n`);
		
		// 提取前5条
		const topics = [];
		items.each((index, element) => {
			if (index >= 5) return;
			
			const $item = $(element);
			const rankText = $item.find("span.title-content-index").text().trim();
			const title = $item.find("span.title-content-title").text().trim();
			const link = $item.find("a.title-content").attr("href");
			const isHot = $item.find("span.title-content-mark").length > 0;
			
			console.log(`【${index + 1}】`);
			console.log(`  排名: ${rankText}`);
			console.log(`  标题: ${title}`);
			console.log(`  链接: ${link}`);
			console.log(`  是否为热: ${isHot}`);
			console.log();
			
			topics.push({ rankText, title, link, isHot });
		});
		
		if (topics.length > 0) {
			console.log("✅ 成功从百度首页提取数据！");
		} else {
			console.log("❌ 没有从百度首页提取到数据");
			console.log("\n--- HTML 摘录（前 1000 字符）---");
			console.log(html.substring(0, 1000));
		}
		
	} catch (error) {
		console.error("❌ 错误:", error.message);
	}
}

testBaiduScrape();
