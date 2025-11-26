<template>
	<div class="crawler-stats-container">
		<!-- 顶部刷新按钮 -->
		<div class="header-actions">
			<el-button type="primary" @click="refreshAllData" :loading="isRefreshing">
				<i class="el-icon-refresh"></i> 刷新所有数据
			</el-button>
			<el-statistic title="最后更新时间">
				<template #default>
					{{ formatTime(lastUpdateTime) }}
				</template>
			</el-statistic>
		</div>

		<!-- 顶部统计卡片 -->
		<div class="stats-header">
			<el-row :gutter="20">
				<el-col :xs="24" :sm="12" :md="6" v-for="stat in totalStats" :key="stat.id">
					<stat-card
						:icon="stat.icon"
						:label="stat.label"
						:value="stat.value"
						:trend="stat.trend"
						:color="stat.color"
						:clickable="stat.id === 'spiderCount'"
						:is-active-spiders="stat.id === 'spiderCount'"
						@click="handleActiveSpidersClick"
					/>
				</el-col>
			</el-row>
		</div>

		<!-- 图表区域 -->
		<el-row :gutter="20" class="charts-section">
			<!-- 爬虫类型分布 -->
			<el-col :xs="24" :lg="12">
				<el-card class="chart-card">
					<template #header>
						<div class="card-header">
							<span class="title">📊 爬虫类型分布</span>
							<span class="subtitle">(各类型数据占比)</span>
						</div>
					</template>
					<div ref="spiderTypePieRef" class="chart-container"></div>
				</el-card>
			</el-col>

			<!-- 数据趋势 -->
			<el-col :xs="24" :lg="12">
				<el-card class="chart-card">
					<template #header>
						<div class="card-header">
							<span class="title">📈 近期爬取趋势</span>
							<span class="subtitle">(最近7天)</span>
						</div>
					</template>
					<div ref="trendLineRef" class="chart-container"></div>
				</el-card>
			</el-col>
		</el-row>

		<!-- 爬虫详情表格 -->
		<el-row :gutter="20" class="table-section">
			<el-col :span="24">
				<el-card class="chart-card">
					<template #header>
						<div class="card-header">
							<span class="title">🔍 爬虫详细统计</span>
						</div>
					</template>
					<el-table
						:data="crawlerDetails"
						stripe
						v-loading="tableLoading"
						class="crawler-table"
						:default-sort="{ prop: 'spiderName', order: 'ascending' }"
					>
						<el-table-column prop="spiderName" label="爬虫名称" min-width="140">
							<template #default="{ row }">
								<span class="spider-name" :style="{ color: row.color }">{{ row.icon }} {{ row.spiderName }}</span>
							</template>
						</el-table-column>
						<el-table-column prop="platformName" label="数据源" min-width="160">
							<template #default="{ row }">
								<span>{{ row.platformName }}</span>
							</template>
						</el-table-column>
						<el-table-column prop="tableName" label="存储表" min-width="140">
							<template #default="{ row }">
								<el-tag type="info" effect="light">📦 {{ row.tableName || "未配置" }}</el-tag>
							</template>
						</el-table-column>
						<el-table-column prop="scheduleTime" label="定时配置" min-width="200">
							<template #default="{ row }">
								<div class="schedule-info">
									<div class="time"><span style="font-weight: bold">⏰</span> {{ row.scheduleTime || "未配置" }}</div>
									<div class="frequency" style="font-size: 11px; color: #909399">{{ row.scheduleFrequency || "-" }}</div>
								</div>
							</template>
						</el-table-column>
						<el-table-column prop="totalCount" label="数据量" min-width="120">
							<template #default="{ row }">
								<div class="count-number">{{ formatNumber(row.totalCount) }}</div>
							</template>
						</el-table-column>
						<el-table-column prop="lastUpdateTime" label="最后更新" min-width="180">
							<template #default="{ row }">
								<span class="time">{{ formatTime(row.lastUpdateTime) }}</span>
							</template>
						</el-table-column>
						<el-table-column prop="successRate" label="成功率" min-width="130">
							<template #default="{ row }">
								<el-progress :percentage="row.successRate" color="#409EFF" :format="(p: number) => p + '%'" />
							</template>
						</el-table-column>
						<el-table-column label="操作" min-width="120" fixed="right">
							<template #default="{ row }">
								<el-button link type="primary" size="small" @click="viewSourceCode(row)">
									<i class="el-icon-document"></i> 查看代码
								</el-button>
							</template>
						</el-table-column>
					</el-table>
				</el-card>
			</el-col>
		</el-row>

		<!-- 活跃爬虫弹窗 -->
		<spiders-modal
			v-model="showSpidersModal"
			:spiders="
				crawlerDetails.map(item => ({
					...item,
					icon: item.icon,
					color: item.color
				}))
			"
			@close="handleSpidersModalClose"
		/>

		<!-- 源代码弹窗 -->
		<el-dialog
			v-model="showCodeDialog"
			:title="`${selectedSpider?.spiderName} - 爬虫配置与源代码`"
			width="85%"
			class="code-dialog"
		>
			<div class="code-container">
				<div class="code-header">
					<div class="code-file-info">
						<span class="label">📄 文件:</span>
						<span class="file">{{ selectedSpider?.sourceCode }}</span>
						<span style="margin-left: 30px; color: #999">
							<span class="label">📊 存储表:</span>
							<el-tag type="info">{{ selectedSpider?.tableName }}</el-tag>
						</span>
						<span style="margin-left: 20px; color: #999">
							<span class="label">⏰ 定时运行:</span>
							<el-tag type="success">{{ selectedSpider?.scheduleTime }}</el-tag>
						</span>
					</div>
					<el-button link type="primary" @click="copyCode" style="font-size: 12px">
						<i class="el-icon-document-copy"></i> 复制代码
					</el-button>
				</div>
				<pre class="code-content"><code>{{ sourceCodeContent }}</code></pre>
			</div>
		</el-dialog>

		<!-- 子路由展示区域 -->
		<el-row v-if="$slots.default" class="children-section">
			<el-col :span="24">
				<slot></slot>
			</el-col>
		</el-row>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";
