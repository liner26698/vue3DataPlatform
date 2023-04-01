<template>
	<div class="book_container">
		<div class="readerPageWrap">
			<el-backtop :right="100" :bottom="100" />
			<div class="h20-blank"></div>

			<!-- 主内容 -->
			<div class="rw_3" id="reader_warp">
				<!-- <div class="reader_crumb">
					当前位置： <a href="https://www.zongheng.com"> 首页 </a>&gt;
					<a href="https://www.zongheng.com/category/1.html">奇幻玄幻 </a> &gt;
					<a href="https://book.zongheng.com/book/1245261.html">霸天刀尊</a> &gt; 卷一 凉州风云
				</div> -->

				<!-- 包裹层 -->
				<!-- <div class="rft_1" id="readerFt" style="font-size: 14px"> -->
				<div class="rft_1" id="readerFt">
					<!-- 内容主盒 -->
					<div class="reader_main">
						<div class="reader_box">
							<div class="marker" @click="marke()"></div>
							<div class="title">
								<div class="iconbox">
									<em class=""></em>
								</div>
								<div class="title_txtbox">{{ title }}</div>
							</div>
							<div class="bookinfo">
								作者：<a>{{ author }}</a> &nbsp;&nbsp;|&nbsp;&nbsp;字数：<span>{{ textTotal }}</span>
								<!-- 更新时间：<span>2022-10-10 09:39:32</span> -->
								<!-- <a href="https://book.zongheng.com/totaltome/1245261/70179690.html" class="reader_lnkbtn">全文阅读</a> -->
							</div>

							<div class="reader_line"></div>

							<div class="content" itemprop="acticleBody">
								<p v-html="content"></p>
							</div>

							<div class="chap_btnbox">
								<!-- <div>目录</div> -->

								<div @click="prevChapter()">上一章</div>

								<div @click="nextChapter()">下一章</div>
								<!-- <a class="Jcalalog_link">目录</a>

								<a href="https://book.zongheng.com/chapter/1245261/70672865.html">上一章</a>

								<a href="https://book.zongheng.com/chapter/1245261/70185069.html" class="nextchapter">下一章</a> -->
							</div>

							<div class="ctrl_tips">
								按“键盘左键←”返回上一章&nbsp;&nbsp;&nbsp;按“键盘右键→”进入下一章&nbsp;&nbsp;&nbsp;按“空格键”向下滚动&nbsp;&nbsp;&nbsp;按“-=”键调整字体大小
							</div>
						</div>
					</div>
					<!-- /内容主盒 -->
				</div>
				<!-- /包裹层 -->
			</div>

			<div class="h20-blank"></div>
			<!-- /大包 -->
		</div>
	</div>
</template>
<script setup lang="ts" name="bookDetail">
import { getBookContent } from "@/api/book/modules/mybook";
import { ElNotification } from "element-plus";

let title = ref("");
let author = ref("");
let content = ref("");
let textTotal = ref(0);
let currentBookid = ref("");
let currentNid = ref("");
let currentPid = ref("");
let fontsize = ref(16);

// 获取内容
const getChapterContent = async (bookid = "", chapterid = "") => {
	if (chapterid == "" || bookid == "" || chapterid == "-1" || bookid == "-1") return; // 无效的章节id
	let params = {
		bookid: bookid,
		chapterid: chapterid
	};
	let data: any = await getBookContent(params);
	if (data?.data?.content) {
		currentBookid.value = bookid;
		if (data.data.nid) {
			currentNid.value = String(data.data.nid);
		}
		if (data.data.pid) {
			currentPid.value = String(data.data.pid);
		}
		title.value = data.data.cname;
		author.value = data.data.name;
		content.value = data.data.content.replace(/(\n)/g, "<br/>");

		try {
			textTotal.value = content.value.replace(/(\s)/g, "").replace(/(<br\/>)/g, "").length;
		} catch (error) {
			console.log("content.value err :>> ", content.value);
		}
	} else {
		ElNotification({
			title: "提示",
			message: "获取书籍内容失败,换一本看看~",
			type: "error"
		});
	}
};

// 监听键盘按键
document.onkeydown = function (e) {
	// 翻页
	if (e.keyCode == 37) {
		prevChapter();
	}
	if (e.keyCode == 39) {
		nextChapter();
	}

	// 字体大小
	if (e.keyCode == 189 || e.keyCode == 187) {
		if (e.keyCode == 189) {
			if (fontsize.value < 12) return;
			fontsize.value = fontsize.value - 1;
		} else {
			if (fontsize.value > 36) return;
			fontsize.value = fontsize.value + 1;
		}
		document.getElementById("readerFt")!.style.fontSize = fontsize.value + "px";
	}
};

// 书签功能 TODO...
const marke = () => {
	ElNotification({
		title: "提示",
		message: "别慌~ 书签功能还在开发中！",
		type: "error"
	});
};

const debounce = (fn: Function, time: number) => {
	let timer: any;
	return function (this: object, ...args: any[]) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn.apply(this, args);
			clearTimeout(timer);
		}, time);
	};
};

// 上一章
const prevChapter = debounce(() => {
	getChapterContent(currentBookid.value, currentPid.value);
	document.documentElement.scrollTop = 0;
}, 300);

// 下一章
const nextChapter = debounce(() => {
	getChapterContent(currentBookid.value, currentNid.value);
	document.documentElement.scrollTop = 0;
}, 300);

onMounted(() => {
	const url = window.location.href;
	const bookid = url.split("?")[1].split("&")[0].split("=")[1];
	const chapterid = url.split("?")[1].split("&")[1].split("=")[1];
	getChapterContent(bookid, chapterid);
});
</script>

<style lang="scss" scoped>
@import "../index.scss";
.book_container {
	background: #d9cdb6;
}
.book {
	position: relative;
	width: 100%;
	height: 100%;
	background-color: #f5f5f5;
}
.h20-blank {
	height: 20px;
}
/* ZONGHENG PC 2018 Copyright (c) 2018 (ZONGHENG FETEAM) lastUpdate: 2023-02-27 11:44:36*/
.space_h80 {
	height: 80px;
	clear: both;
}

input::-webkit-input-placeholder,
textarea::-webkit-input-placeholder {
	color: #999;
}

textarea {
	font-family: PingFangSC-Regular, HelveticaNeue-Light, "Helvetica Neue Light", "Microsoft YaHei", sans-serif, Simsun;
}

body {
	background: #d9cdb6;
}

input {
	border: none;
	background: 0 0;
	padding: 0;
}

#reader_warp {
	margin: 0 auto;
	position: relative;
}

.reader_crumb {
	font-size: 13px;
	letter-spacing: 0.86px;
	line-height: 33px;
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
	// width: 760px;
	padding: 0 100px;
	position: relative;
	margin: 0 auto;
	border-bottom: 1px solid #ccc;
}

.rw_comment_open .reader_box {
	margin: 0 !important;
}

.reader_r {
	width: 400px;
	position: absolute;
	top: 0 !important;
	display: none;
	right: -1px;
	z-index: 50;
}

.rw_comment_open .reader_r {
	display: block;
}

