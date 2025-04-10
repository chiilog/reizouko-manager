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
    render(<FoodCard food={mockFood} onDelete={onDelete} />);

    // 食材名が表示されていることを確認
    expect(screen.getByText('テスト食材')).toBeInTheDocument();

    // 賞味期限が表示されていることを確認
    expect(screen.getByText(/賞味期限：/)).toBeInTheDocument();
  });

  it('削除ボタンをクリックしたとき正しく処理されることを確認', () => {
    render(<FoodCard food={mockFood} onDelete={onDelete} />);

    // 削除ボタンをクリック
    fireEvent.click(screen.getByText('削除'));

    // 確認ダイアログが表示されたことを確認
    expect(window.confirm).toHaveBeenCalled();

    // deleteFoodItemが呼ばれたことを確認
    expect(storageUtils.deleteFoodItem).toHaveBeenCalledWith(mockFood.id);

    // onDeleteが呼ばれたことを確認
    expect(onDelete).toHaveBeenCalled();
  });
});
