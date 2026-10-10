# yantkys.github.io

GitHub Pages で公開している個人用サイトへ素早くアクセスするための静的ランチャーと、GitHub 公開リポジトリのポートフォリオです。
公開URL: <https://yantkys.github.io/>

HTML・CSS・JavaScript のみで実装しており、フレームワーク、外部CDN、データベース、認証は使いません。
ブラウザは GitHub API を呼び出さず、GitHub Actions が生成した静的 JSON だけを読み込みます。

## 画面構成

画面上部のタブで 2 つの画面を切り替えます（ページの再読み込みはありません）。初期表示は「Webサイト」です。
`#repos` を付けた URL（`https://yantkys.github.io/#repos`）で「リポジトリ」を直接開けます。

| タブ | 内容 |
| --- | --- |
| **Webサイト** | 従来のランチャー。お気に入り・サイト検索・カテゴリ絞り込み・カード一覧 |
| **リポジトリ** | 「代表作品」（手動選定）と「全リポジトリ」（自動取得）のポートフォリオ |

検索ボックスはタブごとに独立しています（切り替えても入力内容は混ざりません）。

## 構成

| ファイル | 内容 |
| --- | --- |
| `index.html` | 画面本体（CSS・JavaScript を内包） |
| `sites.json` | 登録サイトの一覧（Webサイトタブ）。**サイトの追加・削除・変更はこのファイルの編集だけで完結します** |
| `featured.json` | 代表作品に表示するリポジトリ名と表示順。**代表作品の変更はこのファイルの編集だけで完結します** |
| `repositories.json` | 公開リポジトリの一覧。**Actions が生成する**ためリポジトリには含めません |
| `scripts/fetch-repos.mjs` | GitHub REST API から `repositories.json` を生成（依存パッケージなし、Node.js 20 以上） |
| `scripts/check-data.mjs` | 配信するデータファイルの形式検証 |
| `.github/workflows/pages.yml` | データ生成と GitHub Pages へのデプロイ |

## Webサイトタブ

- **検索**: サイト名・説明文を即時検索（全角/半角・大文字/小文字を区別せず、空白区切りで AND 検索）
- **お気に入り**: 画面上部にカードで表示。カード右上の ☆ で登録・解除
- **全サイト一覧**: カテゴリで絞り込み。カードのクリックで新規タブにサイトを開く。`repo` を登録したサイトには GitHub リポジトリへのリンク（`<>` ボタン）を表示
- **テーマ**: システム設定／ライト／ダークの切替（初期値はシステム設定に追従。両タブ共通）

### キーボード操作

| キー | 動作 |
| --- | --- |
| `/` | 表示中のタブの検索ボックスにフォーカス |
| `Enter`（検索中） | 先頭の結果を新規タブで開く（Webサイト: サイト、リポジトリ: GitHub） |
| `↓` | 検索ボックスからカードへ移動 |
| `↑` `↓` `←` `→` | カード間を移動（先頭行で `↑` は検索ボックスへ） |
| `Esc` | 表示中のタブの検索語を消去（空なら検索ボックスのフォーカスを外す） |
| `←` `→` `Home` `End`（タブ上） | タブの切り替え |

## リポジトリタブ

### 代表作品

`featured.json` に列挙したリポジトリを、**記載した順**に上段のカードで表示します。全リポジトリの並び順・検索の影響は受けません。
名称・説明・主要言語・GitHub リンク・公開サイトのリンクは、自動取得した `repositories.json` の情報を使うため、説明やリンクを二重管理する必要はありません。

```json
{
  "featured": ["nestsuite", "pdfengine", "kanban", "news-watch"]
}
```

- 4〜6 件程度を想定しています。名前は大文字小文字を区別しません。
- 公開リポジトリに存在しない名前は、画面に理由を表示して読み飛ばします（Actions のログにも警告を出します）。
- 変更は `featured.json` を編集して `main` に push するだけです（その場で Actions が再デプロイします）。

### 全リポジトリ

YanTKYS が所有する**公開**リポジトリをすべて表示します。Fork と Archived もバッジで区別して表示します。

- **表示項目**: リポジトリ名・説明・主要言語・最終 Push 日（日本時間）・GitHub リンク・公開サイトのリンク
- **並び順**: 初期表示は `pushed_at` の降順（同時刻は名前順、Push 日時がないものは末尾）。「名前順」に切り替えられます（選択は保存しません）
- **検索**: リポジトリ名・説明文を入力と同時に絞り込み。代表作品は検索中も固定表示です
- **公開サイトのリンク**: `sites.json` の `repo` が一致するサイトはその `url` を優先し、なければ GitHub Pages が有効なリポジトリの標準 URL（`https://yantkys.github.io/<リポジトリ名>/`）を使います
- **説明の補完**: GitHub 側の説明が空のリポジトリは、`sites.json` の `description` を表示します

## データの自動更新（GitHub Actions）

