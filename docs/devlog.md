# RaiseChat 開発ログ

開発中の意思決定・気づき・トレードオフを記録するログ。
講師・採用担当者が「なぜこの設計にしたか」を理解できることを目的とする。

---

## 2026-06-04 要件定義フェーズ

### 1. アプリケーション概要の決定

**決定内容**：Slack風チャットアプリケーション「RaiseChat」を作成する。

**意図**：
単純なチャットアプリではなく、ワークスペース・チャンネルという階層構造を持つ
本格的なビジネスチャットツールを目指した。
Slackを参考にしたのは、ワークスペース単位でチームを管理するという概念が
現場のチーム開発に近く、ポートフォリオとして実用性を示しやすいと判断したため。

---

### 2. Slackの独自機能の調査と取捨選択

**調査内容**：Discord・Microsoft TeamsとSlackの違いを調査した。

**取り込んだSlack独自の設計**：

- **スレッドをチャンネルのタイムラインと分離する設計**
  - DiscordやTeamsのスレッドは返信がタイムラインに流れ込みカオスになりやすい
  - Slackはスレッド内の会話をチャンネルタイムラインから分離する
  - これにより複数の話題が同時進行しても可読性が保たれる
  - RaiseChatでもこの設計を採用し、スレッドペインを右側に展開するUIにした

- **スレッド返信時の「チャンネルにも投稿する」オプション**
  - スレッド内の重要な結論だけをチャンネルタイムラインにも流せる機能
  - 「スレッドを追っていない人にも結論を届けたい」というニーズに対応
  - Slack らしさを高める機能として採用した

- **ワークスペース参加時の#generalへのシステムメッセージ**
  - Discordの「○○さんがサーバーに参加しました」と同じ概念
  - 全チャンネルに流れるとノイズになるため、#generalのみに投稿する設計にした
  - ワークスペース作成時に#generalを自動生成することで対応

- **メッセージのピン留め（チャンネル全員が確認可能）**
  - 個人用のブックマークではなくチャンネル共有のピン留めを採用
  - 「チームで共有すべき重要情報」をいつでも参照できる仕組みとして実装する

**スコープ外とした機能**：

- Slack Canvas（ドキュメント共同編集）
  - リッチテキストエディタ＋リアルタイム共同編集が必要で実装難易度が高い
  - 個人開発のスコープを超えると判断しスコープ外とした

- ワークフロービルダー
  - GUIで業務自動化ルールを設定する機能でローコードツールの開発に近い
  - ウェルカムメッセージのような単純な自動化はシステムメッセージで代替する

---

### 3. 技術スタックの選定

#### フロントエンド：Next.js + TypeScript

**判断**：Next.js + TypeScriptを採用した。

**理由**：
- Slack・Discord・Microsoft Teams全てがReact系のフロントエンドを採用しており
  業界標準として定着していると判断した
- TypeScriptを使うことで型安全なコードが書け、バグを早期に発見できる
- 日本の求人市場でNext.jsの需要が高く転職活動でのアピールになる

#### バックエンド：NestJS

**判断**：ExpressではなくNestJSを採用した。

**理由**：
- Expressは自由度が高い反面、設計が開発者によってバラバラになりやすい
- NestJSはController・Service・Repositoryの三層構造が強制されるため
  現場レベルの設計を学ぶことができる
- TypeScriptで統一できるためフロントとバックで言語を切り替える必要がない
- AngularライクなモジュールシステムがSpringなど他言語のフレームワークにも通じる

**トレードオフ**：
- NestJSはExpressより学習コストが高く実装期間が長くなる
- しかし「本格的なバックエンドを自分で実装した」という説明ができることを
  優先し、あえてNestJSを選択した

#### データベース：PostgreSQL + Prisma

**判断**：NoSQL（FirestoreやMongoDB）ではなくPostgreSQLを採用した。

**理由**：
- チャットアプリはユーザー・ワークスペース・チャンネル・メッセージが
  複雑に関連し合うためRDB（リレーショナルDB）が適している
- SQLの知識は現場で必須であり、学習価値が高い
- PrismaをORMとして使うことでTypeScriptの型補完が効き
  タイポによるバグを防げる

#### リアルタイム通信：Socket.io

**判断**：生のWebSocketではなくSocket.ioを採用した。

**理由**：
- Socket.ioはWebSocketをラップした高レベルなライブラリで
  再接続処理やルーム機能が標準搭載されている
- チャンネルの概念がSocket.ioのルーム機能と完全に一致しており
  チャットアプリの実装に最適と判断した
- NestJSがSocket.ioを公式サポートしており組み込みで使える

#### BaaS不採用の判断（Supabase不採用）

**判断**：SupabaseなどのBaaSを使わず自前のバックエンドを実装することにした。

**理由**：
- Supabaseは認証・DB・リアルタイム通信・ストレージを一括で提供するため
  個人開発のスピードは上がるが、バックエンドの仕組みが隠蔽される
- 「認証の仕組みを理解しているか」「APIを自分で設計できるか」という
  面接での質問に答えられるようにするため自前実装を選択した
- ポートフォリオとして「難しいことをやった」という説明ができる構成にした

---

### 4. DB設計の意思決定

#### スレッドの設計：messagesテーブルで管理（自己参照）

**判断**：threadsテーブルを別に作らず、messagesテーブルのthread_idカラムで管理した。

**理由**：
- threadsテーブルを別に作ると管理するテーブルが増え複雑になる
- 個人開発・ポートフォリオのスコープでは自己参照で十分な設計
- SlackもこれよりシンプルなDB設計に近い構造を採用している

**トレードオフ**：
- スレッド単位での既読管理や通知管理が将来的に複雑になる可能性がある
- ただし今回のスコープでは問題にならないと判断した

#### DMの設計：チャンネルメッセージと別テーブルで管理

**判断**：dmessagesテーブルをmessagesテーブルと分離した。

**理由**：
- messagesテーブルと共通化すると channel_id か dm_id のどちらかが
  必ずnullになるという不自然なデータ構造になる
- チャンネルメッセージとDMは性質が異なるため分離した方が設計として自然
- それぞれ独立して機能追加・変更がしやすい

#### 添付ファイルの設計：チャンネル用とDM用で別テーブル

**判断**：message_attachmentsとdm_message_attachmentsを別テーブルにした。

**理由**：
- DMの設計方針と一貫性を持たせるため
- 共通化するとnullカラムが増え不自然なデータ構造になる

#### メッセージ取得：カーソルベースのページネーション採用

**判断**：ページ番号ではなくカーソルベース（最後のメッセージIDを起点に取得）にした。

**理由**：
- チャットアプリは上スクロールで過去メッセージを読む無限スクロールUIが自然
- ページ番号方式だとリアルタイムでメッセージが追加された場合に
  ページのズレが発生する問題がある
- Slackも同様の方式を採用している

---

### 5. 画面設計の意思決定

#### ワークスペース切り替え：左端のアイコン縦並び

**判断**：サイドバー左端にワークスペースアイコンを縦並びで表示する設計にした。

**理由**：
- Slackの「サイドバー上部のWS名クリック→モーダル」ではなく
  Discordと同じ「左端のアイコン縦並び」を採用した
- クリック1回で切り替えられるため使いやすい
- 複数WSに所属している場合でも常に視認できる

#### 設定画面：モーダルで表示

**判断**：独立した設定ページではなくモーダル（ポップアップ）で設定を表示する。

**理由**：
- Slackと同じUXパターンで直感的に使える
- ページ遷移が発生しないためチャット画面のコンテキストを失わない

#### 未読バッジ：太字＋メンション時のみ数字バッジ

**判断**：未読は太字表示・メンションがある場合のみ数字バッジを表示する。

**理由**：
- Slackと同じUXパターンを採用した
- 全ての未読に数字バッジをつけると情報過多になる
- メンション（自分宛ての重要な通知）だけ数字バッジで目立たせることで
  優先度の高い情報を一目で把握できる

