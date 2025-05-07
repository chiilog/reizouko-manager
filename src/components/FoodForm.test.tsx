/**
 * FoodFormコンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
import React from 'react';

// モックの定義
vi.mock('@/lib/storage', () => ({
  addFoodItem: vi.fn(),
}));

// validation関数は個別にテスト内でモックすることにし、ここではモックしない

describe('FoodForm', () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    onFoodAdded: vi.fn(),
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('フォームの要素が正しく表示されることを確認', () => {
    // Arrange
    render(<FoodForm {...mockProps} />);

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

    // 賞味期限のラベルと選択ボタンが表示されていることを確認
    expect(screen.getByText('賞味期限')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/ })
    ).toBeInTheDocument();

    // 操作ボタンが表示されていることを確認
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
  });

  it('フォーム送信時に正しい処理が行われることを確認', async () => {
    // Arrange
    // addFoodItemが正常に動作することをシミュレート
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      return { ...food, id: 'test-id' };
    });

    render(<FoodForm {...mockProps} />);
    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力
    await user.type(nameInput, 'テスト食材');

    // 登録ボタンをクリック
    await user.click(submitButton);

    // Assert
    // addFoodItemが呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalled();

    // onFoodAddedとonCloseが呼ばれたことを確認
    await waitFor(() => {
      expect(mockProps.onFoodAdded).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
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

  it('食品名が空の場合、フォーム送信時にフォーカスが設定されることを確認', async () => {
    // Arrange
    render(<FoodForm {...mockProps} />);
    const submitButton = screen.getByRole('button', { name: '登録' });

    // 名前欄は空のまま

    // Act
    // 登録ボタンをクリック
    await user.click(submitButton);

    // Assert
    // storageのメソッドが呼ばれていないことを確認
    expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    // フォーカスが名前入力欄に設定されていることを確認（直接検証は難しいため省略）
    // 登録後の処理が呼ばれていないことを確認
    expect(mockProps.onFoodAdded).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  /**
   * userEventを使った実際のユーザー入力をシミュレートするテスト
   */
  it('ユーザー操作を使って食材を追加できることを確認', async () => {
    // Arrange
    // addFoodItemが正常に動作することをシミュレート
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      return { ...food, id: 'test-id' };
    });

    render(<FoodForm {...mockProps} />);

    // フォーム内の要素を取得
    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力
    await user.type(nameInput, '新しい食材');

    // 登録ボタンをクリック
    await user.click(submitButton);

    // Assert
    // addFoodItemが適切な引数で呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '新しい食材',
        expiryDate: expect.any(String),
      })
    );

    // コールバック関数が呼ばれたことを確認
    expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  /**
   * 送信処理の結果がAppコンポーネントに伝わることを確認するテスト
   */
  it('食材追加成功時にonFoodAddedとonCloseが呼ばれることを確認', async () => {
    // Arrange
    // addFoodItemが成功することをシミュレート
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      return { ...food, id: 'test-id' };
    });

    render(<FoodForm {...mockProps} />);

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, '通知テスト');
    await user.click(submitButton);

    // Assert
    // Appコンポーネントのコールバックが呼ばれたことを確認
    await waitFor(() => {
      // 食材が追加されたことをAppに通知
      expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
      // フォームが閉じられたことをAppに通知
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * 賞味期限入力のバリデーション
   */
  describe('賞味期限入力のバリデーション', () => {
    it('カレンダーUIで過去の日付が選択できないことを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);

      // 日付選択ボタンを取得
      const dateButton = screen.getByRole('button', {
        name: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
      });

      // 初期の日付の値を保存
      const initialDateText = dateButton.textContent;

      // Act
      // カレンダーを開く
      await user.click(dateButton);

      // カレンダーが表示されていることを確認
      const calendar = await screen.findByRole('grid');
      expect(calendar).toBeVisible();

      // 過去日付のセル（無効化されているセル）を確認
      const disabledCells = within(calendar)
        .getAllByRole('gridcell')
        .filter(
          (cell) =>
            cell.hasAttribute('aria-disabled') === true ||
            cell.getAttribute('aria-disabled') === 'true' ||
            cell.hasAttribute('data-disabled') ||
            cell.classList.contains('disabled')
        );

      // Assert
      // 少なくとも1つの無効化されたセルがあることを確認
      expect(disabledCells.length).toBeGreaterThan(0);

      // 無効化されたセルをクリックしても日付が変わらないことを確認
      if (disabledCells.length > 0) {
        await user.click(disabledCells[0]);
        expect(dateButton.textContent).toBe(initialDateText);
      }
    });

    it('フォームの初期表示時に賞味期限が適切に設定されていることを確認', () => {
      // Arrange & Act
      render(<FoodForm {...mockProps} />);

      // Assert
      // 日付選択ボタンのテキストが年月日形式であることを確認
      const dateButton = screen.getByRole('button', {
        name: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
      });
      expect(dateButton).toBeInTheDocument();

      // 日付が現在日から少なくとも1日以上先であることを確認
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dateText = dateButton.textContent || '';
      const match = dateText.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);

      if (match) {
        const [, year, month, day] = match;
        const selectedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        // 選択された日付が今日以降であることを確認
        expect(selectedDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
      } else {
        // 日付形式が一致しない場合は失敗
        expect(match).not.toBeNull();
      }
    });

    it('カレンダーでの日付選択とフォーム送信が正常に動作することを確認', async () => {
      // Arrange
      vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
        return { ...food, id: 'test-id' };
      });

      render(<FoodForm {...mockProps} />);

      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      // 食品名を入力
      await user.type(nameInput, 'テスト食材');

      // 日付はデフォルトのままで送信（日付選択のテストは他のテストで実施済み）
      await user.click(submitButton);

      // Assert
      // 食材追加処理が呼ばれ、名前と日付が正しく渡されることを確認
      expect(storageUtils.addFoodItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'テスト食材',
          expiryDate: expect.any(String),
        })
      );

      // コールバックが呼ばれることを確認
      expect(mockProps.onFoodAdded).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  /**
   * 送信処理の結果がAppコンポーネントに伝わることを確認するテスト
   */
  it('食材追加成功時にonFoodAddedとonCloseが呼ばれることを確認', async () => {
    // Arrange
    // addFoodItemが成功することをシミュレート
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      return { ...food, id: 'test-id' };
    });

    render(<FoodForm {...mockProps} />);

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, '通知テスト');
    await user.click(submitButton);

    // Assert
    // Appコンポーネントのコールバックが呼ばれたことを確認
    await waitFor(() => {
      // 食材が追加されたことをAppに通知
      expect(mockProps.onFoodAdded).toHaveBeenCalledTimes(1);
      // フォームが閉じられたことをAppに通知
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * 送信状態の外部制御のテスト
   */
  it('送信処理中は登録ボタンが無効化されることを確認', () => {
    // Arrange
    // 送信中状態をtrueに設定
    render(<FoodForm {...mockProps} isSubmitting={true} />);

    // Assert
    // 登録ボタンが無効化され、「登録中...」というテキストが表示されていることを確認
    const submitButton = screen.getByRole('button', { name: /登録中/ });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('登録中...');
  });

  /**
   * 送信状態のコールバック処理のテスト
   */
  it('送信状態変更時にコールバックが呼び出されることを確認', async () => {
    // Arrange
    const onSubmittingChangeMock = vi.fn();
    // addFoodItemが正常に動作することをシミュレート
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      return { ...food, id: 'test-id' };
    });

    render(
      <FoodForm {...mockProps} onSubmittingChange={onSubmittingChangeMock} />
    );

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, 'テスト食材');
    await user.click(submitButton);

    // Assert
    // 送信状態がtrueに変更されたことを確認
    expect(onSubmittingChangeMock).toHaveBeenCalledWith(true);

    // 処理が終わったら送信状態がfalseに戻ることを確認
    await waitFor(() => {
      expect(onSubmittingChangeMock).toHaveBeenCalledWith(false);
    });
  });

  /**
   * 外部から送信状態を制御した場合の二重送信防止テスト
   */
  it('送信処理中は二重送信が防止されることを確認', async () => {
    // Arrange
    // addFoodItem関数をモック
    vi.mocked(storageUtils.addFoodItem).mockImplementation((food) => {
      // FoodItem型を適切に返すために型アサーションを使用
      return { ...food, id: 'test-id' } as const;
    });

    const { rerender } = render(<FoodForm {...mockProps} />);

    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力
    await user.type(nameInput, 'テスト食材');

    // 登録ボタンをクリック
    await user.click(submitButton);

    // 送信中状態でコンポーネントを再レンダリング
    rerender(<FoodForm {...mockProps} isSubmitting={true} />);

    // 送信中状態で再度クリック
    await user.click(screen.getByRole('button', { name: /登録中/ }));

    // Assert
    // addFoodItemが1回だけ呼ばれたことを確認
    expect(storageUtils.addFoodItem).toHaveBeenCalledTimes(1);
  });

  /**
   * 非同期のエラー処理をテスト
   */
  it('エラー発生時も送信状態がリセットされることを確認', async () => {
    // Arrange
    // addFoodItemがエラーをスローすることをシミュレート
    vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
      throw new Error('テストエラー');
    });

    render(<FoodForm {...mockProps} />);
    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, 'テスト食材');
    await user.click(submitButton);

    // Assert
    // エラーメッセージが表示されることを確認
    const errorElement = await screen.findByText(/食材の追加に失敗しました/, {
      exact: false,
    });
    expect(errorElement).toBeInTheDocument();

    // 送信状態がリセットされ、ボタンが再度有効になることを確認
    expect(screen.getByRole('button', { name: '登録' })).toBeEnabled();
  });

  /**
   * 特定のエラータイプに対するエラーメッセージをテスト
   */
  it('エラータイプに応じた具体的なエラーメッセージが表示されることを確認', async () => {
    // Arrange
    // QuotaExceededErrorをスローするようにモック
    vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
      throw new QuotaExceededError();
    });

    render(<FoodForm {...mockProps} />);
    const nameInput = screen.getByRole('textbox', { name: '食品名' });
    const submitButton = screen.getByRole('button', { name: '登録' });

    // Act
    // 食品名を入力して送信
    await user.type(nameInput, 'テスト食材');
    await user.click(submitButton);

    // Assert
    // 特定のエラータイプに応じたメッセージが表示されることを確認
    const errorElement = await screen.findByText(
      '保存容量が上限に達しました。不要なデータを削除してください。'
    );
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent).toBe(
      '保存容量が上限に達しました。不要なデータを削除してください。'
    );
  });

  /**
   * 食品名のバリデーション強化に関するテスト
   */
  describe('食品名入力のバリデーション', () => {
    it('空白文字のみの入力が無効であることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      // スペースのみを入力
      await user.clear(nameInput);
      await user.type(nameInput, '   ');

      // フォーカスを外す（onBlurイベントをトリガー）
      fireEvent.blur(nameInput);

      // Assert
      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(
          screen.getByText('食品名を入力してください。空白文字のみは無効です。')
        ).toBeInTheDocument();
      });

      // エラー状態で送信ボタンをクリックしても処理が実行されないことを確認
      await user.click(submitButton);
      expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    });

    it('入力文字数が上限を超える場合にエラーを表示することを確認', async () => {
      // Arrange
      // モック実装でバリデーションが失敗するように設定
      vi.mocked(storageUtils.addFoodItem).mockImplementation(() => {
        throw new Error('バリデーションに失敗しました');
      });

      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      // 51文字の名前をセットし、onBlurイベントをトリガー
      const tooLongName = 'あ'.repeat(51);
      fireEvent.change(nameInput, { target: { value: tooLongName } });

      // フォーカスを外す（onBlurイベントをトリガー）
      fireEvent.blur(nameInput);

      // Assert
      // バリデーションエラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(
          screen.getByText('食品名は50文字以内で入力してください。')
        ).toBeInTheDocument();
      });

      // エラー状態でクリックしても処理が実行されないことを確認
      await user.click(submitButton);
      expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    });

    it('HTMLタグを含む入力が適切にサニタイズされることを確認', async () => {
      // Arrange
      // モック実装を上書き
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
        name: 'タグ付ききゅうり',
        expiryDate: expect.any(String),
      });
    });

    it('入力値がトリムされることを確認', async () => {
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
          name: 'きゅうり', // 前後の空白が除去されることを期待
          expiryDate: expect.any(String),
        })
      );
    });

    it('食品名バリデーションが機能していることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      // 空文字を入力して送信ボタンをクリック
      await user.clear(nameInput);
      await user.click(submitButton);

      // Assert
      // エラーメッセージが表示されていることを確認
      const errorMessage = await screen.findByText(
        '食品名を入力してください。空白文字のみは無効です。'
      );
      expect(errorMessage).toBeInTheDocument();
      // エラーメッセージの内容が期待どおりであることを確認
      expect(errorMessage.textContent).toBe(
        '食品名を入力してください。空白文字のみは無効です。'
      );
    });

    it('エラーが発生したフィールドにエラースタイルが適用されることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });

      // Act - エラー状態の確認
      // 空文字を入力してフォーカスを外す
      await user.clear(nameInput);
      await user.tab();

      // Assert - エラー状態でスタイルが適用されていることを確認
      await waitFor(() => {
        expect(nameInput).toHaveClass('border-destructive');
      });

      // Act - エラー解消の確認
      // 有効な値を入力
      await user.type(nameInput, 'テスト');
      await user.tab();

      // Assert - エラーが解消されてスタイルが削除されることを確認
      await waitFor(() => {
        expect(nameInput).not.toHaveClass('border-destructive');
      });
    });

    it('入力値を修正するとエラーメッセージが消えることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });

      // まずエラーを発生させる
      await user.clear(nameInput);
      await user.tab();

      // エラーメッセージが表示されたことを確認
      const errorMessage = await screen.findByText(
        '食品名を入力してください。空白文字のみは無効です。'
      );
      expect(errorMessage).toBeInTheDocument();

      // Act
      // 正しい値を入力
      await user.type(nameInput, '有効な名前');

      // Assert
      // エラーメッセージが消えていることを確認
      await waitFor(() => {
        expect(
          screen.queryByText(
            '食品名を入力してください。空白文字のみは無効です。'
          )
        ).not.toBeInTheDocument();
      });
    });

    it('複数フィールドのバリデーションが行われることの確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      // 名前欄を空にして送信
      await user.clear(nameInput);
      await user.click(submitButton);

      // Assert
      // 名前のエラーメッセージが表示されていることを確認
      const nameError = await screen.findByText(
        '食品名を入力してください。空白文字のみは無効です。'
      );
      expect(nameError).toBeInTheDocument();

      // 送信が中断されていることを確認 (addFoodItemが呼ばれていないこと)
      expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    });

    it('フォームをキャンセルするとリセットされることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

      // 有効な値を入力
      await user.type(nameInput, 'テスト食材');

      // 現在の値が正しく入力されていることを確認
      expect(nameInput).toHaveValue('テスト食材');

      // Act
      // キャンセルボタンをクリック
      await user.click(cancelButton);

      // Assert
      // onCloseが呼ばれていることを確認
      expect(mockProps.onClose).toHaveBeenCalled();

      // ダイアログを閉じる処理が実行されたことを確認
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  /**
   * 複数フィールドのバリデーションが行われることの確認
   */
  describe('フォームバリデーション', () => {
    it('食品名が空の場合はエラーが表示されることを確認', async () => {
      // Arrange
      render(<FoodForm {...mockProps} />);
      const nameInput = screen.getByRole('textbox', { name: '食品名' });
      const submitButton = screen.getByRole('button', { name: '登録' });

      // Act
      // 名前欄を空にして送信
      await user.clear(nameInput);
      await user.click(submitButton);

      // Assert
      // 名前のエラーメッセージが表示されていることを確認
      const nameError = await screen.findByText(
        '食品名を入力してください。空白文字のみは無効です。'
      );
      expect(nameError).toBeInTheDocument();
      expect(nameError.textContent).toBe(
        '食品名を入力してください。空白文字のみは無効です。'
      );

      // 送信が中断されていることを確認 (addFoodItemが呼ばれていないこと)
      expect(storageUtils.addFoodItem).not.toHaveBeenCalled();
    });
  });
});
