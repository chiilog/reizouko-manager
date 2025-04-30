/**
 * App コンポーネントのテスト
 *
 * このテストスイートは、Appコンポーネントの主要な機能を検証します。
 * - 初期表示（データなし、データあり）
 * - 食材登録フォームの開閉
 * - 食材追加後のリスト更新
 * - 食材削除後のリスト更新
 *
 * localStorage のモックを使用して、ブラウザ API への依存を排除しています。
 * また、ユーザーイベントのシミュレーションには @testing-library/user-event を使用し、
 * より実際のユーザー操作に近いテストを目指しています。
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { FoodItem } from './lib/types';
import * as storage from './lib/storage'; // storage モジュール全体をインポート
import '@testing-library/jest-dom';

// storage モジュールをモック
vi.mock('./lib/storage');
// モックされた関数への型付けを容易にするために as を使用
const mockedGetAllFoodItems = vi.mocked(storage.getAllFoodItems);

/**
 * テストで使用する初期状態の食材データ配列
 * @type {FoodItem[]}
 */
const initialFoodItems: FoodItem[] = [
  { id: '1', name: 'りんご', expiryDate: '2024-12-31' },
  { id: '2', name: '牛乳', expiryDate: '2024-08-10' },
];

/**
 * App コンポーネントのテストスイート
 */