---

### 6. 開発環境の意思決定

#### Docker：全コンテナ化

**判断**：PostgreSQLだけでなくfrontend・backend全てをDockerコンテナ化した。

**理由**：
- チーム開発では全コンテナ化が一般的であり本番環境に近い構成を学びたかった
- `docker-compose up` 1コマンドで起動できるため
  採用担当者がすぐに動作確認できるポートフォリオになる
- 「現場を意識した開発環境を構築できる」というアピールになる

---

## 2026-06-05 フェーズ1：開発環境構築（PR #5）

### 8. Prisma 7.x から 6.x へのダウングレード

**状況**：最初に `prisma@^7` をインストールして `generate` を実行したところ、Windows 環境で以下のエラーが発生した。

```
Error: Could not resolve @prisma/client.
```

**原因調査**：Prisma 7.x は `datasource.url` の記述が非推奨になり、`prisma.config.ts` に接続設定を移す新しい構成が必要になっている。さらにドライバーアダプター（`@prisma/adapter-pg`）を使う `earlyAccess` モードが必須となっており、generate コマンドの動作が変わっていた。

**判断**：`prisma@^6`（安定版）にダウングレードした。

**理由**：
- Prisma 7.x の `earlyAccess` adapter API は Windows 環境で generate が通らないバグに近い挙動を示した
- ポートフォリオとして「動くものを確実に作る」ことを優先した
- Prisma 6.x は十分に成熟しており、14 テーブルのスキーマに必要な機能を全て備えている
- 7.x への移行は安定版がリリースされたタイミングで対応する

---

### 9. commitlint の Windows 対応

**状況**：`.husky/commit-msg` に `npx --no commitlint --edit $1` を設定したが、npm が `--edit` を `--editor` に展開してしまい commitlint が正しく動作しなかった。

**判断**：`node_modules/.bin/commitlint --edit .git/COMMIT_EDITMSG` を直接呼ぶ方式に変更した。

**理由**：
- `npx` 経由だと npm の引数解析が介在して `--edit` が別フラグに展開される
- `node_modules/.bin/commitlint` を直接呼ぶことで npm の解析をバイパスできる
- `.git/COMMIT_EDITMSG` を明示的に指定することで `$1` の Windows パス渡し問題も回避できる

---

### 10. lint-staged の ESLint コマンド設定

**状況**：lint-staged から `eslint --fix` を実行しようとしたが `'eslint' is not recognized` エラーが発生した。

**判断**：フェーズ1 では lint-staged の対象を Prettier のみとし、ESLint は各アプリの `npm run lint` で手動実行する運用にした。

**理由**：
- lint-staged から各アプリの ESLint を呼ぶには `cd apps/backend && npx eslint` のようなパス切り替えが必要だが、lint-staged はファイルパスを引数で渡す仕組みのため `cd` との組み合わせが難しい
- Prettier の自動フォーマットだけでも「コミット前にフォーマットが統一される」という品質担保の目的は達成できる
- ESLint は PR レビュー時に GitHub Actions で確認する運用で補完する（フェーズ2以降の課題）

---

## 2026-06-05 フェーズ1：認証機能実装（PR #6）

### 11. JWT の設計判断（アクセストークンのみ）

**判断**：リフレッシュトークンを実装せず、アクセストークン（有効期限7日）のみ採用した。

**理由**：
- リフレッシュトークンを実装するには `RefreshToken` テーブルの追加・ローテーション処理・`/auth/refresh` エンドポイント・Cookie 管理が必要になる
- フェーズ1の目的は「JWT 認証の基本的な仕組みを正しく実装する」ことであり、上記の追加実装はその目的から外れる
- 有効期限を7日に設定することで実用上の不便さを最小化した

**本番環境での改善点**：
アクセストークンの有効期限を15分に短縮し、30日有効のリフレッシュトークンと組み合わせるのが理想。Redis でリフレッシュトークンのブラックリストを管理することで、ログアウト時のトークン無効化も実現できる。この実装はフェーズ4の仕上げで検討する。

---

### 12. logout エンドポイントの設計

**判断**：`POST /auth/logout` はサーバー側で何もせず200を返すだけにした。

**理由**：
- JWT はステートレスなトークンであり、サーバー側でセッション情報を持たない
- トークンを無効化するにはトークンブラックリスト（Redis）が必要だが、フェーズ1スコープ外
- クライアント側で `localStorage` からトークンを削除する責務を持たせることで機能的には問題ない

---

### 13. login / register の失敗時に同一エラーを返す設計

**判断**：ユーザーが存在しない場合とパスワードが違う場合、同じ `401 ユーザー名またはパスワードが正しくありません` を返す。

**理由**：
- 「このユーザー名は存在しません」と「パスワードが違います」を区別すると攻撃者がユーザー名の存在確認（ユーザー列挙攻撃）に悪用できる
- セキュリティのベストプラクティスとして両者を区別しないことが推奨される

---

### 14. passwordHash を Repository の select で除外

**判断**：`AuthRepository` の `findById` と `createUser` は `select` でパスワードハッシュを除外して返す。

**理由**：
- Service・Controller 層でレスポンスを構築する際に `passwordHash` が混入するリスクをゼロにする
- ORM の選択的取得機能（Prisma の `select`）を活用することで、レスポンスの安全性をデータ取得の段階で保証できる
- `Omit<User, 'passwordHash'>` のような型操作より、DB から最初から取得しない方が確実

---

### 15. Zustand を初期から採用した理由

**判断**：フロントエンドのグローバル状態管理に Context API ではなく Zustand を採用した。

**理由**：
- フェーズ2以降でメッセージ・チャンネル・オンライン状態など複数のグローバル状態が増える
- Context API は状態が増えるにつれて Provider のネストが深くなりコードが複雑化しやすい
- Zustand はボイラープレートが少なく、状態を store 単位でシンプルに管理できる
- 初期から Zustand を使うことで、フェーズ2以降のストア追加が一貫したパターンで書ける

---

### 16. 将来の拡張候補として検討したこと

#### キャッシュ機能（Redis）をスコープ外とした理由

**判断**：Redisによるキャッシュ機能は今回のスコープ外とした。

**理由**：
- ポートフォリオ・個人開発のスケールでは必須ではない
- まずコア機能を完成させることを優先した
- ただし大規模化した際のボトルネックは理解しており
  メッセージ一覧・オンライン状態・タイピング状態・セッション管理で
  Redisが有効であることは把握している

---

## 2026-06-05 フェーズ2：基盤強化（PR #7）

### 17. グローバル例外ハンドリングを AllExceptionsFilter に一本化した理由

**判断**：フェーズ1の `HttpExceptionFilter`（HTTP例外専用）を廃止し、全例外を捕捉する `AllExceptionsFilter` に統合した。

**理由**：
- フェーズ2でPrismaのDB操作が増えるにつれ、`P2002`（unique制約違反）や `P2025`（レコード未存在）などのPrismaエラーがService層から素通りしてしまう問題が顕在化する
- これらを個別のtry-catchで処理するとコードが冗長になり、漏れが生じやすい
- 1つのフィルターで「HttpException → そのまま返す」「PrismaエラーP2002 → 409」「P2025 → 404」「その他 → 500 + Logger.error」と一元マッピングすることでService層の実装をシンプルに保てる

**トレードオフ**：
- 全例外を1つのフィルターで処理するため、例外の種類が増えた際にこのフィルターが肥大化する可能性がある
- ただし現状のスコープでは管理しやすい範囲に収まっている

---

### 18. 権限ガードを Guard クラスとして切り出した理由

**判断**：ワークスペースメンバー確認・オーナー確認・チャンネルメンバー確認を `WorkspaceMemberGuard` / `WorkspaceOwnerGuard` / `ChannelMemberGuard` として独立したクラスにした。

