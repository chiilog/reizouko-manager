# コンポーネントユーティリティ

このドキュメントでは、`src/lib` ディレクトリに配置されているユーティリティ関数について説明します。

## date-utils.ts

日付関連の操作を行うユーティリティ関数を提供します。

- `getDateAfterDays(days: number): Date`

  - **引数**: `days` - 現在の日付から加算する日数（数値型）
  - **戻り値**: 現在の日付から指定した日数後の日付を表す `Date` オブジェクト
  - **説明**: 現在の日付から指定した日数後の `Date` オブジェクトを返します。
  - **使用例**:

    ```typescript
    // 1週間後の日付を取得
    const nextWeek = getDateAfterDays(7);
    // 結果: 現在日付から7日後のDateオブジェクト（例: 2023-04-08T13:45:30.000Z）

    // 30日後の日付を取得して表示
    const thirtyDaysLater = getDateAfterDays(30);
    console.log(thirtyDaysLater.toISOString().split('T')[0]); // 例: '2023-05-01'
    ```

- `getDaysUntilExpiry(expiryDate: string): number`

  - **引数**: `expiryDate` - YYYY-MM-DD形式の賞味期限日（文字列型）
  - **戻り値**: 今日から賞味期限までの残り日数（数値型、負の値は期限切れを表す）
  - **説明**: YYYY-MM-DD形式の日付文字列を受け取り、今日から賞味期限までの残り日数を計算して返します。
  - **使用例**:

    ```typescript
    // 2023年12月31日までの残り日数を取得
    const daysLeft = getDaysUntilExpiry('2023-12-31');
    // 結果: 275 (仮に今日が2023年4月1日の場合)

    // 期限切れの場合は負の値が返される
    const pastDays = getDaysUntilExpiry('2023-01-01');
    // 結果: -90 (仮に今日が2023年4月1日の場合)
    ```

- `formatDateToISOString(date: Date): string`

  - **引数**: `date` - 変換する日付（Dateオブジェクト）
  - **戻り値**: YYYY-MM-DD形式の日付文字列
  - **説明**: `Date` オブジェクトをYYYY-MM-DD形式の文字列に変換します。時刻部分は省略されます。
  - **使用例**:

    ```typescript
    // 現在の日付をYYYY-MM-DD形式で取得
    const today = formatDateToISOString(new Date());
    // 結果: '2023-04-01' (実行日による)

    // 特定の日付を変換
    const specificDate = new Date(2023, 3, 15); // 2023年4月15日
    const formattedDate = formatDateToISOString(specificDate);
    // 結果: '2023-04-15'
    ```

- `formatDateToJapanese(date: Date | string): string`

  - **引数**: `date` - 変換する日付（DateオブジェクトまたはYYYY-MM-DD形式の文字列）
  - **戻り値**: 「YYYY年MM月DD日」形式の日本語日付文字列
  - **説明**: `Date` オブジェクトまたはYYYY-MM-DD形式の日付文字列を、日本語の年月日形式に変換します。
  - **使用例**:

    ```typescript
    // 文字列からの変換
    const japaneseDate1 = formatDateToJapanese('2023-04-01');
    // 結果: '2023年4月1日'

    // Dateオブジェクトからの変換
    const date = new Date(2023, 11, 31); // 2023年12月31日
    const japaneseDate2 = formatDateToJapanese(date);
    // 結果: '2023年12月31日'
    ```

