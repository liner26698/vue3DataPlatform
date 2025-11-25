/**
 * 小说数据存储管理
 * 用于存储爬取到的小说信息，包括href等
 */

class NovelDataManager {
	constructor() {
		// 存储: novelId -> novelData (包含href等信息)
		this.novelData = new Map();
		// 存储: novelId -> chapters列表
		this.novelChapters = new Map();
	}

	/**
	 * 保存小说信息
	 */
	saveNovel(novelId, novelData) {
		this.novelData.set(novelId, {
			...novelData,
			savedAt: Date.now()
		});
		console.log(`[存储] 保存小说: ${novelId} - ${novelData.Name}`);
	}

	/**
	 * 获取小说信息
	 */
	getNovel(novelId) {
		return this.novelData.get(novelId);
	}

	/**
	 * 保存小说章节列表
	 */
	saveChapters(novelId, chapters) {
		this.novelChapters.set(novelId, {
			chapters: chapters,
			savedAt: Date.now()
		});
		console.log(`[存储] 保存章节: ${novelId} - ${chapters.length} 个章节`);
	}

	/**
	 * 获取小说章节列表
	 */
	getChapters(novelId) {
		const data = this.novelChapters.get(novelId);
		return data ? data.chapters : null;
	}

	/**
	 * 获取指定章节
	 */
	getChapter(novelId, chapterId) {
		const chapters = this.getChapters(novelId);
		if (chapters && chapterId > 0 && chapterId <= chapters.length) {
			return chapters[chapterId - 1];
		}
		return null;
	}

	/**
	 * 清空所有数据
	 */
	clear() {
		this.novelData.clear();
		this.novelChapters.clear();
		console.log("[存储] 所有数据已清空");
	}

	/**
	 * 获取统计信息
	 */
	getStats() {
		return {
			totalNovels: this.novelData.size,
			totalNovelChapters: this.novelChapters.size
		};
	}
}

module.exports = new NovelDataManager();
