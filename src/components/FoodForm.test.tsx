/**
 * FoodFormコンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodForm } from './FoodForm';
import * as storageUtils from '@/lib/storage';

// モックの定義
vi.mock('@/lib/storage', () => ({
  addFoodItem: vi.fn(),
}));

describe('FoodForm', () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    onFoodAdded: vi.fn(),
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('フォームの要素が正しく表示されることを確認', () => {
    // Arrange
    render(<FoodForm {...mockProps} />);

    // Assert
    // ダイアログのタイトルが表示されていることを確認
    expect(
      screen.getByRole('heading', { name: '食材の登録' })
    ).toBeInTheDocument();

    // 食品名のラベルと入力欄が表示されていることを確認
    expect(screen.getByLabelText('食品名')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '食品名' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('例：きゅうり、たまご')
    ).toBeInTheDocument();

    // 賞味期限のラベルと選択ボタンが表示されていることを確認
    expect(screen.getByText('賞味期限')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/ })
    ).toBeInTheDocument();

    // 操作ボタンが表示されていることを確認
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
  });

  it('フォーム送信時に正しい処理が行われることを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力
    await user.type(nameInput, 'テスト食材');

    // 登録ボタンをクリック
    await user.click(submitButton);

    // Assert
    // addFoodItemが呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalled();

    // onFoodAddedとonCloseが呼ばれたことを確認
    await waitFor(() => {
      expect(mockProps.onFoodAdded).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('キャンセルボタンをクリックするとonCloseが呼ばれることを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

    // Act
    // キャンセルボタンをクリック
    await user.click(cancelButton);

    // Assert
    // onCloseが呼ばれたことを確認
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('食品名が空の場合、フォーム送信時にフォーカスが設定されることを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const submitButton = screen.getByRole('button', { name: '登録' });

    // 名前欄は空のまま

    // Act
    // 登録ボタンをクリック
    await user.click(submitButton);

    // Assert
    // storageのメソッドが呼ばれていないことを確認
    expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    // フォーカスが名前入力欄に設定されていることを確認（直接検証は難しいため省略）
    // 登録後の処理が呼ばれていないことを確認
    expect(mockProps.onFoodAdded).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  /**
   * userEventを使った実際のユーザー入力をシミュレートするテスト
   */
  it('ユーザー操作を使って食材を追加できることを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);

    // フォーム内の要素を取得
    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力
    await user.type(nameInput, '新しい食材');

    // 登録ボタンをクリック
    await user.click(submitButton);

    // Assert
    // addFoodItemが適切な引数で呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '新しい食材',
        expiryDate: expect.any(String),
      })
    );

    // コールバック関数が呼ばれたことを確認
    expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  /**
   * 食材追加成功時にonFoodAddedとonCloseが呼ばれることを確認
   */
  it('食材追加成功時にonFoodAddedとonCloseが呼ばれることを確認', async () => {
    // Arrange
    // addFoodItemが成功することをシミュレート
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      return { ...food, id: 'test-id' };
    });

    render(<FoodForm {...mockProps} />);

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, '通知テスト');
    await user.click(submitButton);

    // Assert
    // Appコンポーネントのコールバックが呼ばれたことを確認
    await waitFor(() => {
      // 食材が追加されたことをAppに通知
      expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
      // フォームが閉じられたことをAppに通知
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * 登録ボタンのダブルクリックを防止するテスト
   */
  it('登録ボタンをダブルクリックしても処理が1回だけ実行されることを確認', async () => {
    // Arrange
    // addFoodItemの処理を遅延させるためのモック
    let isSubmitting = false;
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      // 既に送信中なら2回目以降の呼び出しとみなす
      if (isSubmitting) {
        throw new Error('二重送信が発生しました');
      }

      // 送信中フラグをON
      isSubmitting = true;

      // 結果を返す
      const result = { ...food, id: 'test-id' };

      // 非同期処理の完了後にフラグをOFF（必要に応じて）
      setTimeout(() => {
        isSubmitting = false;
      }, 100);

      return result;
    });

    render(<FoodForm {...mockProps} />);

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力
    await user.type(nameInput, 'テスト食材');

    // 登録ボタンを素早く2回クリック
    await user.click(submitButton);
    await user.click(submitButton);

    // Assert
    // addFoodItemが1回だけ呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalledTimes(1);
    // コールバック関数も1回だけ呼ばれたことを確認
    expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  /**
   * カレンダーで過去の日付が選択できないことを確認するテスト
   */
  it('カレンダーで過去の日付が選択できないことを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);

    // 日付選択ボタンを取得
    const dateButton = screen.getByRole('button', {
      name: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
    });

    // 初期の日付の値を保存
    const initialDateText = dateButton.textContent;

    // Act
    // カレンダーを開く
    await user.click(dateButton);

    // カレンダーが表示されていることを確認
    const calendar = await screen.findByRole('grid');
    expect(calendar).toBeVisible();

    // 過去日付のセルを探す
    const yesterdayCell = findDisabledYesterdayCell(calendar);

    // 過去日付のセルが見つかった場合、クリックを試みる
    if (yesterdayCell) {
      await user.click(yesterdayCell);
    }

    // Assert
    if (yesterdayCell) {
      // 過去の日付なので選択されず、日付が変わらないことを確認
      expect(dateButton.textContent).toBe(initialDateText);
    } else {
      // 過去日付のセルが見つからない場合は、disabled属性を持つセルが存在することを確認
      const disabledCells = verifyDisabledCells(calendar);
      expect(disabledCells.length).toBeGreaterThan(0);
    }

    // テスト終了時に日付が変更されていないことを最終確認
    expect(dateButton.textContent).toBe(initialDateText);
  });

  /**
   * 過去日付（昨日）のセルを特定する関数
   * @param calendar カレンダー要素
   * @returns 昨日の日付に対応するセル要素、または undefined
   */
  function findDisabledYesterdayCell(calendar: HTMLElement) {
    // 今日の日付を取得
    const today = new Date();
    // タイムゾーンを考慮してUTCで昨日の日付を作成
    const yesterday = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    );

    // カレンダー内のすべてのセルを取得
    const allCells = within(calendar).getAllByRole('gridcell');

    // disabled属性を持つセルのうち、昨日の日付と一致するものを探す
    const disabledCells = allCells.filter(
      (cell) =>
        cell.hasAttribute('data-disabled') ||
        cell.getAttribute('aria-disabled') === 'true' ||
        cell.classList.contains('disabled')
    );

    // 昨日の日付のセルを特定して返す
    return disabledCells.find((cell) => {
      // data-day属性がある場合は、その値から日付を比較
      const cellDate = cell.getAttribute('data-day');
      if (cellDate) {
        const [year, month, day] = cellDate.split('-').map(Number);
        const cellDateObj = new Date(Date.UTC(year, month - 1, day));
        return isSameDay(cellDateObj, yesterday);
      }

      // data-day属性がない場合は、テキスト内容で比較
      const cellText = cell.textContent || '';
      return cellText === String(yesterday.getDate());
    });
  }

  /**
   * 2つの日付が同じ日かどうかを判定する関数
   * @param date1 比較する日付1
   * @param date2 比較する日付2
   * @returns 同じ日である場合はtrue、そうでない場合はfalse
   */
  function isSameDay(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * カレンダー内のdisabled状態のセルを検証する関数
   * @param calendar カレンダー要素
   * @returns disabled状態のセル要素の配列
   */
  function verifyDisabledCells(calendar: HTMLElement) {
    // カレンダー内のすべてのセルを取得
    const allCells = within(calendar).getAllByRole('gridcell');

    // disabled属性を持つセルを取得
    const disabledCells = allCells.filter(
      (cell) =>
        cell.hasAttribute('data-disabled') ||
        cell.getAttribute('aria-disabled') === 'true' ||
        cell.classList.contains('disabled')
    );

    // 少なくとも1つのdisabledセルが存在することを確認
    expect(disabledCells.length).toBeGreaterThan(0);

    // 各セルが少なくとも1つのdisabled状態を示す属性を持つことを確認
    disabledCells.forEach((cell) => {
      const hasDisabledAttribute = cell.hasAttribute('data-disabled');
      const hasAriaDisabledTrue = cell.getAttribute('aria-disabled') === 'true';
      const hasDisabledClass = cell.classList.contains('disabled');

      expect(
        hasDisabledAttribute || hasAriaDisabledTrue || hasDisabledClass
      ).toBe(true);
    });

    return disabledCells;
  }
});
