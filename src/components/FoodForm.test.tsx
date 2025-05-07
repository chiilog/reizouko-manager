/**
 * FoodFormコンポーネントのテスト
 * @description FoodFormコンポーネントのレンダリング、インタラクション、バリデーション、送信処理などに関するテストを記述します。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { FoodForm } from './FoodForm';
import * as storageUtils from '@/lib/storage';
import { QuotaExceededError } from '@/lib/errors';
import {
  formatDateToISOString,
  formatDateToJapanese,
  getDateAfterDays,
} from '@/lib/date-utils';
import * as validationUtils from '@/lib/validation';
import { renderFoodForm, calcShadcnAriaLabel } from '@/lib/test-utils';

// モックの定義
vi.mock('@/lib/storage', () => ({
  addFoodItem: vi.fn(),
}));

describe('FoodForm', () => {
  // FoodFormコンポーネントの基本プロパティ
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    onFoodAdded: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // テストの再現性を高めるためにシステム日時を固定
    vi.setSystemTime(new Date(2024, 6, 15, 0, 0, 0, 0)); // 2024年7月15日
  });

  afterEach(() => {
    vi.useRealTimers(); // システム時刻を元に戻す
  });

  it('フォームの要素が正しく表示されることを確認', () => {
    // Arrange
    const { getByRole } = renderFoodForm(mockProps); // ヘルパー関数でレンダリング

    // Assert
    // ダイアログのタイトルが表示されていることを確認
    expect(getByRole('heading', { name: '食材の登録' })).toBeInTheDocument();

    // 食品名のラベルと入力欄が表示されていることを確認
    expect(screen.getByLabelText('食品名')).toBeInTheDocument();
    expect(getByRole('textbox', { name: '食品名' })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('例：きゅうり、たまご')
    ).toBeInTheDocument();

    // 賞味期限 (CustomDatePicker)
    expect(screen.getByText('賞味期限')).toBeInTheDocument();
    const datePickerButton = getByRole('button', {
      name: formatDateToJapanese(getDateAfterDays(5)),
    });
    expect(datePickerButton).toBeInTheDocument();

    // 操作ボタンが表示されていることを確認
    expect(getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    expect(getByRole('button', { name: '登録' })).toBeInTheDocument();
  });

  // フォームが正常に送信され、コールバックが呼ばれることを確認するテスト
  describe('フォーム送信成功時の処理', () => {
    beforeEach(() => {
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        // FoodFormはサニタイズとトリムを行うので、それを考慮した上でモックを設定
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
        const { user, getByRole } = renderFoodForm(mockProps);
        const nameInput = getByRole('textbox', { name: '食品名' });
        const submitButton = getByRole('button', { name: '登録' });
        const initialExpiryDate = getDateAfterDays(5);
        const datePickerButton = getByRole('button', {
          name: formatDateToJapanese(initialExpiryDate),
        });

        // Act: 食品名を入力
        await user.type(nameInput, foodName);

        let expectedExpiryDate = initialExpiryDate;
        if (selectDate) {
          // 日付選択のシミュレーション
          await user.click(datePickerButton);
          const calendar = await screen.findByRole('grid');
          const dateCellButton = within(calendar).getByRole('button', {
            name: calcShadcnAriaLabel(selectDate),
          });
          await user.click(dateCellButton);
          await waitFor(() => {
            expect(
              getByRole('button', {
                name: formatDateToJapanese(selectDate),
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

    it('HTMLタグや前後の空白を含む食品名が、サニタイズ・トリムされて登録されること', async () => {
      // Arrange
      const { user, getByRole } = renderFoodForm(mockProps);
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });
      const initialExpiryDate = getDateAfterDays(5); // FoodForm のデフォルト日付

      // Act
      await user.type(
        nameInput,
        '  <p>テスト食材</p><script>alert("XSS")</script>  '
      );
      await user.click(submitButton);

      // Assert
      expect(storageUtils.addFoodItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'テスト食材', // サニタイズ＆トリムされた結果を期待
          expiryDate: formatDateToISOString(initialExpiryDate), // 日付も正しく渡される
        })
      );
      // 成功コールバックも呼ばれるはず
      await waitFor(() => {
        expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  it('キャンセルボタンをクリックするとonCloseが呼ばれることを確認', async () => {
    // Arrange
    const { user, getByRole } = renderFoodForm(mockProps);
    const cancelButton = getByRole('button', { name: 'キャンセル' });

    // Act
    await user.click(cancelButton);

    // Assert
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('フォームをキャンセルすると入力内容がリセットされることを確認', async () => {
    // Arrange
    const { user, rerender, getByRole } = renderFoodForm({
      ...mockProps,
      open: true,
    });
    const currentRerender = rerender;

    const nameInput = screen.getByLabelText('食品名');
    const cancelButton = getByRole('button', { name: 'キャンセル' });
    const initialExpiryDateDisplay = formatDateToJapanese(getDateAfterDays(5));

    // 有効な値を入力
    await user.type(nameInput, 'テスト食材');

    // Act: キャンセルボタンをクリック
    await user.click(cancelButton);

    // Assert: onCloseが呼ばれていることを確認
    expect(mockProps.onClose).toHaveBeenCalled();

    // Act: FoodFormを閉じる (open prop を false にして再レンダリング)
    currentRerender(<FoodForm {...mockProps} open={false} />);

    // Assert: ダイアログが非表示になったことを確認
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: '食材の登録' })
      ).not.toBeInTheDocument();
    });

    // Act: FoodFormを再度開く (open prop を true にして再レンダリング)
    currentRerender(<FoodForm {...mockProps} open={true} />);

    // Assert: ダイアログが再表示されたことを確認
    await screen.findByRole('heading', { name: '食材の登録' });

    // Assert: 入力内容がリセットされていることを確認
    expect(screen.getByLabelText('食品名')).toHaveValue('');
    expect(
      getByRole('button', {
        name: initialExpiryDateDisplay,
      })
    ).toBeInTheDocument();
  });

  // CustomDatePickerとの連携や、FoodForm側での日付関連のバリデーションをテスト
  describe('賞味期限入力のバリデーション (FoodFormレベル)', () => {
    it('カレンダーでの日付選択とフォーム送信が正常に動作することを確認', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: 'test-id' };
      });

      const { user, getByRole } = renderFoodForm(mockProps);
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });
      const datePickerInitialDisplay = formatDateToJapanese(
        getDateAfterDays(5)
      );
      const datePickerButton = getByRole('button', {
        name: datePickerInitialDisplay,
      });

      // Act: 食品名を入力
      await user.type(nameInput, '連携テスト食材');

      // Act: 日付を選択 (例: 7日後)
      const targetDate = getDateAfterDays(7);
      await user.click(datePickerButton); // カレンダーを開く
      const calendar = await screen.findByRole('grid');
      const dateCellButtonForSubmitTest = within(calendar).getByRole('button', {
        name: calcShadcnAriaLabel(targetDate),
      });
      await user.click(dateCellButtonForSubmitTest);
      await waitFor(() => {
        expect(
          getByRole('button', {
            name: formatDateToJapanese(targetDate),
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

  // 送信中の状態管理に関するテスト
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
      const { user, getByRole } = renderFoodForm({
        ...mockProps,
        onSubmittingChange: onSubmittingChangeMock,
      });
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });

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
      const { user, rerender, getByRole } = renderFoodForm({
        ...mockProps,
        isSubmitting: false,
      });
      const currentRerender = rerender;

      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });

      // Act: 1回目の送信
      await user.type(nameInput, '二重送信テスト');
      await user.click(submitButton);

      // rerenderでisSubmitting=trueをFoodFormに渡す (親が制御するケースを模倣)
      currentRerender(<FoodForm {...mockProps} isSubmitting={true} />);

      // Act: 送信中にもう一度クリック (ボタンは無効化されているはず)
      const submittingButton = getByRole('button', { name: /登録中/ });
      expect(submittingButton).toBeDisabled();
      await user.click(submittingButton);

      // Assert
      expect(storageUtils.addFoodItem).toHaveBeenCalledTimes(1); // 1回しか呼ばれない
    });
  });

  // エラー処理のテスト
  describe('エラー処理', () => {
    it('addFoodItemで汎用エラー発生時、エラーメッセージが表示され送信状態がリセットされることを確認', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
        throw new Error('テスト汎用エラー');
      });
      const { user, getByRole } = renderFoodForm(mockProps);
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });

      // Act
      await user.type(nameInput, '汎用エラーテスト');
      await user.click(submitButton);

      // Assert
      const errorElement = await screen.findByText(
        '食材の追加に失敗しました。もう一度お試しください。'
      );
      expect(errorElement).toBeInTheDocument();
      expect(getByRole('button', { name: '登録' })).toBeEnabled(); // ボタンが有効に戻る
    });

    it('addFoodItemでQuotaExceededError発生時、専用のエラーメッセージが表示されることを確認', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
        throw new QuotaExceededError('容量オーバー');
      });
      const { user, getByRole } = renderFoodForm(mockProps);
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });

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

  // 食品名入力のバリデーションテスト
  describe('食品名入力のバリデーション', () => {
    it.each([
      {
        caseName: '空文字の場合',
        inputValue: '',
        expectedMessage: '食品名を入力してください。空白文字のみは無効です。',
      },
      {
        caseName: '空白文字のみの場合',
        inputValue: '   ', // FoodForm側でtrimされる前の状態をテスト
        expectedMessage: '食品名を入力してください。空白文字のみは無効です。',
      },
    ])(
      '$caseName、エラー「$expectedMessage」が表示され送信されないこと',
      async ({ inputValue, expectedMessage }) => {
        // Arrange
        const { user, getByRole } = renderFoodForm(mockProps);
        const nameInput = getByRole('textbox', { name: '食品名' });
        const submitButton = getByRole('button', { name: '登録' });

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
      }
    );

    it('エラーが発生した食品名入力フィールドにエラースタイルが適用されること', async () => {
      // Arrange
      const { user, getByRole } = renderFoodForm(mockProps);
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });

      // Act: 名前欄を空にして送信 (名前エラー)
      await user.clear(nameInput);
      await user.click(submitButton);

      // Assert: 名前入力欄にエラースタイル適用
      await waitFor(() => {
        expect(nameInput).toHaveClass('border-destructive');
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('エラーが発生した賞味期限フィールドにエラースタイルが適用されること', async () => {
      // Arrange
      const { user, getByRole } = renderFoodForm(mockProps);
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });
      // 日付バリデーションエラーを模倣
      const mockValidateExpiryDate = vi
        .spyOn(validationUtils, 'validateExpiryDate')
        .mockReturnValue('日付エラーのためテストでエラー');

      // Act: 名前は有効にし、日付エラーを発生させる
      await user.type(nameInput, '有効な名前');
      await user.click(submitButton);

      // Assert: 日付ピッカーにエラースタイル適用
      await waitFor(() => {
        const datePickerButton = getByRole('button', {
          name: '2024年7月20日',
        });
        expect(datePickerButton).toHaveClass('border-destructive');
        expect(
          screen.getByText('日付エラーのためテストでエラー')
        ).toBeInTheDocument();
      });
      mockValidateExpiryDate.mockRestore();
    });

    it('入力値を修正するとエラーメッセージが消えることを確認（食品名）', async () => {
      // Arrange
      const { user, getByRole } = renderFoodForm(mockProps);
      const nameInput = getByRole('textbox', { name: '食品名' });
      const submitButton = getByRole('button', { name: '登録' });

      // Act: エラーを発生させる (名前を空にして送信)
      await user.clear(nameInput);
      await user.click(submitButton);
      const errorMessage = await screen.findByText(
        '食品名を入力してください。空白文字のみは無効です。'
      );
      expect(errorMessage).toBeInTheDocument();

      // Act: 正しい値を入力
      await user.type(nameInput, '有効な名前');

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

  // フォームフィールドのエラースタイル適用
  describe('フォームフィールドのエラースタイル適用', () => {
    let mockValidateExpiryDate: unknown = null;

    afterEach(() => {
      // 各テストケース後にモックを確実にリストア
      if (mockValidateExpiryDate) {
        // 型アサーションを使用して安全に操作
        (mockValidateExpiryDate as { mockRestore: () => void }).mockRestore();
        mockValidateExpiryDate = null;
      }
    });

    it.each([
      {
        caseName: '食品名が空の場合、食品名入力欄にエラースタイルが適用される',
        fieldIdentifier: { role: 'textbox' as const, name: '食品名' },
        actionToTriggerError: async (
          user: ReturnType<
            typeof import('@testing-library/user-event').default.setup
          >
        ) => {
          const nameInput = screen.getByRole('textbox', { name: '食品名' });
          const submitButton = screen.getByRole('button', { name: '登録' });
          await user.clear(nameInput);
          await user.click(submitButton);
        },
      },
      {
        caseName:
          '賞味期限が無効な場合、日付ピッカーボタンにエラースタイルが適用される',
        fieldIdentifier: { role: 'button' as const, name: '2024年7月20日' },
        actionToTriggerError: async (
          user: ReturnType<
            typeof import('@testing-library/user-event').default.setup
          >
        ) => {
          const nameInput = screen.getByRole('textbox', { name: '食品名' });
          const submitButton = screen.getByRole('button', { name: '登録' });
          mockValidateExpiryDate = vi
            .spyOn(validationUtils, 'validateExpiryDate')
            .mockReturnValue('テスト用日付エラー');
          await user.type(nameInput, '有効な名前');
          await user.click(submitButton);
        },
        expectedErrorMessage: 'テスト用日付エラー',
        skipAriaInvalidCheck: true, // 日付ピッカーの場合はaria-invalid属性のチェックをスキップ
      },
    ])(
      '$caseName',
      async ({
        fieldIdentifier,
        actionToTriggerError,
        expectedErrorMessage,
        skipAriaInvalidCheck = false,
      }) => {
        // Arrange
        const { user, getByRole } = renderFoodForm(mockProps);
        vi.spyOn(storageUtils, 'addFoodItem'); // addFoodItemが呼ばれないことを確認するためスパイを設定

        // Act
        await actionToTriggerError(user);

        // Assert
        const fieldElement = getByRole(fieldIdentifier.role, {
          name: fieldIdentifier.name,
        });
        await waitFor(() => {
          expect(fieldElement).toHaveClass('border-destructive');
          if (!skipAriaInvalidCheck) {
            expect(fieldElement).toHaveAttribute('aria-invalid', 'true');
          }
          if (expectedErrorMessage) {
            expect(screen.getByText(expectedErrorMessage)).toBeInTheDocument();
          }
        });
        // 賞味期限エラーの場合のみ addFoodItem が呼ばれないことを確認
        if (fieldIdentifier.name === '2024年7月20日') {
          expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
        }
      }
    );
  });
});
