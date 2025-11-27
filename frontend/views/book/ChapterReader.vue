<template>
	<div class="book_container">
		<div class="readerPageWrap">
			<el-backtop :right="100" :bottom="100" />
			<div class="h20-blank"></div>

			<!-- 主内容 -->
			<div class="rw_3" id="reader_warp">
				<div class="rft_1" id="readerFt">
					<!-- 内容主盒 -->
					<div class="reader_main">
						<div class="reader_box">
							<div class="marker" @click="marke()"></div>
							<div class="title">
								<div class="iconbox">
									<em class=""></em>
								</div>
								<div class="title_txtbox">{{ chapterName }}</div>
							</div>
							<div class="bookinfo">
								书名：<a>{{ bookName }}</a> &nbsp;&nbsp;|&nbsp;&nbsp;字数：<span>{{ textTotal }}</span>
							</div>

							<div class="reader_line"></div>

							<!-- eslint-disable-next-line vue/no-v-html -->
							<div class="content" itemprop="acticleBody">
								<p v-html="formattedContent"></p>
							</div>
							<div class="chap_btnbox">
								<div
									@click="goToPrev()"
									:style="{
										opacity: prevChapter ? 1 : 0.5,
										cursor: prevChapter ? 'pointer' : 'not-allowed'
									}"
								>
									上一章
								</div>
								<div @click="toggleChapterList()">章节列表</div>
								<div
									@click="goToNext()"
									:style="{
										opacity: nextChapter ? 1 : 0.5,
										cursor: nextChapter ? 'pointer' : 'not-allowed'
									}"
								>
									下一章
								</div>
							</div>
							<div class="ctrl_tips">
								按"键盘左键←"返回上一章&nbsp;&nbsp;&nbsp;按"键盘右键→"进入下一章&nbsp;&nbsp;&nbsp;按"-="键调整字体大小
							</div>
						</div>
					</div>
					<!-- /内容主盒 -->
				</div>
				<!-- /包裹层 -->
			</div>

			<div class="h20-blank"></div>
		</div>

		<!-- 章节列表抽屉 -->
		<el-drawer v-model="chapterListVisible" direction="rtl" title="章节列表" size="30%">
			<div class="chapter-list-container">
				<el-input v-model="chapterSearch" placeholder="搜索章节..." clearable class="chapter-search" />
				<div class="chapters-scroll">
					<div
						v-for="ch in filteredChapters"
						:key="ch.chapterId"
						class="chapter-item"
						:class="{ active: ch.chapterId === currentChapterId }"
						@click="selectChapter(ch)"
					>
						{{ ch.chapterName }}
					</div>
				</div>
			</div>
		</el-drawer>
	</div>
</template>

<script setup lang="ts" name="ChapterReader">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getNovelChapters, getNovelChapterContent } from "@/api/book/modules/novelApi";
import { ElNotification } from "element-plus";

const route = useRoute();
const router = useRouter();

// 状态
const bookName = ref("");
const bookId = ref("");
const novelHref = ref("");
const currentChapterId = ref("");
const chapterName = ref("");
const chapterContent = ref("");
const updateTime = ref("");
const textTotal = ref(0);
const contentLoading = ref(false);
const error = ref("");

const fontSize = ref(16);
const chapterListVisible = ref(false);
const chapterSearch = ref("");
const chapters = ref<any[]>([]);
const prevChapter = ref<any>(null);
const nextChapter = ref<any>(null);

// 格式化后的内容（将换行符转换为 HTML br 标签）
const formattedContent = computed(() => {
	return chapterContent.value.replace(/(\n)/g, "<br/>");
});

// 计算属性
const filteredChapters = computed(() => {
	if (!chapterSearch.value) return chapters.value;
	return chapters.value.filter(ch => ch.chapterName.includes(chapterSearch.value));
});

// 方法
const loadChapters = async () => {
	try {
		const result = await getNovelChapters({
			bookId: bookId.value,
			novelHref: novelHref.value
		});

		if (result?.data?.data) {
			chapters.value = result.data.data;

			// 找出当前和前后章节
			const currentIdx = chapters.value.findIndex(ch => ch.chapterId === currentChapterId.value);
			if (currentIdx > -1) {
				prevChapter.value = currentIdx > 0 ? chapters.value[currentIdx - 1] : null;
				nextChapter.value = currentIdx < chapters.value.length - 1 ? chapters.value[currentIdx + 1] : null;
			}
		} else {
			chapters.value = [];
		}
	} catch (error: any) {
		console.error("加载章节失败:", error);
		error.value = error?.message || "加载章节失败";
	}
};

const loadContent = async () => {
	contentLoading.value = true;
	error.value = "";

	try {
		const chapterHref = route.query.chapterHref as string;

		if (!chapterHref) {
			throw new Error("缺少章节链接");
		}

		const result = await getNovelChapterContent({
			bookId: bookId.value,
			chapterId: currentChapterId.value,
			chapterHref: decodeURIComponent(chapterHref)
		});

		if (result?.data?.content) {
			// 保存原始内容，将在计算属性中格式化
			chapterContent.value = result.data.content;
			chapterName.value = result.data.title || (route.query.chapterName as string);
			updateTime.value = new Date().toLocaleString();

			try {
				textTotal.value = chapterContent.value.replace(/(\s)/g, "").replace(/(<br\/>)/g, "").length;
			} catch (err) {
				console.log("计算内容长度错误:", err);
			}
		} else {
			throw new Error("无法获取章节内容");
		}
	} catch (err: any) {
		error.value = err instanceof Error ? err.message : "加载失败";
		console.error(error.value);
	} finally {
		contentLoading.value = false;
	}
};

