// 这个版本是提取游民星空游戏页面ps5发售表的数据, 并存储到MySQL数据库中
// 2025年02月08日11:38:57
// 修复了服务器上puppeteer的问题, 重新部署 (完美版)
var cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const mysql = require("mysql2/promise");
var targetgametype = "ps5";
var nowTime = "";
var url = `https://ku.gamersky.com/release/${targetgametype}_${nowTime}/`;

const nodeSchedule = require("node-schedule");

// maowei 服务器 创建数据库连接池
const pool = mysql.createPool({
 host: "8.166.130.216",
  user: "admin", //用户名
  password: "Admin@2025!", //密码
  database: "vue3", // 数据库名称
  port: "3306", //端口号
  waitForConnections: true, // 等待连接池中的连接可用
  connectionLimit: 10, // 连接池最大连接数
  queueLimit: 0, // 连接池最大等待队列数
});

// 获取当前时间 格式为: yyyy-MM-dd HH:mm:ss
function getNowFormatDate() {
  var date = new Date();

  var seperator1 = "-";

  var seperator2 = ":";

  var month = date.getMonth() + 1;

  var strDate = date.getDate();

  if (month >= 1 && month <= 9) {
    month = "0" + month;
  }

  if (strDate >= 0 && strDate <= 9) {
    strDate = "0" + strDate;
  }

  var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate + " " + date.getHours() + seperator2 + date.getMinutes() + seperator2 + date.getSeconds();

  return currentdate;
}

function formatDateMonth(dateStr) {
  // 去掉前后空格，确保字符串不包含多余的空格
  dateStr = dateStr.trim();

  // 通用的年和月正则表达式，支持所有年份（如 2024年、2025年、2026年 等）
  const yearMonthRegex = /(\d{4})[年](\d{1,2})[月]/;

  // 完整的日期格式 "YYYY-MM-DD"
  const fullDateRegex = /(\d{4})-(\d{2})-(\d{2})/;

  // 处理 '2025年2月' 或 '2025年12月' 格式, 将日期格式化为 '2025-02-01'
  if (yearMonthRegex.test(dateStr)) {
    const match = dateStr.match(yearMonthRegex);
    let year = match[1];
    let month = match[2];

    // 如果月份是1位数，补充前导零
    if (month.length === 1) {
      month = "0" + month;
    }

    // 返回 'YYYY-MM-01'
    return `${year}-${month}`;
  }

  // 处理 '2025-02-15' 这种已经是完整日期的格式, 直接返回
  if (fullDateRegex.test(dateStr)) {
    return dateStr; // 已经是 YYYY-MM-DD 格式，直接返回
  }

  // 如果没有匹配任何已知格式，返回原始字符串
  return dateStr;
}

// 获取爬取的页面时间 格式为: yyyyMM
function getNowTime() {
  var date = new Date();

  var month = date.getMonth() + 1;

  if (month >= 1 && month <= 9) {
    month = "0" + month;
  }

  var currentdate = date.getFullYear() + month;
  console.log("currentdate :>> ", currentdate);
  nowTime = currentdate;
  return currentdate;
}