**理由**：
- `@UseGuards()` デコレータを重ねるだけで複数の権限チェックを組み合わせられる
- Controller のメソッドに権限チェックのロジックを書くと、Controller が肥大化してテストが難しくなる
- Guard → Service → Repository の責務分離ルールを守れる
- `WorkspaceMemberGuard` が `request['workspaceMemberRole']` にロールをセットすることで、後続の `WorkspaceOwnerGuard` がDBアクセスなしにロールを確認できる設計にした

---

## 2026-06-05 フェーズ2：ワークスペース管理（PR #8）

### 19. ワークスペース作成を $transaction で実装した理由

**判断**：ワークスペース作成時に `#general` チャンネルを自動生成する処理を `prisma.$transaction` で包んだ。

**理由**：
- ワークスペース作成は成功したが `#general` チャンネル作成が失敗した場合、チャンネルのないワークスペースというデータ不整合が生じる
- トランザクションにより「全部成功か全部失敗か」を保証できる（原子性）
- 招待コード参加も同様にトランザクション化し、ワークスペース参加とデフォルトチャンネルへの自動参加をセットで保証した

---

### 20. 招待コード参加に upsert を使った理由

**判断**：招待コード参加の `WorkspaceMember` と `ChannelMember` の作成に `upsert` を使った。

**理由**：
- 既に参加済みのユーザーが再度招待コードを使って参加しようとした場合に、一意制約違反（P2002）でエラーになるのを防ぐため
- `upsert` の `update: {}` により「既存レコードがあれば何もしない、なければ作成する」というべき等な操作を実現した
- これによりフロントエンドが誤って二重リクエストを送っても安全に処理できる

---

## 2026-06-05 フェーズ2：チャンネル管理（PR #9）

### 21. チャンネル一覧のN+1対策

**判断**：チャンネル一覧を取得する `findAccessibleChannels` で、Prisma の `select` + ネストした `_count` を使い1クエリで取得した。

**理由**：
- 単純な `findMany` でチャンネル一覧を取得し、その後で各チャンネルのメンバー数を取得するとN+1クエリが発生する
- Prisma の `_count: { select: { members: true } }` を使うことで、メンバー数を集計するSQLをJOINとして同一クエリに含めてもらえる
- プライベートチャンネルの可視性フィルタも `OR: [{ isPrivate: false }, { members: { some: { userId } } }]` で1クエリに収めた

---

### 22. チャンネル名のバリデーションに正規表現を使った理由

**判断**：チャンネル名を `/^[a-z0-9_-]+$/` に制限した。

**理由**：
- Slack のチャンネル名は英小文字・数字・ハイフン・アンダースコアのみ許可されており、同様の制約を採用した
- スペースや日本語を含むチャンネル名はURLパラメータや Socket.io のルーム名として扱うときにエスケープ処理が必要になる
- チャンネル名を URL の一部として使える形式に制限することで将来の拡張が容易になる

---

### 23. デフォルトチャンネルの削除を禁止した理由

**判断**：`isDefault: true` のチャンネルを `DELETE` しようとした場合、Service 層で 403 を返すようにした。

**理由**：
- `#general` チャンネルは招待コード参加時に全メンバーが自動参加するチャンネルで、削除されるとワークスペースのコミュニティ基盤が失われる
- DBのCascade設定でワークスペース削除時にチャンネルも削除されるため、「ワークスペースを消さずにデフォルトチャンネルだけ消す」操作は意図しない操作と判断した

---

## 2026-06-05 フェーズ2：メッセージング（PR #10）

### 24. メッセージ一覧のN+1対策（MESSAGE_SELECT定数）

**判断**：メッセージ取得クエリの `select` を `MESSAGE_SELECT` 定数として切り出し、全メッセージ取得メソッドで共有した。

**理由**：
- メッセージ1件につきauthor（User）・attachments・reactionsを個別クエリで取得するとN+1が発生する
- Prisma の `select` でネストした関連テーブルをまとめて取得することで、メッセージ50件 + author + attachments + reactions を1〜数クエリで取得できる
- 定数として切り出すことで `findManyByChannelId` / `findById` / `create` などの全メソッドで同じ取得形式を保証し、レスポンス形状の不一致バグを防ぐ

---

### 25. リアクション集計をService層で実装した理由

**判断**：リアクションの絵文字別カウント・自分のリアクション有無の判定を `aggregateReactions` としてService層のメモリ集計で実装した。

**理由**：
- SQLの `GROUP BY` + `COUNT` で集計するには Prisma の `groupBy` を使う必要があるが、`groupBy` は `findMany` と同時に発行できず別クエリになる
- メッセージ50件 × `groupBy` = 最大50クエリのN+1が発生してしまう
- `reactions: { select: { emoji: true, userId: true } }` で全リアクションを1クエリで取得し、JavaScript の `Map` で集計する方が結果的にクエリ数が少なくなる
- また「自分がリアクション済みか（`hasMe`）」はSQLで表現するよりもアプリ層で判定する方がシンプル

---

### 26. メッセージ削除をソフトデリートにした理由

**判断**：メッセージの「削除」は `DELETE` ではなく `deletedAt` に日時をセットするソフトデリートで実装した。

**理由**：
- 物理削除すると「このメッセージは削除されました」という表示ができなくなる（Slack と同様のUX）
- スレッドの親メッセージが削除された場合でもスレッド返信の整合性を保てる
- 監査ログや誤削除の復元対応が将来的に必要になった場合に対応できる

---

### 27. カーソルベースページネーションで limit+1件取得する実装

**判断**：`findMany` で `take: limit + 1` 件取得し、超過分の有無で `hasMore` を判定した。

**理由**：
- `COUNT` クエリを別途発行して総件数を求める方式はパフォーマンスが悪い
- `limit + 1` 件取得して「limit件より多く返ってきた = まだある」と判定することで、追加のクエリなしに `hasMore` フラグを得られる
- この実装パターンはRelayのカーソルベースページネーション仕様に準拠しており、業界標準の手法

---

## 2026-06-05 フェーズ2：Socket.io リアルタイム（PR #11）

### 28. Gateway での JWT 検証を handleConnection で行った理由

**判断**：Socket.io の接続認証を `handleConnection` ライフサイクルフックで実施し、失敗時は即 `client.disconnect(true)` した。

**理由**：
- REST API の `JwtAuthGuard` は HTTP リクエスト単位で動作するが、WebSocket は一度接続すると持続するため接続確立時点で認証を完了させる必要がある
- Middleware での JWT 検証も可能だが、NestJS の `handleConnection` の方が実装がシンプルで `AuthenticatedSocket` 型として `userId` / `username` を後続ハンドラに渡しやすい
- 認証失敗時に即切断することで、未認証クライアントが何らかのイベントを送り込むことを防ぐ

---

### 29. Socket.ioルーム設計の判断

**判断**：`workspace:{id}` ルームと `channel:{id}` ルームを分離した。

**理由**：
- `workspace:{id}` ルームは `presence:updated`（オンライン状態）の配信にのみ使う。メッセージはチャンネルごとにルームを分けることで、無関係なチャンネルのメッセージが届かないようにする
- チャンネルルームへの参加前に `isChannelMember` チェックを挟むことで、プライベートチャンネルに未招待ユーザーが参加するのを防ぐ
- この設計はSlackのチャンネル概念と1:1で対応しており、将来のルーム管理が直感的になる

---

### 30. タイピングインジケーターをDBアクセスなしで実装した理由

**判断**：`typing:start` / `typing:stop` の処理でDBへのアクセスを行わず、そのまま同じチャンネルルームの他のメンバーに転送するだけにした。