.chapter_forum {
	position: absolute;
	z-index: 1;
	width: 400px;
	top: 0;
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

.reader_box .title .vip {
	display: inline-block;
	margin-right: 10px;
	background: url(../images/vip.png) no-repeat;
	width: 16px;
	height: 16px;
	vertical-align: 0;
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

.reader_box .content .r_count {
	cursor: pointer;
	position: relative;
	border: 1px solid #b3b3b3;
	border-radius: 2px;
	min-width: 34px;
	height: 18px;
	line-height: 18px;
	display: inline-block;
	text-align: center;
	text-indent: 0;
	color: #999;
	margin-left: 15px;
}

.reader_box .content .r_count i {
	position: absolute;
	top: 50%;
	left: -5px;
	width: 0;
	height: 0;
	margin-top: -3px;
	border-top: 3px solid transparent;
	border-right: 4px solid #999;
	border-bottom: 3px solid transparent;
	border-left: 0 none;
}

.reader_box .content .r_count i:after {
	content: "";
	position: absolute;
	top: -3px;
	left: 1px;
	width: 0;
	height: 0;
	border-top: 3px solid transparent;
	border-right: 4px solid #f6f1e7;
	border-bottom: 3px solid transparent;
	border-left: 0 none;
}

.reader_box .content .p5 {
	display: none;
}

.reader_box .content .kong {
	height: 1em;
	box-sizing: border-box;
}

.reader_box .content .p1,
.reader_box .content .p2,
.reader_box .content .p3 {
	height: 2em;
	background-color: rgba(0, 0, 0, 0.05);
	margin-bottom: 0.5em;
	box-sizing: border-box;
}

.rb_8 .reader_box .content .p1,
.rb_8 .reader_box .content .p2,
.rb_8 .reader_box .content .p3 {
	background: rgba(153, 153, 153, 0.11);
}

.reader_box .content .p1 {
	width: 100%;
}

.reader_box .content .p2 {
	width: 150px;
}

.reader_box .content .p3 {
	width: 240px;
}

.rw_comment_open .reader_box .content p.active .con_txt {
	background: rgba(0, 0, 0, 0.1);
}

.rw_comment_open .reader_box .content p.active .r_count {
	border: 1px solid #d32f2f;
	background: #d32f2f;
	color: #fff;
}

.rw_comment_open .reader_box .content p.active .r_count i {
	border-right: 4px solid #d32f2f;
}

.rw_comment_open .reader_box .content p.active .r_count i:after {
	content: "";
	border-right: 4px solid #d32f2f;
}

.reader_box.parCommentHide .content .r_count {
	display: none;
}

#reader_warp .reader_box.parCommentHide .content p.active .con_txt {
	background: 0 0;
}

.head-fixed-reader {
	display: inline-flex;
}

.reader_lnkbtn {
	border: 1px solid #b3b3b3;
	border-radius: 2px;
	height: 24px;
	line-height: 24px;
	position: absolute;
	right: 0;
	margin-top: -2px;
	color: #333;
	text-align: center;
}

.reader_lnkbtn:hover {
	border: 1px solid #e84848;
	color: #e84848;
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

.marker.added {
	background-position: -154px 0;
}

.reader_btnred {
	font-size: 18px;
	color: #fff;
	background: #d32f2f;
	border-radius: 2px;
	height: 50px;
	line-height: 50px;
	padding: 0 50px;
	border: 0;
	cursor: pointer;
}

.authortips {
	padding-top: 30px;
	clear: both;
	display: table;
	width: 100%;
	position: relative;
	font-size: 12px;
}

.authortips .avatar {
	float: left;
	width: 60px;
	text-align: center;
	height: 65px;
}

.authortips .avatar img {
	width: 50px;
	height: 50px;
	border-radius: 50px;
}

.authortips .avatar .avatar_b {
	width: 60px;
	height: 20px;
	background: #fc7403;
	color: #fff;
	line-height: 20px;
	text-align: center;
	border-radius: 3px;
	position: relative;
	top: -8px;
}

.authortips .con {
	margin-left: 80px;
	color: #333;
	letter-spacing: 0.86px;
	line-height: 20px;
	position: relative;
	right: 0;
	left: 0;
	min-height: 40px;
	background: #fcf4e7;
	border: 1px solid #e6e6e6;
	padding: 10px;
}

.authortips .con em.arr {
	width: 14px;
	height: 14px;
	border: 1px solid #e6e6e6;
	background: #fcf4e7;
	position: absolute;
	left: -8px;
	transform: rotate(45deg);
	border-top: 0;
	border-right: 0;
	top: 20px;
}

.authortips .con p {
	font-family: PingFangSC-Regular, HelveticaNeue-Light, "Helvetica Neue Light", "Microsoft YaHei", sans-serif, Simsun;
}

.reader_order {
	width: 610px;
	height: 290px;
	margin: 30px auto;
	background: rgba(250, 250, 250, 0.98);
	box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.2);
	border-radius: 2px;
}

.reader_order h4 {
	height: 50px;
	border-bottom: 2px solid #f0f0f0;
	font-size: 14px;
	color: #333;
	line-height: 50px;
	padding: 0 20px;
}

.reader_order h4 .fr {
	font-size: 12px;
}

.reader_order .reader_ordercon {
	display: table-cell;
	vertical-align: middle;
	text-align: center;
	width: 610px;
	height: 240px;
}

.reader_obtnred {
	width: 210px;
	height: 85px;
	background: #d32f2f;
	border-radius: 2px;
	display: inline-block;
	margin-right: 50px;
}

.reader_obtnred:hover {
	background: #e84848;
}

.reader_obtnred p {
	font-size: 18px;
	color: #fff;
	margin: 17px auto 7px;
}

.big_donate p,
.reader_order * {
	font-family: "å¾®è½¯é›…é»‘", Microsoft YaHei, Apple LiGothic Medium !important;
}

.reader_obtnred span {
	font-size: 12px;
	color: #fff;
}

.reader_ordercon a span {
	display: block;
	padding-top: 3px;
}

.reader_obtnred.ordering {
	background-color: #ccc;
}

.reader_obtnwhite {
	width: 208px;
	height: 83px;
	border: 1px solid #d6d6d6;
	background: #fff;
	border-radius: 2px;
	display: inline-block;
	color: #333;
}

.reader_obtnwhite:hover {
	color: #e84848;
	border-color: #e84848;
}

.reader_obtnwhite:hover * {
	color: #e84848;
}

.reader_obtnwhite p {
	font-size: 18px;
	margin: 17px auto 7px;
}

.reader_obtnwhite span {
	font-size: 12px;
}

.order_autotip {
	margin-top: 50px;
	font-size: 14px;
	color: #999;
	position: relative;
}

.order_autotip input {
	vertical-align: middle;
	margin-right: 5px;
	position: relative;
}

.order_autotip input[type="checkbox"] {
	vertical-align: middle;
	left: -20px;
	position: relative;
	visibility: hidden;
}

.order_autotip input[type="checkbox"] + em.checkbox {
	width: 13px;
	height: 13px;
	position: absolute;
	background-image: url(../images/reader_ico.png);
	background-position: -120px -150px;
	margin: 4px auto auto -20px;
}

.order_autotip input[type="checkbox"]:checked + em.checkbox {
	width: 13px;
	height: 13px;
	position: absolute;
	background-position: -133px -150px;
}

.rb_8 #hour-24 .culture-top {
	border-bottom: 1px solid rgba(230, 230, 230, 0.1);
}

.rb_8 #hour-24 .culture-top .culture-wenzi {
	background: url(../images/reader/culture_wenzi_night.png) no-repeat center center;
	background-size: 194px 20px;
}

.rb_8 #hour-24 .hour-24-imgs .hour-24-andtip,
.rb_8 #hour-24 .hour-24-imgs .hour-24-iostip {
	color: #999;
}

