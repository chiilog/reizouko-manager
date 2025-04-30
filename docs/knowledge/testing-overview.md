# テスト方針

このプロジェクトにおけるテストの方針とルールをまとめたドキュメントです。

## 基本方針

- 実装する各機能には、可能な限りテストも含めて実装すること。
- テストは主に振る舞い（behavior）に着目し、ユーザー視点で書くこと。

## 使用ライブラリ

- **テストランナー/フレームワーク:** [Vitest](https://vitest.dev/)
- **React コンポーネントテスト:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **DOM マッチャー:** [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) (Vitest でも利用可能)
- **ユーザーイベントシミュレーション:** [@testing-library/user-event](https://testing-library.com/docs/user-event/intro)
- **テスト環境:** JSDOM (Vite 設定より)

## テストファイルの配置

- コンポーネントのテストファイルは、対象コンポーネントと同じディレクトリに `.test.tsx` の拡張子で配置されています。
  ```
  src/components/
  ├── FoodCard.tsx
  └── FoodCard.test.tsx
  ```

## テストの書き方

- **構造:** 可読性を意識し、**3A（Arrange → Act → Assert）** パターンで記述する。
  - 各フェーズが分かるよう、空行やコメントで明確に区切ることが推奨されます。
- **命名規則:** テスト名は「**何をどうしたらどうなるか**」が具体的にわかるように記述する。

## 要素の選択 (クエリ)

[Testing Library のガイドライン](https://testing-library.com/docs/queries/about/) に準拠し、以下の優先度でクエリを使用すること。

### 誰でもアクセスできるクエリ（最優先）

1.  `getByRole` / `findByRole` / `queryByRole`
2.  `getByLabelText` / `findByLabelText` / `queryByLabelText`
3.  `getByPlaceholderText` / `findByPlaceholderText` / `queryByPlaceholderText`
4.  `getByText` / `findByText` / `queryByText`
5.  `getByDisplayValue` / `findByDisplayValue` / `queryByDisplayValue`

### セマンティッククエリ

1.  `getByAltText` / `findByAltText` / `queryByAltText`
2.  `getByTitle` / `findByTitle` / `queryByTitle`

### テスト専用クエリ（最終手段）

1.  `getByTestId` / `findByTestId` / `queryByTestId`

(補足: `getBy*` は要素が存在しない場合にエラー、`queryBy*` は null を返し、`findBy*` は非同期で要素が出現するのを待つ)

## イベントの発火

- **基本:** 実際のユーザー操作を再現するため、原則として **`userEvent` (`@testing-library/user-event`)** を使用する。

  - `userEvent` はホバーやフォーカスなど、関連するイベントも内部的に発火させます。
  - `userEvent` の API は非同期 (`async`/`await`) で使用する必要があります。

  ```typescript
  import { render, screen } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';

  test('should handle user interaction', async () => {
    const user = userEvent.setup(); // setup() を呼び出す
    render(<MyComponent />);

    const button = screen.getByRole('button', { name: /submit/i });
    await user.click(button);

    const input = screen.getByLabelText(/username/i);
    await user.type(input, 'testuser');
  });
  ```

- **`fireEvent` を使用するケース:**
  - 特定の単一イベントのみをテストしたい場合（例: `change` イベントだけを直接発火させたい）。
  - 特定のイベントハンドラ関数を個別にテストする場合。
  - パフォーマンスが重要で、多数のテストを高速に実行する必要がある場合。

## 除外設定

`vite.config.ts` で以下のディレクトリがテスト対象から除外されています。

- `**/node_modules/**`
- `**/dist/**`
- `**/lib/**`
- `**/components/ui/**` (shadcn/ui のコンポーネントはテスト対象外)
