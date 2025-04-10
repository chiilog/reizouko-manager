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
    render(<FoodForm {...mockProps} />);

    // タイトルが表示されていることを確認
    expect(screen.getByText('食材の登録')).toBeInTheDocument();

    // 食品名のラベルが表示されていることを確認
    expect(screen.getByText('食品名')).toBeInTheDocument();

    // 賞味期限のラベルが表示されていることを確認
    expect(screen.getByText('賞味期限')).toBeInTheDocument();

    // ボタンが表示されていることを確認
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
    expect(screen.getByText('登録')).toBeInTheDocument();
  });

  it('フォーム送信時に正しい処理が行われることを確認', () => {
    render(<FoodForm {...mockProps} />);

    // 食品名を入力
    const nameInput = screen.getByPlaceholderText('例：きゅうり、たまご');
    fireEvent.change(nameInput, { target: { value: 'テスト食材' } });

    // 登録ボタンをクリック
    fireEvent.click(screen.getByText('登録'));

    // addFoodItemが呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalled();

    // onFoodAddedとonCloseが呼ばれたことを確認
    expect(mockProps.onFoodAdded).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('キャンセルボタンをクリックするとonCloseが呼ばれることを確認', () => {
    render(<FoodForm {...mockProps} />);

    // キャンセルボタンをクリック
    fireEvent.click(screen.getByText('キャンセル'));

    // onCloseが呼ばれたことを確認
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