.rb_8 #hour-24 .hour-24-imgs .hour-24-andtip i {
	background: url(../images/reader/and_tip_night.png) no-repeat top center;
	background-size: 20px 20px;
}

.rb_8 #hour-24 .hour-24-imgs .hour-24-iostip i {
	background: url(../images/reader/ios_tip_night.png) no-repeat top center;
	background-size: 20px 20px;
}

.rb_8 #hour-24 .hour-24-tip {
	color: #999;
}

.rb_8 #hour-24 .hour-24-say {
	color: #666;
}

.rb_8 #hour-24 .culture-top .culture-wenzi-right {
	color: #990913;
}

#hour-24 {
	height: 361px;
}

#hour-24 .culture-top {
	padding: 16px 30px 16px;
	overflow: hidden;
	border-bottom: 1px solid rgba(240, 240, 240, 0.5);
}

#hour-24 .culture-top .culture-wenzi {
	width: 194px;
	height: 20px;
	background: url(../images/reader/culture_wenzi.png) no-repeat center center;
	background-size: 194px 20px;
}

#hour-24 .culture-top .culture-wenzi-right {
	font-size: 18px;
	font-family: SourceHanSerifSC, SourceHanSerifSC-Bold;
	font-weight: 700;
	text-align: right;
	color: #e60000;
	line-height: 19px;
}

#hour-24 .hour-24-imgs {
	padding-top: 41px;
	height: 140px;
	width: 372px;
	margin: 0 auto;
}

#hour-24 .hour-24-imgs .hour-24-imglf,
#hour-24 .hour-24-imgs .hour-24-imgri {
	width: 116px;
}

#hour-24 .hour-24-imgs .hour-24-and,
#hour-24 .hour-24-imgs .hour-24-ios {
	width: 116px;
	height: 116px;
	background: url(../images/reader/apk.png) no-repeat center center;
	background-size: 116px 116px;
}

#hour-24 .hour-24-imgs .hour-24-ios {
	background: url(../images/reader/pak_ios.png) no-repeat center center;
	background-size: 116px 116px;
}

#hour-24 .hour-24-imgs .hour-24-andtip,
#hour-24 .hour-24-imgs .hour-24-iostip {
	font-size: 16px;
	font-family: MicrosoftYaHei, MicrosoftYaHei-Regular;
	font-weight: 400;
	text-align: center;
	color: #333;
	line-height: 20px;
	vertical-align: middle;
	padding-top: 12px;
}

#hour-24 .hour-24-imgs .hour-24-andtip i,
#hour-24 .hour-24-imgs .hour-24-iostip i {
	vertical-align: bottom;
	display: inline-block;
	width: 20px;
	height: 20px;
	background: url(../images/reader/and_tip.png) no-repeat top center;
	background-size: 20px 20px;
}

#hour-24 .hour-24-imgs .hour-24-iostip i {
	background: url(../images/reader/ios_tip.png) no-repeat top center;
	background-size: 20px 20px;
}

#hour-24 .hour-24-tip {
	font-size: 14px;
	font-family: MicrosoftYaHei, MicrosoftYaHei-Bold;
	font-weight: 900;
	text-align: center;
	color: #333;
	line-height: 14px;
	padding-top: 54px;
}

#hour-24 .hour-24-say {
	font-size: 12px;
	font-family: MicrosoftYaHei, MicrosoftYaHei-Regular;
	font-weight: 300;
	padding-left: 30px;
	color: #999;
	line-height: 12px;
	padding-top: 24px;
	padding-bottom: 20px;
}

.big_donate {
	width: 250px;
	height: 50px;
	background: #d32f2f;
	color: #fff;
	text-align: center;
	display: block;
	margin: 0 auto;
	border-radius: 2px;
}

.big_donate:hover {
	background: #e84848;
}

.big_donate em {
	display: inline-block;
	background: url(../images/reader_donate_icon.png) center no-repeat;
	width: 22px;
	height: 50px;
	vertical-align: middle;
	margin-right: 10px;
}

.big_donate p {
	color: #fff;
	line-height: 50px;
	display: inline-block;
	height: 50px;
	overflow: hidden;
	font-size: 20px;
	letter-spacing: 1.5px;
	vertical-align: middle;
}

.small_donate {
	width: 87px;
	height: 24px;
	text-align: center;
	line-height: 24px;
	border: 1px solid #d32f2f;
	border-radius: 2px;
	font-size: 12px;
}

.small_donate em {
	background: url(../images/reader_donate_12.png) center no-repeat;
	width: 12px;
	height: 12px;
	margin-right: 5px;
	display: inline-block;
	vertical-align: -2px;
}

.small_donate.flowbot {
	position: absolute;
	right: 100px;
	top: -2px;
	color: #a11313;
}

.small_donate.flowbot:hover {
	color: #e84848;
	border-color: #e84848;
}

.chap_btnbox {
	display: table;
	height: 50px;
	width: 100%;
	user-select: none;
	border-spacing: 5px 0;
}

.chap_btnbox div {
	background: rgba(0, 0, 0, 0.03);
	border-radius: 2px;
	height: 50px;
	display: table-cell;
	border-collapse: separate;
	line-height: 50px;
	text-align: center;
	font-size: 14px;
	color: #333;
	letter-spacing: 0.93px;
	width: 180px;
}

.chap_btnbox div.nextchapter {
	width: 370px;
}

.chap_btnbox div:hover {
	background: rgba(232, 72, 72, 0.06);
	color: #e84848;
}

.ctrl_tips {
	text-align: center;
	font-size: 12px;
	color: #999;
	letter-spacing: 1.2px;
	line-height: 60px;
}

.chapter_forum {
	width: 360px;
	padding: 20px 20px 30px;
	position: absolute;
	top: 0;
	border-left: 1px solid #ccc;
}

.chapter_forum.fixed {
	position: fixed;
}

.chapter_forum .chapter_forum_tit {
	height: 48px;
	line-height: 48px;
}

.chapter_forum .chapter_forum_tit h3 {
	float: left;
	font-family: MicrosoftYaHei;
	font-size: 18px;
	color: #999;
	letter-spacing: 0.8px;
	margin-right: 15px;
	cursor: pointer;
	display: none;
}

.chapter_forum .chapter_forum_tit h3.active {
	color: #333;
	font-weight: 700;
}

.show_cha .chapter_forum .chapter_forum_tit h3:first-child {
	display: block;
}

.show_par .chapter_forum .chapter_forum_tit h3:last-child {
	display: block;
}

.chapter_forum_btn {
	border: 1px solid #d32f2f;
	border-radius: 2px;
	width: 87px;
	height: 24px;
	float: right;
	line-height: 24px;
	color: #a11313;
	letter-spacing: 0.86px;
	text-align: center;
	margin-top: 10px;
	font-size: 12px;
}

.chapter_forum_btn:hover {
	color: #e84848;
	border: color #e84848;
}

.forums-list .fail {
	background: url(../images/fail.png) no-repeat center top;
	width: 100%;
	margin: 103px auto 130px;
	padding-top: 166px;
	font-size: 14px;
	color: #999;
	text-align: center;
}

.forums-list .fail i {
	color: #a11313;
	cursor: pointer;
}

.forums-list .fail i:hover {
	color: #d32f2f;
}

.chapter_thread_list {
	height: calc(100vh - 381px + 122px);
	overflow-y: auto;
	transition: height 0.3s;
}

.chapter_forum.fixed .chapter_thread_list {
	height: calc(100vh - 286px + 122px);
}

.showSendTextArea .chapter_forum .chapter_thread_list {
	height: calc(100vh - 451px);
}