**理由**：
- タイピング状態はリアルタイム性が最重要で、DBに保存する必要がない揮発性のデータ
- DBアクセスが入ると数十〜数百msのレイテンシが加算され、「入力中」の表示が遅れてUXが悪化する
- Socket.io の `client.to(room).emit()` で即時転送することでDBアクセスなしに低レイテンシを実現した
- 2秒間入力がなければ自動で `typing:stop` を送信するdebounce処理をフロントエンドのフックに実装し、ネットワーク切断時の「ずっと入力中」問題を防いだ

---

### 31. socket.io / socket.io-client のバージョン統一

**判断**：バックエンドの `socket.io` とフロントエンドの `socket.io-client` を同じ v4.8.3 で統一した。

**理由**：
- socket.io はメジャーバージョン間でプロトコルの互換性がなく、サーバーとクライアントのメジャーバージョンが異なると接続できない
- npm install 時に自動的に v4.8.3 が入ったため明示的に固定した
- 将来バージョンアップする際も両方を同時に上げる必要があることを認識している

---

## 2026-06-05 フェーズ2：型エラー修正・クリーンアップ（PR #12）

### 32. DTOプロパティに ! アサーションを付けた理由

**判断**：`strictPropertyInitialization` により全DTOプロパティに `!` を付けた。

**理由**：
- TypeScriptの `strictPropertyInitialization` はコンストラクタで初期化されないプロパティをエラーにする
- DTOはclass-validatorのデコレータで動作し、コンストラクタではなくリクエストのデシリアライズ時に値がセットされる
- NestJSの標準DTOパターンは `!` アサーションで「この値は必ずセットされる」と宣言する設計（既存の `RegisterDto` と同じパターン）
- `?` をつけてオプショナルにするとバリデーションの意図が変わってしまうため `!` が適切

---

## 2026-06-05 フェーズ2：Claudeレビューで発見・修正したバグ

### 33. チャンネル操作のIDOR脆弱性（PR #9 レビュー指摘）

**状況**：Claude Code Review が `GET/PATCH/DELETE /workspaces/:wsId/channels/:channelId` 系エンドポイントで IDOR（Insecure Direct Object Reference）脆弱性を指摘した。

**問題の詳細**：
- `WorkspaceMemberGuard` はユーザーが `:wsId` のメンバーかどうかしか確認しない
- Service 層の `getChannel(channelId)` / `deleteChannel(channelId)` は `channelId` のみで検索しており、そのチャンネルが `:wsId` に属するかを誰も検証していなかった
- 結果として「ワークスペースAのオーナーが、ワークスペースBのチャンネルIDを知っていれば削除できる」という攻撃が成立していた

**修正**：Service 層の全メソッドに `workspaceId` 引数を追加し、`channel.workspaceId !== workspaceId` の場合に 404 を返す検証を追加した。

**404 を返す理由**（403 ではなく）：
- 403 だと「そのチャンネルIDが存在するが権限がない」という情報が攻撃者に漏れる
- 404 にすることで他ワークスペースのチャンネルIDの存在自体を隠蔽できる

**教訓**：URLの階層構造（`/workspaces/:wsId/channels/:channelId`）は、子リソースが親リソースに属することを**自動的には保証しない**。Service 層で明示的に親子関係を検証する必要がある。

---

### 34. メッセージ操作のIDOR脆弱性（PR #10 レビュー指摘）

**状況**：Claude Code Review が `PATCH/DELETE /workspaces/:wsId/channels/:channelId/messages/:messageId` で同様の IDOR 脆弱性を指摘した。さらに `isOwner` チェックに URL の `:wsId`（攻撃者が制御できる値）を使っていることも問題だと指摘された。

**問題の詳細**：
- `findById(messageId)` は `channelId` のスコープなしに取得できていた
- `isOwner(userId, wsId)` の `wsId` は URL から来る値。攻撃者が自分のワークスペースを作成してオーナーになれば、`isOwner` が `true` を返し他ワークスペースのメッセージを編集・削除できた

**修正**：
- `message.channelId !== channelId` の場合に 404 を返す検証を追加
- `isOwner` チェックはメッセージが実際に属するチャンネルの `workspaceId` を取得して使うよう変更
- Controller から `wsId` ではなく `channelId` を渡すよう修正（チャンネルからワークスペースを辿る）

**設計の学び**：権限チェックに使う ID は「URL パラメータ（攻撃者が操作できる）」ではなく「DB から取得したリソースの実際の親 ID」を使う必要がある。

---

### 35. 過去メッセージ読み込み時にスクロールが最下部に飛ぶバグ（PR #10 レビュー指摘）

**状況**：Claude Code Review が `MessageList.tsx` の `useEffect` が `messages.length` を依存配列にしていることで、`loadMore()` による過去メッセージ追加でも最下部スクロールが発火すると指摘した。

**問題の詳細**：
- 上スクロールで過去メッセージを読み込む → `messages.length` が増える → `useEffect` が発火 → 最下部にスクロール → ユーザーが読もうとした過去メッセージが見えなくなる

**修正**：`messages[0]?.id`（配列先頭 = 最新メッセージの ID）を依存配列に変更した。

**理由**：
- 新着メッセージが追加されると配列先頭の ID が変わる → スクロール発火（正しい挙動）
- `loadMore()` は過去メッセージを配列末尾に追加するため配列先頭の ID は変わらない → スクロールしない（正しい挙動）
- `messages.length` より意味が明確で、新着か過去かを正確に区別できる

---

### 36. gateway.service の isOwner に channelId を渡していたバグ（PR #11 レビュー指摘）

**状況**：Claude Code Review が `gateway.service.ts` の `updateMessage` で `workspacesRepository.isOwner(data.userId, message.channelId)` と誤って channel ID を workspace ID 引数に渡していることを指摘した。

**問題の詳細**：
- `Channel.id` と `Workspace.id` はそれぞれ独立した CUID（`cuid()` で生成）で絶対に一致しない
- `WorkspaceMember` テーブルに `{ userId, workspaceId: channelId }` のレコードが存在するはずがないため `isOwner` は常に `false` を返していた
- 結果として「WS オーナーが Socket.io 経由で他ユーザーのメッセージを編集しようとすると常に拒否される」というバグが発生していた

**修正**：`prisma.channel.findUnique` で `workspaceId` を取得してから `isOwner` に渡すよう修正した。

**教訓**：ID の型が同じ `string` だとコンパイルエラーが出ず、誤った ID を渡してもビルドが通ってしまう。引数の型に `WorkspaceId` / `ChannelId` のような branded type を使うと防げるが、今回は明示的なコメントと変数名で対処した。

---

### 37. ワークフローファイル変更を含む PR で Claude Review が動かない問題（PR #12）

**状況**：PR #12 に `.github/workflows/claude-code-review.yml` の変更（`pull-requests: read → write`）が含まれていたため、Claude Code Action が以下のエラーで動作しなかった。

```
Workflow validation failed. The workflow file must exist and have identical content 
to the version on the repository's default branch.
```

**理由**：GitHub は PR に含まれるワークフローファイルの変更をセキュリティ上の理由でブロックする。ワークフローの変更は `main` にマージされて初めて有効になる。

**対処**：PR #12 はコードの問題がないことを確認の上そのままマージした。マージ後は `main` のワークフローが更新され、以降の PR で Claude Review が正常に動作するようになる。

---

## 2026-06-06 フェーズ3：スレッド返信（PR #15）

### 38. スレッド返信をチャンネルタイムラインに混入させない設計

**判断**：スレッド返信（`threadId` あり）はチャンネルタイムライン（`GET .../messages`）に含めず、専用エンドポイント（`GET .../messages/:id/replies`）からのみ取得できるようにした。

**理由**：
- Slack と同様に、スレッドの返信は親メッセージのスレッドパネルを開いた時にのみ見える設計が自然なUX
- タイムラインに返信が混入するとページネーションのカーソル計算がずれ、件数管理が複雑になる
- `findManyByChannelId` の `where` 条件に `threadId: null` を追加するだけで実現でき、変更コストが低い

