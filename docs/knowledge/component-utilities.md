# コンポーネントユーティリティ

このドキュメントでは、`src/lib` ディレクトリに配置されているユーティリティ関数について説明します。

## date-utils.ts

日付関連の操作を行うユーティリティ関数を提供します。

- `getDateAfterDays(days: number): Date`
  - 現在の日付から指定した日数後の `Date` オブジェクトを返します。
- `getDaysUntilExpiry(expiryDate: string): number`
  - ISO形式の日付文字列 (`YYYY-MM-DD`) を受け取り、今日から賞味期限までの残り日数を計算して返します。
- `formatDateToISOString(date: Date): string`
  - `Date` オブジェクトを受け取り、`YYYY-MM-DD` 形式の文字列に変換して返します。
- `formatDateToJapanese(date: Date | string): string`
  - `Date` オブジェクトまたはISO形式の日付文字列を受け取り、日本語の年月日形式（例: 2023年4月1日）の文字列に変換して返します。
- `getExpiryColorClass(daysRemaining: number): string`
  - 残り日数を受け取り、その日数に応じた背景色と文字色を指定するTailwind CSSのクラス名を返します。
    - 残り日数 < 0: `bg-black text-white`
    - 残り日数 = 0: `bg-red-500 text-white`
    - 残り日数 <= 3: `bg-red-200`
    - 残り日数 <= 5: `bg-yellow-200`
    - それ以外: `bg-green-200`

## storage.ts

ブラウザのローカルストレージを使用して、食材データを永続化するための関数を提供します。データのキーは `food-items` です。

- `getAllFoodItems(): FoodItem[]`
  - ローカルストレージから全ての食材データを取得し、`FoodItem` の配列として返します。データがない場合は空の配列を返します。
- `saveFoodItems(items: FoodItem[]): void`
  - `FoodItem` の配列を受け取り、ローカルストレージにJSON形式で保存します。既存のデータは上書きされます。
- `addFoodItem(item: Omit<FoodItem, 'id'>): FoodItem`
  - IDを含まない食材データ (`name` と `expiryDate`) を受け取り、`crypto.randomUUID()` で一意のIDを付与した後、ローカルストレージに追加します。追加された `FoodItem` オブジェクトを返します。
- `deleteFoodItem(id: string): void`
  - 削除したい食材のIDを受け取り、ローカルストレージから該当するデータを削除します。

## types.ts

アプリケーション全体で使用される型定義を提供します。

- `FoodItem` インターフェース
  - 食材データを表現する型です。
    - `id: string`: 食材の一意な識別子。
    - `name: string`: 食材の名前。
    - `expiryDate: string`: 賞味期限（`YYYY-MM-DD` 形式の文字列）。

## utils.ts

汎用的なユーティリティ関数を提供します。

- `cn(...inputs: ClassValue[]): string`
  - `clsx` と `tailwind-merge` を組み合わせた関数です。複数のクラス名の値（文字列、配列、オブジェクトなど）を受け取り、条件に応じてクラス名を結合し、Tailwind CSSのクラス名の衝突を解決して最適化された単一のクラス文字列を返します。主にReactコンポーネントで動的にクラス名を適用する際に使用されます。
