/**
 * main.gs - AI News Collection メイン処理
 * 設定は config.gs で管理
 */

// ============================================
// 環境設定（ここを変更するだけで切り替え可能）
// ============================================
const ENVIRONMENT = 'PRODUCTION';  // 'TEST' または 'PRODUCTION'

// 環境別の設定
const ENV_CONFIG = {
  TEST: {
    filePrefix: 'AI News TEST ',  // テスト環境用のファイル名
    alertEnabled: false            // テスト時はアラート無効
  },
  PRODUCTION: {
    filePrefix: 'AI News ',        // 本番環境用のファイル名
    alertEnabled: true             // 本番はアラート有効
  }
};

// 現在の環境設定を取得
function getEnvironmentConfig() {
  const config = ENV_CONFIG[ENVIRONMENT];
  if (!config) {
    throw new Error(`無効な環境設定: ${ENVIRONMENT}`);
  }
  return config;
}

/**
 * メイン実行関数 - 毎時実行推奨
 */
function dailyAINewsUpdate() {
  try {
    const envConfig = getEnvironmentConfig();
    console.log(`[${ENVIRONMENT}環境] AI情報収集開始...`);
    
    // ★ 古いプロパティを自動削除（容量制限対策）
    cleanupOldReadArticles();
    
    // 設定取得
    const config = getConfig();
    const feeds = getRSSFeeds();
    const alertConfig = getAlertConfig();
    
    const today = getTodayString();
    const todayFormatted = getTodayFormattedString();
    const updateTime = Utilities.formatDate(new Date(), 'JST', 'HH:mm');
    
    // 今日のドキュメントIDを取得または作成
    const todayDocId = getTodayDocumentId(todayFormatted);
    
    let totalNewArticles = 0;
    const newArticlesBySource = {};
    
    // 各フィードから新着記事を取得
    for (const feed of feeds) {
      const newArticles = fetchNewArticles(feed, today);
      if (newArticles.length > 0) {
        newArticlesBySource[feed.name] = newArticles;
        totalNewArticles += newArticles.length;
        
        // 新着記事をドキュメントに追記
        appendNewArticlesToDoc(feed.name, newArticles, today, updateTime, todayDocId);
      }
    }
    
    // アラート送信（TEST環境では無効）
    if (envConfig.alertEnabled && totalNewArticles >= alertConfig.minArticles) {
      AlertManager.sendUpdateAlert(totalNewArticles, newArticlesBySource, updateTime, todayDocId);
    } else if (!envConfig.alertEnabled) {
      console.log(`[${ENVIRONMENT}環境] アラート送信はスキップされました`);
    }
    
    console.log(`[${ENVIRONMENT}環境] 新着記事 ${totalNewArticles}件 を取得・更新完了`);
    console.log(`今日のファイル: https://docs.google.com/document/d/${todayDocId}`);
    
  } catch (error) {
    console.error('エラー発生:', error);
    AlertManager.sendErrorNotification(error);
  }
}

/**
 * 3日以前の古い既読記事プロパティを削除
 * dailyAINewsUpdate() の最初で呼び出す
 */
function cleanupOldReadArticles() {
  try {
    const props = PropertiesService.getScriptProperties();
    const allKeys = props.getKeys();
    const today = new Date();
    
    let deletedCount = 0;
    
    allKeys.forEach(key => {
      // read_articles_環境名_xxx_yyyy年MM月dd日 形式のキーのみ処理
      if (key.startsWith(`read_articles_${ENVIRONMENT}_`)) {
        const dateMatch = key.match(/(\d{4})年(\d{2})月(\d{2})日$/);
        if (dateMatch) {
          const [, year, month, day] = dateMatch;
          const keyDate = new Date(year, parseInt(month) - 1, day);
          
          // 3日以上前のデータを削除
          const daysDiff = Math.floor((today - keyDate) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 3) {
            props.deleteProperty(key);
            deletedCount++;
            console.log(`古いプロパティを削除: ${key} (${daysDiff}日前)`);
          }
        }
      }
    });
    
    if (deletedCount > 0) {
      console.log(`${deletedCount}個の古いプロパティを削除しました`);
    } else {
      console.log('削除対象の古いプロパティはありません');
    }
    
  } catch (error) {
    console.error('プロパティクリーンアップエラー:', error);
  }
}

/**
 * 新着記事のみを取得（2日間重複チェック版）
 */
