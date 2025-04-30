# コンポーネント概要

`src/components` ディレクトリ内のコンポーネント実装に関する調査結果です。

## ディレクトリ構造

```
src/components/
├── ui/             # shadcn/ui のコンポーネント群 (推測)
├── FoodCard.tsx    # 食材表示カード
├── FoodCard.test.tsx # FoodCard のテスト
├── FoodForm.tsx    # 食材登録フォーム (ダイアログ形式)
└── FoodForm.test.tsx # FoodForm のテスト
```

## 実装の特徴

- **UI ライブラリ:**
  - shadcn/ui (`@/components/ui`) のコンポーネント (`Button`, `Card`, `Dialog`, `Input`, `Popover`, `Calendar` など) をベースに UI が構築されています。
  - `cn` ユーティリティ (`@/lib/utils`) と `tailwind-merge`, `clsx` を利用したクラス名の管理が行われています。
- **状態管理:**
  - コンポーネント内の状態管理には主に React の `useState` が利用されています。
  - `FoodForm` では `useRef` を使って特定の DOM 要素への参照も取得しています。
  - `FoodForm` は React Hook Form を使用せず、標準的なフォーム要素と `useState` で実装されています。
- **ロジックの分離:**
  - 日付関連のユーティリティ関数 (`getDaysUntilExpiry`, `formatDateToJapanese` など) は `src/lib/date-utils.ts` にまとめられています。
  - データ永続化に関する処理 (`addFoodItem`, `deleteFoodItem`) は `src/lib/storage.ts` に分離されています (実装詳細は未確認)。
- **コンポーネント設計:**
  - Props を通じて親コンポーネントからデータやコールバック関数を受け取る、標準的な React の設計パターンです。
  - `FoodCard` は食材データを受け取って表示し、削除機能を提供します。
  - `FoodForm` はダイアログとして表示され、食材の入力と登録機能を提供します。
- **テスト:**
  - カスタムコンポーネント (`FoodCard`, `FoodForm`) には、それぞれ対応するテストファイル (`.test.tsx`) が存在します (テスト内容は未確認)。
- **コメント:**
  - ファイル、コンポーネント定義、Props、主要な内部関数には JSDoc 形式で日本語のコメントが付与されています。