`.github/workflows/pages.yml` が次のタイミングで実行されます。

- 毎日 1 回（03:17 JST）
- 手動実行（Actions タブ → **Deploy site** → Run workflow）
- `main` への push
- Pull Request（ビルドとデータ検証のみ。デプロイしません）

処理の流れ:

1. `index.html` `sites.json` `featured.json` を `_site/` にまとめる
2. `scripts/fetch-repos.mjs` が `GET /users/YanTKYS/repos?type=owner` をページネーション付きで全件取得し、必要な項目だけを抽出して `_site/repositories.json` を生成する（認証は `GITHUB_TOKEN` のみ。PAT や追加の Secrets は不要。100 件ごとに 1 リクエスト）
3. `scripts/check-data.mjs` でデータ形式を検証する
4. `_site/` を GitHub Pages へデプロイする（同じ実行内で公開するため、生成データは確実に反映されます）

安全策:

- 公開リポジトリのみを対象とし、`private` / `visibility` / `owner` も確認して非公開のものを含めません。
- **取得に失敗した場合や 0 件の場合はジョブが失敗し、公開中のサイトはそのまま維持されます**（空データで置き換えません）。
- ただし `main` への push のときだけは、API 障害中でも `index.html` などの変更を反映できるよう、公開中の `repositories.json` を検証したうえで再利用します（警告を出力）。定期実行・手動実行では再利用せず失敗として扱います。
- 生成物をコミットしないため、定期実行で履歴が増えることはありません。

> GitHub は、リポジトリに 60 日間活動がないと定期実行（schedule）を自動で停止します。停止した場合は Actions タブから再有効化するか、手動実行してください。

## GitHub Pages の設定（初回のみ・必須）

これまでは **Deploy from a branch** で公開していましたが、生成データを確実に公開へ反映するため、**GitHub Actions による公開**へ切り替えます。

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に変更する
2. この変更を `main` にマージする（または Actions タブで **Deploy site** を手動実行する）
3. 実行が成功すると <https://yantkys.github.io/> に反映される。「リポジトリ」タブに一覧が表示されることを確認する

Source を切り替えてから最初のデプロイが完了するまでは、公開内容が一時的に表示されない場合があります。手順 1〜2 は続けて実施してください。
ブランチ公開のままだと `repositories.json` が存在せず、「リポジトリ」タブにエラーが表示されます（「Webサイト」タブは影響を受けません）。

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
| `repo` | | GitHub リポジトリURL（`github.com` のみ）。リポジトリタブでも公開サイトのリンク・アイコン・説明の補完に使います |
| `category` | | カテゴリ名。省略時は「その他」。表示順は最初に登場した順 |
| `icon` | | 組み込みアイコン名、または絵文字・1〜2文字。省略時はサイト名の先頭文字 |
| `favorite` | | 初期お気に入りにするか（既定 `false`） |

組み込みアイコン名: `kanban` `clock` `news` `book` `compass` `link` `code` `doc` `calendar` `chart` `tool` `folder` `globe`
（アイコンは外部サービスを使わず、`index.html` 内の SVG で描画します。追加する場合は `index.html` の `ICONS` に定義を足します。）

### 入力の扱い

- 表示は常にテキストとして描画し、HTML は解釈しません。
- 必須項目の欠落、`id` の重複、不正な `url`（`javascript:` など）の定義は読み飛ばし、画面上部に理由を表示します。`repo` が GitHub 以外の場合は、リンクのみ表示しません。
- `sites.json` / `repositories.json` / `featured.json` の取得失敗（HTTPエラー、通信エラー）、JSON 構文エラー、形式不正は、原因と対処を画面に表示します。エラーは該当タブ内に表示され、もう一方のタブには影響しません。

## 個人設定

お気に入りとテーマはブラウザの `localStorage`（キー `launcher.v1`）に保存します。サーバーへは送信しません。リポジトリタブの並び順・検索語は保存しません。

- お気に入りを一度でも変更すると、以降はブラウザ側の内容を優先します。`sites.json` の `favorite` は、ブラウザ側に設定がない場合の初期値としてのみ使われます。
- 初期状態に戻すには、ブラウザの開発者ツールで `localStorage.removeItem('launcher.v1')` を実行して再読み込みします。

## ローカルで確認

JSON を `fetch` で読み込むため、ファイルを直接開くのではなく簡易サーバー経由で開きます。
`repositories.json` は Actions が生成するので、ローカルでは次のように生成します（`GITHUB_TOKEN` は任意。未指定でも公開リポジトリは取得できます）。

```sh
node scripts/fetch-repos.mjs        # repositories.json を生成（リポジトリには含めません。.gitignore 済み）
python3 -m http.server 8000
# http://localhost:8000/ を開く
```

サイトの追加・変更は `sites.json`、代表作品の変更は `featured.json` を編集して `main` へ push するだけです。