.showSendTextArea .chapter_forum.fixed .chapter_thread_list {
	height: calc(100vh - 400px);
}

.chapter_ipt {
	margin-bottom: 20px;
}

.chapter_forum_close {
	background: url(../images/widget_close.png) no-repeat center;
	width: 48px;
	height: 48px;
	position: absolute;
	right: 6px;
	top: 6px;
	cursor: pointer;
}

.par_form {
	display: none;
}

.form_ipt {
	background: #fff;
	border: 1px solid #e0e0e0;
	padding: 0 20px;
	transition: opacity ease 0.2s;
}

.form_ipt input {
	height: 50px;
	border: none;
	background: 0 0;
	width: 100%;
	color: #333;
	font-size: 14px;
	line-height: 50px;
	padding: 0;
}

.ch_form .form_text {
	transition: height ease 0.2s;
	overflow: hidden;
	border: none;
	margin-top: 0;
	height: 0;
}

.r_comment_container.showSendTextArea .ch_form .form_text {
	height: 154px;
	margin-top: -1px;
	border: 1px solid #e0e0e0;
}

.form_text {
	margin-bottom: 13px;
	border: none;
	padding: 0 20px;
	background: #fff;
	border: 1px solid #e0e0e0;
}

.form_text textarea {
	border: none;
	width: 100%;
	color: #333;
	font-size: 14px;
	height: 138px;
	line-height: 26px;
	display: block;
	padding-top: 12px;
	background: 0 0;
}

.par_form .form_text {
	margin-top: 0;
}

.par_form .form_text textarea {
	height: 50px;
	line-height: 50px;
	display: block;
	padding: 0;
}

.r_comment_container.showSendTextArea .par_form .form_text textarea {
	line-height: 26px;
	transition: height ease 0.2s;
	height: 138px;
	padding-top: 12px;
}

.form_publish {
	position: relative;
	display: none;
}

.r_comment_container.showSendTextArea .form_publish {
	display: block;
}

.form_code {
	float: left;
}

.form_code input {
	height: 50px;
	border: none;
	border-radius: 2px;
	width: 60px;
	height: 32px;
	background: #fff;
	border: 1px solid #e0e0e0;
	margin-right: 4px;
	float: left;
	text-align: center;
}

.form_code .code {
	height: 30px;
	float: left;
}

.form_code .code img {
	width: 60px;
	height: 30px;
	display: inline-block;
	margin-right: 4px;
}

.form_code .refresh {
	width: 16px;
	height: 32px;
	display: inline-block;
	background: url(../images/forums/book_ic2.png) no-repeat;
	background-position: 0 -381px;
}

.form_code .refresh:hover {
	background-position: -53px -381px;
}

.form_emoji {
	width: 20px;
	height: 30px;
	vertical-align: middle;
	cursor: pointer;
	position: relative;
	float: left;
	background: url(../images/forums/book_ic2.png) no-repeat;
	background-position: 0 -278px;
	margin-right: 30px;
}

.form_wnums {
	float: left;
	line-height: 30px;
	padding-right: 6px;
	color: #999;
	font-size: 14px;
}

.form_wnums i {
	color: #333;
}

.form_btn {
	background: #d32f2f;
	border-radius: 2px;
	width: 60px;
	height: 30px;
	line-height: 30px;
	text-align: center;
	font-size: 14px;
	color: #fff;
	float: left;
	opacity: 0.5;
}

.form_btn.clicked {
	opacity: 1;
	transition: opacity ease 0.1s;
}

.form_emoji_popup {
	padding: 12px 20px 0;
	background: #fafafa;
	box-shadow: 0 0 6px 0 rgb(0 0 0 / 10%);
	position: absolute;
	left: 13px;
	top: 30px;
	width: 346px;
	font-size: 0;
	text-align: left;
	z-index: 1000;
	margin-top: 15px;
	display: block;
}

.form_emoji_popup.hide {
	display: none;
}

.form_emoji_popup .emoji_em {
	width: 34px;
	height: 34px;
	margin-bottom: 16px;
	margin-right: 18px;
	vertical-align: middle;
}

.form_emoji_popup .emoji_em:hover {
	border: 1px solid #e84848;
	width: 32px;
	height: 32px;
}

.form_emoji_popup .emoji_em:nth-of-type(7n) {
	margin-right: 0;
}

.form_emoji_popup .arrow-t {
	background: url(../images/forums/rt.png) no-repeat;
	width: 21px;
	height: 13px;
	display: block;
	position: absolute;
	top: -13px;
	left: 50%;
	margin-left: -10px;
}

.reader_crumb,
.reader_crumb a {
	color: #666;
}

.bookinfo {
	color: #999;
}

.bookinfo a {
	color: #2a2a2a;
}

Y .bookinfo a:hover {
	color: #e84848;
}

.reader_box .content p {
	color: #333;
	-moz-user-select: none;
	-webkit-user-select: none;
}

.reader_lnkbtn {
	color: #333;
	font-size: 12px;
	width: 87px;
	height: 24px;
}

.reader_lnkbtn:hover {
	color: #e84848;
}

.content div {
	font-size: 14px;
}

body.rb_1 {
	background: #d9cdb6;
}

.rb_1 .reader_main {
	background: #faeed7;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_1 .chapter_forum {
	background: #faeed7;
}

body.rb_2 {
	background: #b9c1c9;
}

