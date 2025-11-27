/**
 * 爬虫配置文件
 * 支持多个数据源和代理配置
 */

module.exports = {
	// 主要爬虫源
	sources: {
		biquge: {
			enabled: true,
			name: "笔趣阁",
			baseUrl: "https://www.biquge.com.cn",
			searchUrl: "/modules/article/search.php?searchkey=",
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
			}
		},
		// 备选源可在这里添加
		// 如: 掌阅、起点中文网等
	},

	// 代理配置 (可选)
	proxy: {
		enabled: process.env.PROXY_ENABLED === "true",
		http: process.env.HTTP_PROXY || null,
		https: process.env.HTTPS_PROXY || null,
		// 使用示例: 
		// HTTP_PROXY=http://10.10.1.10:3128 npm run dev
	},

	// 缓存配置
	cache: {
		enabled: true,
		ttl: 24 * 60 * 60 * 1000, // 24小时
	},

	// 重试配置
	retry: {
		enabled: true,
		maxRetries: 3,
		retryDelay: 1000, // ms
	},

	// 请求间隔 (礼貌爬虫)
	requestDelay: 500, // ms

	// 是否使用本地备份数据作为降级方案
	fallbackToLocal: true,
};