const goToPrev = async () => {
	if (prevChapter.value) {
		await selectChapter(prevChapter.value);
		document.documentElement.scrollTop = 0;
	}
};

const goToNext = async () => {
	if (nextChapter.value) {
		await selectChapter(nextChapter.value);
		document.documentElement.scrollTop = 0;
	}
};

const selectChapter = async (chapter: any) => {
	currentChapterId.value = chapter.chapterId;
	chapterName.value = chapter.chapterName;

	router.replace({
		query: {
			...route.query,
			chapterid: chapter.chapterId,
			chapterName: chapter.chapterName,
			chapterHref: chapter.chapterHref
		}
	});

	await loadContent();
	chapterListVisible.value = false;
};

const toggleChapterList = () => {
	chapterListVisible.value = !chapterListVisible.value;
};

const marke = () => {
	ElNotification({
		title: "提示",
		message: "别慌~ 书签功能还在开发中！",
		type: "error"
	});
};

// 监听键盘按键
document.onkeydown = function (e: any) {
	// 翻页
	if (e.keyCode == 37) {
		// 左键
		if (prevChapter.value) {
			goToPrev();
		}
	}
	if (e.keyCode == 39) {
		// 右键
		if (nextChapter.value) {
			goToNext();
		}
	}

	// 字体大小
	if (e.keyCode == 189 || e.keyCode == 187) {
		if (e.keyCode == 189) {
			if (fontSize.value < 12) return;
			fontSize.value = fontSize.value - 1;
		} else {
			if (fontSize.value > 36) return;
			fontSize.value = fontSize.value + 1;
		}
		const readerFt = document.getElementById("readerFt");
		if (readerFt) {
			readerFt.style.fontSize = fontSize.value + "px";
		}
	}
};

onMounted(() => {
	bookName.value = (route.query.bookname as string) || "";
	bookId.value = (route.query.bookid as string) || "";
	novelHref.value = (route.query.href as string) || "";
	currentChapterId.value = (route.query.chapterid as string) || "1";
	chapterName.value = (route.query.chapterName as string) || "";

	if (!bookId.value || !novelHref.value) {
		error.value = "参数不完整";
		return;
	}

	loadChapters();
	loadContent();
});
</script>

<style lang="scss" scoped>
@import "./index.scss";

.book_container {
	background: #d9cdb6;
}

.h20-blank {
	height: 20px;
}

.readerPageWrap {
	width: 100%;
}

#reader_warp {
	margin: 0 auto;
	position: relative;
}

.reader_box_spline {
	height: 1px;
	overflow: hidden;
	background: #ccc;
}

.reader_main {
	position: relative;
	background: #faeed7;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
	margin: 0 auto;
}

.reader_box {
	padding: 0 100px;
	position: relative;
	margin: 0 auto;
	border-bottom: 1px solid #ccc;
}

.reader_box .title {
	padding-top: 80px;
	padding-bottom: 10px;
	text-align: center;
}

.reader_box .title .iconbox {
	display: inline-block;
}

.title_txtbox {
	line-height: 40px;
	font-size: 28px;
	color: #333;
	letter-spacing: 1.08px;
	display: inline;
	font-weight: 700;
}

.bookinfo {
	text-align: center;
	font-family: MicrosoftYaHei;
	font-size: 12px;
	letter-spacing: 0.86px;
	line-height: 23px;
	padding-bottom: 20px;
	position: relative;
}

.reader_line {
	border-top: 1px dotted #ccc;
	height: 1px;
	overflow: hidden;
	display: block;
}

.reader_box .content {
	padding: 30px 0 50px;
}

.reader_box .content p {
	letter-spacing: 1px;
	line-height: 2em;
	text-indent: 2em;
	padding: 0.5em 0.3em;
}

.chap_btnbox {
	text-align: center;
	margin: 30px 0;
	padding: 20px 0;
	border-top: 1px solid #ccc;
	border-bottom: 1px solid #ccc;

	div {
		display: inline-block;
		margin: 0 20px;
		padding: 8px 24px;
		cursor: pointer;
		border: 1px solid #ccc;
		background: #f5f5f5;
		transition: all 0.3s ease;

		&:hover {
			background: #e84848;
			color: white;
			border-color: #e84848;
		}
	}
}

.ctrl_tips {
	text-align: center;
	padding: 20px;
	color: #999;
	font-size: 12px;
	line-height: 20px;
}

.marker {
	width: 26px;
	height: 26px;
	background-image: url(@images/reader-1.png);
	position: absolute;
	right: 18px;
	top: 0;
	background-repeat: no-repeat;
	background-size: 100% 100%;
	cursor: pointer;
}

.marker:hover {
	background-image: url(@images/reader-2.png);
}

.chapter-list-container {
	display: flex;
	flex-direction: column;
	height: 100%;

	.chapter-search {
		margin-bottom: 16px;
	}

	.chapters-scroll {
		flex: 1;
		overflow-y: auto;

		.chapter-item {
			padding: 12px 16px;
			margin-bottom: 4px;
			border-left: 3px solid transparent;
			background: #f9f9f9;
			cursor: pointer;
			font-size: 13px;
			color: #666;
			transition: all 0.2s ease;

			&:hover {
				background: #f0f0f0;
			}

			&.active {
				background: #e6f7ff;
				border-left-color: #409eff;
				color: #409eff;
				font-weight: bold;
			}
		}
	}
}
</style>