.rb_2 #readerFt .reader_main .chapter_forum,
.rb_2 .reader_main {
	background: #e9eff5;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_2 .authortips .con,
.rb_2 .authortips .con em.arr {
	background-color: #f1f5f9;
}

body.rb_3 {
	background: #c4ccc0;
}

.rb_3 #readerFt .reader_main .chapter_forum,
.rb_3 .reader_main {
	background: #e7f0e1;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_3 .authortips .con,
.rb_3 .authortips .con em.arr {
	background-color: #f0f6ed;
}

body.rb_4 {
	background: #d4c7cc;
}

.rb_4 #readerFt .reader_main .chapter_forum,
.rb_4 .reader_main {
	background: #f2e4e9;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_4 .authortips .con,
.rb_4 .authortips .con em.arr {
	background-color: #f7eef1;
}

body.rb_5 {
	background: #ccc;
}

.rb_5 #readerFt .reader_main .chapter_forum,
.rb_5 .reader_main {
	background: #f7f7f7;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_5 .authortips .con,
.rb_5 .authortips .con em.arr {
	background-color: #fafafa;
}

body.rb_6 {
	background: #d6d5c1;
}

.rb_6 #readerFt .reader_main,
.rb_6 #readerFt .reader_main .chapter_forum {
	background: url(../images/reader/bg6.jpg) center top repeat-x #f9f7e3;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_6 .authortips .con,
.rb_6 .authortips .con em.arr {
	background-color: #f6f4ea;
}

body.rb_7 {
	background: #b8b8b8;
}

.rb_7 #readerFt .reader_main .chapter_forum,
.rb_7 .reader_main {
	background: url(../images/reader/bg7.png);
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_7 .authortips .con,
.rb_7 .authortips .con em.arr {
	background-color: #fafafa;
}

body.rb_8 {
	background: #222;
}

.rb_8 .reader_main {
	background: #343434;
	box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.05);
}

.rb_8 .bookinfo a,
.rb_8 .bookinfo span,
.rb_8 .chapter_forum .chapter_forum_tit h3,
.rb_8 .chapter_forum .chapter_forum_tit span b,
.rb_8 .for-rp-con .dec a,
.rb_8 .for-rp-con h4 > a,
.rb_8 .for-rp-con h4 > a i,
.rb_8 .reader_box .content p,
.rb_8 .reader_lnkbtn,
.rb_8 .title_txtbox {
	color: #999;
}

.rb_8 .bookinfo {
	color: #666;
}

.rb_8 .reader_line {
	opacity: 0.4;
}

.rb_8 .chap_btnbox div {
	background: #3e3e3e;
	color: #999;
}

.rb_8 .chap_btnbox div:hover {
	background: rgba(232, 72, 72, 0.05);
	color: #e84848;
}

.rb_8 .ctrl_tips {
	color: #666;
}

.rb_8 .gpd_btnpal a {
	background-color: #343434;
}

.rb_8 .gpd_btnpal a:hover {
	background-color: rgba(52, 52, 52, 0.6);
}

.rb_8 .gpd_btnpal a.active {
	background-color: rgba(34, 34, 34, 0.98);
	box-shadow: 2px 2px 5px 0 rgba(0, 0, 0, 0.3);
}

.rb_8 .gpd_btnpal a.active:after {
	background-color: rgba(34, 34, 34, 0.98);
}

.rb_8 .gpd_btnpal a.bookShelf.added,
.rb_8 .gpd_btnpal a.bookShelf.added:hover {
	background-color: #343434;
	color: #666;
}

.rb_8 .reader_box_spline {
	background: #222;
}

.rb_8 .reader_box {
	border-bottom: 1px solid rgba(204, 204, 204, 0.4);
}

.rb_8 .reader_box .content p.active .con_txt {
	background: rgba(255, 255, 255, 0.08);
}

.rb_8 .chapter_forum .chapter_forum_tit h3 {
	color: #666;
}

.rb_8 .chapter_forum .chapter_forum_tit h3.active {
	color: #999;
}

.rb_8 .form_ipt,
.rb_8 .r_comment_container .form_text,
.rb_8 .r_comment_container.showSendTextArea .form_text {
	background: #3e3e3e;
	border: 1px solid #3c3c3c;
}

.rb_8 .form_ipt input,
.rb_8 .r_comment_container .form_text textarea {
	background: 0 0;
	color: #999;
}

.rb_8 .r_comment_container.showSendTextArea .ch_form .form_text {
	border-top: 1px solid #434343;
}

.rb_8 .form_code input {
	background: #3e3e3e;
	border: none;
	color: #999;
}

.rb_8 .form_wnums i {
	color: #999;
}

.rb_8 .reader_order h4 .fr {
	color: #666;
}

.rb_8 .reader_lnkbtn:hover {
	border: 1px solid #e84848;
	color: #e84848;
}

.rb_8 .chapter_forum .chapter_forum_tit,
.rb_8 .for-rp-con {
	border-bottom-color: #4b4b4b;
}

.rb_8 .chapter_forum {
	background: #343434;
	border-left: 1px solid rgba(204, 204, 204, 0.4);
}

.rb_8 .authortips .con,
.rb_8 .authortips .con em.arr {
	background-color: #484848;
	border-color: #333;
	color: #999;
}

.rb_8 .reader_order {
	background: rgba(34, 34, 34, 0.8);
}

.rb_8 .reader_order h4 {
	border-color: #4b4b4b;
	color: #999;
}

.rb_8 .gpd_flt_setting {
	background: rgba(34, 34, 34, 0.98);
}

.rb_8 .gpd_setLine .gpd_setcon a,
.rb_8 .sbw_font {
	background-color: rgba(250, 250, 250, 0.6);
	border-color: #4b4b4b;
}

.rb_8 .gpd_flt_setting h4 {
	color: #999;
	border-color: #4b4b4b;
}

.rb_8 .gpd_setLine .gpd_setcon a.active,
.rb_8 .gpd_setLine .gpd_setcon a:hover,
.rb_8 .gpd_setLine.gpd_setstyle .gpd_setcon a.active,
.rb_8 .gpd_setLine.gpd_setstyle .gpd_setcon a:hover {
	color: #333;
}

.rb_8 .gpd_setsize .nowfont {
	float: left;
	color: #666;
	border-color: #4b4b4b;
}

.rb_8 .gpd_setLine .gpd_setcon .sbw_font a {
	background-color: transparent;
}

.rb_8 .reader_box .content .r_count {
	border: 1px solid #b3b3b3;
	color: #999;
}

.rb_8 .reader_box .content .r_count i {
	border-right: 4px solid #b3b3b3;
}

.rb_8 .reader_box .content .r_count i:after {
	border-right: 4px solid #343434;
}

.gpd_setfont .sbf_1,
.rft_1 p,
.rft_1 p .con_txt {
	font-family: "å®‹ä½“", SimSun, STSong;
}

.gpd_setfont .sbf_2,
.rft_2 p,
.rft_2 p .con_txt {
	font-family: "é»‘ä½“", SimHei, STHeiti;
}

.gpd_setfont .sbf_3,
.rft_3 p,
.rft_3 p .con_txt {
	font-family: "å¾®è½¯é›…é»‘", Microsoft YaHei, Apple LiGothic Medium;
}

.gpd_setfont .sbf_4,
.rft_4 p,
.rft_4 p .con_txt {
	font-family: "æ¥·ä½“", KaiTi, BiauKai;
}

.rw_1 {
	width: 640px;
}

.rw_1.rw_comment_open {
	width: 1040px;
}

.rw_1 .reader_box {
	width: 560px;
	padding: 8px 40px;
}

.rw_1.rw_comment_open .reader_main {
	width: 1040px;
}

.rw_1 .reader_order,
.rw_1 .reader_order .reader_ordercon {
	width: 563px;
}

.rw_1 .bookinfo .reader_lnkbtn {
	margin-top: -95px;
	right: -30px;
}

.rw_2 {
	width: 800px;
}

.rw_2.rw_comment_open {
	width: 1200px;
}

.rw_2.rw_comment_open .reader_main {
	width: 1200px;
}

.rw_2 .reader_box {
	width: 600px;
}

.rw_2 .bookinfo .reader_lnkbtn {
	margin-top: -85px;
	right: -82px;
}

.rw_3 {
	width: 960px;
}

.rw_3.rw_comment_open {
	width: 1360px;
}

.rw_3.rw_comment_open .reader_main {
	width: 1360px;
}

.rw_3 .reader_box {
	// width: 760px;
}

.rw_4 {
	width: 1100px;
}

.rw_4.rw_comment_open {
	width: 1500px;
}

.rw_4 .reader_box {
	width: 900px;
}

.rw_5 {
	width: 1440px;
}

.rw_5.rw_comment_open {
	width: 1840px;
}

.rw_5 .reader_box {
	width: 1240px;
}

.rw_6 {
	width: 1700px;
}

#uiGPReaderAct {
	position: fixed;
	top: 113px;
	left: 50%;
	margin-left: -550px;
}

#uiGPUserAct {
	position: fixed;
	bottom: 0;
	left: 50%;
	margin-left: 490px;
}

#uiGPReaderAct,
#uiGPUserAct {
	width: 70px;
}

.goodgame {
	width: 100%;
	height: 1920px;
	position: fixed;
	top: 0;
	background-position: center top;
	background-repeat: no-repeat;
	display: none;
	opacity: 0.2;
}

.goodgame a {
	display: block;
	width: 100%;
	height: 1920px;
}

.gpd_btnpal {
	position: relative;
	z-index: 11;
}

.gpd_btnpal a {
	float: left;
	width: 43px;
	height: 25px;
	background-color: rgba(250, 250, 250, 0.3);
	font-size: 12px;
	color: #999;
	letter-spacing: 0.93px;
	text-align: left;
	padding-left: 17px;
	padding-top: 35px;
	margin-bottom: 2px;
	background-image: url(../images/reader_ico.png);
	background-repeat: no-repeat;
	position: relative;
}

.gpd_btnpal a:hover {
	background-color: rgba(250, 250, 250, 0.5);
}

.gpd_btnpal a.active {
	width: 53px;
	background-color: rgba(250, 250, 250, 0.98);
	box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.2);
}

