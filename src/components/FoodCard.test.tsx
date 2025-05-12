/**
 * FoodCardコンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  const user = userEvent.setup();

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

  it('削除ボタンをクリックしたとき正しく処理されることを確認', async () => {
    // Arrange
    render(<FoodCard food={mockFood} onDelete={onDelete} />);
    const deleteButton = screen.getByRole('button', {
      name: 'テスト食材の削除ボタン',
    });

    // Act
    // 削除ボタンをクリック
    await user.click(deleteButton);

    // Assert
    // 確認ダイアログが表示されたことを確認
    expect(window.confirm).toHaveBeenCalledWith('本当に削除しますか？');

    // deleteFoodItemが呼ばれたことを確認
    expect(storageUtils.deleteFoodItem).toHaveBeenCalledWith(mockFood.id);

    // onDeleteが呼ばれたことを確認
    expect(onDelete).toHaveBeenCalled();
  });

  it('確認ダイアログでキャンセルした場合、削除処理が行われないことを確認', async () => {
    // Arrange
    window.confirm = vi.fn(() => false); // キャンセルするケース
    render(<FoodCard food={mockFood} onDelete={onDelete} />);
    const deleteButton = screen.getByRole('button', {
      name: 'テスト食材の削除ボタン',
    });

    // Act
    // 削除ボタンをクリック
    await user.click(deleteButton);

    // Assert
    // 確認ダイアログが表示されたことを確認
    expect(window.confirm).toHaveBeenCalledWith('本当に削除しますか？');

    // deleteFoodItemが呼ばれていないことを確認
    expect(storageUtils.deleteFoodItem).not.toHaveBeenCalled();

    // onDeleteが呼ばれていないことを確認
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('articleにaria-labelが正しく設定されていることを確認', () => {
    // Arrange
    render(<FoodCard food={mockFood} onDelete={onDelete} />);
    const article = screen.getByRole('article', {
      name: 'テスト食材の食材カード',
    });

    // Assert
    expect(article).toBeInTheDocument();
  });

  describe('賞味期限に応じたカードの表示色のテスト', () => {
    const createMockFoodWithDaysRemaining = (daysRemaining: number) => {
      const today = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(today.getDate() + daysRemaining);

      return {
        id: '1',
        name: 'テスト食材',
        expiryDate: formatDateToISOString(expiryDate),
      };
    };

    it.each([
      {
        daysRemaining: -1,
        expectedClass: 'bg-black text-white',
        description: '期限切れ',
      },
      {
        daysRemaining: 0,
        expectedClass: 'bg-red-500 text-white',
        description: '当日',
      },
      {
        daysRemaining: 3,
        expectedClass: 'bg-red-200',
        description: '残り3日以内',
      },
      {
        daysRemaining: 5,
        expectedClass: 'bg-yellow-200',
        description: '残り5日以内',
      },
      {
        daysRemaining: 10,
        expectedClass: 'bg-green-200',
        description: '残り6日以上',
      },
    ])(
      '残り日数が$daysRemaining日（$description）の場合、カードのクラスが$expectedClassであること',
      ({ daysRemaining, expectedClass }) => {
        // Arrange
        const mockFoodWithCustomExpiry =
          createMockFoodWithDaysRemaining(daysRemaining);

        // Act
        const { container } = render(
          <FoodCard food={mockFoodWithCustomExpiry} onDelete={onDelete} />
        );
        const card = container.querySelector('[role="article"]');

        // Assert
        // クラス名に部分一致で確認（他のクラス名も含まれている可能性があるため）
        expectedClass.split(' ').forEach((className) => {
          expect(card).toHaveClass(className);
        });
      }
    );

    it.each([
      { daysRemaining: -2, expectedText: '2日過ぎています' },
      { daysRemaining: -1, expectedText: '1日過ぎています' },
      { daysRemaining: 0, expectedText: '本日までです' },
      { daysRemaining: 1, expectedText: 'あと1日' },
      { daysRemaining: 5, expectedText: 'あと5日' },
    ])(
      '残り日数が$daysRemainingの場合、期限テキストが「$expectedText」と表示されること',
      ({ daysRemaining, expectedText }) => {
        // Arrange
        const mockFoodWithCustomExpiry =
          createMockFoodWithDaysRemaining(daysRemaining);

        // Act
        render(
          <FoodCard food={mockFoodWithCustomExpiry} onDelete={onDelete} />
        );

        // Assert
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
    );
  });
});
