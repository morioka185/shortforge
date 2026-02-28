# Contributing to ShortForge

ShortForge へのコントリビューションを歓迎します！

## Development Setup

1. Prerequisites をインストール（README.md 参照）
2. リポジトリをフォーク＆クローン
3. `pnpm install` で依存関係をインストール
4. `pnpm tauri dev` で開発サーバーを起動

## Code Style

- **Rust:** `cargo clippy` と `cargo fmt` を使用
- **TypeScript:** `pnpm lint` でESLintチェック、`pnpm format` でPrettierフォーマット

## Pull Request Process

1. フィーチャーブランチを作成: `git checkout -b feature/your-feature`
2. 変更をコミット（コミットメッセージは英語推奨）
3. テストを実行: `cargo test` および `pnpm lint`
4. Pull Request を作成

## Reporting Issues

バグレポートや機能リクエストは GitHub Issues で受け付けています。
テンプレートに沿って詳細を記載してください。
