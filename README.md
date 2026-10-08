# yantkys.github.io

GitHub Pages で公開している個人用サイトへ素早くアクセスするための静的ランチャーです。
公開URL: <https://yantkys.github.io/>

HTML・CSS・JavaScript のみで実装しており、フレームワーク、外部CDN、外部API、データベース、認証は使いません。

## 構成

| ファイル | 内容 |
| --- | --- |
| `index.html` | 画面本体（CSS・JavaScript を内包） |
| `sites.json` | 登録サイトの一覧。**サイトの追加・削除・変更はこのファイルの編集だけで完結します** |

## 機能

- **検索**: サイト名・説明文を即時検索（全角/半角・大文字/小文字を区別せず、空白区切りで AND 検索）
- **お気に入り**: 画面上部にカードで表示。カード右上の ☆ で登録・解除
- **全サイト一覧**: カテゴリで絞り込み。カードのクリックで新規タブにサイトを開く。`repo` を登録したサイトには GitHub リポジトリへのリンク（`<>` ボタン）を表示
- **テーマ**: システム設定／ライト／ダークの切替（初期値はシステム設定に追従）
- **キーボード操作**

  | キー | 動作 |
  | --- | --- |
  | `/` | 検索ボックスにフォーカス |
  | `Enter`（検索中） | 先頭の結果を新規タブで開く |
  | `↓` | 検索ボックスからカードへ移動 |
  | `↑` `↓` `←` `→` | カード間を移動（先頭行で `↑` は検索ボックスへ） |
  | `Esc` | 検索語を消去（空なら検索ボックスのフォーカスを外す） |

## sites.json の書式

```json
{
  "sites": [
    {
      "id": "kanban",
      "name": "iKanban",
      "description": "個人用の4列Kanbanボード。JSONバックアップ対応",
      "url": "https://yantkys.github.io/kanban/",
      "repo": "https://github.com/YanTKYS/kanban",
      "category": "タスク・記録",
      "icon": "kanban",
      "favorite": true
    }
  ]
}
```

| 項目 | 必須 | 説明 |
| --- | --- | --- |
| `id` | ○ | 一意のID。お気に入りの保存に使うため、登録後は変更しないでください |
| `name` | ○ | サイト名 |
| `url` | ○ | サイトのURL（`http(s)` のみ） |
| `description` | | 短い説明（カードでは2行まで表示） |
| `repo` | | GitHub リポジトリURL（`github.com` のみ） |
| `category` | | カテゴリ名。省略時は「その他」。表示順は最初に登場した順 |
| `icon` | | 組み込みアイコン名、または絵文字・1〜2文字。省略時はサイト名の先頭文字 |
| `favorite` | | 初期お気に入りにするか（既定 `false`） |

組み込みアイコン名: `kanban` `clock` `news` `book` `compass` `link` `code` `doc` `calendar` `chart` `tool` `folder` `globe`
（アイコンは外部サービスを使わず、`index.html` 内の SVG で描画します。追加する場合は `index.html` の `ICONS` に定義を足します。）

### 入力の扱い

- 表示は常にテキストとして描画し、HTML は解釈しません。
- 必須項目の欠落、`id` の重複、不正な `url`（`javascript:` など）の定義は読み飛ばし、画面上部に理由を表示します。`repo` が GitHub 以外の場合は、リンクのみ表示しません。
- `sites.json` の取得失敗（HTTPエラー、通信エラー）、JSON 構文エラー、形式不正は、原因と対処を画面に表示します。

## 個人設定

お気に入りとテーマはブラウザの `localStorage`（キー `launcher.v1`）に保存します。サーバーへは送信しません。

- お気に入りを一度でも変更すると、以降はブラウザ側の内容を優先します。`sites.json` の `favorite` は、ブラウザ側に設定がない場合の初期値としてのみ使われます。
- 初期状態に戻すには、ブラウザの開発者ツールで `localStorage.removeItem('launcher.v1')` を実行して再読み込みします。

## ローカルで確認

`sites.json` を `fetch` で読み込むため、ファイルを直接開くのではなく簡易サーバー経由で開きます。

```sh
python3 -m http.server 8000
# http://localhost:8000/ を開く
```

## GitHub Pages へのデプロイ

このリポジトリはユーザーサイト（`yantkys.github.io`）で、ビルドは不要です。

1. リポジトリの **Settings → Pages** を開く
2. **Source** を **Deploy from a branch**、**Branch** を `main` / `/ (root)` にして保存
3. `main` に push すると自動的に <https://yantkys.github.io/> へ反映される（反映まで数分かかることがあります）

サイトの追加・変更は `sites.json` を編集して `main` へ push するだけです。
