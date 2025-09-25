# デプロイ手順

## Vercelへのデプロイ

### 1. Vercelアカウントの準備
1. https://vercel.com にアクセス
2. GitHubアカウントでログイン

### 2. プロジェクトのインポート
1. 「New Project」をクリック
2. GitHubリポジトリ `tairu07/apgihukun` を選択
3. 「Import」をクリック

### 3. プロジェクト設定
- **Project Name**: `apple-gift-manager`
- **Framework Preset**: `Next.js` (自動検出)
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Install Command**: `npm install`

### 4. 環境変数の設定
以下の環境変数を「Environment Variables」セクションで設定：

```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=23254749985a130dc847b3220d5f8beb16724b9188648469fefbadfc80399abf
ENCRYPTION_KEY_HEX=0a767d344c86dbc9640329ab7bce980c7e195b89916f3dc43d0d2ecacb5e3fe8
DATABASE_URL=postgresql://username:password@host:port/database
```

### 5. データベースの設定

#### オプション1: Vercel Postgres (推奨)
1. Vercelダッシュボードで「Storage」タブ
2. 「Create Database」→「Postgres」
3. 自動生成される `DATABASE_URL` を環境変数に設定

#### オプション2: Supabase (無料プラン有り)
1. https://supabase.com でプロジェクト作成
2. Settings → Database → Connection string をコピー
3. パスワードを実際の値に置換

### 6. データベースの初期化
デプロイ後、以下のコマンドでデータベースを初期化：

```bash
# ローカルで実行
npx prisma migrate deploy
npx prisma db seed
```

### 7. デプロイ実行
「Deploy」ボタンをクリックしてデプロイ開始

## 動作確認

デプロイ完了後、以下を確認：

1. **ホームページアクセス**: https://your-app-name.vercel.app
2. **ログイン機能**: `/auth/signin`
3. **ダッシュボード**: `/dashboard`
4. **在庫取り込み**: `/inventory/import`
5. **配分機能**: `/allocate`

## トラブルシューティング

### ビルドエラーの場合
- `npm run build` をローカルで実行して確認
- TypeScriptエラーの修正
- 環境変数の設定確認

### データベース接続エラーの場合
- `DATABASE_URL` の形式確認
- データベースの接続許可設定
- Prismaマイグレーションの実行

### 認証エラーの場合
- `NEXTAUTH_URL` が正しいドメインに設定されているか確認
- `NEXTAUTH_SECRET` が設定されているか確認

## セキュリティ注意事項

- 本番環境では必ず強力なパスワードを使用
- 環境変数は絶対にコードにハードコードしない
- データベースアクセスは信頼できるIPからのみ許可
- 定期的なバックアップの実施
