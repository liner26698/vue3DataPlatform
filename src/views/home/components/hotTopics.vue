<template>
	<div class="hot-topics-container">
		<!-- 平台选项卡 -->
		<div class="platform-tabs">
			<button
				v-for="platform in platforms"
				:key="platform.id"
				:class="['platform-tab', { active: activePlatform === platform.id }]"
				@click="activePlatform = platform.id"
			>
				<span class="platform-icon">{{ platform.icon }}</span>
				<span class="platform-name">{{ platform.name }}</span>
			</button>
		</div>

		<!-- 话题列表 -->
		<div class="topics-list">
			<div
				v-for="(topic, index) in filteredTopics"
				:key="index"
				:class="['topic-item', `rank-${index + 1}`]"
				@click="openTopic(topic)"
			>
				<!-- 排名 -->
				<div class="topic-rank">
					<span v-if="index < 3" class="rank-badge" :class="`rank-${index + 1}`">
						{{ index + 1 }}
					</span>
					<span v-else class="rank-number">{{ index + 1 }}</span>
				</div>

				<!-- 话题内容 -->
				<div class="topic-content">
					<div class="topic-title">{{ topic.title }}</div>
					<div class="topic-meta">
						<span class="topic-category" v-if="topic.category">{{ topic.category }}</span>
						<span class="topic-heat">
							<i class="icon-fire">🔥</i>
							{{ formatNumber(topic.heat) }}
						</span>
					</div>
				</div>

				<!-- 额外信息 -->
				<div class="topic-extra">
					<span v-if="topic.trend" :class="['trend', topic.trend]">
						{{ topic.trend === "up" ? "↑" : topic.trend === "down" ? "↓" : "→" }}
					</span>
					<span v-if="topic.tags" class="topic-tags">
						<span v-for="tag in topic.tags" :key="tag" class="tag">{{ tag }}</span>
					</span>
				</div>

				<!-- 跳转按钮 -->
				<div class="topic-link">
					<i class="icon-link">→</i>
				</div>
			</div>

			<!-- 空状态 -->
			<div v-if="filteredTopics.length === 0" class="empty-state">
				<p>暂无话题数据</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface Topic {
	title: string;
	category?: string;
	heat: number;
	trend?: "up" | "down" | "stable";
	tags?: string[];
	url?: string;
	platform: string;
}

const platforms = [
	{ id: "baidu", name: "百度", icon: "🔍", color: "#2319dc" },
	{ id: "weibo", name: "微博", icon: "✨", color: "#e6162d" },
	{ id: "bilibili", name: "B站", icon: "▶", color: "#fb7299" },
	{ id: "xiaohongshu", name: "小红书", icon: "❤️", color: "#ff1111" }
];

const activePlatform = ref("baidu");
const topics = ref<Topic[]>([]);

const filteredTopics = computed(() => {
	return topics.value.filter(topic => topic.platform === activePlatform.value);
});

// 格式化数字
const formatNumber = (num: number) => {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + "M";
	} else if (num >= 1000) {
		return (num / 1000).toFixed(1) + "K";
	}
	return num.toString();
};

// 打开话题链接
const openTopic = (topic: Topic) => {
	if (topic.url) {
		window.open(topic.url, "_blank");
	}
};

// 获取数据
const fetchData = async () => {
	try {
		// 导入 API 模块
		const { getHotTopicsApi } = await import("@/api/modules/hotTopics");

		// 调用真实的 API
		const res: any = await getHotTopicsApi();

		if (res && res.data && res.data.topics) {
			// 将数据库返回的分类数据转为一维数组
			const allTopics: Topic[] = [];
			const topicsData = res.data.topics;

			// 遍历所有平台的数据
			for (const platform of Object.keys(topicsData)) {
				if (Array.isArray(topicsData[platform])) {
					topicsData[platform].forEach((topic: any) => {
						allTopics.push({
							title: topic.title || "",
							heat: topic.heat || 0,
							category: topic.category || "",
							trend: topic.trend || "stable",
							tags: Array.isArray(topic.tags) ? topic.tags : typeof topic.tags === "string" ? JSON.parse(topic.tags) : [],
							url: topic.url || "#",
							platform: platform
						});
					});
				}
			}

			topics.value = allTopics;
			console.log(`✅ 成功加载 ${allTopics.length} 条热门话题`);
		} else {
			throw new Error("API 返回数据格式错误");
		}
	} catch (error) {
		console.error("获取热门话题失败:", error);
		console.log("⚠️ 无法从API获取数据，请检查后端服务");
		topics.value = [];
	}
};