describe('App コンポーネント', () => {
  const user = userEvent.setup();

  // 各テスト前にモックをリセット
  beforeEach(() => {
    vi.resetAllMocks();
  });

  /**
   * 初期表示のテスト (localStorage が空の場合)
   *
   * @test {App}
   */
  it('localStorage が空の場合、初期表示時にタイトル、説明、登録ボタン、および「食材なし」メッセージが表示されること', () => {
    // Arrange: getAllFoodItems が空配列を返すように設定
    mockedGetAllFoodItems.mockReturnValue([]);

    // Act
    render(<App />);

    // Assert
    expect(
      screen.getByRole('heading', { name: /冷蔵庫管理アプリ/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /登録された食材はありません。新しい食材を登録してください。/
      )
    ).toBeInTheDocument();
    // FoodCard が表示されないことを確認
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(mockedGetAllFoodItems).toHaveBeenCalledTimes(1);
  });

  /**
   * 初期表示のテスト (localStorage にデータが存在する場合)
   *
   * @test {App}
   */
  it('localStorage にデータがある場合、初期表示時に食材カードが表示されること', () => {
    mockedGetAllFoodItems.mockReturnValue(initialFoodItems);
    render(<App />);

    // Assert
    expect(
      screen.queryByText(/登録された食材はありません。/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'りんご', level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '牛乳', level: 2 })
    ).toBeInTheDocument();
    // article ロールを持つ要素を全て取得
    const foodCards = screen.getAllByRole('article');
    expect(foodCards).toHaveLength(initialFoodItems.length);
    // 各カードに適切なaria-labelがあることを確認
    expect(
      screen.getByRole('article', { name: /りんごの食材カード/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: /牛乳の食材カード/i })
    ).toBeInTheDocument();
    expect(mockedGetAllFoodItems).toHaveBeenCalledTimes(1);
  });

  /**
   * 食材登録フォームの表示テスト
   *
   * @test {App}
   */
  it('「食材を登録」ボタンをクリックすると、登録フォーム（ダイアログ）が表示されること', async () => {
    // Arrange: 初期状態は空データとする
    mockedGetAllFoodItems.mockReturnValue([]);
    render(<App />);
    const registerButton = screen.getByRole('button', { name: /食材を登録/i });

    // Act
    await user.click(registerButton);

    // Assert
    // ダイアログが表示されることを確認（内部要素の検証はFoodForm.test.tsxで行う）
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  /**
   * 食材追加後のリスト更新テスト
   */
  it('FoodFormコンポーネントのonFoodAddedが呼ばれると、リストが更新されること', async () => {
    // Arrange
    // addFoodItemのモック
    const mockAddFoodItem = vi.mocked(storage.addFoodItem);
    mockAddFoodItem.mockReturnValue({
      id: '3',
      name: '新しい食材',
      expiryDate: '2025-01-01',
    });

    // 最初は空の配列を返し、onFoodAddedシミュレーション後には新しい食材を含む配列を返す
    const newItem: FoodItem = {
      id: '3',
      name: '新しい食材',
      expiryDate: '2025-01-01',
    };

    // フォーム送信前は空配列、送信後は新しい食材を含む配列を返す
    mockedGetAllFoodItems
      .mockReturnValueOnce([]) // 初期表示時（空）
      .mockReturnValueOnce([newItem]); // フォーム送信後（新アイテムあり）

    // 画面をレンダリング
    render(<App />);

    // 初期状態では「登録された食材はありません」メッセージが表示されている
    expect(screen.getByText(/登録された食材はありません/)).toBeInTheDocument();

    // Act
    // フォームを開く
    const registerButton = screen.getByRole('button', { name: /食材を登録/i });
    await user.click(registerButton);

    // Assert
    // ダイアログが表示されることを確認
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // フォーム内の要素を取得
    const nameInput = within(dialog).getByRole('textbox', { name: '食品名' });
    const submitButton = within(dialog).getByRole('button', { name: '登録' });

    // 食品名を入力
    await user.type(nameInput, '新しい食材');

    // 送信ボタンをクリック
    await user.click(submitButton);

    // リストが更新されたことを確認
    await waitFor(() => {
      // 「登録された食材はありません」メッセージが消えていることを確認
      expect(
        screen.queryByText(/登録された食材はありません/)
      ).not.toBeInTheDocument();

      // 新しい食材の名前が表示されていることを確認
      expect(
        screen.getByRole('heading', { name: '新しい食材', level: 2 })
      ).toBeInTheDocument();
    });

    // loadFoodItemsが呼ばれたことを確認（getAllFoodItemsが2回呼ばれる - 初期ロードと更新時）
    expect(mockedGetAllFoodItems).toHaveBeenCalledTimes(2);
  });

  /**
   * 食材削除後のリスト更新テスト
   */
  it('食材カードの削除が実行されると（onDeleteが呼ばれた後）、リストが更新されその食材が削除されること', async () => {
    // Arrange
    // 削除関数の直接モック
    const mockDeleteFoodItem = vi.mocked(storage.deleteFoodItem);

    // confirmモック
    window.confirm = vi.fn(() => true);

    // 初期状態では両方の食材を表示
    mockedGetAllFoodItems.mockReturnValueOnce([...initialFoodItems]);

    // 削除後は牛乳のみを表示（りんごが削除される）
    const afterDeleteItems = initialFoodItems.filter((item) => item.id !== '1');
    mockedGetAllFoodItems.mockReturnValueOnce(afterDeleteItems);

    render(<App />);

    // Assert
    // 初期状態で両方の食材が表示されていることを確認
    expect(
      screen.getByRole('heading', { name: 'りんご', level: 2 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '牛乳', level: 2 })
    ).toBeInTheDocument();

    // FoodCardの削除ボタンを全て取得（この時点で2つのボタンがあるはず）
    const deleteButtons = screen.getAllByRole('button', {
      name: /の削除ボタン$/,
    });
    expect(deleteButtons).toHaveLength(2);

    // aria-labelを使用してりんごの削除ボタンを直接取得
    const buttonForApple = screen.getByRole('button', {
      name: 'りんごの削除ボタン',
    });
    expect(buttonForApple).toBeInTheDocument();

    // deleteFoodItemが呼ばれたときに、指定されたIDの食材を削除する
    mockDeleteFoodItem.mockReturnValue(undefined); // 実際の関数は戻り値がないので、undefinedを返す

    // 削除ボタンをクリック
    await user.click(buttonForApple);

    // 確認ダイアログが表示されたことを確認
    expect(window.confirm).toHaveBeenCalled();

    // deleteFoodItemが呼ばれたことを確認
    expect(mockDeleteFoodItem).toHaveBeenCalledWith('1');

    // りんごが表示されなくなったことを確認
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'りんご', level: 2 })
      ).not.toBeInTheDocument();
    });

    // 牛乳は引き続き表示されていることを確認
    expect(
      screen.getByRole('heading', { name: '牛乳', level: 2 })
    ).toBeInTheDocument();

    // 削除ボタンが1つだけになったことを確認（牛乳の削除ボタンが表示されている）
    const milkDeleteButton = screen.getByRole('button', {
      name: '牛乳の削除ボタン',
    });
    expect(milkDeleteButton).toBeInTheDocument();
  });
});
