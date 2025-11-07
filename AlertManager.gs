/**
 * Alert Manager - 通知システム
 * 様々な通知方法に対応できる拡張可能な設計
 */

// アラート設定（ここで通知方法をカスタマイズ）
const ALERT_CONFIG = {
  // 通知方法の有効/無効
  EMAIL: {
    enabled: true,
    sendTo: '' // 空の場合は実行ユーザーのメールアドレス
  },
  
  // 将来の拡張用（現在は無効）
  LINE: {
    enabled: false,
    token: '' // LINE Notify Token
  },
  
  SLACK: {
    enabled: false,
    webhookUrl: '' // Slack Webhook URL
  },
  
  DESKTOP: {
    enabled: false,
    method: 'browser' // 'browser' または 'system'
  },
  
  // 通知レベル設定
  LEVELS: {
    INFO: true,    // 通常の更新通知
    WARNING: true, // 警告
    ERROR: true    // エラー通知
  }
};

/**
 * Alert Manager メインクラス
 */
const AlertManager = {
  
  /**
   * 更新通知送信
   */
  sendUpdateAlert: function(totalNewArticles, newArticlesBySource, updateTime, docId) {
    try {
      if (!ALERT_CONFIG.LEVELS.INFO) return;
      
      console.log(`アラート送信開始: 新着${totalNewArticles}件`);
      
      const alertData = {
        type: 'update',
        totalArticles: totalNewArticles,
        sources: newArticlesBySource,
        updateTime: updateTime,
        docId: docId
      };
      
      // 有効な通知方法で送信
      if (ALERT_CONFIG.EMAIL.enabled) {
        this._sendEmailAlert(alertData);
      }
      
      if (ALERT_CONFIG.LINE.enabled) {
        this._sendLineAlert(alertData);
      }
      
      if (ALERT_CONFIG.SLACK.enabled) {
        this._sendSlackAlert(alertData);
      }
      
      if (ALERT_CONFIG.DESKTOP.enabled) {
        this._sendDesktopAlert(alertData);
      }
      
      console.log('アラート送信完了');
      
    } catch (error) {
      console.error('アラート送信エラー:', error);
    }
  },
  
  /**
   * エラー通知送信
   */
  sendErrorNotification: function(error) {
    try {
      if (!ALERT_CONFIG.LEVELS.ERROR) return;
      
      const alertData = {
        type: 'error',
        error: error,
        timestamp: new Date()
      };
      
      // エラー通知は必ずメールで送信
      this._sendEmailAlert(alertData);
      
      // 他の方法でも送信（設定されていれば）
      if (ALERT_CONFIG.SLACK.enabled) {
        this._sendSlackAlert(alertData);
      }
      
    } catch (alertError) {
      console.error('エラーアラート送信失敗:', alertError);
    }
  },
  
  /**
   * カスタムアラート送信
   */
  sendCustomAlert: function(message, level = 'INFO') {
    try {
      if (!ALERT_CONFIG.LEVELS[level]) return;
      
      const alertData = {
        type: 'custom',
        message: message,
        level: level,
        timestamp: new Date()
      };
      
      if (ALERT_CONFIG.EMAIL.enabled) {
        this._sendEmailAlert(alertData);
      }
      
    } catch (error) {
      console.error('カスタムアラート送信エラー:', error);
    }
  },
  
  // ===========================================
  // 内部メソッド（通知方法別実装）
  // ===========================================
  
  /**
   * メール通知送信
   */
  _sendEmailAlert: function(alertData) {
    try {
      let subject, body;
      
      switch (alertData.type) {
        case 'update':
          subject = `📰 AI News更新：新着${alertData.totalArticles}件 (${alertData.updateTime})`;
          body = this._buildUpdateEmailBody(alertData);
          break;
          
        case 'error':
          subject = '🚨 AI News Collection エラー通知';
          body = this._buildErrorEmailBody(alertData);
          break;
          
        case 'custom':
          subject = `🔔 AI News通知 (${alertData.level})`;
          body = this._buildCustomEmailBody(alertData);
          break;
          
        default:
          return;
      }
      
      const recipient = ALERT_CONFIG.EMAIL.sendTo || Session.getActiveUser().getEmail();
      
      GmailApp.sendEmail(recipient, subject, body);
      console.log('メール通知送信完了');
      
    } catch (error) {
      console.error('メール送信エラー:', error);
    }
  },
  
  /**
   * LINE通知送信（将来実装用）
   */
  _sendLineAlert: function(alertData) {
    try {
      if (!ALERT_CONFIG.LINE.token) {
        console.log('LINE Notify Token未設定');
        return;
      }
      
      let message;
      
      switch (alertData.type) {
        case 'update':
          message = `📰 AI News更新\n新着${alertData.totalArticles}件 (${alertData.updateTime})`;
          break;
        case 'error':
          message = `🚨 AI News Collection エラーが発生しました`;
          break;
        default:
          message = alertData.message || 'AI News通知';
      }
      
      const options = {
        'method': 'POST',
        'headers': {
          'Authorization': `Bearer ${ALERT_CONFIG.LINE.token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        'payload': `message=${encodeURIComponent(message)}`
      };
      
      UrlFetchApp.fetch('https://notify-api.line.me/api/notify', options);
      console.log('LINE通知送信完了');
      
    } catch (error) {
      console.error('LINE通知送信エラー:', error);
    }
  },
  
  /**
   * Slack通知送信（将来実装用）
   */
  _sendSlackAlert: function(alertData) {
    try {
      if (!ALERT_CONFIG.SLACK.webhookUrl) {
        console.log('Slack Webhook URL未設定');
        return;
      }
      
      let payload;
      
      switch (alertData.type) {
        case 'update':
          payload = {
            'text': `📰 AI News更新：新着${alertData.totalArticles}件`,
            'attachments': [
              {
                'color': 'good',
                'fields': [
                  {
                    'title': '更新時刻',
                    'value': alertData.updateTime,
                    'short': true
                  },
                  {
                    'title': '新着記事数',
                    'value': `${alertData.totalArticles}件`,
                    'short': true
                  }
                ]
              }
            ]
          };
          break;
          
        case 'error':
          payload = {
            'text': '🚨 AI News Collection エラー',
            'attachments': [
              {
                'color': 'danger',
                'text': alertData.error.message
              }
            ]
          };
          break;
          
        default:
          payload = { 'text': alertData.message || 'AI News通知' };
      }
      
      const options = {
        'method': 'POST',
        'headers': { 'Content-Type': 'application/json' },
        'payload': JSON.stringify(payload)
      };
      
      UrlFetchApp.fetch(ALERT_CONFIG.SLACK.webhookUrl, options);
      console.log('Slack通知送信完了');
      
    } catch (error) {
      console.error('Slack通知送信エラー:', error);
    }
  },
  
  /**
   * デスクトップ通知送信（将来実装用）
   */
  _sendDesktopAlert: function(alertData) {
    try {
      // デスクトップ通知は直接的には不可能だが、
      // ブラウザベースの通知やシステム連携で実装可能
      
      console.log('デスクトップ通知: 現在未実装');
      console.log('通知内容:', alertData);
      
      // 将来的な実装例：
      // 1. Chrome Extension連携
      // 2. IFTTT/Zapier経由でシステム通知
      // 3. 外部API経由でモバイル通知
      
    } catch (error) {
      console.error('デスクトップ通知エラー:', error);
    }
  },
  
  // ===========================================
  // メール本文作成メソッド
  // ===========================================
  
  /**
   * 更新通知メール本文作成
   */
  _buildUpdateEmailBody: function(alertData) {
    let body = `AI News Dashboard が更新されました！\n\n`;
    body += `🕐 更新時刻: ${alertData.updateTime}\n`;
    body += `📊 新着記事数: ${alertData.totalArticles}件\n\n`;
    
    body += `📋 ソース別詳細:\n`;
    for (const [source, articles] of Object.entries(alertData.sources)) {
      body += `• ${source}: ${articles.length}件\n`;
      articles.slice(0, 3).forEach(article => {
        body += `  - ${article.title}\n`;
      });
      if (articles.length > 3) {
        body += `  - ...他${articles.length - 3}件\n`;
      }
      body += '\n';
    }
    
    body += `🔗 詳細確認: https://docs.google.com/document/d/${alertData.docId}\n\n`;
    body += `⚙️ 通知設定変更: Google Apps Script > AlertManager`;
    
    return body;
  },
  
  /**
   * エラー通知メール本文作成
   */
  _buildErrorEmailBody: function(alertData) {
    return `AI News Collection でエラーが発生しました：

🕐 時刻: ${alertData.timestamp}
🚨 エラー内容: ${alertData.error.message}
📋 スタック: ${alertData.error.stack}

確認をお願いします。

⚙️ システム設定: Google Apps Script
🔧 トラブルシューティング: ログを確認してください`;
  },
  
  /**
   * カスタム通知メール本文作成
   */
  _buildCustomEmailBody: function(alertData) {
    return `AI News System からの通知:

📅 時刻: ${alertData.timestamp}
📊 レベル: ${alertData.level}
📝 メッセージ: ${alertData.message}

⚙️ 通知設定: Google Apps Script > AlertManager`;
  }
};

// ===========================================
// 設定変更用ヘルパー関数
// ===========================================

/**
 * LINE通知を有効化
 */
function enableLineNotification(token) {
  ALERT_CONFIG.LINE.enabled = true;
  ALERT_CONFIG.LINE.token = token;
  console.log('LINE通知を有効化しました');
}

/**
 * Slack通知を有効化
 */
function enableSlackNotification(webhookUrl) {
  ALERT_CONFIG.SLACK.enabled = true;
  ALERT_CONFIG.SLACK.webhookUrl = webhookUrl;
  console.log('Slack通知を有効化しました');
}

/**
 * メール通知先変更
 */
function setEmailRecipient(email) {
  ALERT_CONFIG.EMAIL.sendTo = email;
  console.log(`メール通知先を ${email} に変更しました`);
}

/**
 * 通知テスト送信
 */
function testAllNotifications() {
  const testData = {
    type: 'update',
    totalArticles: 3,
    sources: {
      'TechCrunch': [
        { title: 'Test Article 1' },
        { title: 'Test Article 2' }
      ],
      'The Verge': [
        { title: 'Test Article 3' }
      ]
    },
    updateTime: '15:30',
    docId: 'test_doc_id'
  };
  
  console.log('🧪 通知テスト開始...');
  AlertManager.sendUpdateAlert(testData.totalArticles, testData.sources, testData.updateTime, testData.docId);
  console.log('🧪 通知テスト完了');
}

/* 
=== Alert Manager 使用方法 ===

1. 基本設定
   - ALERT_CONFIG で各通知方法の有効/無効を設定
   - メール以外は現在無効（将来拡張用）

2. メイン機能
   - AlertManager.sendUpdateAlert() : 更新通知
   - AlertManager.sendErrorNotification() : エラー通知
   - AlertManager.sendCustomAlert() : カスタム通知

3. 設定変更
   - enableLineNotification(token) : LINE通知有効化
   - enableSlackNotification(webhookUrl) : Slack通知有効化
   - setEmailRecipient(email) : メール送信先変更

4. テスト
   - testAllNotifications() : 全通知方法テスト

5. 将来の拡張例
   ✅ LINE Notify
   ✅ Slack Webhook  
   ✅ Discord Webhook
   ✅ Microsoft Teams
   ✅ IFTTT/Zapier連携
   ✅ Chrome Extension連携
   ✅ モバイルアプリ通知

6. カスタマイズ方法
   - ALERT_CONFIG を編集して通知方法追加
   - _send[Method]Alert メソッドを追加実装
   - 新しい通知レベルやフィルタリング追加可能
*/