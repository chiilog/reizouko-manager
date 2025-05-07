/**
 * カスタム日付選択コンポーネント
 * @description PopoverとCalendarを組み合わせた再利用可能な日付選択UIを提供します。
 */
import { useState } from 'react';
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

// CustomDropdownNav コンポーネントの定義 (元の実装に戻す)
const CustomDropdownNav = (
  navProps: React.HTMLAttributes<HTMLDivElement>
): React.JSX.Element => {
  const { goToMonth, months } = useDayPicker();

  const displayDate =
    months && months.length > 0 && months[0]?.date ? months[0].date : undefined;

  if (!displayDate) {
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

  const yearOptions = Array.from(
    { length: 21 },
    (_, i) => currentYear - 10 + i
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) => i);

  const handleYearChange = (yearValue: string) => {
    const newDate = new Date(displayDate);
    newDate.setFullYear(parseInt(yearValue, 10));
    goToMonth(newDate);
  };

  const handleMonthChange = (monthValue: string) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(parseInt(monthValue, 10));
    goToMonth(newDate);
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
  const effectiveMinDate = minDate || new Date();
  // 過去の日付を選択不可にするための修飾子
  const disabledDays = [{ before: effectiveMinDate }];

  /**
   * 日付がカレンダーから選択されたときのハンドラ
   * @param {Date | undefined} date - 選択された日付、または未選択を示すundefined
   */
  const handleDateSelect = (date: Date | undefined) => {
    onDateChange(date);
    setIsOpen(false); // 日付を選択したらPopoverを閉じる
  };

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
          aria-label={
            selectedDate ? formatDateToJapanese(selectedDate) : placeholder
          }
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
          defaultMonth={selectedDate || initialDate || getDateAfterDays(0)} // カレンダーの初期表示月
          captionLayout="dropdown-months" // ドロップダウンナビゲーションを有効化（月のドロップダウン）
          components={{
            DropdownNav: CustomDropdownNav, // カスタムドロップダウンナビゲーションを指定
          }}
        ></Calendar>
      </PopoverContent>
    </Popover>
  );
}