- `getExpiryColorClass(daysRemaining: number): string`

  - **引数**: `daysRemaining` - 賞味期限までの残り日数（数値型）
  - **戻り値**: 残り日数に応じたTailwind CSSのクラス名（文字列型）
  - **説明**: 残り日数に基づいて、食品の賞味期限を視覚的に表示するためのTailwind CSSクラス名を返します。
  - **使用例**:

    ```typescript
    // 期限切れの場合
    const expiredClass = getExpiryColorClass(-1);
    // 結果: 'bg-black text-white'（黒背景・白文字）

    // 当日の場合
    const todayClass = getExpiryColorClass(0);
    // 結果: 'bg-red-500 text-white'（赤背景・白文字）

    // 残り3日の場合
    const nearExpiryClass = getExpiryColorClass(3);
    // 結果: 'bg-red-200'（薄い赤背景）

    // 残り5日の場合
    const warningClass = getExpiryColorClass(5);
    // 結果: 'bg-yellow-200'（薄い黄色背景）

    // 余裕がある場合
    const safeClass = getExpiryColorClass(10);
    // 結果: 'bg-green-200'（薄い緑背景）
    ```

  - **戻り値の詳細**:
    - 残り日数 < 0: `bg-black text-white` (黒背景、白文字 - 期限切れ)
    - 残り日数 = 0: `bg-red-500 text-white` (赤背景、白文字 - 当日)
    - 残り日数 <= 3: `bg-red-200` (薄い赤背景 - 期限間近)
    - 残り日数 <= 5: `bg-yellow-200` (薄い黄色背景 - やや注意)
    - それ以外: `bg-green-200` (薄い緑背景 - 余裕あり)

## storage.ts

ブラウザのローカルストレージを使用して、食材データを永続化するための関数を提供します。データの保存には定数 `STORAGE_KEY` で定義されたキーを使用します。

- `getAllFoodItems(): FoodItem[]`

  - **引数**: なし
  - **戻り値**: 保存されている全食材データの配列（`FoodItem[]`型）
  - **説明**: ローカルストレージから全ての食材データを取得し、`FoodItem` の配列として返します。データがない場合は空の配列を返します。
  - **使用例**:

    ```typescript
    // すべての食材データを取得して表示
    const allItems = getAllFoodItems();
    console.log(`保存されている食材数: ${allItems.length}`);

    // 取得したデータを期限の近い順にソートして処理
    const sortedItems = getAllFoodItems().sort(
      (a, b) =>
        getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
    );

    // 最初の5件だけ表示
    const recentItems = getAllFoodItems().slice(0, 5);
    ```

- `saveFoodItems(items: FoodItem[]): void`

  - **引数**: `items` - 保存する食材データの配列（`FoodItem[]`型）
  - **戻り値**: なし（`void`）
  - **説明**: `FoodItem` の配列を受け取り、ローカルストレージにJSON形式で保存します。既存のデータは上書きされます。
  - **使用例**:

    ```typescript
    // 単一の食材データを保存
    saveFoodItems([{ id: '123', name: 'りんご', expiryDate: '2023-12-31' }]);

    // 複数の食材データを保存
    const foodItems = [
      { id: '001', name: 'バナナ', expiryDate: '2023-04-10' },
      { id: '002', name: 'キャベツ', expiryDate: '2023-04-15' },
      { id: '003', name: '牛乳', expiryDate: '2023-04-05' },
    ];
    saveFoodItems(foodItems);

    // 既存のデータを取得して更新する
    const currentItems = getAllFoodItems();
    const updatedItems = currentItems.map((item) => {
      if (item.id === '001') {
        return { ...item, expiryDate: '2023-04-20' }; // 期限を更新
      }
      return item;
    });
    saveFoodItems(updatedItems);
    ```

- `addFoodItem(item: Omit<FoodItem, 'id'>): FoodItem`

  - **引数**: `item` - ID以外の食材データ（`name`と`expiryDate`を含む）
  - **戻り値**: 追加された食材データ（自動生成されたIDを含む`FoodItem`型）
  - **説明**: IDを含まない食材データを受け取り、`crypto.randomUUID()`で一意のIDを付与し、ローカルストレージに追加します。追加された完全な`FoodItem`オブジェクトを返します。
  - **使用例**:

    ```typescript
    // 新しい食材を追加
    const newApple = addFoodItem({
      name: 'りんご',
      expiryDate: '2023-04-30',
    });
    console.log(`追加した食材のID: ${newApple.id}`);

    // 追加と同時に変数に保存して利用
    const newBanana = addFoodItem({
      name: 'バナナ',
      expiryDate: formatDateToISOString(getDateAfterDays(7)),
    });
    console.log(
      `${newBanana.name}の賞味期限: ${formatDateToJapanese(newBanana.expiryDate)}`
    );
    ```