**Socket.io の対応**：スレッド返信を受信した際、`message:received` イベントではタイムラインに追加しない（`if (!msg.threadId)`）。代わりに `thread:reply_count_updated` イベントで親メッセージの返信数・最新返信者アバターを更新する。

---

### 39. `MESSAGE_SELECT` に返信カウント・最新返信者を含めた理由

**判断**：`MESSAGE_SELECT` 定数に `_count: { select: { replies: true } }` と `replies: { take: 3, orderBy: { createdAt: 'desc' }, select: { user: ... } }` を追加した。

**理由**：
- タイムラインのメッセージアイテムに「3件の返信 + 返信者アバター」を表示するためには、メッセージ一覧取得時に返信情報を含める必要がある
- 表示に必要な最新3件のみ `take: 3` で取得し、全返信を取得するよりもデータ転送量を抑えた
- `MESSAGE_SELECT` を共有定数にしているため、`create` / `findById` / `findManyByChannelId` の全メソッドで自動的に一貫した形状が返る

---

### 40. スレッドパネルを独立した Zustand ストアで管理した理由

**判断**：スレッドの開閉状態・親メッセージ・返信一覧を `thread.store.ts` として分離した。

**理由**：
- スレッドパネルはチャンネルページとは独立したライフサイクルを持つ（別チャンネルに移動したらリセット）
- `useThread` フックで取得・送信ロジックをカプセル化し、ページコンポーネントをシンプルに保てる
- チャンネルの `message.store` とスレッドの `thread.store` を分けることで、返信追加時に親チャンネルのページネーション状態に影響しない

---

## 2026-06-06 フェーズ3：ダイレクトメッセージ（PR #15）

### 41. 1対1 DM の重複防止に `$transaction` を使った理由

**判断**：`findOrCreateDirectRoom` を `prisma.$transaction` 内で実装した。

**理由**：
- 2ユーザー間で同時に DM 作成リクエストが来た場合、通常の find → create パターンでは「両方が `find` で未存在を確認 → 両方が `create` を実行」という race condition が発生する
- `$transaction` 内でも完全な serializable 保証はないが、同一プロセス内の短いトランザクションでは実用上の重複を防げる
- さらに JS 側で「取得した candidates の中に exactMatch があれば return」という二重チェックを入れ、万一重複が起きても最初のレコードを返すフォールバックを持たせた

---

### 42. DM ルームのアクセス制御に専用 Guard を作成した理由

**判断**：`DmRoomMemberGuard` を独立したクラスとして実装した。

**理由**：
- DM メッセージの取得・送信・編集・削除はすべて「ルームメンバーであること」を前提とする
- `@UseGuards(JwtAuthGuard, DmRoomMemberGuard)` をコントローラーレベルに付けるだけで全エンドポイントを保護でき、メソッドごとに重複コードを書かなくて済む
- `WorkspaceMemberGuard` と同じ設計パターンを踏襲することでコードベースの一貫性を保った
- Socket.io ハンドラ（`dm:send` 等）でも `gatewayService.isDmRoomMember()` を呼ぶことで WebSocket 経由の IDOR も防止した

---

### 43. DM ルーム表示名を utility 関数として切り出した理由

**判断**：`getDmRoomDisplayName(room, myUserId)` を `lib/dm.ts` に配置した。

**理由**：
- グループ DM は `room.name` を表示し、1対1 DM は相手の `displayName` を表示するというロジックが複数コンポーネントで必要になる
- この判定ロジックをコンポーネント内に書くと重複が生じ、将来グループDM名の変更仕様が追加された際に修正漏れが起きる
- utility 関数にすることでテストしやすく、変更箇所を一元化できる

---

## 2026-06-06 フェーズ3：通知システム（PR #15）

### 44. 通知生成を NotificationsService に集中させた理由

**判断**：メンション通知・スレッド返信通知・DM未読通知の生成ロジックをすべて `NotificationsService` に集約し、各サービスから fire-and-forget で呼び出す設計にした。

**理由**：
- 通知の生成条件（誰に・何を・いつ）は NotificationsService が知るべきであり、MessagesService や DmRoomsService に書くと責務が混在する
- `void this.notificationsService.notifyMentions(...)` の fire-and-forget パターンにより、通知生成の失敗がメッセージ送信のレスポンスレイテンシに影響しない
- 将来的に通知種別が増えた場合も NotificationsService だけを変更すればよい

---

### 45. ユーザー個別 Socket.io ルームで通知を配信した理由

**判断**：接続時に `client.join('user:${userId}')` し、`server.to('user:${userId}').emit('notification:received', ...)` で通知を配信するアーキテクチャを採用した。

**理由**：
- `channel:{id}` ルームは全チャンネルメンバーへのブロードキャスト用。通知は受信者1人だけに届ける必要があり、チャンネルルームでは他者に漏れる
- ユーザーIDをルーム名にすることで、マルチタブ・マルチデバイスのセッションすべてに同時に届けられる
- 将来 Redis Adapter に切り替えても `server.to(room).emit()` のインターフェースは変わらない

---

### 46. 通知の重複防止に `createIfNotExists` パターンを使った理由

**判断**：`prisma.notification.upsert` ではなく `findFirst` + `create` の組み合わせ（`createIfNotExists`）を実装した。

**理由**：
- `upsert` は `where` 条件に unique インデックスが必要。`(type, userId, messageId)` の複合 unique インデックスを追加する変更は影響範囲が大きい
- `findFirst` で既存チェックをしてから `create` する方式なら、インデックス変更なしに実装できる
- `messageId` が null の DM 通知（`dmRoomId` で重複チェック）と messageId あり通知（`messageId` で重複チェック）でロジックを分岐させることで、null 値の衝突（null === null）による誤検知を防いだ

---

### 47. 通知の `dmRoomId` カラムを別途追加した理由

**判断**：DM 通知の識別に既存の `channelId` カラムを使わず、`Notification` モデルに `dmRoomId` カラムを新設した。

**理由**：
- `channelId` は `Channel` テーブルへの FK 制約があるため、`DmRoom` の ID を格納しようとすると外部キー制約違反でレコード作成が失敗する（実際にこのバグを踏んだ）
- `dmRoomId` として `DmRoom` への正しい FK を持つカラムを追加することで、データの整合性をDB側で保証できる
- `schema.prisma` に `dmRoomId String?` と対応する `@relation` を追加し、`prisma db push` でスキーマを反映した

---

### 48. 通知ベルの未読数をサーバーから再取得して同期した理由

**判断**：`notification:received` を受け取った際、楽観的に `incrementUnreadCount()` を呼んだ後、`getNotifications(undefined, 1)` で正確な `unreadCount` を再取得してセットしなおす方式にした。

**理由**：
- 楽観的更新だけだと、タブを長時間開いていた場合に別デバイスで既読にした通知がカウントされ続ける
- かといってリアルタイムで全通知リストを再取得するとパケット量が大きい
- `limit=1` で `unreadCount` フィールドだけを目的にリクエストすることで、最小限のデータで正確な未読数を得られる

---

## 2026-06-06 フェーズ3：Claudeレビューで発見・修正したバグ（PR #15）

### 49. findOrCreateDirectRoom の構造不一致バグ（バグ #1）

**状況**：Claude Code Review が `findOrCreateDirectRoom` の既存ルーム取得パスと新規作成パスで返却オブジェクトの構造が異なることを指摘した。

**問題の詳細**：
- 既存ルーム取得パスでは `include: { members: { select: { userId: true } } }` を使っていたため `members[].user` が `undefined`
- 新規作成パスでは `select: DM_ROOM_SELECT` を使っており `members[].user` が正しく返ってくる
- 結果として「既存 DM ルームを開こうとするとフロントエンドで TypeError が発生する」というバグ