import StatCard from "./components/StatCard.vue";
import SpidersModal from "./components/SpidersModal.vue";
import { ElMessage } from "element-plus";

// 数据类型定义
interface CrawlerStat {
	id: string;
	icon: string;
	label: string;
	value: number;
	trend: number;
	color: string;
}

interface CrawlerDetail {
	spiderName: string;
	platformName: string;
	icon: string;
	totalCount: number;
	lastUpdateTime: string | Date;
	successRate: number;
	status: string;
	sourceCode: string;
	description: string;
	color: string;
	tableName?: string;
	scheduleTime?: string;
	scheduleFrequency?: string;
}

// 数据引用
const totalStats = ref<CrawlerStat[]>([]);
const crawlerDetails = ref<CrawlerDetail[]>([]);
const tableLoading = ref(false);
const isRefreshing = ref(false);
const lastUpdateTime = ref(new Date());
const showSpidersModal = ref(false);
const showCodeDialog = ref(false);
const selectedSpider = ref<CrawlerDetail | null>(null);
const sourceCodeContent = ref("");

// ECharts 实例
let spiderTypePieChart: ECharts | null = null;
let trendLineChart: ECharts | null = null;
const spiderTypePieRef = ref<HTMLDivElement>();
const trendLineRef = ref<HTMLDivElement>();

// 格式化时间
const formatTime = (time: string | number | Date) => {
	if (!time) return "未知";
	const date = new Date(time);
	return date.toLocaleString("zh-CN");
};

// 格式化数字
const formatNumber = (num: number) => {
	if (num >= 10000) {
		return (num / 10000).toFixed(2) + "万";
	}
	return num.toString();
};

