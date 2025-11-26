#!/bin/bash

# ========================================
# 爬虫配置表初始化脚本 (改进版)
# 用于创建 crawler_config 表并导入配置数据
# ========================================

echo "================================"
echo "🚀 开始初始化爬虫配置表..."
echo "================================"
echo ""

# 读取 MySQL 配置
DB_HOST="${1:-localhost}"
DB_USER="${2:-admin}"
DB_PASS="${3:-Admin@2025!}"
DB_NAME="${4:-vue3_data_platform}"

echo "📋 数据库配置:"
echo "  Host: $DB_HOST"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/crawler_config_schema.sql"

# 检查 SQL 文件是否存在
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ 错误: 找不到 SQL 文件"
    echo "期望路径: $SQL_FILE"
    exit 1
fi

echo "✅ 找到 SQL 文件: $SQL_FILE"
echo ""

# 方案 1: 尝试使用 mysql 命令行工具
if command -v mysql &> /dev/null; then
    echo "✅ 检测到 MySQL 命令行工具，执行脚本..."
    
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "================================"
        echo "✅ 爬虫配置表创建成功！"
        echo "================================"
        echo ""
        echo "📊 已创建表: crawler_config"
        echo "📝 已导入默认配置:"
        echo "  • 游戏爬虫 (game_info, 每天03:00)"
        echo "  • 热门话题 (hot_topics, 每天00:00/12:00/18:00)"
        echo "  • AI工具库 (ai_info, 手动)"
        exit 0
    fi
fi

# 方案 2: 使用 Node.js
if command -v node &> /dev/null; then
    echo "✅ 检测到 Node.js，使用 Node.js 方案..."
    echo ""
    
    # 创建临时脚本
    cat > "$SCRIPT_DIR/temp_init.js" << 'EOF'
const mysql = require('mysql2/promise');
const fs = require('fs');

async function init() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASS || 'Admin@2025!',
      database: process.env.DB_NAME || 'vue3_data_platform'
    });

    console.log('✅ 数据库连接成功\n');

    const sql = fs.readFileSync(process.env.SQL_FILE, 'utf8');
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await conn.execute(statement);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }
    }

    console.log('================================');
    console.log('✅ 爬虫配置表创建成功！');
    console.log('================================\n');
    console.log('📊 已创建表: crawler_config');
    console.log('📝 已导入默认配置:');
    console.log('  • 游戏爬虫 (game_info, 每天03:00)');
    console.log('  • 热门话题 (hot_topics, 每天00:00/12:00/18:00)');
    console.log('  • AI工具库 (ai_info, 手动)');
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error('\n请检查:');
    console.error('  1. MySQL 是否运行: brew services start mysql');
    console.error('  2. 连接参数是否正确');
    console.error('  3. 数据库是否存在\n');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

init();
EOF

    DB_HOST="$DB_HOST" DB_USER="$DB_USER" DB_PASS="$DB_PASS" DB_NAME="$DB_NAME" SQL_FILE="$SQL_FILE" \
    node "$SCRIPT_DIR/temp_init.js"
    
    RESULT=$?
    rm -f "$SCRIPT_DIR/temp_init.js"
    exit $RESULT
fi

echo "❌ 错误: 找不到 mysql 或 node 命令"
echo ""
echo "解决方案:"
echo "  1. 安装 MySQL 客户端: brew install mysql-client"
echo "  2. 或者确保 Node.js 已安装"
echo ""
echo "手动方案:"
echo "  mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < $SQL_FILE"
exit 1
