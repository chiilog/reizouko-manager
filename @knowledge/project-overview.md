# プロジェクト概要

## 基本情報

- **プロジェクト名:** reizouko-manager (package.json より)
- **目的 (推測):** 冷蔵庫の中身を管理する Web アプリケーション
- **ビルドツール:** Vite
- **フレームワーク:** React
- **言語:** TypeScript
- **UI ライブラリ (推測):** shadcn/ui (Radix UI + Tailwind CSS)
- **テスト:** Vitest, React Testing Library
- **リンター/フォーマッタ:** ESLint, Prettier
- **Git Hooks:** Husky, lint-staged

## ディレクトリ構造 (主要)

```
.
├── @knowledge/  # この調査結果を格納するフォルダ (今回作成)
├── public/      # 静的ファイル (index.html など)
├── src/         # アプリケーションコード
│   ├── assets/      # 画像などの静的アセット
│   ├── components/  # 再利用可能な UI コンポーネント
│   ├── lib/         # 共通ロジック、型定義、ユーティリティなど
│   ├── App.tsx      # メインのアプリケーションコンポーネント
│   ├── main.tsx     # アプリケーションのエントリーポイント
│   └── index.css    # グローバルなスタイル (Tailwind の起点)
├── .github/     # GitHub Actions などの設定 (中身未確認)
├── .husky/      # Git フック設定
├── node_modules/ # 依存パッケージ
├── .gitignore
├── eslint.config.js
├── package.json
├── package-lock.json
├── prettier.config.js
├── README.md
├── tsconfig.json  # TypeScript 設定 (ベース)
├── tsconfig.app.json # TypeScript 設定 (アプリ用)
├── tsconfig.node.json # TypeScript 設定 (Node.js 環境用)
├── vite.config.ts   # Vite 設定
└── vitest.setup.ts  # Vitest セットアップ
```

## 主要設定

- **パスエイリアス:** `@/*` が `./src/*` を指すように設定 (`tsconfig.json`, `vite.config.ts`)
- **ベースパス:** `/reizouko-manager/` (Vite 設定)
- **テスト環境:** JSDOM (Vite/Vitest 設定)
- **テスト除外:** `node_modules`, `dist`, `lib`, `components/ui` (Vite/Vitest 設定)

## その他

- `components.json` が存在するため、shadcn/ui の CLI を使用している可能性が高い。
- `TODO.md` が存在するため、未実装の機能や課題がリストアップされている可能性がある。
- `.github` フォルダがあるため、CI/CD が設定されている可能性がある。
