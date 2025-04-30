/**
 * FoodCardコンポーネントのテスト
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FoodCard } from './FoodCard';
import { formatDateToISOString } from '@/lib/date-utils';
import * as storageUtils from '@/lib/storage';

// モックの定義
vi.mock('@/lib/storage', () => ({
  deleteFoodItem: vi.fn(),
}));

// window.confirm のモック
const originalConfirm = window.confirm;
beforeEach(() => {
  window.confirm = vi.fn(() => true);
});
afterEach(() => {
  window.confirm = originalConfirm;
  vi.clearAllMocks();
});

describe('FoodCard', () => {
  const mockFood = {
    id: '1',
    name: 'テスト食材',
    expiryDate: formatDateToISOString(new Date()),
  };

  const onDelete = vi.fn();

  it('食材の情報が正しく表示されることを確認', () => {
    // Arrange
    render(<FoodCard food={mockFood} onDelete={onDelete} />);

    // Assert
    // 食材名が表示されていることを確認（CardTitleはh2として表示される）
    expect(
      screen.getByRole('heading', { name: 'テスト食材' })
    ).toBeInTheDocument();

    // 賞味期限のラベルが表示されていることを確認
    expect(screen.getByText('賞味期限：')).toBeInTheDocument();

    // 期限情報のラベルが表示されていることを確認
    expect(screen.getByText('期限：')).toBeInTheDocument();

    // 削除ボタンが表示されていることを確認
    expect(
      screen.getByRole('button', { name: 'テスト食材の削除ボタン' })
    ).toBeInTheDocument();
  });

  it('削除ボタンをクリックしたとき正しく処理されることを確認', () => {
    // Arrange
    render(<FoodCard food={mockFood} onDelete={onDelete} />);
    const deleteButton = screen.getByRole('button', {
      name: 'テスト食材の削除ボタン',
    });

    // Act
    // 削除ボタンをクリック
    fireEvent.click(deleteButton);

    // Assert
    // 確認ダイアログが表示されたことを確認
    expect(window.confirm).toHaveBeenCalledWith('本当に削除しますか？');

    // deleteFoodItemが呼ばれたことを確認
    expect(storageUtils.deleteFoodItem).toHaveBeenCalledWith(mockFood.id);

    // onDeleteが呼ばれたことを確認
    expect(onDelete).toHaveBeenCalled();
  });

  it('確認ダイアログでキャンセルした場合、削除処理が行われないことを確認', () => {
    // Arrange
    window.confirm = vi.fn(() => false); // キャンセルするケース
    render(<FoodCard food={mockFood} onDelete={onDelete} />);
    const deleteButton = screen.getByRole('button', {
      name: 'テスト食材の削除ボタン',
    });

    // Act
    // 削除ボタンをクリック
    fireEvent.click(deleteButton);

    // Assert
    // 確認ダイアログが表示されたことを確認
    expect(window.confirm).toHaveBeenCalledWith('本当に削除しますか？');

    // deleteFoodItemが呼ばれていないことを確認
    expect(storageUtils.deleteFoodItem).not.toHaveBeenCalled();

    // onDeleteが呼ばれていないことを確認
    expect(onDelete).not.toHaveBeenCalled();
  });
});
