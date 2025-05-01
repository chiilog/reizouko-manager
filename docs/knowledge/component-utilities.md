# コンポーネントユーティリティ

このドキュメントでは、`src/lib` ディレクトリに配置されているユーティリティ関数について説明します。

## date-utils.ts

日付関連の操作を行うユーティリティ関数を提供します。

- `getDateAfterDays(days: number): Date`
  - 現在の日付から指定した日数後の `Date` オブジェクトを返します。
  - 使用例: `getDateAfterDays(7)` // 1週間後の日付を取得
- `getDaysUntilExpiry(expiryDate: string): number`
  - ISO形式の日付文字列 (`YYYY-MM-DD`) を受け取り、今日から賞味期限までの残り日数を計算して返します。
  - 使用例: `getDaysUntilExpiry('2023-12-31')` // 2023年12月31日までの残り日数
- `formatDateToISOString(date: Date): string`
  - `Date` オブジェクトを受け取り、`YYYY-MM-DD` 形式の文字列に変換して返します。
  - 使用例: `formatDateToISOString(new Date())` // 今日の日付を '2023-04-01' のような形式で取得
- `formatDateToJapanese(date: Date | string): string`
  - `Date` オブジェクトまたはISO形式の日付文字列を受け取り、日本語の年月日形式（例: 2023年4月1日）の文字列に変換して返します。
  - 使用例: `formatDateToJapanese('2023-04-01')` // '2023年4月1日' を返す
- `getExpiryColorClass(daysRemaining: number): string`
  - 残り日数を受け取り、その日数に応じた背景色と文字色を指定するTailwind CSSのクラス名を返します。
  - 使用例: `getExpiryColorClass(3)` // 'bg-red-200' を返す
    - 残り日数 < 0: `bg-black text-white` (黒背景、白文字 - 期限切れ)
    - 残り日数 = 0: `bg-red-500 text-white` (赤背景、白文字 - 当日)
    - 残り日数 <= 3: `bg-red-200` (薄い赤背景 - 期限間近)
    - 残り日数 <= 5: `bg-yellow-200` (薄い黄色背景 - やや注意)
    - それ以外: `bg-green-200` (薄い緑背景 - 余裕あり)

## storage.ts

ブラウザのローカルストレージを使用して、食材データを永続化するための関数を提供します。データのキーは定数 `STORAGE_KEY` で定義されています。

- `getAllFoodItems(): FoodItem[]`
  - ローカルストレージから全ての食材データを取得し、`FoodItem` の配列として返します。データがない場合は空の配列を返します。
  - 使用例: `const allItems = getAllFoodItems()` // すべての食材データを取得
- `saveFoodItems(items: FoodItem[]): void`
  - `FoodItem` の配列を受け取り、ローカルストレージにJSON形式で保存します。既存のデータは上書きされます。
  - 使用例: `saveFoodItems([{ id: '123', name: 'りんご', expiryDate: '2023-12-31' }])`
- `addFoodItem(item: Omit<FoodItem, 'id'>): FoodItem`
  - IDを含まない食材データ (`name` と `expiryDate`) を受け取り、`crypto.randomUUID()` で一意のIDを付与した後、ローカルストレージに追加します。追加された `FoodItem` オブジェクトを返します。
  - 使用例: `addFoodItem({ name: 'バナナ', expiryDate: '2023-06-15' })`
- `deleteFoodItem(id: string): void`
  - 削除したい食材のIDを受け取り、ローカルストレージから該当するデータを削除します。
  - 使用例: `deleteFoodItem('123')` // ID '123' の食材を削除

## types.ts

アプリケーション全体で使用される型定義を提供します。

- `FoodItem` インターフェース
  - 食材データを表現する型です。アプリケーション全体で食材データの構造を統一するために使用されます。
    - `id: string`: 食材の一意な識別子。
    - `name: string`: 食材の名前。
    - `expiryDate: string`: 賞味期限（`YYYY-MM-DD` 形式の文字列）。

## utils.ts

汎用的なユーティリティ関数を提供します。

- `cn(...inputs: ClassValue[]): string`
  - 内部で `clsx` と `tailwind-merge` を使用しています。複数のクラス名の値（文字列、配列、オブジェクトなど）を受け取り、Tailwind CSSのクラス名の衝突を考慮しつつ、単一のクラス文字列に結合・最適化します。Reactコンポーネントなどで動的にクラス名を管理する際に便利です。
  - 使用例: `cn('text-red-500', isActive && 'font-bold', { 'bg-blue-100': isHighlighted })`