onMounted(() => {
	fetchData();
});
</script>

<style lang="scss" scoped>
.hot-topics-container {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;

	.platform-tabs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		padding: 8px 0;

		.platform-tab {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 16px;
			border: 1px solid rgba(0, 0, 0, 0.1);
			border-radius: 20px;
			background: #ffffff;
			cursor: pointer;
			transition: all 0.3s ease;
			font-size: 13px;
			font-weight: 500;
			color: #606266;

			.platform-icon {
				font-size: 16px;
			}

			.platform-name {
				white-space: nowrap;
			}

			&:hover {
				border-color: #409eff;
				color: #409eff;
				background: rgba(64, 158, 255, 0.05);
			}

			&.active {
				border-color: #409eff;
				background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
				color: #409eff;
				font-weight: 600;

				.platform-icon {
					transform: scale(1.2);
				}
			}
		}
	}

	.topics-list {
		display: flex;
		flex-direction: column;
		gap: 10px;

		.topic-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			border-radius: 8px;
			background: #f5f7fa;
			border: 1px solid rgba(0, 0, 0, 0.05);
			cursor: pointer;
			transition: all 0.3s ease;

			&:hover {
				background: #ffffff;
				border-color: #409eff;
				box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
				transform: translateX(4px);

				.topic-link {
					opacity: 1;
					transform: translateX(0);
				}
			}

			&.rank-1,
			&.rank-2,
			&.rank-3 {
				background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
				border: 1px solid rgba(100, 200, 255, 0.2);

				.topic-rank {
					.rank-badge {
						font-weight: 700;
						color: white;
						padding: 4px 8px;
						border-radius: 4px;
						min-width: 28px;
						text-align: center;
						display: block;

						&.rank-1 {
							background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
						}

						&.rank-2 {
							background: linear-gradient(135deg, #ffa502 0%, #ff8c00 100%);
						}

						&.rank-3 {
							background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
							color: #333;
						}
					}
				}
			}

			.topic-rank {
				flex-shrink: 0;
				min-width: 40px;

				.rank-badge {
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 14px;
					font-weight: 700;
				}

				.rank-number {
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 13px;
					color: #909399;
					min-width: 28px;
				}
			}

			.topic-content {
				flex: 1;
				min-width: 0;

				.topic-title {
					font-size: 14px;
					font-weight: 500;
					color: #303133;
					line-height: 1.4;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;

					@media (max-width: 768px) {
						font-size: 13px;
					}
				}

				.topic-meta {
					display: flex;
					align-items: center;
					gap: 8px;
					margin-top: 4px;
					font-size: 12px;

					.topic-category {
						display: inline-block;
						padding: 2px 8px;
						background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
						color: #667eea;
						border-radius: 4px;
						white-space: nowrap;
					}

					.topic-heat {
						color: #909399;
						display: flex;
						align-items: center;
						gap: 2px;

						.icon-fire {
							animation: flicker 2s ease-in-out infinite;
						}
					}
				}
			}

			.topic-extra {
				display: flex;
				align-items: center;
				gap: 8px;
				flex-shrink: 0;

				.trend {
					font-weight: 700;
					font-size: 14px;

					&.up {
						color: #ff4757;
					}

					&.down {
						color: #2ed573;
					}

					&.stable {
						color: #ffa502;
					}
				}

				.topic-tags {
					display: flex;
					gap: 4px;

					.tag {
						display: inline-block;
						padding: 2px 8px;
						background: #e8f5e9;
						color: #27ae60;
						border-radius: 3px;
						font-size: 11px;
						white-space: nowrap;
					}
				}
			}

			.topic-link {
				flex-shrink: 0;
				font-size: 18px;
				color: #409eff;
				opacity: 0.5;
				transform: translateX(-8px);
				transition: all 0.3s ease;
			}
		}

		.empty-state {
			padding: 40px 20px;
			text-align: center;
			color: #909399;

			p {
				font-size: 14px;
			}
		}
	}
}

@keyframes flicker {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.6;
	}
}

@media (max-width: 768px) {
	.hot-topics-container {
		gap: 16px;

		.platform-tabs {
			gap: 6px;

			.platform-tab {
				padding: 6px 12px;
				font-size: 12px;

				.platform-icon {
					font-size: 14px;
				}
			}
		}

		.topics-list {
			gap: 8px;

			.topic-item {
				padding: 10px 12px;
				gap: 10px;

				.topic-extra {
					display: none;
				}

				.topic-link {
					font-size: 16px;
				}
			}
		}
	}
}
</style>