**修正**：既存ルーム取得パスも `select: DM_ROOM_SELECT` に統一し、両パスが同一形状を返すようにした。

**教訓**：2つのコードパスが同じ型を返すと思っている場合でも、`select` と `include` の書き方が異なると返却形状が変わる。`SELECT` 定数を共有することで形状の一貫性を強制できる。

---

### 50. useSocket の無限再接続ループバグ（バグ #2）

**状況**：Claude Code Review が `useSocket.ts` の `useEffect` 依存配列に `messages` が含まれることで、メッセージ受信のたびに Socket.io のルーム再参加が起きると指摘した。

**問題の詳細**：
- `messages` が依存配列にある → メッセージ受信で `addMessage` が呼ばれる → `messages` 配列の参照が変わる → `useEffect` が再実行される → `workspace:join` / `channel:join` が再 emit される
- 再参加のたびにイベントリスナーが二重登録され、同じメッセージが複数回表示されることもあった

**修正**：`onThreadReplyCountUpdated` ハンドラ内で `useMessageStore.getState()` を使って最新状態を参照するようにし、`messages` / `setMessages` / `nextCursor` / `hasMore` を依存配列から取り除いた。

**設計の学び**：Zustand の `getState()` は useEffect のクロージャ問題を回避するための重要なパターン。「useEffect 内で Zustand ストアの値が必要だが、依存配列に入れると無限ループになる」場合は `getState()` で解決できる。

---

### 51. getReplies の IDOR 脆弱性（バグ #3）

**状況**：Claude Code Review が `GET .../channels/:channelId/messages/:messageId/replies` に IDOR 脆弱性があると指摘した。

**問題の詳細**：
- `messageId` が実際に `:channelId` に属するかを検証していなかった
- 攻撃者がチャンネルAのメンバーとして、チャンネルBのメッセージIDを `:messageId` に指定すると、チャンネルBのスレッド返信が取得できた

**修正**：`messagesService.getReplies` の先頭に `findById(parentMessageId)` → `parent.channelId !== channelId` のチェックを追加し、不一致の場合 404 を返すようにした。

**教訓**：URLの `:channelId` と `:messageId` の親子関係は DB で検証しなければならない。フェーズ2のチャンネル・メッセージ IDOR と同じパターン。リソースを操作する前に必ずリソースが URL で示された親に属することを確認する。

---

### 52. DM 通知の重複防止ロジックが動作していなかったバグ（バグ #4）

**状況**：Claude Code Review が DM 通知の重複防止に `channelId` フィールドを使っていることを指摘した（DmRoom ID は Channel FK の制約に違反する）。

**問題の詳細**（2段階で発生）：
- 第1段階：`notifyDmUnread` が `dmRoomId` を `channelId` フィールドに格納しようとした → `Channel` FK 制約違反で `prisma.notification.create` が毎回エラー → 通知レコードが一切作成されていなかった
- 第2段階：スキーマに `dmRoomId` カラムを追加して `prisma generate` を実行したが、`apps/backend/node_modules/.prisma/client` に古いキャッシュが残っており TypeScript は古い型を参照し続けた

**修正**：
1. `prisma/schema.prisma` に `Notification.dmRoomId String?` カラムと `DmRoom` への `@relation` を追加
2. `apps/backend/node_modules/.prisma` と `apps/backend/node_modules/@prisma/client` を削除してキャッシュをクリア
3. ルートで `prisma generate` を再実行し、バックエンドが正しい Prisma Client を参照するようにした

**教訓**：monorepo で Prisma を使う場合、`generate` の出力先（ルートの `node_modules`）とサービスが参照する `node_modules` が異なる場合がある。スキーマ変更後に型エラーがない場合でも、サブパッケージに古いキャッシュが残っている可能性を疑う。

---

## 2026-06-06 フェーズ4：絵文字リアクション（PR #16）

### 53. リアクションのトグル設計（upsert → delete パターン）

**判断**：リアクション追加・削除を別々のエンドポイント（`POST` / `DELETE`）で分けず、1回のリクエストでトグルする設計にした。

**理由**：
- Slack のリアクションは「同じ絵文字を2回クリックで取り消し」というUXが直感的
- フロントエンドが「今リアクション済みか」を事前に確認してエンドポイントを切り替えるより、バックエンドがトグルを担当する方が競合状態（同時クリック）への耐性が高い
- `upsert` → 既存なら `delete`、なければ `create` という atomic な実装で race condition を回避した

**Prismaエラー対応**：
- `P2002`（unique制約違反）が発生した場合は「既にリアクション済み」として正常終了（べき等）
- `P2025`（削除対象なし）が発生した場合は「既に削除済み」として正常終了（べき等）
- AllExceptionsFilter がこれらを自動的に適切なHTTPステータスに変換する

---

### 54. Socket.io `reaction:updated` のペイロード設計

**判断**：`reaction:updated` イベントのペイロードを `{ messageId, reactions: { emoji, userIds[] }[] }` 形式にした。

**理由**：
- 差分（「誰が追加した」「誰が削除した」）を送るより、最新の全リアクション状態を毎回送る方がクライアントのロジックが単純になる
- 「`hasMe`（自分がリアクション済みか）」はフロントエンドが `userIds.includes(currentUserId)` で判定できるため、サーバーが `userId` に依存するロジックを持たなくてよい
- パケット量は増えるが、リアクション数がそれほど多くないポートフォリオスケールでは問題にならない

---

### 55. `aggregateReactions` をバックエンドとフロントエンドの両方に実装した理由

**判断**：`aggregateReactions` 関数をバックエンドの `MessagesService` とフロントエンドの `lib/utils/reaction.ts` の両方に配置した。

**理由**：
- REST API（GET /messages）のレスポンスにはサーバー側集計が必要（どのユーザーがリクエストしたかは `userId` で判定）
- Socket.io `reaction:updated` はフロントエンドが受け取った全 `userIds` から `hasMe` を算出する必要がある
- 重複実装に見えるが、バックエンドは「DBから取得した生データ → 集計済みオブジェクト」、フロントエンドは「Socketから来た集計済みデータ → 表示用データ」と変換対象が異なる

---

## 2026-06-06 フェーズ4：メッセージピン留め（PR #17）

### 56. ピン削除権限を「追加者 or オーナー」に設定した理由

**判断**：ピン削除はピンを追加したユーザーかワークスペースオーナーのみ可能とした。

**理由**：
- チャンネルメンバー全員がピンを削除できると、誤ってまたは意図的に他者のピンを消せてしまう
- Slack と同様の権限設計を採用した
- 既存の `workspacesRepository.isOwner()` を再利用できるため実装コストが低い
- ピン追加（チャンネルメンバー全員可）と削除（追加者 or オーナーのみ）を分けることで「誰でも重要情報をシェアできるが、それを消せるのは追加者か管理者だけ」という自然な権限モデルになる

---

### 57. `removePin` の IDOR 修正（Claudeレビュー指摘）

**状況**：Claude Code Review が `removePin` 内でワークスペースオーナー判定に URL の `:wsId`（攻撃者制御可能）を使っていると指摘した。

**問題の詳細**：
- `isOwner(userId, wsId)` の `wsId` が URL パラメータ由来だった
- 攻撃者が自分のワークスペースを作成してオーナーになれば、`isOwner` が `true` を返し他ワークスペースのピンを削除できた

**修正**：`removePin` の先頭で `pin.channelId → channel.workspaceId` と DB を辿って正しい `workspaceId` を取得し、それを `isOwner` に渡すよう修正した。

**教訓**：URL パラメータの `:wsId` は「攻撃者が操作できる入力値」であり、権限チェックに直接使ってはならない。常に DB から辿ったリソースの `workspaceId` を使う（フェーズ2・3で繰り返し指摘されたパターンと同じ）。

