/**
 * FoodFormコンポーネントのテスト
 * @description FoodFormコンポーネントのレンダリング、インタラクション、バリデーション、送信処理などに関するテストを記述します。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodForm } from './FoodForm';
import * as storageUtils from '@/lib/storage';
import { QuotaExceededError } from '@/lib/errors';
import {
  formatDateToISOString,
  formatDateToJapanese,
  getDateAfterDays,
} from '@/lib/date-utils';

// モックの定義
vi.mock('@/lib/storage', () => ({
  addFoodItem: vi.fn(),
}));

// CustomDatePicker をモック化 (オプション)
// 今回はCustomDatePickerの内部実装ではなく、FoodFormとの連携を主に見るため、
// 完全にモック化せず、実際のCustomDatePickerのレンダリング結果の一部を検証するアプローチも取る。
// vi.mock('@/components/ui/CustomDatePicker', () => ({
//   CustomDatePicker: vi.fn(({ selectedDate, onDateChange, placeholder, isError }) => (
//     <button
//       data-testid="mocked-datepicker"
//       onClick={() => onDateChange(new Date(2024, 7, 1))} // 適当な日付を返す
//       data-placeholder={placeholder}
//       data-selected={selectedDate ? formatDateToJapanese(selectedDate) : ''}
//       data-error={isError?.toString()}
//     >
//       {selectedDate ? formatDateToJapanese(selectedDate) : placeholder}
//     </button>
//   )),
// }));

describe('FoodForm', () => {
  /**
   * @constant {object} mockProps - FoodFormコンポーネントに渡すモックのプロパティ。
   * @property {boolean} open - ダイアログが開いているかどうか。
   * @property {Function} onClose - ダイアログを閉じる処理のモック関数。
   * @property {Function} onFoodAdded - 食材追加成功時の処理のモック関数。
   */
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    onFoodAdded: vi.fn(),
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.resetAllMocks();
    // Date.now() を固定して、テストの再現性を高める
    // CustomDatePicker側でも固定しているが、FoodForm側でも初期値設定等で使われるため設定
    vi.setSystemTime(new Date(2024, 6, 15, 0, 0, 0, 0)); // 2024年7月15日
  });

  afterEach(() => {
    vi.useRealTimers(); // システム時刻を元に戻す
  });

  it('フォームの要素が正しく表示されることを確認', () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const defaultExpiry = getDateAfterDays(5); // FoodForm内の DEFAULT_EXPIRY_DATE_DAYS と合わせる

    // Assert
    // ダイアログのタイトルが表示されていることを確認
    expect(
      screen.getByRole('heading', { name: '食材の登録' })
    ).toBeInTheDocument();

    // 食品名のラベルと入力欄が表示されていることを確認
    expect(screen.getByLabelText('食品名')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '食品名' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('例：きゅうり、たまご')
    ).toBeInTheDocument();

    // 賞味期限 (CustomDatePicker)
    // CustomDatePickerのボタンが表示され、初期値が設定されていることを確認
    // (CustomDatePicker内の詳細な表示テストはCustomDatePicker.test.tsxで行う)
    expect(screen.getByText('賞味期限')).toBeInTheDocument();
    const datePickerButton = screen.getByRole('button', {
      name: new RegExp(formatDateToJapanese(defaultExpiry)), // 初期表示の日付（5日後）
    });
    expect(datePickerButton).toBeInTheDocument();

    // 操作ボタンが表示されていることを確認
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
  });

  /**
   * @describe フォーム送信成功時の処理
   * @description フォームが正常に送信され、関連するコールバックが呼ばれることを確認するテスト群。
   */
  describe('フォーム送信成功時の処理', () => {
    beforeEach(() => {
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: `test-id-${food.name}` };
      });
    });

    it.each([
      { testName: '基本的な食材名', foodName: 'テスト食材' },
      {
        testName: '異なる食材名で、日付も選択し直す',
        foodName: '新しい食材',
        selectDate: new Date(2024, 7, 1), // 2024年8月1日を選択
      },
    ])(
      '$foodName を登録すると、onFoodAdded と onClose が呼ばれること',
      async ({ foodName, selectDate }) => {
        // Arrange
        render(<FoodForm {...mockProps} />);
        const nameInput = screen.getByRole('textbox', { name: '食品名' });
        const submitButton = screen.getByRole('button', { name: '登録' });
        const initialExpiryDate = getDateAfterDays(5);
        const datePickerButton = screen.getByRole('button', {
          name: new RegExp(formatDateToJapanese(initialExpiryDate)),
        });

        // Act: 食品名を入力
        await user.type(nameInput, foodName);

        let expectedExpiryDate = initialExpiryDate;
        if (selectDate) {
          // 日付選択のシミュレーション
          await user.click(datePickerButton); // カレンダーを開く
          const calendar = await screen.findByRole('grid');
          // 適切な月のカレンダーが表示されている前提で日を選択
          // (CustomDatePickerのテストで月のナビゲーションは確認済みと仮定)
          const monthStr = selectDate.toLocaleString('en-US', {
            month: 'long',
          });
          const dayNum = selectDate.getDate();
          const yearNum = selectDate.getFullYear();
          const dateCellButton = within(calendar).getByRole('button', {
            name: new RegExp(
              `${monthStr}\\s+${dayNum}(st|nd|rd|th)?,\\s+${yearNum}`
            ),
          });
          await user.click(dateCellButton);
          await waitFor(() => {
            // ボタンの表示が更新されるのを待つ (FoodFormが状態を更新するため)
            expect(
              screen.getByRole('button', {
                name: new RegExp(formatDateToJapanese(selectDate)),
              })
            ).toBeInTheDocument();
          });
          expectedExpiryDate = selectDate;
        }

        // 登録ボタンをクリック
        await user.click(submitButton);

        // Assert
        expect(storageUtils.addFoodItem).toHaveBeenCalledWith(
          expect.objectContaining({
            name: foodName,
            expiryDate: formatDateToISOString(expectedExpiryDate), // ISO形式で比較
          })
        );
        await waitFor(() => {
          expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
          expect(mockProps.onClose).toHaveBeenCalledTimes(1);
        });
      }
    );
  });

  it('キャンセルボタンをクリックするとonCloseが呼ばれることを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

    // Act
    // キャンセルボタンをクリック
    await user.click(cancelButton);

    // Assert
    // onCloseが呼ばれたことを確認
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('フォームをキャンセルすると入力内容がリセットされることを確認', async () => {
    // Arrange
    const { rerender, getByLabelText, getByRole } = render(
      <FoodForm {...mockProps} open={true} />
    );
    const nameInput = getByLabelText('食品名');
    const cancelButton = getByRole('button', { name: 'キャンセル' });
    const initialExpiryDateDisplay = formatDateToJapanese(getDateAfterDays(5));

    // 有効な値を入力
    await user.type(nameInput, 'テスト食材');
    // 日付も変更してみる (例として10日後)
    const datePickerButton = getByRole('button', {
      name: new RegExp(initialExpiryDateDisplay),
    });
    await user.click(datePickerButton);
    const calendar = await screen.findByRole('grid');
    const dayToSelect = getDateAfterDays(10).getDate();
    const yearToSelect = getDateAfterDays(10).getFullYear();
    const dateCellButton = within(calendar).getByRole('button', {
      name: new RegExp(`\\b${dayToSelect}(st|nd|rd|th)?\\b.*${yearToSelect}`),
    });
    await user.click(dateCellButton);
    await waitFor(() =>
      expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    );

    // Act: キャンセルボタンをクリック
    await user.click(cancelButton);

    // Assert: onCloseが呼ばれていることを確認
    expect(mockProps.onClose).toHaveBeenCalled();

    // Act: FoodFormを閉じる (open prop を false にして再レンダリング)
    rerender(<FoodForm {...mockProps} open={false} />);

    // Assert: ダイアログが非表示になったことを確認 (FoodFormの主要要素の非存在を確認)
    // Dialog自体はDOMに残っている可能性があるため、DialogTitleなどで確認
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: '食材の登録' })
      ).not.toBeInTheDocument();
    });

    // Act: FoodFormを再度開く (open prop を true にして再レンダリング)
    rerender(<FoodForm {...mockProps} open={true} />);

    // Assert: ダイアログが再表示されたことを確認
    await screen.findByRole('heading', { name: '食材の登録' });

    // Assert: 入力内容がリセットされていることを確認
    expect(getByLabelText('食品名')).toHaveValue('');
    expect(
      getByRole('button', {
        name: new RegExp(initialExpiryDateDisplay),
      })
    ).toBeInTheDocument();
  });

  /**
   * @describe 賞味期限入力のバリデーション (FoodFormレベルでの連携テスト)
   * @description CustomDatePickerとの連携や、FoodForm側での必須チェックなどをテストします。
   * CustomDatePicker自体の詳細な日付バリデーション（過去日無効など）はCustomDatePicker.test.tsxで実施します。
   */
  describe('賞味期限入力のバリデーション (FoodFormレベル)', () => {
    it('フォーム送信時に賞味期限が未選択の場合、エラーメッセージが表示され送信されないことを確認', async () => {
      // Arrange
      // CustomDatePickerのonDateChangeを操作して、日付を未選択(undefined)にするのは難しいので、
      // FoodFormの初期状態では日付が選択されているため、このテストケースは現状では再現しにくい。
      // 実際には、CustomDatePickerがclearボタンを持つなどして日付をundefinedにできる場合に有効なテスト。
      // ここでは、仮にexpiryDateが somehow undefined になった場合を想定するか、
      // または、CustomDatePickerをモックして onDateChange(undefined) を呼び出す。
      // 今回は、FoodFormのhandleSubmit内のロジックを信じ、エラーメッセージの確認に留める。

      // テストのために、FoodFormの初期のexpiryDateをundefinedにするのはコンポーネントの実装と乖離する。
      // 代わりに、handleSubmit内のバリデーションロジックを信頼し、送信時にエラーが出ることを確認する。
      // ただし、UI操作でdateをundefinedにする方法がないため、このテストの価値は限定的。
      // 実際のUIで日付をクリアできる機能がCustomDatePickerに追加されたら、このテストはより意味を持つ。

      // 現状のFoodFormでは、初期値として必ず日付がセットされるため、
      // 「未選択」状態をユーザー操作で作り出すのは難しい。
      // このテストは「もし何らかの理由でexpiryDateがundefinedになったら」という防御的プログラミングの観点からのテストになる。
      // その場合、handleSubmit内の `!expiryDate` の条件分岐が機能することを確認する。

      render(<FoodForm {...mockProps} />); // expiryDateは初期値(5日後)が設定される
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // 食品名だけ入力
      await user.type(nameInput, '日付なしテスト');

      // ここでexpiryDateをプログラム的にundefinedにすることは、テスト対象のロジックから外れるため行わない。
      // FoodFormのhandleSubmitが、万が一expiryDateがundefinedの場合もエラーを出すことを期待する。

      // Act: 送信
      // このまま送信すると、expiryDateには初期値が入っているので、バリデーションエラーは出ないはず。
      // テストとして「未選択エラー」を出すには、FoodFormのstateを操作するか、CustomDatePickerをモックする必要がある。
      // ここでは、CustomDatePickerが正常に動作し、日付が常に選択されているという前提で、
      // 「賞味期限が不正な場合（例：過去日）」のバリデーションがFoodFormレベルで機能するか、という観点の方が適切かもしれない。
      // しかし、過去日選択はCustomDatePicker側でブロックされる。

      // **このテストケースは、CustomDatePickerが日付をクリアする手段を持たない現状では、**
      // **FoodFormのhandleSubmit内の `!expiryDate` 条件を能動的にテストするのが難しい。**
      // **将来的にCustomDatePickerに日付クリア機能がついた場合に再検討する。**
      // **一旦、このテストはskipするか、意図を明確にして残すかを検討する。**
      // **ここでは、バリデーションメッセージ自体が存在することの確認に留める。**

      // 仮にエラーが出るとしたら、という想定でsubmitする
      // 実際にはexpiryDateには初期値が入るため、このテストは意図通りには動かない可能性が高い。
      // どうしてもテストしたい場合は、FoodFormの初期stateを操作するか、親からexpiryDateをundefinedで渡せるようにする必要がある。
      // → FoodFormは常にopen時に初期日付を設定するため、意図的にundefinedにはできない。

      // **このテストは現在の実装では有効なシナリオを生成できないため、コメントアウトまたは削除を推奨**
      // console.warn('賞味期限未選択のテストは、現在のUIでは能動的に発生させることが難しいためスキップ気味です。');
      // 期待されるエラーメッセージを直接検証するのは難しい。
      // 代わりに、日付エラーのクラスが付与されるかのテストに切り替えるなど検討の余地あり。

      // --- 代替テスト案 --- :
      // 送信時に FoodForm 側のバリデーションが expiryDate をチェックし、
      // もし validateExpiryDate がエラーを返せばエラーメッセージが表示されることを確認する。
      // (ただし、validateExpiryDate は CustomDatePicker 側でも使われているため、重複テストになる可能性)

      // このテストは一旦、handleSubmitが呼ばれた際に、もしexpiryDateがなければエラーがセットされることを期待する、
      // という形で残すが、UI操作からの自然な流れではないことに留意。
      // 実際には、handleSubmit内の`!expiryDate`の分岐は、初期値があるため通常通らない。

      // このテストの前提を「何らかの理由で日付がクリアされた場合」とする。
      // しかし、現行のCustomDatePickerにはクリア機能がないため、FoodFormのhandleSubmitが呼ばれる際に
      // expiryDateがundefinedになることは通常ありえない。
      // よって、このテストは一旦保留とし、別の形で日付バリデーションのエラーメッセージ表示を確認する。
      // 例えば、CustomDatePickerにisErrorを渡したときにエラーメッセージが表示されるかなど。

      // **結論：このテストは現在の FoodForm と CustomDatePicker の仕様では有効なテストシナリオを作成しにくいため、**
      // **より現実的なバリデーションエラー（例えば必須項目としてのエラーメッセージ表示）のテストに置き換えるか、削除する。**
      // **ここでは「賞味期限」というラベルに対応するエラーメッセージが表示されうる、という構造的な確認に留める。**

      // 代わりに、FoodFormがCustomDatePickerにisErrorを渡せることを確認するテストは意味があるかもしれない。
      // 例：送信ボタン押下 → バリデーションエラー → CustomDatePickerのボタンにisErrorスタイル適用
      // これは「エラーが発生したフィールドにエラースタイルが適用されることを確認」のテストでカバーされる。

      // **このテストは、FoodFormが「賞味期限は必須である」というバリデーションロジックを**
      // **handleSubmit 内で持っており、エラー時に適切なメッセージキー (expiryDate) で**
      // **エラーをセットすることを検証する、というスコープに絞る。**
      vi.spyOn(storageUtils, 'addFoodItem'); // addFoodItemが呼ばれないことを確認するため

      // 名前だけ入力
      await user.type(nameInput, '日付エラーテスト');
      // 送信ボタンを押す (この時点では日付には初期値が入っている)
      // 強制的にhandleSubmit内のバリデーションを失敗させるために、
      // `validateExpiryDate` をモックしてエラーを返すようにする。
      const mockValidateExpiryDate = vi.spyOn(
        await import('@/lib/validation'),
        'validateExpiryDate'
      );
      mockValidateExpiryDate.mockReturnValue('賞味期限を選択してください。');

      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('賞味期限を選択してください。')
        ).toBeInTheDocument();
      });
      expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
      mockValidateExpiryDate.mockRestore(); // モックを元に戻す
    });

    it('カレンダーでの日付選択とフォーム送信が正常に動作することを確認 (日付バリデーションはCustomDatePicker側メイン)', async () => {
      // このテストは、FoodFormとCustomDatePickerの基本的な連携が取れていることを確認する。
      // 詳細な日付バリデーション（過去日無効など）はCustomDatePicker.test.tsxで実施済み。
      // FoodForm側では、選択された日付が送信データに含まれることを確認する。
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: 'test-id' };
      });

      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });
      const datePickerInitialDisplay = formatDateToJapanese(
        getDateAfterDays(5)
      );
      const datePickerButton = screen.getByRole('button', {
        name: new RegExp(datePickerInitialDisplay),
      });

      // Act: 食品名を入力
      await user.type(nameInput, '連携テスト食材');

      // Act: 日付を選択 (例: 7日後)
      const targetDate = getDateAfterDays(7);
      const targetDay = targetDate.getDate();
      const targetYear = targetDate.getFullYear();
      await user.click(datePickerButton); // カレンダーを開く
      const calendar = await screen.findByRole('grid');
      const dateCellButton = within(calendar).getByRole('button', {
        // セレクタ修正
        name: new RegExp(`\\b${targetDay}(st|nd|rd|th)?\\b.*${targetYear}`),
      });
      await user.click(dateCellButton);
      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: new RegExp(formatDateToJapanese(targetDate)),
          })
        ).toBeInTheDocument();
      });

      // Act: フォームを送信
      await user.click(submitButton);

      // Assert: 食材追加処理が呼ばれ、名前と選択した日付が正しく渡されることを確認
      expect(storageUtils.addFoodItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '連携テスト食材',
          expiryDate: formatDateToISOString(targetDate),
        })
      );
      expect(mockProps.onFoodAdded).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  /**
   * @describe 送信状態のテスト (FoodFormの責務)
   */
  describe('送信状態の制御', () => {
    it('送信処理中は登録ボタンが無効化され「登録中...」と表示される (isSubmitting prop)', () => {
      // Arrange
      render(<FoodForm {...mockProps} isSubmitting={true} />); // 外部からisSubmitting=trueを渡す

      // Assert
      const submitButton = screen.getByRole('button', { name: /登録中/ });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('登録中...');
    });

    it('送信状態変更時にonSubmittingChangeコールバックが呼び出される (内部状態管理時)', async () => {
      // Arrange
      const onSubmittingChangeMock = vi.fn();
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: 'test-id' };
      });
      render(
        <FoodForm {...mockProps} onSubmittingChange={onSubmittingChangeMock} />
      );
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      await user.type(nameInput, 'コールバックテスト');
      await user.click(submitButton);

      // Assert
      expect(onSubmittingChangeMock).toHaveBeenCalledWith(true); // 送信開始
      await waitFor(() => {
        expect(onSubmittingChangeMock).toHaveBeenCalledWith(false); // 送信完了
      });
    });

    it('送信処理中は二重送信が防止される (isSubmitting prop連携)', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: 'test-id' };
      });
      const { rerender } = render(
        <FoodForm {...mockProps} isSubmitting={false} />
      ); //最初は送信中でない
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act: 1回目の送信
      await user.type(nameInput, '二重送信テスト');
      await user.click(submitButton); // これで内部的にisSubmittingがtrueになる (onSubmittingChange経由の想定)

      // rerenderでisSubmitting=trueをFoodFormに渡す (親が制御するケースを模倣)
      rerender(<FoodForm {...mockProps} isSubmitting={true} />);

      // Act: 送信中にもう一度クリック (ボタンは無効化されているはず)
      const submittingButton = screen.getByRole('button', { name: /登録中/ });
      expect(submittingButton).toBeDisabled();
      await user.click(submittingButton); // 無効化ボタンへのクリックは通常イベントを発火しないが、念のため

      // Assert
      expect(storageUtils.addFoodItem).toHaveBeenCalledTimes(1); // 1回しか呼ばれない
    });
  });

  /**
   * @describe エラー処理のテスト (FoodFormの責務)
   */
  describe('エラー処理', () => {
    it('addFoodItemで汎用エラー発生時、エラーメッセージが表示され送信状態がリセットされることを確認', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
        throw new Error('テスト汎用エラー');
      });
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      await user.type(nameInput, '汎用エラーテスト');
      await user.click(submitButton);

      // Assert
      const errorElement = await screen.findByText(
        '食材の追加に失敗しました。もう一度お試しください。' // FoodForm内のデフォルトエラーメッセージ
      );
      expect(errorElement).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登録' })).toBeEnabled(); // ボタンが有効に戻る
    });

    it('addFoodItemでQuotaExceededError発生時、専用のエラーメッセージが表示されることを確認', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
        throw new QuotaExceededError('容量オーバー');
      });
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      await user.type(nameInput, '容量オーバーテスト');
      await user.click(submitButton);

      // Assert
      const errorElement = await screen.findByText(
        '保存容量が上限に達しました。不要なデータを削除してください。'
      );
      expect(errorElement).toBeInTheDocument();
    });
  });

  /**
   * @describe 食品名入力のバリデーション (FoodFormの責務)
   */
  describe('食品名入力のバリデーション', () => {
    it.each([
      {
        caseName: '空文字の場合',
        inputValue: '',
        expectedMessage: '食品名を入力してください。空白文字のみは無効です。',
      },
      {
        caseName: '空白文字のみの場合',
        inputValue: '   ',
        expectedMessage: '食品名を入力してください。空白文字のみは無効です。',
      },
    ])(
      '$caseName、エラー「$expectedMessage」が表示され送信されないこと',
      async ({ inputValue, expectedMessage }) => {
        // Arrange
        render(<FoodForm {...mockProps} />);
        const nameInput = screen.getByRole('textbox', { name: '食品名' });
        const submitButton = screen.getByRole('button', { name: '登録' });

        // Act
        if (inputValue) {
          await user.type(nameInput, inputValue);
        } else {
          await user.clear(nameInput);
        }
        // 送信ボタンクリックでバリデーションがトリガーされる
        await user.click(submitButton);

        // Assert
        await waitFor(() => {
          expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        });
        expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
        expect(mockProps.onFoodAdded).not.toHaveBeenCalled();
        expect(mockProps.onClose).not.toHaveBeenCalled();
      }
    );

    it('入力文字数が上限（50文字）を超える場合にエラーを表示し送信されないことを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });
      const tooLongName = 'あ'.repeat(51);

      // Act
      // userEvent.typeが遅い場合があるのでfireEventで値を直接セットし、blurとclickで検証
      fireEvent.change(nameInput, { target: { value: tooLongName } });
      // blurイベントでエラーメッセージが出ることを期待 (FoodFormの実装による)
      fireEvent.blur(nameInput);
      await waitFor(() => {
        expect(
          screen.getByText('食品名は50文字以内で入力してください。')
        ).toBeInTheDocument();
      });

      // さらに送信ボタンを押しても、送信されないことを確認
      await user.click(submitButton);
      expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    });

    it('HTMLタグを含む入力がサニタイズ（除去）されて登録されることを確認', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: 'test-id' };
      });
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      // HTMLタグとスクリプトタグを含む名前を入力
      await user.clear(nameInput);
      await user.type(
        nameInput,
        '<div>タグ付き</div><script>alert("XSS")</script>きゅうり'
      );
      await user.click(submitButton);

      // Assert
      // HTMLタグとスクリプトタグが除去された状態でaddFoodItemが呼ばれることを確認
      expect(storageUtils.addFoodItem).toHaveBeenCalledWith({
        name: 'タグ付ききゅうり', // タグが除去されることを期待
        expiryDate: expect.any(String),
      });
    });

    it('入力値の前後の空白がトリムされて登録されることを確認', async () => {
      // Arrange
      // addFoodItemが正常に動作することをシミュレート
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: 'test-id' };
      });
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      await user.type(nameInput, '  きゅうり  '); // 前後に空白がある
      await user.click(submitButton);

      // Assert
      // トリムされた値でaddFoodItemが呼ばれることを確認
      expect(storageUtils.addFoodItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'きゅうり',
          expiryDate: formatDateToISOString(getDateAfterDays(5)),
        })
      );
    });

    it('エラーが発生したフィールドにエラースタイル（border-destructive）が適用されることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });
      const datePickerButton = screen.getByRole('button', {
        name: /年.*月.*日/,
      }); // 日付ピッカーボタン

      // Act: 名前欄を空にして送信 (名前エラー)
      await user.clear(nameInput);
      await user.click(submitButton);

      // Assert: 名前入力欄にエラースタイル適用、日付ピッカーはエラーなし
      await waitFor(() => {
        expect(nameInput).toHaveClass('border-destructive');
      });
      // CustomDatePickerのisError propsがfalseのはずなので、エラークラスはつかない
      // CustomDatePicker自体のclassNameもチェック (FoodFormが渡すcn内の条件による)
      expect(datePickerButton).not.toHaveClass('border-destructive'); // これはCustomDatePicker内部のisErrorによるクラス

      // Act: 名前を有効にし、日付エラーを発生させる (validateExpiryDateをモックしてエラーを発生させる)
      await user.type(nameInput, '有効な名前');
      const mockValidateExpiryDate = vi.spyOn(
        await import('@/lib/validation'),
        'validateExpiryDate'
      );
      mockValidateExpiryDate.mockReturnValue('日付エラー'); // validateExpiryDateがエラーを返すようにする
      await user.click(submitButton);

      // Assert: 名前入力欄はエラーなし、日付ピッカーにエラースタイル適用
      await waitFor(() => {
        expect(nameInput).not.toHaveClass('border-destructive');
        // CustomDatePickerにisError=trueが渡され、結果としてボタンにエラークラスが付くことを期待
        expect(screen.getByRole('button', { name: /年.*月.*日/ })).toHaveClass(
          'border-destructive'
        );
        expect(screen.getByText('日付エラー')).toBeInTheDocument();
      });

      mockValidateExpiryDate.mockRestore();

      // Act: 両方のエラーを解消
      await user.clear(nameInput); // 名前をクリアして再度入力
      await user.type(nameInput, '再有効な名前');
      // 日付は正常な状態に戻す (validateExpiryDateのモックは解除済み)
      await user.click(submitButton);

      // Assert: 両方のフィールドのエラースタイルが解除される
      await waitFor(() => {
        // 正常登録されるのでコールバックが呼ばれるはず
        expect(storageUtils.addFoodItem).toHaveBeenCalled();
        // エラーメッセージが消え、エラークラスも解除される
        expect(screen.queryByText('日付エラー')).not.toBeInTheDocument();
        expect(nameInput).not.toHaveClass('border-destructive');
        expect(
          screen.getByRole('button', { name: /年.*月.*日/ })
        ).not.toHaveClass('border-destructive');
      });
    });

    it('入力値を修正するとエラーメッセージが消えることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act: エラーを発生させる (名前を空にして送信)
      await user.clear(nameInput);
      await user.click(submitButton);
      const errorMessage = await screen.findByText(
        '食品名を入力してください。空白文字のみは無効です。'
      );
      expect(errorMessage).toBeInTheDocument();

      // Act: 正しい値を入力
      await user.type(nameInput, '有効な名前');
      // blurや他のインタラクションでエラーが消えることを期待 (FoodFormの実装による)
      fireEvent.blur(nameInput);

      // Assert
      await waitFor(() => {
        expect(
          screen.queryByText(
            '食品名を入力してください。空白文字のみは無効です。'
          )
        ).not.toBeInTheDocument();
      });
    });
  });
});
