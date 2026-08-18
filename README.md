# kabuAPIMCP

[kabu STATION® API](https://kabucom.github.io/kabusapi/reference/index.html)（auカブコム証券が提供するWindows常駐アプリ経由のローカルAPI）を、MCP（Model Context Protocol）サーバーとして公開するツールです。stdio transportで動作し、Claude Desktop / Codex Desktop appの両方から利用できます。

## このサーバーが提供するもの

kabu STATION APIの参照系エンドポイントを25個のMCPツールとして公開します。

- 資産残高（wallet系、8本）
- 時価情報（board/symbol/ranking/exchange/regulations/primaryexchange/timeandsales、7本）
- マスタ情報（symbolname系、marginpremium、4本）
- 口座・注文状況（orders/positions/apisoftlimit、3本）
- PUSH配信登録（register/unregister/unregister_all、3本）

**売買系エンドポイント（`sendorder`, `sendorder/future`, `sendorder/option`, `cancelorder`）は意図的に実装していません。** コードベース全体（`src`配下）に該当する文字列が存在しないことをCIで自動検証しています（`src/no-trading-endpoints.test.ts`）。

`register` / `unregister` / `unregister/all` はkabuステーションアプリ全体のPUSH購読状態を変更する副作用のある操作です（他クライアントの購読にも影響しうる）。各ツールのdescriptionにその旨を明記しています。

入力スキーマは[zod](https://zod.dev/)で定義していますが、symbolコード等API固有の制約はOpenAPI定義の必須/型情報に基づく最低限のバリデーションに留めており、列挙値などの完全なドメイン検証は行いません。

## 要件

- Node.js 18以上
- kabuステーションアプリ（Windows常駐）が起動済み・ログイン済みであること
- kabu STATION APIのAPIパスワード（アプリの設定画面で確認・設定できます）

## インストール・ビルド

```bash
npm install
npm run build
```

`dist/index.js` がMCPサーバーのエントリポイントです。npm公開は行っていないため、ローカルビルドしたものをそのまま利用します。

## 環境変数

| 変数名 | 必須 | 既定値 | 説明 |
|---|---|---|---|
| `KABU_API_PASSWORD` | 必須 | なし | kabu STATION APIのAPIパスワード |
| `KABU_API_BASE_URL` | 任意 | `http://localhost:18080/kabusapi` | kabu STATION APIのベースURL |

## Windows導入手順

Windows版 **Claude Desktop** と Windows版 **Codex Desktop app** の両方から利用できます。あらかじめWindows側で `npm install && npm run build` を実行し `dist/` を生成してください。

設定ファイルの `command` に `node` とだけ書くと、GUIアプリがPATHを解決できず起動に失敗することがあります。`where node` などで確認した**絶対パス**（例 `C:\Program Files\nodejs\node.exe`）の指定を推奨します。

### Claude Desktop（`claude_desktop_config.json`, JSON形式）

Windowsのパス区切り `\` はJSON文字列中では `\\` とエスケープします。

```json
{
  "mcpServers": {
    "kabu-station": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\path\\to\\kabuAPIMCP\\dist\\index.js"],
      "env": {
        "KABU_API_PASSWORD": "<APIパスワード>",
        "KABU_API_BASE_URL": "http://localhost:18080/kabusapi"
      }
    }
  }
}
```

### Codex Desktop app（`~/.codex/config.toml`, TOML形式）

TOMLではエスケープ不要な**リテラル文字列（シングルクォート）**を使い、バックスラッシュをそのまま書きます。

```toml
[mcp_servers.kabu-station]
command = 'C:\Program Files\nodejs\node.exe'
args = ['C:\path\to\kabuAPIMCP\dist\index.js']

[mcp_servers.kabu-station.env]
KABU_API_PASSWORD = "<APIパスワード>"
KABU_API_BASE_URL = "http://localhost:18080/kabusapi"
```

### 注意事項

- 上記いずれの設定ファイルも、kabuステーションアプリが起動済み・ログイン済みであることが前提です。
- 設定ファイルにAPIパスワードを平文で保存することになります。当該設定ファイルをGit管理下に置かない、ファイルの読み取り権限を自分のユーザーアカウントのみに絞る、といった対策を行ってください。
- stdio transportを使うため、設定ファイルにコマンドを登録するだけで追加設定なしに動作します。

## 動作確認済みの検証範囲

- ユニットテスト（`npm test`）: fetchはすべてモックし、実APIには接続しません
- CI（`windows-smoke`ジョブ）: Windowsランナー上でビルド成果物を実起動し、`tools/list` が25ツールを返すことを自動検証します
- 実際のkabuステーションアプリとの疎通確認は本リポジトリのCI/テストの対象外です。ご自身のWindows環境・稼働中のkabuステーションアプリで最終確認をお願いします。

## OpenAPI一次情報

エンドポイント仕様は [`kabucom/kabusapi`](https://github.com/kabucom/kabusapi) の `reference/kabu_STATION_API.yaml` を参照しました。実装時に確認したリポジトリのcommitハッシュは `573e43c9925bb60ebb1142087c9456c6dd955c66`（2026-07-18時点）です。

## ライセンス

MIT