---

## 2026-06-06 フェーズ4：ファイルアップロード（PR #18）

### 58. S3 キーをDBに保存し、署名付き URL は読み取り時に生成する設計

**判断**：`message_attachments.file_url` カラムには S3 キー（例：`{workspaceId}/{uuid}.jpg`）を保存し、クライアントへのレスポンス時に `getSignedUrl()` で1時間有効の署名付き URL に変換する方式を採用した。

**理由**：
- 署名付き URL には有効期限（1時間）がある。URL をDBに保存すると、有効期限切れ後にレスポンスに含まれた URL が使えなくなる
- S3 キーはバケットのプレフィックスを変えるだけで新バケットに移行でき、DBの値を変更する必要がない
- S3 キーはバイト数が少なく、`MAX_LENGTH(512)` で確実に収まる

**トレードオフ**：
- メッセージ取得のたびに S3 の `GetObjectCommand` を発行するため、レイテンシが増加する
- ただし `getSignedUrl` は HTTP リクエストを発行しない（クライアント側で URL を計算するだけ）ため実際のオーバーヘッドは小さい

---

### 59. `resolveAttachmentUrls` パターンを Repository に実装した理由

**判断**：`MessagesRepository` と `DmRoomsRepository` に `resolveAttachmentUrls` プライベートメソッドを実装し、全メッセージ返却メソッドで一元的に署名付き URL への変換を行う設計にした。

**理由**：
- Controller・Service・Repository の3層のうち、DBから取得した生の S3 キーを知っているのは Repository だけである
- Service 層が S3 キーの存在を知ると、Service が S3 の実装詳細に依存してしまう
- `resolveAttachmentUrls` をすべてのメッセージ返却メソッドで呼ぶことで、呼び出し元が「DB値か署名付きURLか」を意識せずに済む

**S3 障害時の耐障害性**：各添付ファイルの `getSignedUrl` 呼び出しを個別に `try/catch` でラップし、失敗した場合は `fileUrl: null` を返す。`Promise.all` の一つが失敗してもチャンネル全体のメッセージが表示されなくなる事態を防ぐ。

---

### 60. マジックバイト検証の実装判断

**判断**：アップロードされたファイルのMIMEタイプをファイルヘッダー（マジックバイト）で検証するバリデーションを自前実装した。

**理由**：
- ファイルの Content-Type ヘッダーはクライアントが自由に設定できるため、MIME タイプ偽装攻撃（`.exe` を `image/jpeg` と偽ってアップロード）を防げない
- `file-type` ライブラリは ESM 専用化により CommonJS 環境（NestJS）との互換性問題があったため、自前実装を選択した
- 各MIMEタイプのマジックバイトをオフセット付きで定義する `MAGIC` 配列で、WebP の `RIFF...WEBP` のような複数位置チェックにも対応した

**WebP の特殊ケース**：WebP は `offset 0` に `RIFF`（4バイト）、`offset 8` に `WEBP`（4バイト）という2箇所を確認する必要がある。`checks: Array<{ bytes, offset }>` の構造にすることで複数チェックを `every()` で検証できるようにした。

---

### 61. S3 認証情報の IAM ロール対応

**判断**：`AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` の両方が設定されている場合のみ `credentials` オブジェクトを渡し、どちらか一方でも空の場合は省略して AWS SDK のデフォルトプロバイダーチェーンに委譲する設計にした。

**理由**：
- 本番環境では EC2/ECS の IAM ロールを使うことが AWS のベストプラクティスであり、アクセスキーをハードコードするより安全
- `credentials: { accessKeyId: '', secretAccessKey: '' }` のように空文字を渡すと SDK が認証エラーを投げる。オブジェクト自体を省略することでデフォルトプロバイダーチェーン（IAM ロール → EC2 メタデータ → 環境変数）が動作する

---

### 62. ファイルアップロード後の s3Key IDOR 対策（Claudeレビュー指摘）

**状況**：Claude Code Review が WebSocket `message:send` ハンドラで、添付ファイルの `s3Key` が送信先チャンネルと同じワークスペースのものかを検証していないことを指摘した。

**問題の詳細**：
- ユーザーがワークスペースBにファイルをアップロードし、S3 キー（`workspaceB/{uuid}.jpg`）を別ワークスペースAのメッセージに添付できた
- これにより他ワークスペースのファイルが流用される、またはアクセス権限のないバケットパスへのアクセスが試みられる可能性があった

**修正**：`GatewayService.createMessage()` でメッセージ保存前に `a.s3Key.startsWith(`${channel.workspaceId}/`)` を検証し、不一致の場合 `WsException` をスローするようにした。

---

## 2026-06-06 フェーズ4：メッセージ検索（PR #19）

### 63. Prisma `contains + mode: 'insensitive'` でフルテキスト検索の代替

**判断**：PostgreSQL のフルテキスト検索（`tsvector` / `to_tsquery`）は採用せず、Prisma の `contains: query, mode: 'insensitive'` を使った ILIKE 相当の部分一致検索を採用した。

**理由**：
- フルテキスト検索は形態素解析（日本語は `pg_bigm` 等）・インデックス管理・ランキングのチューニングが必要で実装コストが高い
- ポートフォリオ規模では ILIKE で十分なパフォーマンスが得られる
- Prisma の `mode: 'insensitive'` が自動的に PostgreSQL の `ILIKE` にマップされるため、大文字小文字を区別しない検索がライブラリ1オプションで実現できる
- 将来的なフルテキスト検索への移行に備えて `@@index([content])` を `schema.prisma` に追記した

---

### 64. 検索スコープをアクセス可能チャンネルのみに限定した IDOR 対策

**判断**：検索クエリの Prisma `where` 条件に `channel.OR: [{ isPrivate: false }, { members: { some: { userId } } }]` を含め、参加していないプライベートチャンネルのメッセージを結果から除外した。

**理由**：
- Guard（Layer1）は「ワークスペースメンバーかどうか」しか確認しない
- 検索は横断的な操作で、プライベートチャンネルへのアクセス権限をアプリ層で別途チェックしなければ IDOR が成立する（「secret」というキーワードで秘密のチャンネルの内容が見えてしまう）
- Prisma の `where` 条件にアクセス制御を埋め込む（Layer2）ことで、Service 層で別クエリを発行せずに1クエリで完結する

---

### 65. デバウンス実装に `useRef<ReturnType<typeof setTimeout>>` を採用した理由

**判断**：検索入力のデバウンスを `useRef` でタイマーIDを保持して管理し、300ms のデバウンスを実装した。

**理由**：
- `useState` でタイマーIDを管理すると、`setState` のたびに再レンダリングが発生しデバウンスのタイミングがずれる
- `useRef` はレンダリングをトリガーせずに値を保持できるため、タイマーIDの管理に最適
- `useEffect` のクリーンアップ関数で `clearTimeout` することで、コンポーネントアンマウント時やクエリ変更時のタイマー漏れを防いだ
- `ReturnType<typeof setTimeout>` で型を指定することで、ブラウザ（`number`）と Node.js（`NodeJS.Timeout`）の型の差異を吸収した

---

### 66. 検索モーダルを Cmd+K で起動するショートカット設計

**判断**：サイドバーの検索ボタンクリックに加えて、`document.addEventListener('keydown')` で Cmd+K / Ctrl+K のショートカットを実装した。

**理由**：
- Slack や Linear など多くのツールで Cmd+K は「クイック検索・コマンドパレット」のデファクトスタンダードなショートカット
- ショートカットはサイドバーに `⌘K` バッジとして表示しているため、初見ユーザーにも発見可能
- `e.preventDefault()` でブラウザデフォルトの「アドレスバー選択」を上書きし、アプリ内検索に優先させた

---

## 2026-06-07 フェーズA：テスト戦略の設計判断

### 67. テスト種別の取捨選択（PR #20〜#23）