.gpd_btnpal a.active::after {
	content: "";
	background-color: rgba(250, 250, 250, 0.98);
	width: 10px;
	position: absolute;
	top: 0;
	left: 65px;
	height: 60px;
}

.gpd_btnpal .chapterList {
	background-position: 0 -7px;
}

.gpd_btnpal .bookShelf {
	background-position: 0 -127px;
}

.gpd_btnpal a.bookShelf.added,
.gpd_btnpal a.bookShelf.added:hover {
	padding-left: 11px;
	width: 49px;
	cursor: default;
	background-position: -120px -187px;
	color: #b3b3b3;
	background-color: rgba(250, 250, 250, 0.3);
}

.gpd_btnpal .bookDetail {
	background-position: 0 -67px;
}

.gpd_btnpal .readerSetting {
	background-position: 0 -187px;
}

.gpd_btnpal .view {
	background-position: 0 -248px;
}

.gpd_btnpal .donate {
	background-position: -60px -7px;
}

.gpd_btnpal .monthTicket {
	background-position: -60px -67px;
}

.gpd_btnpal .chapterForum {
	background-position: -60px -127px;
}

.gpd_btnpal .returntop {
	background-position: -60px -187px;
}

.gpd_btnpal .report {
	background-position: -61px -246px;
}

.gpd_flt_chapterlist {
	width: 740px;
	height: 510px;
	background-color: rgba(250, 250, 250, 0.98);
	box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.2);
	left: 70px;
	position: absolute;
	display: none;
}

.gpd_flt_setting {
	width: 500px;
	height: 450px;
	background-color: rgba(250, 250, 250, 0.98);
	box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.2);
	left: 70px;
	position: absolute;
	display: none;
	padding: 0 35px;
}

.gpd_flt_setting h4 {
	font-size: 16px;
	color: #333;
	letter-spacing: 0.83px;
	height: 50px;
	line-height: 60px;
	font-weight: 700;
	border-bottom: 1px solid #e6e6e6;
	overflow: hidden;
	margin-bottom: 20px;
}

.gpd_setLine {
	clear: both;
	margin-bottom: 20px;
}

.gpd_setLine .gpd_setcon a {
	background: #fff;
	border: 1px solid #d6d6d6;
	border-radius: 2px;
	height: 34px;
	line-height: 34px;
	padding: 0 28px;
	float: left;
	margin-right: 9px;
	font-size: 14px;
	color: #333;
}

.gpd_setLine .gpd_setcon a.active,
.gpd_setLine .gpd_setcon a:hover,
.gpd_setLine.gpd_setstyle .gpd_setcon a.active,
.gpd_setLine.gpd_setstyle .gpd_setcon a:hover {
	border-color: #e84848;
	color: #e84848;
}

.gpd_setName,
.gpd_setcon {
	display: table-cell;
	vertical-align: middle;
}

.gpd_setName {
	font-size: 14px;
	color: #666;
	letter-spacing: 0.72px;
	width: 85px;
}

