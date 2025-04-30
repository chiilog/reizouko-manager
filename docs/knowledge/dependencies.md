# 依存パッケージ一覧

`package.json` を元にした主要な依存パッケージの一覧です。

## Dependencies (アプリケーション本体の依存)

| パッケージ名               | バージョン | 概要 (推測)                                                     |
| :------------------------- | :--------- | :-------------------------------------------------------------- |
| `react`                    | ^19.1.0    | UI ライブラリ                                                   |
| `react-dom`                | ^19.1.0    | React を DOM にレンダリングするためのパッケージ                 |
| `@tailwindcss/vite`        | ^4.1.3     | Vite で Tailwind CSS を利用するためのプラグイン                 |
| `tailwindcss`              | ^4.1.3     | CSS フレームワーク                                              |
| `class-variance-authority` | ^0.7.1     | CSS クラスのバリアント管理 (shadcn/ui で利用)                   |
| `clsx`                     | ^2.1.1     | CSS クラス名を条件付きで結合するユーティリティ                  |
| `tailwind-merge`           | ^3.2.0     | Tailwind CSS クラスの競合を解決するユーティリティ               |
| `@radix-ui/react-dialog`   | ^1.1.11    | アクセシブルなダイアログコンポーネント (shadcn/ui ベース)       |
| `@radix-ui/react-label`    | ^2.1.4     | アクセシブルなラベルコンポーネント (shadcn/ui ベース)           |
| `@radix-ui/react-popover`  | ^1.1.11    | アクセシブルなポップオーバーコンポーネント (shadcn/ui ベース)   |
| `@radix-ui/react-slot`     | ^1.2.0     | 子要素に Props をマージするコンポーネント (shadcn/ui ベース)    |
| `lucide-react`             | ^0.503.0   | アイコンライブラリ (shadcn/ui で利用)                           |
| `react-hook-form`          | ^7.56.1    | フォームの状態管理とバリデーションライブラリ                    |
| `@hookform/resolvers`      | ^5.0.1     | React Hook Form 用のバリデーションスキーマリゾルバー            |
| `zod`                      | ^3.24.3    | スキーマ定義とバリデーションライブラリ (React Hook Form と連携) |
| `date-fns`                 | ^4.1.0     | 日付操作ユーティリティライブラリ                                |
| `react-day-picker`         | ^9.6.7     | 日付選択コンポーネント                                          |
| `tw-animate-css`           | ^1.2.8     | Tailwind CSS 用のアニメーションユーティリティ (詳細不明)        |

## DevDependencies (開発時の依存)

| パッケージ名                  | バージョン | 概要                                                   |
| :---------------------------- | :--------- | :----------------------------------------------------- |
| `vite`                        | ^6.3.3     | フロントエンドビルドツール                             |
| `@vitejs/plugin-react-swc`    | ^3.9.0     | Vite で React (SWC) を使うためのプラグイン             |
| `typescript`                  | ~5.8.3     | JavaScript に静的型付けを追加する言語                  |
| `@types/react`                | ^19.1.0    | React の型定義                                         |
| `@types/react-dom`            | ^19.1.2    | React DOM の型定義                                     |
| `@types/node`                 | ^22.15.3   | Node.js の型定義                                       |
| `eslint`                      | ^9.25.1    | JavaScript/TypeScript リンター                         |
| `typescript-eslint`           | ^8.31.1    | ESLint で TypeScript を解析するためのプラグインセット  |
| `@eslint/js`                  | ^9.25.1    | ESLint の JavaScript ルールセット                      |
| `eslint-plugin-react-hooks`   | ^5.2.0     | React Hooks のルールを適用する ESLint プラグイン       |
| `eslint-plugin-react-refresh` | ^0.4.20    | React Fast Refresh 用の ESLint プラグイン              |
| `eslint-config-prettier`      | ^10.1.2    | Prettier と競合する ESLint ルールを無効化する設定      |
| `prettier`                    | 3.5.3      | コードフォーマッタ                                     |
| `vitest`                      | ^3.1.2     | Vite 上で動作する高速なテストフレームワーク            |
| `@testing-library/react`      | ^16.3.0    | React コンポーネントテスト用ユーティリティ             |
| `@testing-library/jest-dom`   | ^6.6.3     | Jest DOM マッチャー (Vitest でも利用可)                |
| `@testing-library/user-event` | ^14.6.1    | ユーザー操作をシミュレートするテストユーティリティ     |
| `@testing-library/dom`        | ^10.4.0    | DOM テスト用ユーティリティ                             |
| `jsdom`                       | ^26.1.0    | JavaScript で DOM 環境をシミュレートするライブラリ     |
| `husky`                       | ^9.1.7     | Git フックを簡単に設定・管理するツール                 |
| `lint-staged`                 | ^15.5.1    | Git のステージングされたファイルに対してコマンドを実行 |
| `globals`                     | ^16.0.0    | グローバル変数の定義情報 (ESLint で利用)               |