// 初始化 ECharts - 爬虫类型分布饼图
const initSpiderTypePie = () => {
	if (!spiderTypePieRef.value) return;

	const chartDom = spiderTypePieRef.value;
	spiderTypePieChart = echarts.init(chartDom, null, { locale: "ZH" });

	const pieData = crawlerDetails.value.map(detail => ({
		name: detail.spiderName,
		value: detail.totalCount,
		itemStyle: { color: detail.color }
	}));

	const option: EChartsOption = {
		tooltip: {
			trigger: "item",
			formatter: "{b}: {c} ({d}%)"
		},
		legend: {
			orient: "vertical",
			left: "left",
			top: "center"
		},
		series: [
			{
				name: "爬虫数据",
				type: "pie",
				radius: ["40%", "70%"],
				avoidLabelOverlap: false,
				itemStyle: {
					borderRadius: 10,
					borderColor: "#fff",
					borderWidth: 2
				},
				label: {
					show: false
				},
				emphasis: {
					label: {
						show: true,
						fontSize: 16,
						fontWeight: "bold"
					},
					itemStyle: {
						shadowBlur: 10,
						shadowOffsetX: 0,
						shadowColor: "rgba(0, 0, 0, 0.5)"
					}
				},
				labelLine: {
					show: false
				},
				data: pieData
			}
		],
		animation: true,
		animationDuration: 1000,
		animationEasing: "cubicOut"
	};

	spiderTypePieChart.setOption(option);
};

// 初始化 ECharts - 数据趋势折线图（按爬虫类型分类）
const initTrendLine = (trendData: any[]) => {
	if (!trendLineRef.value) return;

	const chartDom = trendLineRef.value;
	trendLineChart = echarts.init(chartDom, null, { locale: "ZH" });

	const dates = trendData.map(item => item.date);

	// 收集所有爬虫类型
	const spiderTypes = new Set<string>();
	trendData.forEach(item => {
		Object.keys(item.spiders || {}).forEach(type => {
			spiderTypes.add(type);
		});
	});

	// 定义爬虫类型的颜色
	const spiderColors: Record<string, string> = {
		hot_topics: "#667eea",
		ai_tools: "#4ECDC4",
		ai_info: "#4ECDC4",
		ps5_game: "#FF6B6B",
		pc_game: "#FF8C42",
		xbox_game: "#FFD93D",
		switch_game: "#95E1D3",
		game: "#FF6B6B",
		novel: "#C39BD3",
		book: "#D7BDE2"
	};

	// 生成图例数据和数据系列
	const legendData: string[] = [];
	const seriesData: any[] = [];

	const spiderTypeArray = Array.from(spiderTypes).sort();

	spiderTypeArray.forEach((spiderType, index) => {
		const displayName = spiderType; // 使用原始名称
		legendData.push(displayName);

		const data = trendData.map(item => {
			const spiderData = item.spiders[spiderType];
			return spiderData ? spiderData.dataCount : 0;
		});

		const color = spiderColors[spiderType] || `hsl(${(index * 360) / spiderTypeArray.length}, 70%, 50%)`;

		seriesData.push({
			name: displayName,
			type: "line",
			data: data,
			smooth: true,
			itemStyle: { color: color },
			areaStyle: {
				color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: color + "40" },
					{ offset: 1, color: color + "00" }
				])
			},
			symbolSize: 6,
			lineStyle: {
				width: 2
			}
		});
	});

	const option: EChartsOption = {
		tooltip: {
			trigger: "axis",
			axisPointer: {
				type: "cross",
				label: {
					backgroundColor: "#6a7985"
				}
			},
			formatter: (params: any) => {
				let result = params[0]?.axisValue + "<br/>";
				params.forEach((param: any) => {
					if (param.value !== undefined && param.value !== null) {
						result += `<span style="color:${param.color}">●</span> ${param.seriesName}: ${param.value}<br/>`;
					}
				});
				return result;
			}
		},
		legend: {
			data: legendData,
			top: "5%"
		},
		grid: {
			left: "3%",
			right: "4%",
			bottom: "3%",
			top: "15%",
			containLabel: true
		},
		xAxis: {
			type: "category",
			data: dates,
			boundaryGap: false
		},
		yAxis: {
			type: "value",
			name: "数据量"
		},
		series: seriesData,
		animation: true,
		animationDuration: 1000
	};

	trendLineChart.setOption(option);
};