.gpd_setstyle div {
	height: 50px;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a {
	width: 38px;
	height: 38px;
	border: 1px solid #d6d6d6;
	border-radius: 40px;
	float: left;
	padding: 0;
	margin-right: 10px;
}

.sbw_font {
	border: 1px solid #d6d6d6;
	overflow: hidden;
	background: #fff;
	border-radius: 2px;
}

.gpd_setsize .nowfont {
	float: left;
	height: 18px;
	border: 2px solid #e6e6e6;
	font-size: 18px;
	line-height: 18px;
	padding: 0 28px;
	border-width: 0 2px;
	margin-top: 8px;
	color: #999;
}

.gpd_setLine .gpd_setcon .sbw_font a {
	border: 0;
	font-size: 18px;
	margin: 0;
	padding: 0 20px;
}

.gpd_setLine .gpd_setcon .sbw_font a:hover {
	color: #e84848;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_1 {
	background: #faeed7;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_2 {
	background: #e9eff5;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_3 {
	background: #e7f0e1;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_4 {
	background: #f2e4e9;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_5 {
	background: #f7f7f7;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_6 {
	background: url(../images/reader/style6.png);
	background-size: cover;
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_7 {
	background: url(../images/reader/bg7.png);
}

.gpd_setLine.gpd_setstyle .gpd_setcon a.sbs_8 {
	background-color: #343434;
	background-image: url(../images/reader_ico.png);
	background-position: -132px -72px;
}

.auto_switch {
	cursor: pointer;
}

.auto_switch span {
	position: relative;
	z-index: 1;
	width: 42px;
	height: 24px;
	margin-right: 12px;
	border-radius: 50px;
	background: #d6d6d6;
	display: inline-block;
	position: relative;
	margin-top: 3px;
	transition: all linear 0.2s;
}

.auto_switch span i {
	width: 20px;
	height: 20px;
	background: #fff;
	border-radius: 20px;
	display: block;
	box-shadow: 0 0 5px #bbb;
	position: absolute;
	top: 2px;
	transition: left linear 0.2s;
}

.auto_switch span.on {
	background: #c02727;
}

.auto_switch span.on i {
	left: 20px;
	box-shadow: 0 0 5px #c02727;
}

.auto_switch span.off i {
	left: 2px;
}

.gpd_btnLine {
	text-align: center;
	padding: 15px 0;
}

.gpd_btnLine button {
	border-radius: 2px;
	width: 130px;
	height: 36px;
	line-height: 36px;
	font-size: 14px;
	display: inline-block;
	margin: 0 30px;
	cursor: pointer;
}

.gpd_btnLine .confirm {
	background: #d32f2f;
	border: 1px solid #d32f2f;
	color: #fff;
}

.gpd_btnLine .reset {
	background: #fff;
	border: 1px solid #d6d6d6;
	color: #333;
}

.for-comment em,
.for-praise em,
.for-rp-con .dec .hasPic,
.for-rp-con h4 .hasPic {
	background: url(../images/forums/book_ic2.png) no-repeat;
	vertical-align: -3px;
	display: inline-block;
}

.forums-list li {
	padding: 30px 0 0;
}

.user-head {
	position: relative;
	width: 50px;
	height: 50px;
	float: left;
	margin-right: 20px;
	text-align: center;
}

.for-rp-con {
	overflow: hidden;
	padding-bottom: 22px;
	border-bottom: 1px dotted #d6d6d6;
}

.for-rp-con.no-bor {
	border: none;
}

.user-head img {
	border-radius: 25px;
	margin-bottom: 6px;
}

.user-head em {
	background: url(../images/lv5.gif) no-repeat;
	width: 16px;
	height: 16px;
	display: inline-block;
	position: absolute;
	right: 0;
	bottom: 0;
}

.user-head span {
	display: block;
	font-size: 12px;
	color: #999;
}

.user-head .lv5 {
	background: url(../images/lv5.gif) no-repeat;
}

.user-head .lv4 {
	background: url(../images/lv4.gif) no-repeat;
}

.user-head .lv3 {
	background: url(../images/lv3.gif) no-repeat;
}

.user-head .lv2 {
	background: url(../images/lv2.gif) no-repeat;
}

.user-head .lv1 {
	background: url(../images/lv1.gif) no-repeat;
}

.for-rp-con .name {
	color: #999;
	margin-bottom: 12px;
	position: relative;
	font-weight: 700;
	line-height: 25px;
	font-size: 14px;
}

.for-reset {
	float: right;
	cursor: pointer;
}

.for-reset.show .reset-list {
	display: block;
}

.reset-list {
	display: inline-block;
	display: none;
}

.reset-list span {
	cursor: pointer;
	border: 1px solid #d32f2f;
	border-radius: 2px;
	padding: 0 16px;
	height: 23px;
	text-align: center;
	line-height: 23px;
	display: inline-block;
	color: #d32f2f;
	margin-left: 5px;
}

.reset-list span:hover {
	background: #d32f2f;
	color: #fff;
}

.for-reset-btn {
	background-position: 0 -316px;
	width: 19px;
	height: 25px;
	display: inline-block;
	vertical-align: -8px;
	margin-left: 7px;
}

.for-reset-btn.hover,
.for-reset-btn:hover {
	background-position: -53px -316px;
}

.for-label {
	border-radius: 2px;
	font-size: 12px;
	margin-left: 7px;
	width: 32px;
	height: 18px;
	text-align: center;
	line-height: 18px;
	display: inline-block;
}

.for-label.au {
	background: #fc7403;
	color: #fff;
	border: 1px solid #fc7403;
}

.for-label.cir {
	opacity: 0.6;
	border: 1px solid #02b389;
	color: #02b389;
}

.for-label.lz {
	opacity: 0.6;
	border: 1px solid #ab93f8;
	color: #ab93f8;
}

.for-label.weak {
	color: #fc7403;
	border: 1px solid #fc7403;
	width: 58px;
}

.for-rp-con .name .floor {
	color: #999;
	float: right;
}

.for-rp-con .name .floor i {
	font-size: 16px;
	font-weight: 700;
	padding-right: 3px;
}

.for-rp-con h4 {
	font-size: 16px;
	color: #333;
	margin-bottom: 8px;
	font-weight: 700;
}

.for-rp-con h4 > a,
.for-rp-con h4 > a i {
	color: #333;
	font-weight: 700;
}

.for-rp-con h4 > a i.red {
	color: #d32f2f;
}

.for-rp-con h4 .hasPic {
	background-position: -106px -247px;
	color: #999;
	font-weight: 200;
	padding-left: 30px;
	line-height: 25px;
	vertical-align: 2px;
	margin-left: 10px;
}

.for-rp-con .dec .jh,
.for-rp-con .dec a .jh,
.for-rp-con .dec a .st,
.for-rp-con h4 .jh,
.for-rp-con h4 .st {
	margin-right: 5px;
	background: rgba(232, 72, 72, 0.6);
	border-radius: 2px;
	font-size: 12px;
	color: #fff;
	padding: 0 5px;
	height: 18px;
	text-align: center;
	line-height: 18px;
	display: inline-block;
	vertical-align: 1px;
}

.for-rp-con .dec a .st,
.for-rp-con h4 .st {
	background: #8c9abd;
}

.for-rp-con .dec {
	margin-bottom: 15px;
	color: #333;
	line-height: 25px;
	position: relative;
}

.for-rp-con .dec a {
	color: #333;
	display: block;
}

.for-rp-con .dec a .gray {
	color: #999;
}

.for-rp-con .dec .hasPic {
	background-position: -106px -247px;
	color: #999;
	font-weight: 200;
	padding-left: 30px;
	line-height: 25px;
	display: inline-block;
	vertical-align: 1px;
	margin-left: 10px;
}

.for-rp-con .dec .emoji_em {
	margin-bottom: 1px;
}

.for-rp-con .dec p {
	display: inline-block;
}

.for-rp-con .dec.hide a,
.for-rp-con .dec.hide p {
	max-height: 76px;
	overflow: hidden;
	font-size: 14px;
}

.for-rp-con .dec p .gray {
	color: #999;
}

.for-rp-con .dec img {
	margin: 15px 0 20px;
	display: block;
	max-width: 640px;
	max-height: 480px;
}

.for-rp-con .JdecAll img {
	max-width: 240px;
	border: 1px solid #979797;
	margin-bottom: 5px;
}

.for-rp-con .dec .show-more {
	margin: 0 0 5px;
	cursor: pointer;
	float: right;
}

.for-rp-con .dec .show-more a {
	display: inline;
}

.for-rp-con .dec.hide .show-more em {
	background: url(../images/more.png) no-repeat right center;
	display: inline-block;
	width: 8px;
	height: 9px;
}

.for-rp-con .other .date {
	color: #999;
	font-size: 14px;
}

.for-rp-con .for-list {
	font-size: 0;
}

.for-le {
	cursor: pointer;
	display: inline-block;
	margin-left: 15px;
	color: #999;
}

.for-le:hover,
.for-rp-con .dec .show-more a:hover {
	color: #e84848;
}

.for-le em {
	width: 20px;
	height: 18px;
	display: inline-block;
}

.for-comment,
.for-praise {
	color: #999;
	font-size: 14px;
}

@keyframes uped {
	from {
		transform: scale(2);
		opacity: 0;
	}

	to {
		transform: scale(1);
		opacity: 1;
	}
}

.for-praise {
	margin-left: 30px;
}

.for-praise em {
	background-position: 0 0;
}

.for-praise.popin em {
	animation: uped 0.5s;
	animation-fill-mode: forwards;
}

.for-praise:hover em {
	background-position: -53px 0;
}

.for-praise.uped em {
	background-position: -106px 0;
}

.for-comment em {
	background-position: 0 -34px;
}

.for-comment:hover em {
	background-position: -53px -34px;
}

.chapter_thread .empty {
	background: url(../images/empty.png) no-repeat center top;
	width: 100%;
	margin: 59px auto 0;
	padding-top: 196px;
	font-size: 14px;
	color: #999;
	text-align: center;
	padding-bottom: 130px;
}

.chapter_thread .locking {
	background: url(../images/lock.png) no-repeat center top;
	width: 100%;
	margin: 59px auto 130px;
	padding-top: 196px;
	font-size: 14px;
	color: #999;
	text-align: center;
}

.chapter_morethread {
	font-size: 14px;
	color: #999;
	letter-spacing: 1.17px;
	text-align: center;
	margin: 20px 0 30px;
}

.chapter_morethread a {
	color: #999;
}

.chapter_morethread .more-link em {
	background: url(../images/more.png) no-repeat right center;
	display: inline-block;
	width: 8px;
	height: 9px;
}

.chapter_morethread .more-link:hover {
	text-decoration: underline;
	color: #e84848;
}

.zh_sidebar {
	display: none;
}

.flex {
	display: flex;
	display: -webkit-box;
	display: -webkit-flex;
	display: -ms-flexbox;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
}

.flex--fluid {
	-webkit-box-flex: 1;
	-moz-box-flex: 1;
	box-flex: 1;
	-webkit-flex: 1;
	-moz-flex: 1;
	-ms-flex: 1;
	flex: 1;
}

.flex--2 {
	-webkit-box-flex: 2;
	-moz-box-flex: 2;
	-webkit-flex: 2;
	-moz-flex: 2;
	-ms-flex: 2;
	flex: 2;
}

.flex--3 {
	-webkit-box-flex: 3;
	-moz-box-flex: 3;
	-webkit-flex: 3;
	-moz-flex: 3;
	-ms-flex: 3;
	flex: 3;
}

.flex--lock {
	-webkit-flex: 0 0 auto;
	-moz-flex: 0 0 auto;
	-ms-flex: 0 0 auto;
	flex: 0 0 auto;
}

.flex--vertical {
	-webkit-flex-direction: column;
	-moz-flex-direction: column;
	-ms-flex-direction: column;
	flex-direction: column;
}

.flex--center {
	-webkit-box-pack: center;
	-webkit-flex-pack: center;
	-moz-flex-pack: center;
	-ms-flex-pack: center;
	-webkit-justify-content: center;
	-moz-justify-content: center;
	-ms-justify-content: center;
	justify-content: center;
}

.flex--justify {
	-webkit-flex-pack: justify;
	-moz-flex-pack: justify;
	-ms-flex-pack: justify;
	-webkit-justify-content: space-between;
	-moz-justify-content: space-between;
	-ms-justify-content: space-between;
	justify-content: space-between;
}

.flex--wrap {
	-webkit-flex-wrap: wrap;
	-moz-flex-wrap: wrap;
	-ms-flex-wrap: wrap;
	flex-wrap: wrap;
}

.flex--align_stretch {
	-webkit-box-align: stretch;
	-webkit-flex-align: stretch;
	-moz-flex-align: stretch;
	-ms-flex-align: stretch;
	-webkit-align-items: stretch;
	-moz-align-items: stretch;
	-ms-align-items: stretch;
	align-items: stretch;
}

.flex--align_center {
	-webkit-box-align: center;
	-webkit-flex-align: center;
	-moz-flex-align: center;
	-ms-flex-align: center;
	-webkit-align-items: center;
	-moz-align-items: center;
	-ms-align-items: center;
	align-items: center;
}

.for-comment.for-le {
	display: none;
}

.gpd_btnpal .chapterForum {
	display: none;
}

.state-hide {
	display: none !important;
}

.gpd_flt_catalog {
	position: absolute;
	top: 0;
	left: 69px;
	width: 630px;
	background-color: rgba(250, 250, 250, 0.98);
	box-shadow: 0 2px 5px 0 rgb(0 0 0 / 20%);
	display: none;
	overflow: hidden;
}

.catalog_tit {
	font-size: 28px;
	font-weight: 700;
	color: #333;
	line-height: 30px;
	padding: 68px 32px 0;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(236, 236, 236, 0.7);
}

.catalog_tit .lang i {
	font-family: HelveticaNeue;
	font-size: 22px;
	font-weight: 700;
}

.catalog_tit .sort {
	float: right;
	font-size: 14px;
	font-family: PingFangSC, PingFangSC-Regular;
	font-weight: 400;
	color: #666;
	background: rgba(244, 245, 247, 1);
	border-radius: 14px;
	width: 104px;
	margin-top: 2px;
	cursor: pointer;
}

.catalog_tit .sort i {
	display: inline-block;
	width: 50%;
	height: 28px;
	text-align: center;
	line-height: 28px;
	border-radius: 14px;
	color: #666;
}

.catalog_tit .sort i.cur {
	background: linear-gradient(322deg, #e60000 7%, #ff6800 94%);
	color: #fff;
}

.nowchaptername span {
	height: 50px;
	background: rgba(244, 245, 247, 1);
	font-size: 16px;
	color: #999;
	line-height: 50px;
	padding-left: 32px;
	display: block;
}

.nowchaptername a {
	color: #666;
	padding-left: 16px;
}

.gpd_flt_catalog .catalog_scroll_wrap {
	position: relative;
	overflow: auto;
	overflow-x: hidden;
	min-height: 235px;
	margin-top: 4px;
}

.gpd_flt_catalog .gpd_close_catalog {
	position: absolute;
	top: 32px;
	right: 32px;
	width: 20px;
	height: 20px;
	transition: 0.5s;
	transform: rotate(0);
	background: url(../images/close_2.png) no-repeat;
	background-size: 20px;
}

.catalog_list {
	padding: 0 32px;
}

.catalog_list > div {
	padding-top: 28px;
}

.catalog_list h3 {
	position: relative;
	z-index: 2;
	transition: background 0.3s;
	font-size: 20px;
	color: #333;
	font-weight: 500;
	line-height: 20px;
	margin-bottom: 20px;
}

.catalog_list h3.org {
	color: #ff8d36;
}

.catalog_list h3 cite {
	display: flex;
}

.catalog_list h3 span {
	display: -webkit-box;
	word-break: break-all;
	white-space: normal;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	max-width: 330px;
	height: 20px;
	overflow: hidden;
}

.catalog_list h3 i {
	font-size: 14px;
	color: #999;
	margin-left: 16px;
	display: inline-block;
}

.catalog_list h3 em {
	float: right;
	width: 8px;
	height: 8px;
	border-left: 2px solid #666;
	border-bottom: 2px solid #666;
	transform: rotate(135deg);
	display: block;
	border-radius: 2px;
	transform-origin: center;
	margin-top: 8px;
	cursor: pointer;
}

.catalog_list h3.hide em {
	transform: rotate(-45deg);
	margin-top: 4px;
}

.volume_list ul {
	overflow: hidden;
}

.volume_list {
	clear: both;
}

.volume_list.hide {
	display: none;
}

.volume_list li {
	float: left;
	width: 50%;
	line-height: 48px;
	font-size: 16px;
	color: #666;
	display: flex;
	font-weight: 400;
}

.volume_list li.cur a {
	color: rgba(230, 0, 0, 1);
}

.volume_list li a {
	color: #666;
	display: -webkit-box;
	word-break: break-all;
	white-space: normal;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	max-width: 90%;
	height: 48px;
	overflow: hidden;
	margin-right: 10px;
}

.volume_list li a:hover {
	color: #e60000;
}

.volume_list li em.ic_vip {
	width: 16px;
	height: 48px;
	background: url(../images/vip@2.png) no-repeat center;
	background-size: 16px;
	display: inline-block;
	margin-right: 8px;
	float: left;
}

.volume_list li .ic_update {
	background: url(../images/update.png) no-repeat;
	background-size: 30px;
	width: 30px;
	height: 16px;
	display: inline-block;
	margin-top: 16px;
}

.rb_8 .gpd_flt_catalog {
	background: rgba(34, 34, 34, 0.98);
}

.rb_8 .gpd_flt_catalog .gpd_close_catalog {
	background: url(../images/close_1.png) no-repeat;
	background-size: 20px;
}

.rb_8 .gpd_flt_catalog .catalog_tit {
	border-bottom: none;
	color: #999;
}

.rb_8 .gpd_flt_catalog .catalog_list h3 span {
	color: #999;
}

.rb_8 .gpd_flt_catalog .catalog_list h3.org span {
	color: rgba(255, 141, 54, 0.5);
}

.rb_8 .gpd_flt_catalog .catalog_list h3 i {
	color: #666;
}

.rb_8 .gpd_flt_catalog .catalog_tit .sort i {
	color: #666;
}

.rb_8 .gpd_flt_catalog .catalog_tit .sort {
	background: #333;
}

.rb_8 .gpd_flt_catalog .catalog_tit .sort i.cur {
	background: #990913;
	color: rgba(255, 252, 252, 0.6);
}

.rb_8 .gpd_flt_catalog .volume_list li.cur a {
	color: #999;
}

.rb_8 .gpd_flt_catalog .nowchaptername span {
	background: #333;
}
</style>
