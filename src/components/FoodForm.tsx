/**
 * 食材入力用のフォームコンポーネント
 */
import { useRef, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  formatDateToISOString,
  formatDateToJapanese,
  getDateAfterDays,
} from '@/lib/date-utils';
import { addFoodItem } from '@/lib/storage';
import { Loader2 } from 'lucide-react';
import {
  MAX_NAME_LENGTH,
  sanitizeHtmlTags,
  validateFoodName,
  validateExpiryDate,
} from '@/lib/validation';

interface FoodFormProps {
  /**
   * ダイアログが開いているかどうか
   */
  open: boolean;

  /**
   * ダイアログを閉じる関数
   */
  onClose: () => void;

  /**
   * 食材追加後の処理
   */
  onFoodAdded: () => void;

  /**
   * 送信中状態
   */
  isSubmitting?: boolean;

  /**
   * 送信状態変更ハンドラー
   */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

/**
 * フォームエラーの型定義
 */
type FormErrors = {
  name?: string;
  expiryDate?: string;
  systemError?: string; // システム処理に関するエラー
};

/**
 * 食材入力用のフォームコンポーネント
 */
export function FoodForm({
  open,
  onClose,
  onFoodAdded,
  isSubmitting: externalIsSubmitting,
  onSubmittingChange,
}: FoodFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>(getDateAfterDays(5));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  /**
   * 送信状態は外部から制御される場合はその値を使用し、
   * そうでない場合は内部状態を使用します。
   * 外部から制御する場合は、onSubmittingChange propで状態変更を通知する必要があります。
   */
  const isSubmitting =
    externalIsSubmitting !== undefined
      ? externalIsSubmitting
      : internalIsSubmitting;

  /**
   * 送信状態を更新する
   */
  const updateSubmittingState = (submitting: boolean) => {
    if (onSubmittingChange) {
      onSubmittingChange(submitting);
    } else {
      setInternalIsSubmitting(submitting);
    }
  };

  /**
   * フォームをリセットする
   */
  const resetForm = () => {
    setName('');
    setDate(getDateAfterDays(5));
    setErrors({});
  };

  /**
   * 名前の入力値変更時の処理
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // 対応するエラーをクリア
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  /**
   * 日付の変更時の処理
   */
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setCalendarOpen(false);
      // 対応するエラーをクリア
      if (errors.expiryDate) {
        setErrors((prev) => ({ ...prev, expiryDate: undefined }));
      }
    }
  };

  /**
   * 名前入力欄のブラー時の処理
   */
  const handleNameBlur = () => {
    const nameError = validateFoodName(name);
    if (nameError) {
      setErrors((prev) => ({ ...prev, name: nameError }));
    } else if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  /**
   * フォーム送信時の処理
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 全フィールドの検証
    const nameError = validateFoodName(name);
    const dateError = validateExpiryDate(date);

    const newErrors: FormErrors = {};
    if (nameError) newErrors.name = nameError;
    if (dateError) newErrors.expiryDate = dateError;

    // エラーがある場合は処理を中断
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // 最初のエラーフィールドにフォーカス
      if (newErrors.name) {
        nameInputRef.current?.focus();
      }
      return;
    }

    // エラーをリセット
    setErrors({});

    // 既に送信中の場合は処理を中断
    if (isSubmitting) return;

    // 送信中フラグをONに
    updateSubmittingState(true);

    // 名前の前後の空白をトリムし、HTMLタグをサニタイズ
    const sanitizedName = sanitizeHtmlTags(name.trim());

    try {
      // 食材の追加
      addFoodItem({
        name: sanitizedName,
        expiryDate: formatDateToISOString(date),
      });

      // 親コンポーネントに通知
      onFoodAdded();
      resetForm();
      onClose();
    } catch (error) {
      // エラーが発生した場合、エラーメッセージを設定
      console.error('食材の追加に失敗しました', error);
      // ユーザーにはシンプルなメッセージを表示
      setErrors({
        systemError: '食材の追加に失敗しました。もう一度お試しください。',
      });
    } finally {
      // 処理完了時に送信中フラグをOFFに
      updateSubmittingState(false);
    }
  };

  /**
   * ダイアログが閉じる時の処理
   */
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>食材の登録</DialogTitle>
          <DialogDescription>
            食材の名前と賞味期限を入力してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="food-name" className="text-sm font-medium">
                食品名
              </label>
              <Input
                id="food-name"
                ref={nameInputRef}
                placeholder="例：きゅうり、たまご"
                value={name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                maxLength={MAX_NAME_LENGTH}
                required
                className={cn(errors.name && 'border-destructive')}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <div
                  id="name-error"
                  aria-live="assertive"
                  className="text-sm text-destructive mt-1"
                >
                  {errors.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">賞味期限</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full pl-3 text-left font-normal',
                      !date && 'text-muted-foreground',
                      errors.expiryDate && 'border-destructive'
                    )}
                    aria-describedby={
                      errors.expiryDate ? 'expiry-date-error' : undefined
                    }
                  >
                    {date ? formatDateToJapanese(date) : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
              {errors.expiryDate && (
                <div
                  id="expiry-date-error"
                  aria-live="assertive"
                  className="text-sm text-destructive mt-1"
                >
                  {errors.expiryDate}
                </div>
              )}
            </div>

            {/* システムエラーメッセージ表示エリア */}
            {errors.systemError && (
              <div
                id="system-error"
                aria-live="assertive"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {errors.systemError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登録中...
                </>
              ) : (
                '登録'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
