/**
 * 食材入力用のフォームコンポーネント
 */
import { useRef, useState, useEffect } from 'react';
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
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { cn } from '@/lib/utils';
import { formatDateToISOString, getDateAfterDays } from '@/lib/date-utils';
import { addFoodItem } from '@/lib/storage';
import { Loader2 } from 'lucide-react';
import {
  MAX_NAME_LENGTH,
  sanitizeHtmlTags,
  validateFoodName,
  validateExpiryDate,
} from '@/lib/validation';
import {
  QuotaExceededError,
  NetworkError,
  ValidationError,
  StorageError,
} from '@/lib/errors';

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

const DEFAULT_EXPIRY_DATE_DAYS = 5;

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
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    getDateAfterDays(DEFAULT_EXPIRY_DATE_DAYS)
  );
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
   * ダイアログが開かれたときにフォームの初期値を設定
   */
  useEffect(() => {
    if (open) {
      setName('');
      setExpiryDate(getDateAfterDays(DEFAULT_EXPIRY_DATE_DAYS));
      setErrors({});
    }
  }, [open]);

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
   * 日付の変更時の処理 (CustomDatePickerからのコールバック)
   */
  const handleExpiryDateChange = (newDate: Date | undefined) => {
    setExpiryDate(newDate);
    // 対応するエラーをクリア
    if (errors.expiryDate) {
      setErrors((prev) => ({ ...prev, expiryDate: undefined }));
    }
    // 日付が選択されたら、システムエラーもクリアする (UX向上のため)
    if (errors.systemError) {
      setErrors((prev) => ({ ...prev, systemError: undefined }));
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
      // エラーがない場合は、エラーメッセージをクリア
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  /**
   * フォーム送信時の処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 全フィールドの検証
    const nameError = validateFoodName(name);
    const dateError = expiryDate
      ? validateExpiryDate(expiryDate)
      : '日付を選択してください。'; // expiryDateがundefinedの場合のエラーメッセージ

    const newErrors: FormErrors = {};
    if (nameError) newErrors.name = nameError;
    if (!expiryDate || dateError !== null) {
      // expiryDateが未選択、またはvalidateExpiryDateがエラーメッセージを返した場合
      newErrors.expiryDate = dateError || '日付を選択してください。';
    }

    // エラーがある場合は処理を中断
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // 最初のエラーフィールドにフォーカス
      if (newErrors.name) {
        nameInputRef.current?.focus();
      } else if (newErrors.expiryDate) {
        // CustomDatePickerには直接フォーカスできないため、UI上の工夫が必要な場合がある
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
      // 食材の追加 (expiryDateがundefinedでないことは上でチェック済みのはずだが念のため)
      if (!expiryDate) {
        // このケースは通常発生しないはずだが、型安全のため
        throw new ValidationError('賞味期限が設定されていません。');
      }
      addFoodItem({
        name: sanitizedName,
        expiryDate: formatDateToISOString(expiryDate),
      });

      // 親コンポーネントに通知
      onFoodAdded();
      onClose(); // ダイアログを閉じる
    } catch (error) {
      // エラーが発生した場合、エラーメッセージを設定
      console.error('食材の追加に失敗しました', error);
      // ユーザーにはエラーの種類に応じたメッセージを表示
      let systemError = '食材の追加に失敗しました。もう一度お試しください。';
      if (error instanceof QuotaExceededError) {
        systemError =
          '保存容量が上限に達しました。不要なデータを削除してください。';
      } else if (error instanceof NetworkError) {
        systemError =
          'ネットワーク接続に問題があります。接続を確認し、もう一度お試しください。';
      } else if (error instanceof ValidationError) {
        systemError = error.message; // バリデーションエラーのメッセージをそのまま表示
      } else if (error instanceof StorageError) {
        systemError =
          'データの保存中にエラーが発生しました。ブラウザの設定を確認し、もう一度お試しください。';
      }
      setErrors({
        systemError: systemError,
      });
    } finally {
      // 処理完了時に送信中フラグをOFFに
      updateSubmittingState(false);
    }
  };

  /**
   * ダイアログが閉じる時の処理（Formのキャンセルアクションにも使用）
   */
  const handleCloseDialog = () => {
    onClose(); // onCloseを呼び出してダイアログを閉じる
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>食材の登録</DialogTitle>
          <DialogDescription>
            新しい食材の情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right whitespace-nowrap">
              食品名
            </label>
            <Input
              id="name"
              ref={nameInputRef}
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur} // ブラー時にもバリデーションを実行
              placeholder="例：きゅうり、たまご"
              className={cn('col-span-3', errors.name && 'border-destructive')}
              maxLength={MAX_NAME_LENGTH + 10} // 少し余裕を持たせる (バリデーションはMAX_NAME_LENGTHで)
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p
                id="name-error"
                className="col-span-4 text-sm text-destructive text-right"
              >
                {errors.name}
              </p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="expiryDate" className="text-right">
              賞味期限
            </label>
            <div className="col-span-3">
              <CustomDatePicker
                selectedDate={expiryDate}
                onDateChange={handleExpiryDateChange}
                initialDate={getDateAfterDays(DEFAULT_EXPIRY_DATE_DAYS)}
                minDate={new Date()} // 今日以降を選択可能に
                placeholder="賞味期限を選択"
                className={cn(errors.expiryDate && 'border-destructive')} // isError propも使える
                isError={!!errors.expiryDate} // CustomDatePickerにエラー状態を伝える
                // buttonVariant={errors.expiryDate ? 'destructive' : 'outline'} // 直接variantを変えることも可能
              />
            </div>
            {errors.expiryDate && (
              <p
                id="expiryDate-error"
                className="col-span-4 text-sm text-destructive text-right"
              >
                {errors.expiryDate}
              </p>
            )}
          </div>
          {errors.systemError && (
            <p className="col-span-4 text-sm text-destructive text-center">
              {errors.systemError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
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
