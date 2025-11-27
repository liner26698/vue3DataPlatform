<template>
	<el-dialog v-model="visible" :title="`活跃爬虫 (${spidersData.length})`" width="70%" class="spider-modal" @close="handleClose">
		<!-- 爬虫列表 -->
		<el-row :gutter="20" class="spiders-grid">
			<el-col v-for="spider in spidersData" :key="spider.spiderName" :xs="24" :sm="12" :md="8">
				<div class="spider-card" :style="{ borderTopColor: spider.color }">
					<div class="spider-header">
						<span class="spider-icon">{{ spider.icon }}</span>
						<h4>{{ spider.spiderName }}</h4>
					</div>

					<div class="spider-body">
						<div class="spider-info-row">
							<span class="label">平台：</span>
							<span class="value">{{ spider.platformName }}</span>
						</div>
						<div class="spider-info-row">
							<span class="label">数据量：</span>
							<span class="value">{{ formatNumber(spider.totalCount) }}</span>
						</div>
						<div class="spider-info-row">
							<span class="label">成功率：</span>
							<el-progress :percentage="spider.successRate" color="#409EFF" class="progress-inline" />
						</div>
						<div class="spider-info-row">
							<span class="label">状态：</span>
							<el-tag type="success" size="small"> <i class="el-icon-circle-check"></i> 运行中 </el-tag>
						</div>
						<div class="spider-info-row">
							<span class="label">最后更新：</span>
							<span class="value time">{{ formatTime(spider.lastUpdateTime) }}</span>
						</div>
					</div>

					<div class="spider-footer">
						<el-button link type="primary" size="small" @click="showSourceCode(spider)">
							<i class="el-icon-document"></i> 查看代码
						</el-button>
					</div>
				</div>
			</el-col>
		</el-row>

		<!-- 代码预览 -->
		<el-dialog v-model="codeDialogVisible" :title="`${selectedSpider?.spiderName} - 源代码`" width="80%" class="code-dialog">
			<div class="code-container">
				<div class="code-header">
					<span class="code-file">{{ selectedSpider?.sourceCode }}</span>
					<el-button link type="primary" size="small" @click="copyCode">
						<i class="el-icon-document-copy"></i> 复制代码
					</el-button>
				</div>
				<pre class="code-content"><code>{{ sourceCodeContent }}</code></pre>
			</div>
		</el-dialog>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";
import { ElMessage } from "element-plus";

interface Spider {
	spiderName: string;
	platformName: string;
	totalCount: number;
	successRate: number;
	lastUpdateTime: string | Date;
	status: string;
	sourceCode: string;
	description: string;
	icon?: string;
	color?: string;
}

const props = defineProps<{
	modelValue: boolean;
	spiders: Spider[];
}>();

const emit = defineEmits<{
	"update:modelValue": [boolean];
	close: [];
}>();

const visible = ref(props.modelValue);
const codeDialogVisible = ref(false);
const selectedSpider = ref<Spider | null>(null);
const sourceCodeContent = ref("");

// 监听 modelValue 变化
const handleClose = () => {
	emit("update:modelValue", false);
	emit("close");
};

const formatTime = (time: string | Date) => {
	if (!time) return "未知";
	const date = new Date(time);
	return date.toLocaleString("zh-CN");
};

const formatNumber = (num: number) => {
	if (num >= 10000) {
		return (num / 10000).toFixed(2) + "万";
	}
	return num.toString();
};

