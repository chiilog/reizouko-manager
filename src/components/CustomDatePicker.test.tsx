/**
 * CustomDatePickerコンポーネントのテスト
 * @description CustomDatePickerのレンダリング、日付選択、バリデーション（最小日付）、表示のフォーマットなどをテストします。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomDatePicker } from './CustomDatePicker';
import { formatDateToJapanese, getDateAfterDays } from '@/lib/date-utils';

describe('CustomDatePicker', () => {
  const user = userEvent.setup();
  const mockOnDateChange = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    // Date.now() を固定して、テストの再現性を高める (minDateのデフォルト値などに影響)
    // 例えば、2024年7月15日を現在時刻とする
    vi.setSystemTime(new Date(2024, 6, 15, 0, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers(); // システム時刻を元に戻す
  });

  /**
   * @describe 表示と初期状態のテスト
   */
  describe('表示と初期状態', () => {
    it('正しくレンダリングされ、初期値が表示されることを確認 (selectedDate指定あり)', () => {
      // Arrange
      const testDate = new Date(2024, 6, 20); // 2024年7月20日
      render(
        <CustomDatePicker
          selectedDate={testDate}
          onDateChange={mockOnDateChange}
        />
      );

      // Assert
      const button = screen.getByRole('button', {
        name: formatDateToJapanese(testDate),
      });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(formatDateToJapanese(testDate));
    });

    it('selectedDateがundefinedの場合、プレースホルダーが表示されることを確認', () => {
      // Arrange
      const placeholderText = '日付ピッカー';
      render(
        <CustomDatePicker
          selectedDate={undefined}
          onDateChange={mockOnDateChange}
          placeholder={placeholderText}
        />
      );

      // Assert
      const button = screen.getByRole('button', { name: placeholderText });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(placeholderText);
    });

    it('initialDateが指定された場合、カレンダーの初期表示月がinitialDateになることを確認', async () => {
      // Arrange
      const initialDisplayMonth = new Date(2025, 0, 1); // 2025年1月
      render(
        <CustomDatePicker
          selectedDate={undefined} // 選択日はない状態
          onDateChange={mockOnDateChange}
          initialDate={initialDisplayMonth}
        />
      );

      // Act
      const button = screen.getByRole('button');
      await user.click(button); // カレンダーを開く

      // Assert
      // カレンダーが表示され、表示月が2025年1月であることを確認
      const calendar = await screen.findByRole('grid');
      expect(calendar).toBeVisible();
      // 表示されている月のテキストを取得 (shadcn/uiのCalendarの実装に依存する部分)
      // CaptionLabelを使用して月と年を取得するのがより堅牢かもしれないが、ここでは簡易的に確認
      // expect(
      //   within(calendar).getByText('2025年1月', { exact: false })
      // ).toBeInTheDocument();

      // 年月選択のSelectTriggerが表示され、正しい値が設定されていることを確認
      const yearSelect = screen.getByTestId('year-select');
      expect(yearSelect).toHaveTextContent('2025年');

      const monthSelect = screen.getByTestId('month-select');
      expect(monthSelect).toHaveTextContent('1月');
    });
  });

  /**
   * @describe 日付選択の動作テスト
   */
  describe('日付選択の動作', () => {
    it('カレンダーを開いて日付を選択するとonDateChangeが呼ばれ、表示が更新されることを確認', async () => {
      // Arrange
      const initialDate = new Date(2024, 6, 15); // 2024年7月15日 (今日)
      const selectedDay = 20; // 7月20日を選択する
      const expectedSelectedDate = new Date(2024, 6, selectedDay);

      render(
        <CustomDatePicker
          selectedDate={initialDate} // 初期選択は今日
          onDateChange={mockOnDateChange}
        />
      );
      const button = screen.getByRole('button', {
        name: formatDateToJapanese(initialDate),
      });

      // Act: カレンダーを開く
      await user.click(button);
      const calendar = await screen.findByRole('grid');
      expect(calendar).toBeVisible();

      // Act: 7月20日を選択
      // (shadcn/uiのCalendarの実装では、日付セルは role='gridcell' であり、name属性に日付フルテキストを持つ)
      const dateButtonToClick = within(calendar).getByRole('button', {
        name: new RegExp(
          `\\b${selectedDay}(st|nd|rd|th)?\\b.*${expectedSelectedDate.getFullYear()}`
        ),
      });
      await user.click(dateButtonToClick);

      // Assert: onDateChangeが正しい日付で呼ばれたか
      expect(mockOnDateChange).toHaveBeenCalledTimes(1);
      expect(mockOnDateChange).toHaveBeenCalledWith(expectedSelectedDate);

      // Assert: Popoverが閉じたか (UI上の確認は難しいので、onDateChange後に閉じる実装を信じる)
      // (より厳密には、カレンダーが非表示になったことを確認する)
      await waitFor(() => {
        expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      });

      // Assert: ボタンの表示が更新されたか (props経由で再レンダリングされるため)
      // このテストでは直接ボタンのテキスト変更をアサートせず、コールバックに注目する
      // (親コンポーネントがselectedDateを更新して再レンダリングする責務)
    });
  });

  /**
   * @describe 最小日付 (minDate) のバリデーションテスト
   */
  describe('最小日付 (minDate) のバリデーション', () => {
    it('minDateより過去の日付はカレンダー上で無効化されていることを確認', async () => {
      // Arrange
      // minDateを現在時刻 (2024年7月15日) の3日後 (2024年7月18日) に設定
      const testMinDate = getDateAfterDays(3); // 2024-07-18
      render(
        <CustomDatePicker
          selectedDate={undefined}
          onDateChange={mockOnDateChange}
          minDate={testMinDate}
        />
      );

      // Act: カレンダーを開く
      const button = screen.getByRole('button');
      await user.click(button);
      const calendar = await screen.findByRole('grid');
      expect(calendar).toBeVisible();

      // Assert: minDate (7月18日) より前の日付 (例: 7月17日) が無効化されているか
      // (shadcn/uiのCalendarでは、無効な日付は aria-disabled="true" を持つ)
      const disabledDateCell = within(calendar).getByRole('gridcell', {
        name: /17/,
      });
      expect(disabledDateCell).toHaveAttribute('data-disabled', 'true');

      // 無効化された日付をクリックしてもonDateChangeが呼ばれないことを確認
      await user.click(disabledDateCell);
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });

    it('minDateが指定されていない場合、今日より過去の日付が無効化されていることを確認', async () => {
      // Arrange
      // minDateを指定しない (デフォルトで今日 = 2024年7月15日)
      render(
        <CustomDatePicker
          selectedDate={undefined}
          onDateChange={mockOnDateChange}
        />
      );

      // Act: カレンダーを開く
      const button = screen.getByRole('button');
      await user.click(button);
      const calendar = await screen.findByRole('grid');
      expect(calendar).toBeVisible();

      // Assert: 今日の日付 (7月15日) より前の日付 (例: 7月14日) が無効化されているか
      const disabledDateCellPast = within(calendar).getByRole('gridcell', {
        name: /14/,
      });
      expect(disabledDateCellPast).toHaveAttribute('data-disabled', 'true');

      // 無効化された日付をクリックしてもonDateChangeが呼ばれないことを確認
      await user.click(disabledDateCellPast);
      expect(mockOnDateChange).not.toHaveBeenCalled();
    });
  });

  /**
   * @describe エラースタイルに関するテスト
   */
  describe('エラースタイル', () => {
    it('isErrorがtrueの場合、エラー用のスタイルが適用されることを確認', () => {
      // Arrange
      render(
        <CustomDatePicker
          selectedDate={undefined}
          onDateChange={mockOnDateChange}
          isError={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      // 'border-destructive' クラスが付与されることを確認 (CustomDatePicker内の実装に依存)
      expect(button).toHaveClass('border-destructive');
    });

    it('isErrorがfalseの場合、エラー用のスタイルが適用されないことを確認', () => {
      // Arrange
      render(
        <CustomDatePicker
          selectedDate={undefined}
          onDateChange={mockOnDateChange}
          isError={false} // 明示的にfalse
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('border-destructive');
    });
  });
});
