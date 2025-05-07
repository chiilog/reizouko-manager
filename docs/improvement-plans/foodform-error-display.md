# FoodFormコンポーネント - エラーメッセージ表示の改善計画

## 現状分析

現在のFoodFormコンポーネントでは、以下のようなエラーメッセージ表示の実装がされています：

1. 文字列型の`error`というstate変数を使ってエラーメッセージを管理
2. `validateFoodName`関数による食品名のバリデーション
3. エラーがある場合、`aria-describedby`属性でエラーメッセージとフォーム要素を関連付け
4. エラーメッセージはコンポーネント内の赤い背景の枠内に表示

## 改善すべき点

レビュー文書に基づき、以下の改善が必要です：

1. **賞味期限のバリデーションエラーの表示**

   - 現在は食品名のエラーのみ表示されていますが、賞味期限のバリデーションエラーも表示できるようにする

2. **複数のエラーメッセージへの対応**

   - 食品名と賞味期限の両方でエラーが発生した場合の表示方法を改善

3. **各フィールドに対応するエラーメッセージの関連付け強化**

   - 各入力フィールドごとにエラー状態を示す視覚的な合図（赤い枠線など）を追加

4. **エラーメッセージのアクセシビリティ強化**
   - 複数のエラーがある場合のアクセシビリティ対応

## 実装方針

### 1. エラー状態の管理方法の改善

文字列型の`error`から、フィールドごとにエラーメッセージを管理できるオブジェクト型に変更します：

```typescript
type FormErrors = {
  name?: string;
  expiryDate?: string;
-  general?: string; // フォーム全体に関するエラー
+  systemError?: string; // システム処理に関するエラー
};

const [errors, setErrors] = useState<FormErrors>({});
```

> **注記**: 当初は`general`というフィールド名を使用する予定でしたが、エラーの性質をより明確に表現するため`systemError`に変更しました。これはシステム処理（データ保存失敗など）に関連するエラーメッセージを格納するためのフィールドです。

### 2. 賞味期限のバリデーション関数の追加

`validation.ts`に賞味期限の検証ロジックを追加します：

```typescript
/**
 * 賞味期限のバリデーションを行う関数
 * @param date 賞味期限の日付
 * @returns エラーメッセージ（エラーがない場合はnull）
 */
export const validateExpiryDate = (date: Date | null): string | null => {
  if (!date) {
    return '賞味期限を選択してください。';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return '賞味期限は今日以降の日付を選択してください。';
  }

  return null;
};
```

### 3. エラー表示のUI改善

各入力フィールドの下にエラーメッセージを表示するように変更し、エラー時の入力フィールドのスタイルを変更します：

```tsx
<div className="space-y-2">
  <label htmlFor="food-name" className="text-sm font-medium">
    食品名
  </label>
  <Input
    id="food-name"
    ref={nameInputRef}
    className={cn(errors.name && 'border-destructive')}
    // ...他のプロパティ
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
```

同様に賞味期限の入力欄にも対応するエラー表示を追加します。

### 4. フォーム送信時の全フィールドバリデーション

フォーム送信時に全フィールドのバリデーションを行い、複数のエラーを同時に表示できるようにします：

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // 全フィールドを検証
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

  // エラーがない場合は処理を続行
  setErrors({});
  // ...以降は既存のコード
};
```

### 5. エラー状態リセット処理の改善

フォームリセット時やフィールドの値が変更された時に、対応するエラーメッセージもリセットします：

```typescript
const resetForm = () => {
  setName('');
  setDate(getDateAfterDays(5));
  setErrors({});
};

// 入力値変更時のハンドラー
const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setName(e.target.value);
  // 対応するエラーをクリア
  if (errors.name) {
    setErrors((prev) => ({ ...prev, name: undefined }));
  }
};
```

### 6. テストケースの追加

新しいエラーメッセージ表示機能に対応するテストケースを追加します：

- 食品名のバリデーションエラーが正しく表示されるかテスト
- 賞味期限のバリデーションエラーが正しく表示されるかテスト
- 複数のエラーが同時に表示されるかテスト
- エラーメッセージが関連するフィールドと適切に関連付けられているか（aria-describedby）テスト

## 期待される結果

この改善により：

1. ユーザーは各入力フィールドのエラーを明確に識別できるようになります
2. 複数のエラーがある場合も適切に表示されます
3. エラーメッセージは視覚的にも関連する入力フィールドと関連付けられます
4. スクリーンリーダーなどの支援技術を使用するユーザーにも、どのフィールドにエラーがあるかが明確に伝わります

これらの改善により、ユーザー体験が向上し、フォーム入力時のフラストレーションが軽減されることが期待されます。