const showSourceCode = async (spider: Spider) => {
	selectedSpider.value = spider;

	// 模拟加载源代码（实际应该从后端获取）
	const mockCode = `// ${spider.spiderName}
// 文件: ${spider.sourceCode}
// 功能: ${spider.description}

class ${toCamelCase(spider.spiderName)}Spider {
  constructor() {
    this.name = '${spider.spiderName}';
    this.platform = '${spider.platformName}';
  }

  async crawl() {
    // 爬取逻辑
    console.log('开始爬取 ${spider.platformName} 数据...');
    
    try {
      const data = await this.fetchData();
      await this.saveToDatabase(data);
      
      console.log('✅ 爬取完成，共获取 ' + data.length + ' 条数据');
      return { success: true, count: data.length };
    } catch (error) {
      console.error('❌ 爬取失败:', error);
      return { success: false, error: error.message };
    }
  }

  async fetchData() {
    // 获取数据实现
    const response = await fetch('${spider.platformName}');
    return await response.json();
  }

  async saveToDatabase(data) {
    // 保存到数据库
    const result = await db.query(
      'INSERT INTO \`data_table\` (data) VALUES (?)',
      [JSON.stringify(data)]
    );
    return result;
  }
}

module.exports = ${toCamelCase(spider.spiderName)}Spider;`;

	sourceCodeContent.value = mockCode;
	codeDialogVisible.value = true;
};

const copyCode = () => {
	navigator.clipboard.writeText(sourceCodeContent.value).then(() => {
		ElMessage.success("代码已复制到剪贴板");
	});
};

const toCamelCase = (str: string) => {
	return str
		.split("")
		.map((char, index) => {
			if (index === 0) return char.toUpperCase();
			return char;
		})
		.join("")
		.replace(/\s/g, "");
};

// 直接使用传入的 spiders
const spidersData = ref(props.spiders);
</script>

<style scoped lang="scss">
.spider-modal {
	:deep(.el-dialog__body) {
		padding: 20px;
	}
}

.spiders-grid {
	margin-top: 20px;

	.spider-card {
		background: #ffffff;
		border: 1px solid #ebeef5;
		border-top: 3px solid;
		border-radius: 6px;
		overflow: hidden;
		transition: all 0.3s ease;

		&:hover {
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
			transform: translateY(-2px);
		}

		.spider-header {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 16px;
			display: flex;
			align-items: center;
			gap: 12px;

			.spider-icon {
				font-size: 24px;
			}

			h4 {
				margin: 0;
				font-size: 14px;
				font-weight: 600;
			}
		}

		.spider-body {
			padding: 16px;

			.spider-info-row {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 12px;
				font-size: 12px;

				&:last-of-type {
					margin-bottom: 0;
				}

				.label {
					color: #909399;
					font-weight: 500;
					min-width: 60px;
				}

				.value {
					color: #303133;
					word-break: break-word;

					&.time {
						font-size: 11px;
						color: #606266;
					}
				}

				.progress-inline {
					flex: 1;
					margin-left: 8px;
				}
			}
		}

		.spider-footer {
			border-top: 1px solid #ebeef5;
			padding: 8px 16px;
			text-align: center;
		}
	}
}

.code-dialog {
	:deep(.el-dialog__body) {
		padding: 0;
	}

	.code-container {
		background: #1e1e1e;
		border-radius: 4px;
		overflow: hidden;
	}

	.code-header {
		background: #252526;
		padding: 12px 16px;
		border-bottom: 1px solid #3e3e42;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.code-file {
			color: #858585;
			font-size: 12px;
			font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
		}
	}

	.code-content {
		padding: 16px;
		margin: 0;
		color: #d4d4d4;
		font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
		font-size: 12px;
		line-height: 1.6;
		max-height: 500px;
		overflow-y: auto;
		background: #1e1e1e;

		code {
			color: inherit;
		}

		// 简单的代码高亮
		:deep(.keyword) {
			color: #569cd6;
		}

		:deep(.string) {
			color: #ce9178;
		}

		:deep(.function) {
			color: #dcdcaa;
		}

		:deep(.comment) {
			color: #6a9955;
		}
	}
}

// 响应式
@media (max-width: 768px) {
	.spiders-grid {
		:deep(.el-col) {
			margin-bottom: 16px;
		}
	}
}
</style>