// 获取爬虫统计数据 - 调用真实API
const fetchCrawlerStats = async () => {
	tableLoading.value = true;
	try {
		// 调用后端 API
		const response = await fetch("/statistics/getCrawlerStats", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}
		});

		if (!response.ok) {
			throw new Error("API 请求失败");
		}

		const result = await response.json();

		if (result.code === 0 || result.success) {
			const data = result.data;
			const crawlers = data.crawlers || [];
			const trendData = data.trendData || [];

			// 映射爬虫数据 - 从API动态获取所有配置信息
			const mappedCrawlers: CrawlerDetail[] = crawlers.map((crawler: any) => ({
				spiderName: crawler.spiderName,
				platformName: crawler.platformName,
				icon: getSpiderIcon(crawler.spiderName),
				totalCount: crawler.totalCount,
				lastUpdateTime: crawler.lastUpdateTime,
				successRate: crawler.successRate,
				status: "active",
				sourceCode: crawler.sourceCode,
				description: crawler.description,
				color: getSpiderColor(crawler.spiderName),
				tableName: crawler.tableName,
				scheduleTime: crawler.scheduleTime,
				scheduleFrequency: crawler.scheduleFrequency
			}));

			crawlerDetails.value = mappedCrawlers;

			// 计算总统计
			const totalCount = crawlers.reduce((sum: number, item: any) => sum + item.totalCount, 0);
			const avgSuccessRate = Math.round(crawlers.reduce((sum: number, item: any) => sum + item.successRate, 0) / crawlers.length);

			totalStats.value = [
				{
					id: "totalData",
					icon: "📦",
					label: "总爬取数据量",
					value: totalCount,
					trend: 12,
					color: "#409EFF"
				},
				{
					id: "successRate",
					icon: "✅",
					label: "平均成功率",
					value: avgSuccessRate,
					trend: 5,
					color: "#67C23A"
				},
				{
					id: "spiderCount",
					icon: "🕷️",
					label: "活跃爬虫数",
					value: crawlers.length,
					trend: 0,
					color: "#E6A23C"
				},
				{
					id: "updateFreq",
					icon: "⏱️",
					label: "每日更新频率",
					value: 3,
					trend: 2,
					color: "#F56C6C"
				}
			];

			lastUpdateTime.value = new Date();

			// 初始化图表
			setTimeout(() => {
				initSpiderTypePie();
				initTrendLine(trendData);
			}, 100);
		} else {
			ElMessage.error("获取数据失败: " + (result.msg || "未知错误"));
		}
	} catch (error) {
		console.error("获取爬虫统计数据失败:", error);
		ElMessage.error("获取爬虫统计数据失败，请检查网络连接");
	} finally {
		tableLoading.value = false;
	}
};

// 获取爬虫图标
const getSpiderIcon = (spiderName: string): string => {
	const iconMap: Record<string, string> = {
		游戏爬虫: "🎮",
		热门话题: "🔥",
		AI工具库: "🤖",
		小说爬虫: "📚"
	};
	return iconMap[spiderName] || "🕷️";
};

// 获取爬虫颜色
const getSpiderColor = (spiderName: string): string => {
	const colorMap: Record<string, string> = {
		游戏爬虫: "#FF6B6B",
		热门话题: "#FF8C42",
		AI工具库: "#4ECDC4",
		小说爬虫: "#95E1D3"
	};
	return colorMap[spiderName] || "#409EFF";
};

// 刷新所有数据
const refreshAllData = async () => {
	isRefreshing.value = true;
	try {
		await fetchCrawlerStats();
		ElMessage.success("数据刷新成功");
	} catch (error) {
		ElMessage.error("刷新失败，请重试");
	} finally {
		isRefreshing.value = false;
	}
};

// 处理活跃爬虫卡片点击
const handleActiveSpidersClick = () => {
	showSpidersModal.value = true;
};

