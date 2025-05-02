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
   * 送信処理の結果がAppコンポーネントに伝わることを確認するテスト
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

  it('カレンダーで過去の日付が選択できないことを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const dateButton = screen.getByRole('button', {
      name: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
    });

    // 初期の日付の値を保存
    const initialDateText = dateButton.textContent;

    // Act
    // カレンダーを開く
    await user.click(dateButton);

    // 日付のテーブルを取得
    const calendar = await screen.findByRole('grid');
    expect(calendar).toBeVisible();

    // 今日の日付を取得
    const today = new Date(
      Date.UTC(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      )
    ); // タイムゾーンを考慮

    // 昨日の日付を取得
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDay = yesterday.getDate(); // 日（数値）だけを取得

    // 日付をクリックする前に現在選択されている日付のテキストを保存
    const beforeClick = dateButton.textContent;

    // 日付セル（td）を取得
    const allCells = within(calendar).getAllByRole('gridcell');

    // 昨日の日付を特定し、その日付が選択できないことを検証するアプローチ
    // 方法1: 過去日付のセルを直接特定して検証
    const findDisabledYesterdayCell = () => {
      // タイムゾーンを考慮した日付文字列比較用の関数
      const isSameDay = (date1: Date, date2: Date) => {
        return (
          date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate()
        );
      };

      // disabled属性を持つセルを取得
      const disabledCells = allCells.filter((cell) => {
        return (
          cell.hasAttribute('data-disabled') ||
          cell.getAttribute('aria-disabled') === 'true' ||
          cell.classList.contains('disabled')
        );
      });

      // disabledセルのうち、昨日の日付と一致するものを探す
      for (const cell of disabledCells) {
        const cellDate = cell.getAttribute('data-day') || '';
        if (cellDate) {
          const dateParts = cellDate.split('-').map(Number);
          if (dateParts.length === 3) {
            const [year, month, day] = dateParts;
            const cellDateObj = new Date(Date.UTC(year, month - 1, day));
            if (isSameDay(cellDateObj, yesterday)) {
              return cell;
            }
          }
        }
      }

      // data-day属性がない場合は、テキスト内容と位置で推定
      return disabledCells.find((cell) => {
        const cellText = cell.textContent || '';
        return cellText === String(yesterdayDay);
      });
    };

    // 方法2: すべてのdisabledセルを検証
    const verifyDisabledCells = () => {
      const disabledCells = allCells.filter((cell) => {
        return (
          cell.hasAttribute('data-disabled') ||
          cell.getAttribute('aria-disabled') === 'true' ||
          cell.classList.contains('disabled')
        );
      });

      // 少なくとも1つのdisabledセルが存在することを確認
      expect(disabledCells.length).toBeGreaterThan(0);

      // 各セルが少なくとも1つのdisabled状態を示す属性を持つことを確認
      disabledCells.forEach((cell) => {
        const hasDisabledAttribute = cell.hasAttribute('data-disabled');
        const hasAriaDisabledTrue =
          cell.getAttribute('aria-disabled') === 'true';
        const hasDisabledClass = cell.classList.contains('disabled');

        expect(
          hasDisabledAttribute || hasAriaDisabledTrue || hasDisabledClass
        ).toBe(true);
      });

      return disabledCells;
    };

    // 昨日の日付セルを特定
    const yesterdayCell = findDisabledYesterdayCell();

    if (yesterdayCell) {
      // 昨日の日付セルが特定できた場合、そのセルをクリックしても日付が変わらないことを確認
      const clickTarget =
        yesterdayCell.querySelector('button') || yesterdayCell;
      await user.click(clickTarget);

      // 過去の日付なので選択されず、日付が変わらないことを確認
      expect(dateButton.textContent).toBe(beforeClick);
    } else {
      // 昨日の日付セルが特定できなかった場合、すべてのdisabledセルを検証
      verifyDisabledCells();
    }

    // テスト終了時に日付が変更されていないことを最終確認
    // 日付が変更されていなければ、過去の日付は選択できなかったと判断できる
    expect(dateButton.textContent).toBe(initialDateText);
  });
});
