/**
 * config.gs - 設定専用ファイル
 * このファイルだけを編集して設定を変更できます
 */

// 設定オブジェクト
const CONFIG = {
  // 日別ファイル設定
  FILE_NAME_PREFIX: 'AI News ',  // ファイル名のプレフィックス
  DRIVE_FOLDER_ID: '1ZormvBWSuYjg1OrorCZL9sxoqX1COve1',           // 保存先フォルダID
  
  // RSS フィード設定
  RSS_FEEDS: [
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/feed/'
    },
    {
      name: 'The Verge',  // 全記事フィード（元に戻す）
      url: 'https://www.theverge.com/rss/index.xml'
    },
    {
      name: 'GIGAZINE',  // 日本の技術メディア
      url: 'https://gigazine.net/news/rss_2.0/'
    },
    //{
    //  name: 'AI Blog',  // Artificial Intelligence Blog
    //  url: 'https://www.artificial-intelligence.blog/?format=rss'
    //},
    // 将来追加予定：
    // {
    //   name: 'Ledge.ai',  // AI専門メディア
    //   url: 'https://ledge.ai/feed/' // URL要確認
    // },
    // {
    //   name: 'ITmedia AI+',  // ITメディアのAI記事（フィルタリング要）
    //   url: 'https://www.itmedia.co.jp/news/rss/rss2.xml'
    // }
  ],
  
  // アラート設定
  ALERT_MIN_ARTICLES: 1,     // 最低何件の新着でアラートを送るか
  
  // 日本語AIキーワード（将来のフィルタリング用）
  AI_KEYWORDS: [
    'AI', 'ai', 'A.I.',
    '人工知能', 'じんこうちのう',
    'ChatGPT', 'GPT', 'LLM',
    '機械学習', 'きかいがくしゅう',
    'ディープラーニング', '深層学習',
    '生成AI', 'せいせいAI',
    'OpenAI', 'Anthropic', 'Claude',
    'Gemini',
    'ニューラルネットワーク',
    'トランスフォーマー',
    'プロンプト', 'ファインチューニング'
  ]
};

/**
 * 設定取得関数（他のファイルから呼び出し用）
 */
function getConfig() {
  return CONFIG;
}

/**
 * RSS フィード一覧取得
 */
function getRSSFeeds() {
  return CONFIG.RSS_FEEDS;
}

/**
 * アラート設定取得
 */
function getAlertConfig() {
  return {
    minArticles: CONFIG.ALERT_MIN_ARTICLES
  };
}

/**
 * ファイル設定取得
 */
function getFileConfig() {
  return {
    prefix: CONFIG.FILE_NAME_PREFIX,
    folderId: CONFIG.DRIVE_FOLDER_ID
  };
}

/**
 * AIキーワード取得（将来のフィルタリング用）
 */
function getAIKeywords() {
  return CONFIG.AI_KEYWORDS;
}

/**
 * 設定変更用のヘルパー関数群
 */

/**
 * RSSフィードを追加
 */
function addRSSFeed(name, url) {
  CONFIG.RSS_FEEDS.push({
    name: name,
    url: url
  });
  console.log(`RSS フィード追加: ${name} - ${url}`);
}

/**
 * RSSフィードを削除
 */
function removeRSSFeed(name) {
  const index = CONFIG.RSS_FEEDS.findIndex(feed => feed.name === name);
  if (index !== -1) {
    CONFIG.RSS_FEEDS.splice(index, 1);
    console.log(`RSS フィード削除: ${name}`);
  } else {
    console.log(`RSS フィード見つかりません: ${name}`);
  }
}

/**
 * アラート最小記事数を変更
 */
function setAlertMinArticles(count) {
  CONFIG.ALERT_MIN_ARTICLES = count;
  console.log(`アラート最小記事数を ${count} に変更`);
}

/**
 * 保存先フォルダIDを変更
 */
function setDriveFolderId(folderId) {
  CONFIG.DRIVE_FOLDER_ID = folderId;
  console.log(`保存先フォルダIDを ${folderId} に変更`);
}

/**
 * 設定確認用関数
 */
function showCurrentConfig() {
  console.log('=== 現在の設定 ===');
  console.log('ファイルプレフィックス:', CONFIG.FILE_NAME_PREFIX);
  console.log('保存先フォルダID:', CONFIG.DRIVE_FOLDER_ID);
  console.log('アラート最小記事数:', CONFIG.ALERT_MIN_ARTICLES);
  console.log('RSS フィード数:', CONFIG.RSS_FEEDS.length);
  
  CONFIG.RSS_FEEDS.forEach((feed, index) => {
    console.log(`  ${index + 1}. ${feed.name}: ${feed.url}`);
  });
}

/* 
=== 使用方法 ===

1. 基本設定変更
   - CONFIG オブジェクトを直接編集

2. 動的設定変更
   - addRSSFeed('新サイト名', 'https://example.com/rss')
   - removeRSSFeed('削除したいサイト名')
   - setAlertMinArticles(5)
   - setDriveFolderId('新しいフォルダID')

3. 設定確認
   - showCurrentConfig()

4. 他ファイルからの設定取得
   - const config = getConfig()
   - const feeds = getRSSFeeds()
   - const alertConfig = getAlertConfig()

5. 設定テスト
   - showCurrentConfig() で現在設定を確認
   - 必要に応じて addRSSFeed() で新サイト追加テスト
*/