// 处理活跃爬虫弹窗关闭
const handleSpidersModalClose = () => {
	showSpidersModal.value = false;
};

// 查看源代码
const viewSourceCode = (row: CrawlerDetail) => {
	selectedSpider.value = row;

	// 生成真实的代码展示，显示表名、定时时间等信息
	const codeTemplate = `/**
 * ${row.spiderName} 爬虫配置信息
 * 
 * 📊 数据存储信息:
 *   - 存储表名: ${row.tableName || "未配置"}
 *   - 当前数据量: ${row.totalCount} 条记录
 *   - 最后更新时间: ${formatTime(row.lastUpdateTime)}
 * 
 * ⏰ 定时任务配置:
 *   - 运行时间: ${row.scheduleTime || "未配置"}
 *   - 运行频率: ${row.scheduleFrequency || "每日"}
 *   - 成功率: ${row.successRate}%
 * 
 * 📝 爬虫说明:
 *   ${row.description || "暂无说明"}
 * 
 * 💡 快速参考:
 *   - 查询数据: SELECT * FROM ${row.tableName || "table_name"} LIMIT 10;
 *   - 统计总数: SELECT COUNT(*) FROM ${row.tableName || "table_name"};
 *   - 查询日志: SELECT * FROM crawler_logs WHERE spider_type = '${row.spiderName}' ORDER BY created_at DESC;
 */

const cron = require('node-cron');
const db = require('../db.js');
const logger = require('../utils/logger');

/**
 * ${row.spiderName} 爬虫主函数
 * 运行时间: ${row.scheduleTime || "未配置"}
 */
async function run${row.spiderName.replace(/\s+/g, "")}() {
	const startTime = new Date();
	console.log('[' + startTime.toLocaleString() + '] ⏳ 开始执行 ${row.spiderName}...');
	
	try {
		// 第1步: 从数据源爬取数据
		console.log('第1步: 从数据源爬取数据...');
		const rawData = await fetchData${row.spiderName.replace(/\s+/g, "")}();
		console.log('  ✓ 爬取完成，共获取 ' + rawData.length + ' 条原始数据');
		
		// 第2步: 数据清洗和验证
		console.log('第2步: 数据清洗和验证...');
		const validData = validateAndCleanData(rawData);
		console.log('  ✓ 验证完成，有效数据 ' + validData.length + ' 条');
		
		// 第3步: 检查重复数据并去重
		console.log('第3步: 数据去重 (存储到表: ${row.tableName || "unknown_table"})...');
		const uniqueData = await deduplicateData('${row.tableName || "unknown_table"}', validData);
		console.log('  ✓ 去重完成，新增 ' + uniqueData.length + ' 条不重复的数据');
		
		// 第4步: 保存到数据库
		console.log('第4步: 保存数据到数据库表 ${row.tableName || "unknown_table"}...');
		const savedCount = await saveToDatabase('${row.tableName || "unknown_table"}', uniqueData);
		console.log('  ✓ 保存成功，共插入/更新 ' + savedCount + ' 条记录');
		
		// 第5步: 记录执行日志
		console.log('第5步: 记录爬虫执行日志...');
		const duration = Date.now() - startTime.getTime();
		await logCrawlResult({
			spider_type: '${row.spiderName}',
			status: 'success',
			data_count: savedCount,
			duration_ms: duration,
			run_time: startTime
		});
		console.log('  ✓ 日志已保存到 crawler_logs 表');
		
		console.log('[' + new Date().toLocaleString() + '] ✅ ${row.spiderName} 执行成功 (耗时: ' + duration + 'ms)\\n');
		return { success: true, count: savedCount, duration_ms: duration };
		
	} catch (error) {
		console.error('[' + new Date().toLocaleString() + '] ❌ ${row.spiderName} 执行失败: ' + error.message);
		
		// 记录失败日志
		await logCrawlResult({
			spider_type: '${row.spiderName}',
			status: 'failed',
			error_msg: error.message,
			run_time: new Date()
		});
		
		return { success: false, error: error.message };
	}
}

/**
 * 从数据源爬取数据
 */
async function fetchData${row.spiderName.replace(/\s+/g, "")}() {
	// TODO: 实现具体的爬虫逻辑
	const response = await fetch('${row.platformName}');
	const data = await response.json();
	return data;
}

/**
 * 数据验证和清洗
 */
function validateAndCleanData(data) {
	return data
		.filter(item => item && Object.keys(item).length > 0)
		.map(item => ({
			...item,
			created_at: new Date(),
			updated_at: new Date()
		}));
}

/**
 * 数据去重（检查数据库中是否已存在）
 */
async function deduplicateData(tableName, data) {
	const uniqueData = [];
	for (const item of data) {
		const existing = await db.query(
			'SELECT id FROM ' + tableName + ' WHERE title = ? LIMIT 1',
			[item.title]
		);
		if (!existing || existing.length === 0) {
			uniqueData.push(item);
		}
	}
	return uniqueData;
}

/**
 * 保存到数据库表: ${row.tableName || "unknown_table"}
 */
async function saveToDatabase(tableName, data) {
	console.log('  🔄 正在保存 ' + data.length + ' 条数据...');
	let savedCount = 0;
	
	for (const item of data) {
		try {
			const query = 'INSERT INTO ' + tableName + ' (title, url, description, image_url, data_json, created_at, updated_at) ' +
						'VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ' +
						'ON DUPLICATE KEY UPDATE updated_at = NOW(), description = VALUES(description)';
			
			const result = await db.query(query, [
				item.title,
				item.url,
				item.description,
				item.image_url,
				JSON.stringify(item)
			]);
			
			savedCount++;
		} catch (e) {
			console.warn('    ⚠️ 保存单条数据失败: ' + e.message);
		}
	}
	
	return savedCount;
}

/**
 * 记录爬虫执行日志 -> crawler_logs 表
 */
async function logCrawlResult(logData) {
	try {
		await db.query('INSERT INTO crawler_logs (spider_type, status, data_count, error_msg, duration_ms, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [
			logData.spider_type,
			logData.status,
			logData.data_count || 0,
			logData.error_msg || null,
			logData.duration_ms || 0
		]);
	} catch (e) {
		console.error('记录日志失败:', e.message);
	}
}

// ⏰ 定时任务配置
// Cron 表达式: ${row.scheduleTime || "0 0 3 * * *"}
// 说明:
//   秒  分  时  日  月  周
//   0   0   3   *   *   *   = 每天凌晨 03:00 执行
//   0   0   0   *   *   *   = 每天午夜 00:00 执行
//   0   0   */6 *   *   *   = 每 6 小时执行一次
//   0   */30 *  *   *   *   = 每 30 分钟执行一次
//
// 通过 cronScheduler.js 集成到定时任务系统
// 参考文件: server/utils/cronScheduler.js

// 如果直接运行此文件
if (require.main === module) {
	run${row.spiderName.replace(/\s+/g, "")}()
		.then(result => {
			console.log('爬虫执行结果:', result);
			process.exit(result.success ? 0 : 1);
		})
		.catch(err => {
			console.error('爬虫执行异常:', err);
			process.exit(1);
		});
}

// 导出函数供定时任务调用
module.exports = {
	run: run${row.spiderName.replace(/\s+/g, "")},
	name: '${row.spiderName}',
	table: '${row.tableName || "unknown_table"}',
	schedule: '${row.scheduleTime || "Not configured"}',
	description: '${row.description || "N/A"}'
};`;

	sourceCodeContent.value = codeTemplate;
	showCodeDialog.value = true;
};

