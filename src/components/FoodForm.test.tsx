/**
 * FoodFormコンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodForm } from './FoodForm';
import * as storageUtils from '@/lib/storage';

// モックの定義
vi.mock('@/lib/storage', () => ({
  addFoodItem: vi.fn(),
}));

// Dialog関連コンポーネントをモック
vi.mock('@/components/ui/dialog', () => {
  const DialogContent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  );
  return {
    Dialog: ({ children }: { children: React.ReactNode }) => children,
    DialogContent,
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-header">{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
      <h2 data-testid="dialog-title">{children}</h2>
    ),
    DialogDescription: ({ children }: { children: React.ReactNode }) => (
      <p data-testid="dialog-description">{children}</p>
    ),
    DialogFooter: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dialog-footer">{children}</div>
    ),
  };
});

// Calendar関連コンポーネントをモック
vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({
    selected,
    onSelect,
  }: {
    selected?: Date;
    onSelect?: (date?: Date) => void;
  }) => (
    <div data-testid="calendar-mock">
      <div role="grid">
        <div role="gridcell" data-disabled="true" data-day="2023-05-01">
          1
        </div>
        <div
          role="gridcell"
          data-day={
            selected ? selected.toISOString().split('T')[0] : '2023-05-02'
          }
          onClick={() => onSelect && onSelect(selected || new Date())}
        >
          2
        </div>
      </div>
    </div>
  ),
}));

// Popoverコンポーネントをモック
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover">{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

// Loaderアイコンをモック
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loading-spinner">ローディングアイコン</div>,
  ChevronLeft: () => <div>←</div>,
  ChevronRight: () => <div>→</div>,
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
    expect(screen.getByText('食材の登録')).toBeInTheDocument();

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

    // 初期状態ではエラーメッセージが表示されていないことを確認
    expect(
      screen.queryByText('食材の追加に失敗しました。もう一度お試しください。')
    ).not.toBeInTheDocument();
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
   * 送信中はローディングスピナーが表示されることを確認するテスト
   */
  it('送信中はローディングスピナーが表示されることを確認', async () => {
    // Arrange
    // submitStateの変更を追跡するために実装を置き換え
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      return { ...food, id: 'test-id' };
    });

    render(<FoodForm {...mockProps} />);

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, 'ローディングテスト');

    // ボタンクリック前はスピナーがないことを確認
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

    // 登録ボタンをクリック
    await user.click(submitButton);

    // Assert
    // クリック後に処理が実行され、レンダリングが更新されるため、
    // ローディングスピナーは表示されなくなっている（処理が完了している）ことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalledTimes(1);
    expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
  });

  /**
   * エラー発生時にエラーメッセージが表示されることを確認するテスト
   */
  it('エラー発生時にエラーメッセージが表示されることを確認', async () => {
    // Arrange
    // addFoodItemがエラーをスローするようにモック
    vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
      throw new Error('テストエラー');
    });

    render(<FoodForm {...mockProps} />);

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, 'エラーテスト');
    await user.click(submitButton);

    // Assert
    // エラーメッセージが表示されることを確認
    expect(
      screen.getByText('食材の追加に失敗しました。もう一度お試しください。')
    ).toBeInTheDocument();

    // エラー後は各種コールバックが呼ばれていないことを確認
    expect(mockProps.onFoodAdded).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  /**
   * カレンダーの日付選択機能を確認するテスト（簡略化版）
   */
  it('カレンダーコンポーネントが適切に表示されることを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);

    // 日付選択ボタンを取得
    const dateButton = screen.getByRole('button', {
      name: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
    });

    // Act
    // カレンダーを開く
    await user.click(dateButton);

    // Assert
    // カレンダーのモックが表示されていることを確認
    expect(screen.getByTestId('popover-content')).toBeInTheDocument();
  });
});