async function getHtml() {
  getNowTime(); // 获取当前时间
  const browser = await puppeteer.launch({ 
    headless: true,  // 无界面模式
    args: ['--no-sandbox', '--disable-setuid-sandbox']  // 关键参数
  }); // 创建一个浏览器实例
  

  const page = await browser.newPage(); // 创建一个页面实例
  url = `https://ku.gamersky.com/release/${targetgametype}_${nowTime}/`;
  // url = `https://ku.gamersky.com/release/ps5_202501/`;
  console.log("url :>> ", url); 
  await page.goto(url); // 跳转到指定页面

  setTimeout(async function () {
    const bodyHandle = await page.$("body"); // 选择器

    const html = await page.evaluate((body) => body.innerHTML, bodyHandle); // 获取页面内容

    let $ = cheerio.load(html); // 传入页面内容
    let _data = [];
    $(".Mid")
      .find("div.Mid_L > ul li")
      .each((index, item) => {
        let title = $(item).find(".tit a").text();
        let url = $(item).find(".img a").attr("href");
        let img = $(item).find(".img a img").attr("src");
        let time = $(item).find(".PF_1 div:nth-child(3)").text().split("：")[1];
        let gameType = $(item).find(".PF_1 div:nth-child(4) a").text();
        let production = $(item).find(".PF_1 div:nth-child(5)").text().split("：")[1];
        let introduction = $(item).find(".PF_1 div.Intr > p").text().trim();
        // 已发售游戏包含玩家评分分数和玩家评论人数
        let playerRating = $(item).find(".PF_2 > div > div.PF2-con .wjnum .num").text();
        let playerRatingPeopleNum = $(item).find(".PF_2 > div > div.PF2-txt > div").text();
        // 未发售游戏包含期待值
        let expectedValue = $(item).find(".PF2-con .qdnum .num").text();
        let update_time = getNowFormatDate();

        // 这里的time需要做处理, 因为获取的有时候是2024-02, 有时候是2025-02-15, 有时候获取的是2024年2月, 现在需要遇到有出现月这种文字的话, 需要转换成2024-02
        console.log("time1 :>> ", time);
        time = formatDateMonth(time);
        console.log("time2 :>> ", time);
        _data.push({
          title,
          url,
          img,
          time,
          gameType,
          production,
          introduction,
          update_time,
          playerRating,
          playerRatingPeopleNum,
          expectedValue,
          targetgametype,
        });
      });
    console.log(_data);
    saveDataToMySQL(_data);
    await bodyHandle.dispose(); // 关闭

    await browser.close(); // 关闭浏览器
  }, 200);
}

// 将数据存储到MySQL数据库的函数
async function saveDataToMySQL(dataArray) {
  let connection;

  try {
    connection = await pool.getConnection(); // 从连接池中获取一个连接

    if (!connection) {
      throw new Error("数据库连接建立失败");
    }

    await connection.beginTransaction(); // 开始事务

    for (let i = 0; i < dataArray.length; i++) {
      // 遇到相同的title而且targetgametype
      await connection.execute("delete from ps5_game where title = ?", [dataArray[i].title]);
      await connection.execute(
        "insert into ps5_game(title, url, img, time, game_type, production, introduction, update_time,targetgametype,player_rating,player_num,expected_value) values(?, ?, ?, ?, ?, ?, ?,?,?,?,?,?)",
        [
          dataArray[i].title,
          dataArray[i].url,
          dataArray[i].img,
          dataArray[i].time,
          dataArray[i].gameType,
          dataArray[i].production,
          dataArray[i].introduction,
          dataArray[i].update_time,
          dataArray[i].targetgametype,
          dataArray[i].playerRating,
          dataArray[i].playerRatingPeopleNum,
          dataArray[i].expectedValue,
        ]
      );

      await connection.commit(); // 提交事务
    }
  } catch (error) {
    if (connection) {
      await connection.rollback(); // 回滚事务
    }
    throw error;
  } finally {
    if (connection) {
      connection.release(); // 释放连接
    }
  }
}
getHtml();

// 定时任务
// 30 * * * * * 每分钟的第30秒触发
// 30 5 * * * * 每小时的第5分30秒触发
// 30 5 1 * * * 每天1点5分30秒触发
// 30 5 1 10 * * 每月10号1点5分30秒触发
// 30 5 1 10 6 * 每年6月10号1点5分30秒触发
// 30 5 1 10 6 2019 每年2019年6月10号1点5分30秒触发
// nodeSchedule.scheduleJob("30 30 11 * * *", async () => {
//   try {
//     await getHtml();
//   } catch (error) {
//     console.log("error :", error);
//   }
// });
