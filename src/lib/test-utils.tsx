/**
 * テストユーティリティ関数
 * @description テストで繰り返し使用されるセットアップ処理や共通操作をまとめたモジュールです。
 */
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest'; // vi をインポートしてモック関数を作成できるようにする
import { FoodForm, type FoodFormProps } from '@/components/FoodForm'; // FoodForm と Props の型をインポート

/**
 * @interface RenderFoodFormResult - renderFoodForm ヘルパーの戻り値の型定義。
 * @property {ReturnType<typeof userEvent.setup>} user - ユーザー操作のための userEvent インスタンス。
 * @property {RenderResult['rerender']} rerender - テスト用の再レンダリング関数。
 * @property {RenderResult['getByRole']} getByRole - getByRoleクエリ関数。
 * @property {RenderResult['getByLabelText']} getByLabelText - getByLabelTextクエリ関数。
 */
interface RenderFoodFormResult {
  user: ReturnType<typeof userEvent.setup>;
  rerender: RenderResult['rerender'];
  getByRole: RenderResult['getByRole'];
  getByLabelText: RenderResult['getByLabelText'];
}

/**
 * FoodForm コンポーネントをテスト用にレンダリングし、
 * userEvent インスタンスと rerender, getByRole, getByLabelText を返します。
 *
 * @param {Partial<FoodFormProps>} [props] - FoodForm に渡すプロパティ (部分的に指定可能)。
 *                                           指定されなかったプロパティはデフォルト値で補完されます。
 * @returns {RenderFoodFormResult} userEvent インスタンスと rerender, getByRole, getByLabelText を含むオブジェクト。
 */
export const renderFoodForm = (
  props?: Partial<FoodFormProps>
): RenderFoodFormResult => {
  const user = userEvent.setup();
  const defaultProps: FoodFormProps = {
    open: true,
    onClose: vi.fn(),
    onFoodAdded: vi.fn(),
    // isSubmitting: false, // 必要ならデフォルト値を設定
    // onSubmittingChange: vi.fn(), // 必要ならデフォルト値を設定
    // ...その他の FoodForm が取りうる props のデフォルト値
  };

  const mergedProps = { ...defaultProps, ...props };

  const { rerender, getByRole, getByLabelText } = render(<FoodForm {...mergedProps} />);
  return {
    user,
    rerender,
    getByRole,
    getByLabelText,
  };
};

// 他にも共通化できるテストユーティリティがあればここに追加していく
// 例: selectCalendarDate, fillAndSubmitFoodForm など 