function fetchNewArticles(feedConfig, today) {
  try {
    console.log(`${feedConfig.name} から記事取得中...`);
    
    // RSS取得
    const options = {
      'method': 'GET',
      'headers': {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      'muteHttpExceptions': true,
      'followRedirects': true
    };
    
    const response = UrlFetchApp.fetch(feedConfig.url, options);
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP ${response.getResponseCode()}: ${feedConfig.url}`);
    }
    
    const xmlContent = response.getContentText();
    const allArticles = parseRSSFeed(xmlContent);
    
    // 今日+昨日の既読記事URLを取得
    const allReadArticles = get2DaysReadArticles(feedConfig.name, today);
    
    // 新着記事のみフィルタリング（今日+昨日の既読と比較）
    const newArticles = allArticles.filter(article => 
      article.link && !allReadArticles.includes(article.link)
    );
    
    // 新着記事URLを「今日の」既読に追加（環境別）
    if (newArticles.length > 0) {
      const readArticlesKeyToday = `read_articles_${ENVIRONMENT}_${feedConfig.name}_${today}`;
      const todayReadArticles = JSON.parse(PropertiesService.getScriptProperties().getProperty(readArticlesKeyToday) || '[]');
      
      const newUrls = newArticles.map(article => article.link);
      const updatedReadArticles = [...todayReadArticles, ...newUrls];
      PropertiesService.getScriptProperties().setProperty(
        readArticlesKeyToday, 
        JSON.stringify(updatedReadArticles)
      );
      
      console.log(`${feedConfig.name}: ${newArticles.length}件の新着記事`);
    } else {
      console.log(`${feedConfig.name}: 新着記事なし`);
    }
    
    return newArticles;
    
  } catch (error) {
    console.error(`${feedConfig.name} 取得エラー:`, error);
    return [];
  }
}

/**
 * 今日+昨日の既読記事URL一覧を取得（環境別）
 */
function get2DaysReadArticles(feedName, today) {
  const yesterday = getYesterdayString();
  
  // 今日の既読記事（環境別）
  const todayKey = `read_articles_${ENVIRONMENT}_${feedName}_${today}`;
  const todayArticles = JSON.parse(PropertiesService.getScriptProperties().getProperty(todayKey) || '[]');
  
  // 昨日の既読記事（環境別）
  const yesterdayKey = `read_articles_${ENVIRONMENT}_${feedName}_${yesterday}`;
  const yesterdayArticles = JSON.parse(PropertiesService.getScriptProperties().getProperty(yesterdayKey) || '[]');
  
  // 合併して重複URLを除去
  const allReadArticles = [...todayArticles, ...yesterdayArticles];
  const uniqueReadArticles = [...new Set(allReadArticles)];
  
  console.log(`${feedName}: 今日${todayArticles.length}件+昨日${yesterdayArticles.length}件の既読記事をチェック`);
  return uniqueReadArticles;
}

/**
 * XML/RSS解析（フィルタリング撤廃版）
 */
function parseRSSFeed(xmlContent) {
  try {
    const articles = [];
    
    // 複数のアイテム検索パターンを試す
    let itemMatches = xmlContent.match(/<item[\s\S]*?<\/item>/gi);
    if (!itemMatches) {
      itemMatches = xmlContent.match(/<entry[\s\S]*?<\/entry>/gi);
    }
    
    if (!itemMatches) {
      console.log('RSS記事が見つかりませんでした');
      return articles;
    }
    
    itemMatches.forEach((item, index) => {
      if (index >= 20) return; // 最新20件まで
      
      // タイトル抽出
      let titleMatch = item.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i);
      if (!titleMatch) titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]*>/g, '') : 'タイトル不明';
      
      // URL抽出
      let linkMatch = item.match(/<link[^>]*>(.*?)<\/link>/i);
      if (!linkMatch) linkMatch = item.match(/<guid[^>]*>(.*?)<\/guid>/i);
      if (!linkMatch) linkMatch = item.match(/href="([^"]*?)"/i);
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      // 日付抽出
      let pubDateMatch = item.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
      if (!pubDateMatch) pubDateMatch = item.match(/<published[^>]*>(.*?)<\/published>/i);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
      
      if (title !== 'タイトル不明' && link) {
        articles.push({
          title: title,
          link: link,
          pubDate: pubDate
        });
      }
    });
    
    return articles;
    
  } catch (error) {
    console.error('RSS解析エラー:', error);
    return [];
  }
}

/**
 * 新着記事をドキュメントに追記
 */
function appendNewArticlesToDoc(sourceName, newArticles, today, updateTime, docId) {
  try {
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    
    // 今日のセクションを探すか新規作成
    const todayHeader = `=== AI News ${today} ===`;
    const text = body.getText();
    
    let insertPosition;
    
    if (!text.includes(todayHeader)) {
      // 今日のセクションが存在しない場合、新規作成
      if (text.trim() !== '') {
        body.appendParagraph('\n');
      }
      body.appendParagraph(todayHeader).setHeading(DocumentApp.ParagraphHeading.HEADING1);
      insertPosition = body.getNumChildren();
    } else {
      // 既存のセクションの末尾を見つける
      insertPosition = body.getNumChildren();
    }
    
    // 更新セクション追加
    const isFirstUpdate = !text.includes(`## 🕐`) && !text.includes(`## 🕙`);
    const icon = isFirstUpdate ? '🕙' : '🕐';
    const newLabel = isFirstUpdate ? '初回取得' : `新着${newArticles.length}件 🔔`;
    
    const updateHeader = body.insertParagraph(insertPosition, `\n## ${icon} ${updateTime}更新 - ${sourceName} (${newLabel})`);
    updateHeader.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    insertPosition++;
    
    // 記事リスト追加
    newArticles.forEach(article => {
      // 日付フォーマット
      let formattedDate = '';
      if (article.pubDate) {
        try {
          const date = new Date(article.pubDate);
          if (!isNaN(date.getTime())) {
            formattedDate = ` (${Utilities.formatDate(date, 'JST', 'MM/dd HH:mm')})`;
          }
        } catch (dateError) {
          console.log('日付解析エラー:', article.pubDate);
        }
      }
      
      const articleText = `• ${article.title}${formattedDate} ${isFirstUpdate ? '' : '⭐NEW'}`;
      body.insertParagraph(insertPosition, articleText);
      insertPosition++;
      
      if (article.link) {
        body.insertParagraph(insertPosition, `  🔗 ${article.link}`);
        insertPosition++;
      }
    });
    
    console.log(`${sourceName}: ${newArticles.length}件をドキュメントに追記`);
    
  } catch (error) {
    console.error('ドキュメント書き込みエラー:', error);
    throw error;
  }
}

/**
 * 今日のドキュメントURLを取得
 */
function getTodayDocumentUrl() {
  const todayFormatted = getTodayFormattedString();
  const docId = getTodayDocumentId(todayFormatted);
  const url = `https://docs.google.com/document/d/${docId}`;
  console.log(`今日のドキュメント: ${url}`);
  return url;
}

/**
 * 今日の日付文字列取得
 */
function getTodayString() {
  return Utilities.formatDate(new Date(), 'JST', 'yyyy年MM月dd日');
}

/**
 * 昨日の日付文字列取得
 */
function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return Utilities.formatDate(yesterday, 'JST', 'yyyy年MM月dd日');
}

