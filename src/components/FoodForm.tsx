/**
 * 食材入力用のフォームコンポーネント
 */
import { useRef, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
}

/**
 * 食材入力用のフォームコンポーネント
 */
export function FoodForm({ open, onClose, onFoodAdded }: FoodFormProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>(getDateAfterDays(5));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  /**
   * フォームをリセットする
   */
  const resetForm = () => {
    setName('');
    setDate(getDateAfterDays(5));
  };

  /**
   * フォーム送信時の処理
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      nameInputRef.current?.focus();
      return;
    }

    addFoodItem({
      name,
      expiryDate: formatDateToISOString(date),
    });

    onFoodAdded();
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>食材の登録</DialogTitle>
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
                required
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
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
