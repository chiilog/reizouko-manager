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

/**
 * 食品名の最大文字数
 */
const MAX_NAME_LENGTH = 50;

/**
 * HTMLタグを削除する関数
 * @param input 入力文字列
 * @returns サニタイズされた文字列
 */
const sanitizeHtmlTags = (input: string): string => {
  // <script> タグやその他のHTMLタグを削除
  const noScriptTags = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );
  // 残りの一般的なHTMLタグを削除
  return noScriptTags.replace(/<\/?[^>]+(>|$)/g, '');
};

/**
 * 食品名のバリデーションを行う関数
 * @param name 食品名
 * @returns エラーメッセージ（エラーがない場合はnull）
 */
const validateFoodName = (name: string): string | null => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return '食品名を入力してください。空白文字のみは無効です。';
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return `食品名は${MAX_NAME_LENGTH}文字以内で入力してください。`;
  }

  return null;
};

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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
  };

  /**
   * フォーム送信時の処理
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 名前を検証
    const validationError = validateFoodName(name);
    if (validationError) {
      setError(validationError);
      nameInputRef.current?.focus();
      return;
    }

    // エラーをリセット
    setError(null);

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
      setError('食材の追加に失敗しました。もう一度お試しください。');
    } finally {
      // 処理完了時に送信中フラグをOFFに
      updateSubmittingState(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_NAME_LENGTH + 1} // 入力制限用（バリデーションメッセージを表示するため+1）
                required
                aria-describedby={error ? 'name-error' : undefined}
              />
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
                      !date && 'text-muted-foreground'
                    )}
                  >
                    {date ? formatDateToJapanese(date) : '日付を選択'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      if (date) {
                        setDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* エラーメッセージ表示エリア */}
            {error && (
              <div
                id="name-error"
                aria-live="assertive"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
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