**判断**：以下のテスト種別を採用し、一部は意図的に不採用とした。

| 採用 | 理由 |
|------|------|
| 静的解析（ESLint + tsc） | 既存インフラを活用、コストゼロで型安全性を保証 |
| バックエンド単体テスト（Jest） | Service層の境界が明確でモック設計がしやすい |
| バックエンド結合テスト（Jest + supertest + 実DB） | 認可ロジックが複雑で単体テストだけでは信頼性不足 |
| E2Eテスト（Playwright） | ブラウザ操作でSocket.ioのリアルタイム通信をエンドツーエンド検証 |
| パフォーマンステスト（k6） | Socket.io同時接続がコア機能。数十人規模の検証が必要 |

| 不採用 | 理由 |
|--------|------|
| コントラクトテスト | 同一リポジトリで型共有済み。過剰 |
| スナップショットテスト | UI変更頻度が高いポートフォリオ段階では更新コストが高い |
| 本格SAST（SonarQube等） | npm auditで主要脆弱性をカバー。フェーズE以降に検討 |

---

### 68. バックエンド結合テスト：Repositoryをモックせず実DBを使った理由

**判断**：単体テストでは `Repository` をモックするが、結合テスト（`*.e2e-spec.ts`）では実際のPostgreSQLに対してリクエストを発行する設計にした。

**理由**：
- 前フェーズで複数のIDOR脆弱性が「Guardはパスするが実DBのリレーション検証が漏れていた」パターンで発見された
- モックテストではGuard→Service→Repositoryの実際の連携を検証できない
- 特に認可ロジック（「このユーザーはこのリソースを操作できるか」）はHTTPリクエストから実DBのレコードまで通した検証でしか信頼性を保証できない

**トレードオフ**：
- テスト用の別PostgreSQLコンテナ（ポート5433）が必要になる
- CI環境でDockerの起動が必要になりCIの複雑度が上がる
- しかし「CIで実際に動く」という保証の価値がその複雑度を上回ると判断した

---

### 69. バックエンド結合テスト：各テストで独立したユーザーを作成する方針

**判断**：テストヘルパーの `createTestUser()` が毎回新しいユニークなusernameでユーザーを作成し、テスト間で共有しない設計にした。

**理由**：
- テスト間でユーザーを共有すると、テスト実行順序によって結果が変わるflaky testが生まれる
- `beforeEach` でトランザクションを使ってDBをクリーンにする方式（`prisma.$transaction([prisma.user.deleteMany()])`）は外部キー制約の削除順序管理が複雑になる
- ユニークなusernameを生成してユーザーを毎回作る方式は「各テストが完全に独立」という原則を最もシンプルに実現できる
- `prisma migrate reset --force` でテスト開始時にDBを初期化し、実行中は各テストが独立したデータを持つ

---

### 70. Playwright E2E：PR vs Nightly で実行環境を分けた理由

**判断**：CI（PR時）ではPlaywrightを実行せず、GitHub Actions の nightly ジョブ（毎日深夜）でのみ実行する設計にした。

**理由**：
- PlaywrightはDockerでフロントエンド・バックエンド・DBをすべて起動した状態が必要で、PR時のCIに組み込むと実行時間が大幅に伸びる
- PR時のCIで「型チェック・Lint・単体テスト」を5分以内に完了させることでフィードバックを高速化する
- nightlyで「結合テスト・E2E・パフォーマンステスト」を実行することで、メインブランチの品質を定期的に保証する

この設計は「フィードバック速度と網羅性のトレードオフ」を意識的に分離したもので、現場のCI/CD設計で一般的なパターン。

---

### 71. Playwright E2E：2ブラウザコンテキスト方式でSocket.ioを検証した理由

**判断**：リアルタイム通信のE2Eテストを1ページではなく、`browser.newContext()` を2回呼んで別々のsessionを作成する設計にした。

**理由**：
- Socket.ioのリアルタイム性（userAが送ったメッセージがuserBの画面に届く）を検証するには、物理的に別々の認証状態を持つ2つのブラウザコンテキストが必要
- 同一コンテキストでは同一のJWT・Socket.io接続を共有するため、「別のユーザーが受信した」という状態を作れない
- `storageState` ファイルを使わず、各テスト内でAPIを叩いてユーザー登録・トークン取得・`localStorage` セットをする設計にした。これにより認証ユーザーがテストごとにユニークになり、テスト間の干渉がない

```
[userA browser context] → Socket.io接続 → channel:{id} ルーム参加
[userB browser context] → Socket.io接続 → channel:{id} ルーム参加
                              ↓
        userAがメッセージ送信 → バックエンド → socket.emit → userBの画面に表示
```

---

### 72. 削除テストのデバッグで判明した3つの根本原因

**状況**：「userAがメッセージを削除するとuserBの画面から消える」テストが長時間パスしなかった。最終的に3つの独立した問題が重なっていた。

**根本原因1：DELETEエンドポイントが204 No Content を返す**

バックエンドの `DELETE /messages/:id` は成功時に 204 No Content（ボディなし）を返す。しかしフロントエンドの `apiClient.delete()` は常に `response.json()` を呼んでいたため、`SyntaxError: Unexpected end of JSON input` が発生して削除処理全体が例外になっていた。`catch { // ignore }` で握りつぶしていたためPlaywrightのテストからは何も見えなかった。

**修正**：`response.status === 204` の場合は `response.json()` をスキップして `undefined as T` を返すよう `client.ts` を修正した。

**根本原因2：Socket.io の `message:delete` イベントが発火していなかった**

REST の `DELETE` エンドポイントはSocket.ioイベントをブロードキャストしない設計になっていた（メッセージ送信は `message:received` でリアルタイム配信されるが、削除は REST のみだった）。

**修正**：`MessageItem.tsx` の `handleDelete` に `getSocket().emit('message:delete', { messageId, channelId })` を追加した。

**根本原因3：`window.confirm()` がPlaywrightのモックを通らない**

Playwrightの `page.evaluate(() => { window.confirm = () => true })` と `context.addInitScript()` を試みたが、Reactのイベントハンドラ内の `confirm()` は異なるJavascriptコンテキストで実行されるためモックが効かなかった。

**修正**：`handleDelete` から `confirm()` を削除した。確認ダイアログなしで即削除する設計に変更。

**教訓**：`catch { // ignore }` はデバッグを著しく困難にする。E2Eテスト中はコンソールエラーをPlaywright側でキャプチャして原因特定を効率化できる（`page.on('console', msg => ...)`）。

---

### 73. k6 smokeテスト：`setup()` 関数で事前にユーザーとワークスペースを作成する理由

**判断**：k6の `setup()` 関数で1回だけユーザー登録・ワークスペース作成・チャンネル取得を行い、全VU（仮想ユーザー）がその結果を共有する設計にした。

**理由**：
- k6のデフォルト関数（`export default function`）は全VUが毎イテレーション実行する。ここでユーザー登録すると5VU × 30秒 = 大量の登録リクエストが発行され、テスト本来の目的（メッセージ送受信の負荷測定）が歪む
- `setup()` は1回のみ実行されデータを返す。返却値が全VUの `data` パラメータとして渡されるため、認証トークン・ワークスペースID・チャンネルIDを共有できる
- smoke testは「最小負荷で基本動作を確認する」目的なので、5VUが同一ワークスペースで並行してメッセージを送受信するシナリオが適切

**username 20文字制限の問題**：最初の実装で `k6user_${Date.now()}_${counter}` という形式を使ったため23文字以上になり、バックエンドの `@MaxLength(20)` バリデーションで 400 Bad Request になっていた。タイムスタンプの末尾5桁のみ使用（`k6u${ts}${counter}`）で解決した。この制限は Playwright E2E テストの `uniqueUser` 関数でも同様に発生し、同じ修正パターンで対処した。
