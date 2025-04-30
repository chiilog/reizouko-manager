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

## モックの扱い方

外部モジュールや関数をモック化する場合は、以下のガイドラインに従ってください。

### モックのリセット

- **重要:** 各テスト間でモックの状態をリセットするため、必ず `beforeEach` フックで `vi.clearAllMocks()` を呼び出すこと。

  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  // モジュールのモック
  vi.mock('./path/to/module');
  const mockedFunction = vi.mocked(someModule.someFunction);

  describe('Component tests', () => {
    // 各テスト前にモックをリセット
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should do something', () => {
      // テスト内容
      expect(mockedFunction).toHaveBeenCalledTimes(1);
    });
  });
  ```

- **個別のモックリセット:** 特定のモックだけをリセットしたい場合は `mockReset()` または `mockClear()` を使用する。
  - `mockClear()`: 呼び出し回数のカウンターをリセット
  - `mockReset()`: 呼び出し回数のカウンターをリセットし、実装もデフォルトに戻す

### モック実装の設定

- **戻り値の設定:** `mockReturnValue()` または `mockReturnValueOnce()` を使用して、モック関数の戻り値を設定する。

  ```typescript
  // 常に同じ値を返す
  mockedFunction.mockReturnValue('固定の戻り値');

  // 呼び出し順に異なる値を返す
  mockedFunction
    .mockReturnValueOnce('1回目の戻り値')
    .mockReturnValueOnce('2回目の戻り値');
  ```

- **実装の置き換え:** `mockImplementation()` または `mockImplementationOnce()` を使用して、モック関数の実装を置き換える。
  ```typescript
  mockedFunction.mockImplementation((arg) => {
    // カスタム実装
    return `処理された値: ${arg}`;
  });
  ```

### 非同期処理のモック

- **基本:** 非同期API呼び出しなどのモックには、Promiseを返すモック関数を使用する。

  ```typescript
  // 成功するPromiseを返す
  mockedApiCall.mockResolvedValue(responseData);

  // 失敗するPromiseを返す
  mockedApiCall.mockRejectedValue(new Error('エラーメッセージ'));
  ```

- **テスト記述:** 非同期モックを使用するテストは、`async/await`パターンを使用し、`waitFor`を用いて状態変化を待機する。

  ```typescript
  it('非同期処理のテスト', async () => {
    // モックの設定
    mockedApiCall.mockResolvedValue(testData);

    // コンポーネントのレンダリング
    render(<AsyncComponent />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByText(/期待するテキスト/)).toBeInTheDocument();
    });
  });
  ```

- **高度なケース:** 複雑な非同期シナリオ（遅延、条件付き応答、連続した異なる応答など）が必要な場合は、個別のテスト計画で詳細を検討する。

### モックの検証

- **呼び出し回数の検証:** `toHaveBeenCalledTimes()` を使用して、モック関数が期待通りの回数呼び出されたことを確認する。

  ```typescript
  expect(mockedFunction).toHaveBeenCalledTimes(1);
  ```

- **引数の検証:** `toHaveBeenCalledWith()` を使用して、モック関数が期待通りの引数で呼び出されたことを確認する。
  ```typescript
  expect(mockedFunction).toHaveBeenCalledWith('期待する引数');
  ```

## 除外設定

`vite.config.ts` で以下のディレクトリがテスト対象から除外されています。

- `**/node_modules/**`
- `**/dist/**`
- `**/lib/**`
- `**/components/ui/**` (shadcn/ui のコンポーネントはテスト対象外)