// 复制代码
const copyCode = () => {
	navigator.clipboard.writeText(sourceCodeContent.value).then(() => {
		ElMessage.success("代码已复制到剪贴板");
	});
};

// 监听窗口大小变化
const handleResize = () => {
	spiderTypePieChart?.resize();
	trendLineChart?.resize();
};

// 生命周期
onMounted(() => {
	fetchCrawlerStats();
	window.addEventListener("resize", handleResize);
});

// 清理
onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
	spiderTypePieChart?.dispose();
	trendLineChart?.dispose();
});
</script>

<style lang="scss" scoped>
.crawler-stats-container {
	padding: 20px;
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	min-height: 100vh;

	// 顶部操作区
	.header-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		animation: slideInDown 0.6s ease-out;

		:deep(.el-statistic) {
			font-size: 12px;
		}
	}

	// 统计卡片区域
	.stats-header {
		margin-bottom: 30px;
		animation: slideInDown 0.6s ease-out;
	}

	// 图表区域
	.charts-section {
		margin-bottom: 30px;

		.chart-card {
			background: white;
			border-radius: 12px;
			overflow: hidden;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
			animation: slideInUp 0.6s ease-out;

			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 20px;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				color: white;
				border-bottom: 1px solid rgba(0, 0, 0, 0.05);

				.title {
					font-size: 16px;
					font-weight: bold;
				}

				.subtitle {
					font-size: 12px;
					opacity: 0.8;
					margin-left: 10px;
				}
			}

			.chart-container {
				height: 350px;
				padding: 20px;
				position: relative;

				:deep(.echarts-container) {
					width: 100% !important;
					height: 100% !important;
				}
			}
		}
	}

	// 表格区域
	.table-section {
		margin-bottom: 30px;

		.chart-card {
			animation: slideInUp 0.6s ease-out 0.2s backwards;

			.card-header {
				display: flex;
				justify-content: space-between;
				align-items: center;

				.title {
					font-size: 16px;
					font-weight: bold;
				}
			}

			.crawler-table {
				:deep(.el-table__header th) {
					background: #f5f7fa;
					font-weight: bold;
				}

				:deep(.el-table__body tr:hover > td) {
					background-color: #f0f9ff !important;
				}

				.spider-name {
					font-weight: 500;
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.count-number {
					font-weight: bold;
					font-size: 16px;
					color: #409eff;
				}

				.time {
					font-size: 12px;
					color: #909399;
				}
			}
		}
	}

	// 代码预览区域
	.code-container {
		background: #1e1e1e;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid #3e3e42;

		.code-header {
			background: #252526;
			padding: 16px;
			border-bottom: 1px solid #3e3e42;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.code-file-info {
				display: flex;
				align-items: center;
				gap: 8px;
				flex: 1;

				.label {
					color: #9e9e9e;
					font-size: 12px;
					font-weight: 500;
				}

				.file {
					color: #ce9178;
					font-size: 12px;
					font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
				}

				:deep(.el-tag) {
					font-size: 11px;
					margin: 0 2px;
				}
			}
		}

		.code-content {
			padding: 20px 16px;
			margin: 0;
			color: #d4d4d4;
			font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
			font-size: 12px;
			line-height: 1.8;
			max-height: 600px;
			overflow-y: auto;
			background: #1e1e1e;

			code {
				color: inherit;
			}

			// 代码高亮色
			:deep(strong) {
				color: #569cd6;
			}
		}
	}

	// 代码对话框样式
	:deep(.code-dialog) {
		.el-dialog__header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			padding: 16px 20px;

			.el-dialog__title {
				color: white;
				font-weight: bold;
			}

			.el-dialog__close {
				color: rgba(255, 255, 255, 0.7);

				&:hover {
					color: white;
				}
			}
		}

		.el-dialog__body {
			padding: 0;
			background: #f5f5f5;
		}
	}

	// 子路由区域
	.children-section {
		animation: slideInUp 0.6s ease-out 0.4s backwards;
	}
}

// 动画定义
@keyframes slideInDown {
	from {
		opacity: 0;
		transform: translateY(-30px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes slideInUp {
	from {
		opacity: 0;
		transform: translateY(30px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

// 响应式设计
@media (max-width: 768px) {
	.crawler-stats-container {
		padding: 15px;

		.header-actions {
			flex-direction: column;
			align-items: flex-start;
			gap: 10px;
		}

		.chart-container {
			height: 280px !important;
		}
	}
}
</style>