- `deleteFoodItem(id: string): void`

  - **引数**: `id` - 削除する食材のID（文字列型）
  - **戻り値**: なし（`void`）
  - **説明**: 指定したIDの食材データをローカルストレージから削除します。
  - **使用例**:

    ```typescript
    // 特定IDの食材を削除
    deleteFoodItem('123');

    // 期限切れの食材をすべて削除する例
    const items = getAllFoodItems();
    const expiredItems = items.filter(
      (item) => getDaysUntilExpiry(item.expiryDate) < 0
    );
    expiredItems.forEach((item) => deleteFoodItem(item.id));
    ```

## types.ts

アプリケーション全体で使用される型定義を提供します。

- `FoodItem` インターフェース

  - **説明**: 食材データを表現する型定義です。アプリケーション全体で食材データの構造を統一するために使用されます。
  - **プロパティ**:
    - `id: string`: 食材の一意な識別子。ローカルストレージでの管理や操作に使用されます。
    - `name: string`: 食材の名前。ユーザーに表示される食材の名称です。
    - `expiryDate: string`: 賞味期限。YYYY-MM-DD形式の文字列で表されます。
  - **使用例**:

    ```typescript
    // FoodItem型の変数宣言
    const apple: FoodItem = {
      id: crypto.randomUUID(),
      name: 'りんご',
      expiryDate: '2023-04-30',
    };

    // FoodItemの配列
    const foodItems: FoodItem[] = [
      { id: '001', name: 'バナナ', expiryDate: '2023-04-10' },
      { id: '002', name: 'キャベツ', expiryDate: '2023-04-15' },
    ];

    // IDを除いたFoodItem型（新規追加用）
    const newFood: Omit<FoodItem, 'id'> = {
      name: '牛乳',
      expiryDate: '2023-04-05',
    };
    ```

## utils.ts

汎用的なユーティリティ関数を提供します。

- `cn(...inputs: ClassValue[]): string`

  - **引数**: `inputs` - 結合するクラス名の値（可変長引数、各要素は文字列、オブジェクト、配列など）
  - **戻り値**: 最適化された単一のクラス名文字列
  - **説明**: 内部で`clsx`と`tailwind-merge`ライブラリを使用して、複数のクラス名をマージし、Tailwind CSSのクラス名の衝突を解決して最適化します。条件付きでクラスを適用したい場合や、状態に応じてスタイルを切り替えたい場合に特に有用です。
  - **使用例**:

    ```tsx
    // 基本的な使用法
    <div className={cn('text-lg', 'font-bold')}>
      太字の大きなテキスト
    </div>
    // 結果: <div className="text-lg font-bold">太字の大きなテキスト</div>

    // 条件付きクラスの適用
    <button
      className={cn(
        'px-4 py-2 rounded', // 常に適用されるベースクラス
        isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800', // 状態によって変わるクラス
        isDisabled && 'opacity-50 cursor-not-allowed' // 無効時のみ適用
      )}
      disabled={isDisabled}
    >
      送信
    </button>

    // オブジェクト構文の使用例
    <div className={cn({
      'text-red-500': hasError,
      'text-green-500': isSuccess,
      'text-yellow-500': isWarning,
      'font-bold': isImportant
    })}>
      状態に応じて色が変わるテキスト
    </div>

    // クラスの衝突解決（後のクラスが優先）
    <div className={cn('text-red-500', 'text-blue-500')}>
      青色のテキスト（赤は上書きされる）
    </div>
    // 結果: <div className="text-blue-500">青色のテキスト</div>
    ```
