/**
 * カスタム日付選択コンポーネント
 * @description PopoverとCalendarを組み合わせた再利用可能な日付選択UIを提供します。
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDateToJapanese, getDateAfterDays } from '@/lib/date-utils';
import { CalendarIcon } from 'lucide-react';
import { useDayPicker } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';

/**
 * カスタムドロップダウンナビゲーションコンポーネント
 * カレンダーの上部に表示される年月選択用のドロップダウンUIを提供します
 */
const CustomDropdownNav = (
  navProps: React.HTMLAttributes<HTMLDivElement>
): React.JSX.Element => {
  // React Hookはコンポーネントのトップレベルで呼び出す必要がある
  const dayPicker = useDayPicker();

  try {
    const { goToMonth, months } = dayPicker;

    const displayDate =
      months && months.length > 0 && months[0]?.date
        ? months[0].date
        : undefined;

    // 表示日付がない場合（エッジケース対応）
    if (!displayDate) {
      console.warn(
        'カレンダーの表示日付が未定義です。デフォルトUIを表示します。'
      );
      return (
        <div
          {...navProps}
          className={cn(
            'rdp-dropdown_nav flex items-center justify-center gap-1 p-2',
            navProps.className
          )}
        />
      );
    }

    const currentYear = displayDate.getFullYear();
    const selectedMonth = displayDate.getMonth();

    // 有効な年の範囲を設定（過去10年から将来10年）
    const yearOptions = Array.from(
      { length: 21 },
      (_, i) => currentYear - 10 + i
    );
    const monthOptions = Array.from({ length: 12 }, (_, i) => i);

    /**
     * 年の変更を処理するハンドラー
     * @param yearValue 選択された年（文字列）
     */
    const handleYearChange = (yearValue: string) => {
      try {
        // 文字列を数値に変換し、有効な値かチェック
        const yearNum = parseInt(yearValue, 10);
        if (isNaN(yearNum)) {
          console.error('無効な年の値です:', yearValue);
          return;
        }

        const newDate = new Date(displayDate);
        newDate.setFullYear(yearNum);
        goToMonth(newDate);
      } catch (error) {
        console.error('年の変更中にエラーが発生しました:', error);
        // エラーが発生しても、UIは壊さない
      }
    };

    /**
     * 月の変更を処理するハンドラー
     * @param monthValue 選択された月（文字列）
     */
    const handleMonthChange = (monthValue: string) => {
      try {
        // 文字列を数値に変換し、有効な値かチェック
        const monthNum = parseInt(monthValue, 10);
        if (isNaN(monthNum) || monthNum < 0 || monthNum > 11) {
          console.error('無効な月の値です:', monthValue);
          return;
        }

        const newDate = new Date(displayDate);
        newDate.setMonth(monthNum);
        goToMonth(newDate);
      } catch (error) {
        console.error('月の変更中にエラーが発生しました:', error);
        // エラーが発生しても、UIは壊さない
      }
    };

    return (
      <div
        {...navProps}
        className={cn(
          'rdp-dropdown_nav flex items-center justify-center gap-1 p-2',
          navProps.className
        )}
      >
        <Select onValueChange={handleYearChange} value={currentYear.toString()}>
          <SelectTrigger
            data-testid="year-select"
            aria-label="年を選択"
            className="h-8 w-[75px] px-2 text-sm focus:ring-0"
          >
            <SelectValue placeholder="年" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={handleMonthChange}
          value={selectedMonth.toString()}
        >
          <SelectTrigger
            data-testid="month-select"
            aria-label="月を選択"
            className="h-8 w-[65px] px-2 text-sm focus:ring-0"
          >
            <SelectValue placeholder="月" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {monthOptions.map((monthIndex) => (
              <SelectItem key={monthIndex} value={monthIndex.toString()}>
                {monthIndex + 1}月
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  } catch (error) {
    // トップレベルのエラーハンドリング - UIが壊れることを防ぐ
    console.error(
      'ドロップダウンナビゲーションの描画中にエラーが発生しました:',
      error
    );
    return (
      <div
        {...navProps}
        className={cn(
          'rdp-dropdown_nav flex items-center justify-center gap-1 p-2',
          navProps.className
        )}
      />
    );
  }
};

interface CustomDatePickerProps {
  /**
   * 選択されている日付
   * undefinedの場合は日付が選択されていない状態を示します。
   */
  selectedDate: Date | undefined;

  /**
   * 日付が選択されたときに呼び出されるコールバック関数
   * @param date 選択された日付オブジェクト。選択がクリアされた場合はundefined。
   */
  onDateChange: (date: Date | undefined) => void;

  /**
   * 初期表示時の日付。指定されない場合は、今日から5日後がデフォルト。
   * このpropsはコンポーネントのマウント時に一度だけ評価されます。
   * マウント後の日付変更はselectedDateとonDateChangeを通じて行います。
   */
  initialDate?: Date;

  /**
   * 選択可能な最小日付。これより過去の日付は選択できません。
   * 指定されない場合は、今日が最小日付となります。
   */
  minDate?: Date;

  /**
   * ポップオーバーカレンダーのプレースホルダーとして表示するテキスト
   * 例: 「日付を選択」
   */
  placeholder?: string;

  /**
   * コンポーネントに適用する追加のCSSクラス名
   */
  className?: string;

  /**
   * 日付選択ボタンのバリアント
   */
  buttonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  /**
   * エラー状態かどうか
   * trueの場合、ボタンのスタイルが変更されます（例: 赤い枠線）。
   */
  isError?: boolean;
}

/**
 * カスタム日付選択コンポーネント
 * @param {CustomDatePickerProps} props - コンポーネントのプロパティ
 * @returns {React.ReactElement} レンダリング結果 - JSX.ElementからReact.ReactElementへ変更、または型推論に任せる
 */
export function CustomDatePicker({
  selectedDate,
  onDateChange,
  initialDate,
  minDate,
  placeholder = '日付を選択',
  className,
  buttonVariant = 'outline',
  isError = false,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // minDateが指定されていない場合は今日をデフォルトとする
  // effectiveMinDateをuseMemo内に移動して依存関係の問題を解決
  const effectiveMinDate = useMemo(() => minDate || new Date(), [minDate]);

  // 過去の日付を選択不可にするための修飾子
  const disabledDays = useMemo(
    () => [{ before: effectiveMinDate }],
    [effectiveMinDate]
  );

  // 選択日付が最小日付より前の場合に修正する（最小日付が変更された場合に対応）
  useEffect(() => {
    if (selectedDate && minDate && selectedDate < minDate) {
      console.warn('選択日付が最小日付より前のため、最小日付に修正します。');
      onDateChange(new Date(minDate)); // 最小日付のコピーを使用
    }
  }, [minDate, selectedDate, onDateChange]);

  /**
   * 入力された日付が有効かどうかを検証する
   * @param {Date | undefined} date - 検証する日付
   * @returns {boolean} 日付が有効ならtrue、そうでなければfalse
   */
  const isValidDate = useCallback(
    (date: Date | undefined): boolean => {
      if (!date) return false;

      // 日付オブジェクトが有効かどうか
      if (isNaN(date.getTime())) return false;

      // 最小日付以降かどうか
      if (minDate && date < minDate) return false;

      return true;
    },
    [minDate]
  );

  /**
   * 日付がカレンダーから選択されたときのハンドラ
   * @param {Date | undefined} date - 選択された日付、または未選択を示すundefined
   */
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      try {
        // 日付の妥当性検証
        if (date && !isValidDate(date)) {
          console.warn(
            '無効な日付が選択されました。日付の選択をスキップします。'
          );
          setIsOpen(false);
          return;
        }

        onDateChange(date);
        setIsOpen(false); // 日付を選択したらPopoverを閉じる
      } catch (error) {
        console.error('日付選択処理中にエラーが発生しました:', error);
        // エラーが発生しても、UIは壊さない
        setIsOpen(false);
      }
    },
    [isValidDate, onDateChange]
  );

  // 初期表示月を設定する際のフォールバック処理
  const getDefaultMonth = useCallback((): Date => {
    try {
      if (selectedDate && isValidDate(selectedDate)) {
        return selectedDate;
      } else if (initialDate && isValidDate(initialDate)) {
        return initialDate;
      } else {
        // その他の場合は今日の日付を使用
        return getDateAfterDays(0);
      }
    } catch (error) {
      console.error('初期月の計算中にエラーが発生しました:', error);
      // エラーが発生した場合は今日の日付を返す
      return new Date();
    }
  }, [selectedDate, initialDate, isValidDate]);

  // 表示するラベルテキスト
  const buttonLabelText = useMemo(
    () => (selectedDate ? formatDateToJapanese(selectedDate) : placeholder),
    [selectedDate, placeholder]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            isError && 'border-destructive focus-visible:ring-destructive', // エラー時のスタイル
            className
          )}
          aria-label={buttonLabelText}
          aria-invalid={isError}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            formatDateToJapanese(selectedDate)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={disabledDays} // 過去の日付を選択不可にする
          defaultMonth={getDefaultMonth()} // 安全な初期表示月の計算
          captionLayout="dropdown-months" // ドロップダウンナビゲーションを有効化（月のドロップダウン）
          components={{
            DropdownNav: CustomDropdownNav, // カスタムドロップダウンナビゲーションを指定
          }}
        ></Calendar>
      </PopoverContent>
    </Popover>
  );
}
