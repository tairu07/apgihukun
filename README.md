# Apple ギフトコード管理システム

Appleギフトコードの在庫管理と最適配分を行うWebアプリケーションです。

## 機能

### 🔐 認証・権限管理
- NextAuthによるセッション管理
- 役割ベースアクセス制御（管理者・運用者・閲覧者）
- 開発環境での簡単ログイン

### 📥 在庫管理
- テキスト貼り付けによる一括取り込み
- 多様な形式に対応（コード+金額、タブ区切り等）
- 重複検出と形式バリデーション
- 暗号化による安全な保存

### ⚖️ 最適配分
- 動的計画法による最適解算出
- 「誤差最小・枚数最小」の原則
- リアルタイム提案とプレビュー
- ワンクリック確定

### 📊 統計・履歴
- リアルタイム在庫統計
- 配分履歴の詳細記録
- 監査ログによる操作追跡
- 配布用テキスト自動生成

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes, Prisma ORM
- **データベース**: PostgreSQL
- **認証**: NextAuth.js
- **暗号化**: AES-256-GCM
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. 環境変数の設定

\`.env\`ファイルを作成し、以下を設定：

\`\`\`env
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Encryption
ENCRYPTION_KEY_HEX="your-32-byte-hex-key"
\`\`\`

### 3. データベースのセットアップ

\`\`\`bash
# マイグレーション実行
npx prisma migrate dev

# シードデータ投入
npm run db:seed
\`\`\`

### 4. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

http://localhost:3000 でアプリケーションにアクセスできます。

## ログイン情報（開発環境）

- **管理者**: admin@example.com
- **運用者**: operator@example.com

パスワードは任意の文字列で構いません。

## API エンドポイント

### 在庫管理
- \`POST /api/inventory/parse\` - テキスト解析
- \`POST /api/inventory/commit\` - 在庫登録
- \`GET /api/inventory/stats\` - 統計取得

### 配分管理
- \`POST /api/allocate/propose\` - 最適配分提案
- \`POST /api/allocate/confirm\` - 配分確定

## セキュリティ

- ギフトコードはAES-256-GCMで暗号化保存
- HMAC-SHA256による重複検出
- 全操作の監査ログ記録
- 役割ベースの権限制御

## ライセンス

MIT License

## 開発者

このシステムは仕様書に基づいて実装されました。
