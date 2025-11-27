<template>
	<div class="book-page">
		<!-- 搜索和分类 -->
		<div class="book-header">
			<div class="search-bar">
				<el-input
					v-model="searchKeyword"
					placeholder="搜索小说或作者..."
					@keyup.enter="handleSearch"
					class="search-input"
					clearable
				>
					<template #suffix>
						<el-button type="primary" :loading="loading" @click="handleSearch" class="search-btn"> 搜索 </el-button>
					</template>
				</el-input>
			</div>

			<div class="category-bar">
				<el-button
					v-for="cat in categories"
					:key="cat.id"
					:type="currentCategory === cat.name ? 'primary' : 'info'"
					size="small"
					@click="selectCategory(cat.name)"
					class="category-btn"
				>
					{{ cat.name }}
				</el-button>
			</div>
		</div>

		<!-- 书籍列表 -->
		<div class="book-list">
			<el-skeleton v-if="loading" :rows="3" animated />
			<div v-else-if="books.length === 0" class="empty-state">
				<el-empty description="暂无小说" />
			</div>
			<div v-else class="novels-grid">
				<div v-for="book in books" :key="book.Id" class="novel-card" @click="viewDetails(book)">
					<div class="novel-cover">
						<el-image :src="book.Img" fit="cover" />
						<div class="novel-overlay">
							<el-button type="primary" size="small">阅读</el-button>
						</div>
					</div>
					<div class="novel-info">
						<h3 class="novel-title" :title="book.Name">{{ book.Name }}</h3>
						<p class="novel-author">{{ book.Author }}</p>
						<p class="novel-category">{{ book.CName }}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- 分页 -->
		<div v-if="totalCount > pageSize" class="pagination">
			<el-pagination
				v-model:current-page="currentPage"
				v-model:page-size="pageSize"
				:page-sizes="[20, 40, 60]"
				:total="totalCount"
				layout="total, sizes, prev, pager, next"
				@change="loadBooks"
			/>
		</div>

		<!-- 详情对话框 -->
		<el-dialog v-model="detailVisible" :title="selectedBook?.Name" width="60%" class="book-detail-dialog">
			<div v-if="selectedBook" class="detail-content">
				<div class="detail-header">
					<el-image :src="selectedBook.Img" class="detail-cover" fit="cover" />
					<div class="detail-meta">
						<p><span>作者:</span> {{ selectedBook.Author }}</p>
						<p><span>分类:</span> {{ selectedBook.CName }}</p>
						<p><span>状态:</span> {{ selectedBook.BookStatus || "连载中" }}</p>
					</div>
				</div>
				<div class="detail-desc">
					<h4>简介</h4>
					<p>{{ selectedBook.Desc }}</p>
				</div>
				<el-button type="primary" @click="startReading">开始阅读</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script setup lang="ts" name="BookPage">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { getNovelList, getNovelChapters } from "@/api/book/modules/novelApi";

const router = useRouter();

// 状态
const loading = ref(false);
const books = ref<any[]>([]);
const categories = ref<any[]>([
	{ id: "1", name: "玄幻" },
	{ id: "2", name: "言情" },
	{ id: "3", name: "武侠" },
	{ id: "5", name: "都市" }
]);
const currentCategory = ref("所有");
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

const detailVisible = ref(false);
const selectedBook = ref<any>(null);
const errorMessage = ref(""); // 加载书籍列表
const loadBooks = async () => {
	loading.value = true;
	errorMessage.value = "";
	try {
		const result = await getNovelList({
			current: currentPage.value,
			pageSize: pageSize.value,
			category: currentCategory.value,
			searchText: searchKeyword.value
		});

		if (result?.data?.data) {
			books.value = result.data.data;
			totalCount.value = result.data.total || 0;
		} else {
			books.value = [];
			totalCount.value = 0;
		}
	} catch (error: any) {
		errorMessage.value = error?.message || "加载失败，请重试";
		ElMessage.error(errorMessage.value);
		console.error(error);
		books.value = [];
	} finally {
		loading.value = false;
	}
};
const handleSearch = () => {
	currentPage.value = 1;
	loadBooks();
};