/**
 * ファイル名用の今日の日付文字列取得
 */
function getTodayFormattedString() {
  return Utilities.formatDate(new Date(), 'JST', 'yyyy-MM-dd');
}

/**
 * 今日のドキュメントIDを取得または作成
 */
function getTodayDocumentId(todayFormatted) {
  try {
    const envConfig = getEnvironmentConfig();
    const fileConfig = getFileConfig();
    
    // 環境別のファイル名プレフィックスを使用
    const fileName = `${envConfig.filePrefix}${todayFormatted}`;
    
    // 既存のドキュメントを検索
    const existingDocId = findExistingDocument(fileName, fileConfig.folderId);
    
    if (existingDocId) {
      console.log(`既存のドキュメントを使用: ${fileName}`);
      return existingDocId;
    }
    
    // 新しいドキュメントを作成
    console.log(`新しいドキュメントを作成: ${fileName}`);
    return createTodayDocument(fileName, fileConfig.folderId);
    
  } catch (error) {
    console.error('ドキュメント取得/作成エラー:', error);
    throw error;
  }
}

/**
 * 既存のドキュメントを検索
 */
function findExistingDocument(fileName, folderId) {
  try {
    // 指定フォルダ内を検索（フォルダ指定がある場合）
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      const files = folder.getFilesByName(fileName);
      
      if (files.hasNext()) {
        const file = files.next();
        console.log(`フォルダ内でドキュメント発見: ${fileName}`);
        return file.getId();
      }
    } else {
      // マイドライブ全体を検索
      const files = DriveApp.getFilesByName(fileName);
      
      if (files.hasNext()) {
        const file = files.next();
        console.log(`マイドライブでドキュメント発見: ${fileName}`);
        return file.getId();
      }
    }
    
    console.log(`ドキュメントが見つかりません: ${fileName}`);
    return null;
    
  } catch (error) {
    console.error('ドキュメント検索エラー:', error);
    return null;
  }
}

/**
 * 新しいドキュメントを作成
 */
function createTodayDocument(fileName, folderId) {
  try {
    // 新しいドキュメントを作成
    const newDoc = DocumentApp.create(fileName);
    const docId = newDoc.getId();
    
    // 指定フォルダに移動（フォルダ指定がある場合）
    if (folderId) {
      const file = DriveApp.getFileById(docId);
      const folder = DriveApp.getFolderById(folderId);
      
      // ファイルをフォルダに移動
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
      
      console.log(`ドキュメントを指定フォルダに作成: ${fileName}`);
    } else {
      console.log(`ドキュメントをマイドライブに作成: ${fileName}`);
    }
    
    // 初期ヘッダーを追加
    const body = newDoc.getBody();
    const today = getTodayString();
    body.appendParagraph(`=== AI News ${today} ===`).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(''); // 空行
    
    return docId;
    
  } catch (error) {
    console.error('ドキュメント作成エラー:', error);
    throw error;
  }
}