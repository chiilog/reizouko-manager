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

- **モックリセットの種類:** Vitestには、テスト間でモックをリセットするための複数のメソッドがあります。状況に応じて適切なものを選択してください：

  1. **`vi.clearAllMocks()`**: モック関数の呼び出し履歴のみをリセットします。モックの実装や戻り値は変更されません。

     - 使用ケース: 呼び出し回数やパラメータをリセットしたいが、モックされた振る舞い（戻り値や実装）を維持したい場合

     ```typescript
     // 呼び出し履歴だけをリセット
     vi.clearAllMocks();
     ```

  2. **`vi.resetAllMocks()`**: 呼び出し履歴をリセットし、さらにカスタム実装もすべて削除します。モック関数は元の空の状態に戻ります。

     - 使用ケース: 各テストで完全に新しい状態からモックを再設定したい場合

     ```typescript
     // 呼び出し履歴と実装をリセット
     vi.resetAllMocks();
     ```

  3. **`vi.restoreAllMocks()`**: モック関数を元の実装に復元します。`vi.spyOn()`でモックした関数を元に戻す場合に特に有用です。
     - 使用ケース: テスト中に特定の関数だけをスパイ化/モック化し、テスト後に元の実装に戻したい場合
     ```typescript
     // 元の実装に戻す
     vi.restoreAllMocks();
     ```

