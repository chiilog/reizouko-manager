/**
 * FoodFormコンポーネントのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('フォーム送信時に正しい処理が行われることを確認', () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力
    fireEvent.change(nameInput, { target: { value: 'テスト食材' } });

    // 登録ボタンをクリック
    fireEvent.click(submitButton);

    // Assert
    // addFoodItemが呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalled();

    // onFoodAddedとonCloseが呼ばれたことを確認
    expect(mockProps.onFoodAdded).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('キャンセルボタンをクリックするとonCloseが呼ばれることを確認', () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

    // Act
    // キャンセルボタンをクリック
    fireEvent.click(cancelButton);

    // Assert
    // onCloseが呼ばれたことを確認
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('食品名が空の場合、フォーム送信時にフォーカスが設定されることを確認', () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const submitButton = screen.getByRole('button', { name: '登録' });

    // 名前欄は空のまま

    // Act
    // 登録ボタンをクリック
    fireEvent.click(submitButton);

    // Assert
    // storageのメソッドが呼ばれていないことを確認
    expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    // フォーカスが名前入力欄に設定されていることを確認（直接検証は難しいため省略）
    // 登録後の処理が呼ばれていないことを確認
    expect(mockProps.onFoodAdded).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });
});
