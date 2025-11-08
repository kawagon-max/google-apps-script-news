# AI News Collection - Google Apps Script

AIニュースを自動収集し、Google Documentにまとめ、メールで通知する自動化システム

## 📋 概要

複数のRSSフィードからAI関連のニュースを自動取得し、日別のGoogle Documentに整理します。Google Apps Scriptで動作し、定期実行により最新情報を継続的に収集できます。

## ✨ 主な機能

- **複数RSSフィード対応**: TechCrunch、The Verge、GIGAZINE、AI Blog、ITmedia、CNET、GIZMODOなど
- **自動重複除外**: 過去2日分の記事を記憶し、重複を自動排除
- **日別ドキュメント生成**: 日付ごとにGoogle Documentを自動作成
- **メール通知**: 新着記事があればメールで通知
- **環境切り替え機能**: TEST/PRODUCTION環境を簡単に切り替え可能
- **自動クリーンアップ**: 古い既読データを自動削除して容量を節約

## 🚀 セットアップ

### 1. Google Apps Scriptプロジェクトを作成

1. [Google Apps Script](https://script.google.com)にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を設定（例: AI News Collection）

### 2. ファイルを追加

以下の3つのファイルをプロジェクトに追加:

- `main.gs` - メイン処理
- `config.gs` - 設定管理
- `AlertManager.gs` - 通知システム

### 3. 設定をカスタマイズ

#### config.gs の設定項目

```javascript
const CONFIG = {
  FILE_NAME_PREFIX: 'AI News ',  // ファイル名のプレフィックス
  DRIVE_FOLDER_ID: 'YOUR_FOLDER_ID',  // 保存先フォルダID
  
  RSS_FEEDS: [
    {
      name: 'サイト名',
      url: 'https://example.com/feed/'
    }
    // 複数追加可能
  ],
  
  ALERT_MIN_ARTICLES: 1  // 最低何件の新着でアラートを送るか
};
```

#### 保存先フォルダIDの取得方法

1. Google Driveで保存先フォルダを開く
2. URLの最後の部分をコピー
3. 例: `https://drive.google.com/drive/folders/1ZormvBWSuYjg1OrorCZL9sxoqX1COve1`
   → `1ZormvBWSuYjg1OrorCZL9sxoqX1COve1` がフォルダID

### 4. トリガーを設定

1. Google Apps Scriptエディタで「トリガー」アイコンをクリック
2. 「トリガーを追加」をクリック
3. 以下のように設定:
   - 実行する関数: `dailyAINewsUpdate`
   - イベントのソース: 時間主導型
   - 時間ベースのトリガー: 時間タイマー
   - 時間の間隔: 1時間ごと（または任意）

## 🧪 テスト環境の使い方

### TEST環境で動作確認

`main.gs` の9行目を確認:

```javascript
const ENVIRONMENT = 'TEST';  // TEST環境
```

TEST環境では:
- ファイル名に「TEST」が付く（例: `AI News TEST 2025-11-08`）
- メール通知が送信されない
- 既読データは通常と別管理

### 本番環境への切り替え

テストが成功したら、9行目を変更:

```javascript
const ENVIRONMENT = 'PRODUCTION';  // 本番環境
```

本番環境では:
- 通常のファイル名（例: `AI News 2025-11-08`）
- メール通知が有効化
- 本番用の既読データで管理

## 📁 ファイル構成

```
google-apps-script-news/
├── main.gs              # メイン処理とコア機能
├── config.gs            # 設定管理
├── AlertManager.gs      # 通知システム
└── README.md           # このファイル
```

## 🔧 主要関数

### main.gs

- `dailyAINewsUpdate()` - メイン実行関数（トリガーで呼び出し）
- `fetchNewArticles()` - RSSフィードから新着記事を取得
- `parseRSSFeed()` - RSS XMLを解析
- `appendNewArticlesToDoc()` - 記事をドキュメントに追記
- `cleanupOldReadArticles()` - 古い既読データを削除

### config.gs

- `getConfig()` - 設定を取得
- `getRSSFeeds()` - RSSフィード一覧を取得
- `getAlertConfig()` - アラート設定を取得
- `addRSSFeed()` - RSSフィードを動的に追加
- `removeRSSFeed()` - RSSフィードを削除

### AlertManager.gs

- `sendUpdateAlert()` - 更新通知を送信
- `sendErrorNotification()` - エラー通知を送信
- `sendCustomAlert()` - カスタム通知を送信

## 📝 使用例

### RSSフィードを追加

`config.gs` の `RSS_FEEDS` 配列に追加:

```javascript
{
  name: '新しいサイト',
  url: 'https://example.com/rss'
}
```

### 手動実行

Google Apps Scriptエディタで:
1. 関数リストから `dailyAINewsUpdate` を選択
2. 実行ボタン（▶）をクリック

### ログの確認

1. 左メニューの「実行数」をクリック
2. 最新の実行を選択
3. 「ログ」タブで詳細を確認

## 🔒 必要な権限

初回実行時に以下の権限を承認する必要があります:

- Google Driveへのアクセス（ドキュメント作成・編集）
- 外部サービスへのアクセス（RSSフィード取得）
- Gmailへのアクセス（メール送信）
- スクリプトプロパティへのアクセス（既読管理）

## 📊 出力形式

Google Documentの構造:

```
=== AI News 2025年11月08日 ===

## 🕙 09:23更新 - TechCrunch (初回取得)

• 記事タイトル1 (11/08 09:15) ⭐NEW
  🔗 https://techcrunch.com/article1

• 記事タイトル2 (11/08 08:30)
  🔗 https://techcrunch.com/article2

## 🕐 12:15更新 - The Verge (新着5件 🔔)

• 記事タイトル3 (11/08 12:00) ⭐NEW
  🔗 https://theverge.com/article3
```

## 🛠️ トラブルシューティング

### 記事が重複する場合

既読データをリセット:
```javascript
// Google Apps Scriptコンソールで実行
PropertiesService.getScriptProperties().deleteAllProperties();
```

### RSSフィードが取得できない場合

1. URLが正しいか確認
2. RSSフィードが有効か確認（ブラウザでアクセス）
3. ログでエラー内容を確認

### メール通知が届かない場合

1. `ENVIRONMENT` が `PRODUCTION` になっているか確認
2. `ALERT_MIN_ARTICLES` の設定を確認
3. スパムフォルダを確認

## 🎯 今後の拡張予定

- [ ] LINE通知対応
- [ ] Slack通知対応
- [ ] キーワードフィルタリング機能
- [ ] 記事の自動要約
- [ ] 重要度スコアリング

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 貢献

バグ報告や機能追加の提案は、GitHubのIssuesでお願いします。

## 👤 作成者

かわごん - Japan Generative AI Promotion Association (JGAA)

## 📚 参考リンク

- [Google Apps Script公式ドキュメント](https://developers.google.com/apps-script)
- [RSS 2.0仕様](https://www.rssboard.org/rss-specification)
- [Atom Feed仕様](https://www.ietf.org/rfc/rfc4287.txt)