const selectCategory = (name: string) => {
	currentCategory.value = name;
	searchKeyword.value = "";
	currentPage.value = 1;
	loadBooks();
};

const viewDetails = (book: any) => {
	selectedBook.value = book;
	detailVisible.value = true;
};

const startReading = async () => {
	if (!selectedBook.value?.href) {
		ElMessage.warning("无法获取小说链接");
		return;
	}

	try {
		const chapters = await getNovelChapters({
			bookId: selectedBook.value.Id,
			novelHref: selectedBook.value.href
		});

		if (chapters?.data?.data && chapters.data.data.length > 0) {
			const firstChapter = chapters.data.data[0];
			detailVisible.value = false;
			router.push({
				path: "/book/detail",
				query: {
					bookid: selectedBook.value.Id,
					bookname: selectedBook.value.Name,
					href: selectedBook.value.href,
					chapterid: firstChapter.chapterId,
					chapterName: firstChapter.chapterName,
					chapterHref: firstChapter.chapterHref
				}
			});
		} else {
			ElMessage.error("无法获取章节列表");
		}
	} catch (error: any) {
		ElMessage.error(error?.message || "跳转失败，请重试");
		console.error(error);
	}
};
onMounted(() => {
	loadBooks();
});
</script>

<style scoped lang="scss">
.book-page {
	padding: 20px;
	animation: fadeIn 0.3s ease-in-out;

	.book-header {
		margin-bottom: 30px;

		.search-bar {
			margin-bottom: 20px;

			:deep(.search-input) {
				max-width: 500px;

				.el-input__suffix {
					padding: 0;
				}
			}
		}

		.category-bar {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;

			.category-btn {
				transition: all 0.3s ease;

				&:hover {
					transform: translateY(-2px);
				}
			}
		}
	}

	.book-list {
		min-height: 400px;

		.novels-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 20px;
			animation: slideUp 0.5s ease-out;

			.novel-card {
				cursor: pointer;
				border-radius: 8px;
				overflow: hidden;
				background: white;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

				&:hover {
					transform: translateY(-8px);
					box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

					.novel-overlay {
						opacity: 1;
					}
				}

				.novel-cover {
					position: relative;
					width: 100%;
					aspect-ratio: 3 / 4;
					overflow: hidden;
					background: #f0f0f0;

					:deep(.el-image) {
						width: 100%;
						height: 100%;
					}

					.novel-overlay {
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						background: rgba(0, 0, 0, 0.5);
						display: flex;
						align-items: center;
						justify-content: center;
						opacity: 0;
						transition: opacity 0.3s ease;
					}
				}

				.novel-info {
					padding: 12px;

					.novel-title {
						margin: 0 0 8px;
						font-size: 14px;
						font-weight: bold;
						color: #333;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}

					.novel-author,
					.novel-category {
						margin: 4px 0;
						font-size: 12px;
						color: #666;
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				}
			}
		}

		.empty-state {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 400px;
		}
	}

	.pagination {
		display: flex;
		justify-content: center;
		margin-top: 30px;
		animation: slideUp 0.5s ease-out;
	}

	.book-detail-dialog {
		:deep(.el-dialog) {
			border-radius: 12px;
		}

		.detail-content {
			animation: fadeIn 0.3s ease-in-out;

			.detail-header {
				display: flex;
				gap: 20px;
				margin-bottom: 20px;

				.detail-cover {
					width: 120px;
					height: 160px;
					border-radius: 8px;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				}

				.detail-meta {
					flex: 1;

					p {
						margin: 8px 0;
						font-size: 14px;

						span {
							font-weight: bold;
							color: #666;
							margin-right: 8px;
						}
					}
				}
			}

			.detail-desc {
				margin-bottom: 20px;

				h4 {
					margin: 0 0 10px;
					font-size: 14px;
					font-weight: bold;
				}

				p {
					margin: 0;
					font-size: 13px;
					color: #666;
					line-height: 1.6;
					max-height: 100px;
					overflow-y: auto;
				}
			}
		}
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (max-width: 768px) {
	.book-page {
		.book-list {
			.novels-grid {
				grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
				gap: 12px;
			}
		}
	}
}
</style>