- **推奨される使用法:** 本プロジェクトでは、基本的に `vi.resetAllMocks()` を使用することを推奨します。これにより、各テストが独立した状態で実行されることが保証されます。

  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  // モジュールのモック
  vi.mock('./path/to/module');
  const mockedFunction = vi.mocked(someModule.someFunction);

  describe('Component tests', () => {
    // 各テスト前にモックをリセット
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should do something', () => {
      // モックの振る舞いを設定
      mockedFunction.mockReturnValue('テスト値');

      // テスト内容...
      expect(mockedFunction).toHaveBeenCalledTimes(1);
    });
  });
  ```

- **個別のモックリセット:** 特定のモックだけをリセットしたい場合は以下のメソッドを使用できます：

  - `mockClear()`: 呼び出し回数のカウンターをリセット（`vi.clearAllMocks()`と同様だが個別のモックに適用）
  - `mockReset()`: 呼び出し回数のカウンターをリセットし、実装もデフォルトに戻す（`vi.resetAllMocks()`と同様）
  - `mockRestore()`: モック関数を元の実装に復元する（`vi.spyOn()`で作成したモックに適用可能）

  ```typescript
  // 特定のモックだけをリセット
  mockedFunction.mockClear(); // 呼び出し履歴だけクリア
  mockedFunction.mockReset(); // 呼び出し履歴と実装をリセット
  mockedFunction.mockRestore(); // 元の実装に戻す（spyOnの場合のみ）
  ```

### モック実装の設定

- **戻り値の設定:** `mockReturnValue()` または `mockReturnValueOnce()` を使用して、モック関数の戻り値を設定します。これらは単純な値を返す場合に適しています。

  ```typescript
  // 常に同じ値を返す
  mockedFunction.mockReturnValue('固定の戻り値');

  // 呼び出し順に異なる値を返す（キューのように処理される）
  mockedFunction
    .mockReturnValueOnce('1回目の戻り値')
    .mockReturnValueOnce('2回目の戻り値');
  // 3回目以降は undefined を返す、または mockReturnValue() で設定した値を返す
  ```

- **実装の置き換え:** `mockImplementation()` または `mockImplementationOnce()` を使用して、モック関数の実装を置き換えます。引数に基づいて計算や条件分岐が必要な場合に適しています。

  ```typescript
  // 引数に基づいて動的に値を返す
  mockedFunction.mockImplementation((arg) => {
    // カスタム実装
    return `処理された値: ${arg}`;
  });

  // 1回目の呼び出しだけ特別な実装をする
  mockedFunction
    .mockImplementationOnce((arg) => `特別な処理: ${arg}`)
    .mockImplementation((arg) => `通常の処理: ${arg}`);
  ```

- **mockReturnValue と mockImplementation の使い分け**:

  - **`mockReturnValue`**: 固定値や単純な値を返す場合（引数に関係なく同じ値を返す場合）
  - **`mockImplementation`**: 引数を使った計算や条件分岐が必要な場合、副作用を持つ処理が必要な場合

  ```typescript
  // 良い例: 単純な戻り値にはmockReturnValueを使用
  mockedGetUser.mockReturnValue({ id: 1, name: 'ユーザー1' });

  // 良い例: 引数に基づく処理が必要な場合はmockImplementationを使用
  mockedGetUserById.mockImplementation((id) => {
    if (id === 1) return { id: 1, name: 'ユーザー1' };
    if (id === 2) return { id: 2, name: 'ユーザー2' };
    return null;
  });
  ```

- **モック関数の引数キャプチャ**: モック関数に渡された引数を後で検証するために、`mockImplementation`を使用して引数を保存することもできます。

  ```typescript
  let capturedArgs = [];
  mockedFunction.mockImplementation((...args) => {
    capturedArgs.push(args);
    return 'テスト値';
  });

  // テスト後に引数を確認
  expect(capturedArgs[0][0]).toBe('期待する第1引数');
  ```

- **モックチェーンの構築**: 複数の関数呼び出しがチェーンされたオブジェクトのモックは以下のように構築できます。

  ```typescript
  // 例: axios のようなHTTPクライアントのモック
  const mockGet = vi.fn().mockResolvedValue({ data: { result: 'success' } });
  const mockedAxios = {
    get: mockGet,
    post: vi.fn().mockResolvedValue({ data: { id: 1 } }),
  };

  vi.mock('axios', () => {
    return {
      default: mockedAxios,
    };
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

- **呼び出し回数の検証:** `toHaveBeenCalledTimes()` を使用して、モック関数が期待通りの回数呼び出されたことを確認します。

  ```typescript
  // 1回だけ呼ばれたことを確認
  expect(mockedFunction).toHaveBeenCalledTimes(1);

  // 呼ばれていないことを確認
  expect(mockedFunction).not.toHaveBeenCalled(); // または toHaveBeenCalledTimes(0)
  ```

- **引数の検証:** `toHaveBeenCalledWith()` を使用して、モック関数が期待通りの引数で呼び出されたことを確認します。

  ```typescript
  // 特定の引数で呼ばれたことを確認
  expect(mockedFunction).toHaveBeenCalledWith('期待する引数');

  // 複数の引数を検証
  expect(mockedFunction).toHaveBeenCalledWith(
    '第1引数',
    123,
    expect.any(Object)
  );
  ```

- **特定の呼び出しの検証:** `toHaveBeenNthCalledWith()` を使用して、特定の順番の呼び出しに対する引数を検証します。

  ```typescript
  // 1回目の呼び出し（0ではなく1から始まる）の引数を検証
  expect(mockedFunction).toHaveBeenNthCalledWith(1, '1回目の引数');

  // 2回目の呼び出しの引数を検証
  expect(mockedFunction).toHaveBeenNthCalledWith(2, '2回目の引数');
  ```

- **柔軟なマッチング:** 引数の一部または複雑なオブジェクト構造を検証する場合には、`expect.objectContaining()` や `expect.arrayContaining()` などのマッチャーを使用します。

  ```typescript
  // オブジェクトの一部のプロパティだけを検証
  expect(mockedFunction).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 1,
      // nameプロパティは検証しない
    })
  );

  // 配列の一部の要素だけを検証
  expect(mockedFunction).toHaveBeenCalledWith(
    expect.arrayContaining([1, 2])
    // 他の要素が含まれていても良い
  );
  ```

- **関数呼び出しの順序検証:** 複数のモック関数が特定の順序で呼ばれたことを検証するには、各関数の呼び出しタイミングを比較します。

  ```typescript
  // mockAがmockBより先に呼ばれたことを確認
  expect(mockA.mock.invocationCallOrder[0]).toBeLessThan(
    mockB.mock.invocationCallOrder[0]
  );
  ```

- **モック関数の呼び出し情報の直接利用:** `.mock`プロパティを使用して、より詳細な検証を行うことができます。

  ```typescript
  // すべての呼び出しの引数を調べる
  const allCalls = mockedFunction.mock.calls;
  expect(allCalls[0][0]).toBe('1回目の呼び出しの第1引数');

  // すべての呼び出しの戻り値を調べる
  const allResults = mockedFunction.mock.results;
  expect(allResults[0].value).toBe('期待する戻り値');

  // 例外をスローした呼び出しを検証
  expect(allResults[1].type).toBe('throw');
  expect(allResults[1].value).toBeInstanceOf(Error);
  ```

## 除外設定

`vite.config.ts` で以下のディレクトリがテスト対象から除外されています。

- `**/node_modules/**`
- `**/dist/**`
- `**/lib/**`
- `**/components/ui/**` (shadcn/ui のコンポーネントはテスト対象外)
