/**
 * テストユーティリティ関数
 * @description テストで繰り返し使用されるセットアップ処理や共通操作をまとめたモジュールです。
 */
import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest'; // vi をインポートしてモック関数を作成できるようにする
import { FoodForm, type FoodFormProps } from '@/components/FoodForm'; // FoodForm と Props の型をインポート

// date-fns のロケール
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * @interface RenderFoodFormResult - renderFoodForm ヘルパーの戻り値の型定義。
 * @property {ReturnType<typeof userEvent.setup>} user - ユーザー操作のための userEvent インスタンス。
 * @property {RenderResult['rerender']} rerender - テスト用の再レンダリング関数。
 * @property {RenderResult['getByRole']} getByRole - getByRoleクエリ関数。
 */
interface RenderFoodFormResult {
  user: ReturnType<typeof userEvent.setup>;
  rerender: RenderResult['rerender'];
  getByRole: RenderResult['getByRole'];
}

/**
 * FoodForm コンポーネントをテスト用にレンダリングし、
 * userEvent インスタンスと rerender, getByRole を返します。
 *
 * @param {Partial<FoodFormProps>} [props] - FoodForm に渡すプロパティ (部分的に指定可能)。
 *                                           指定されなかったプロパティはデフォルト値で補完されます。
 * @returns {RenderFoodFormResult} userEvent インスタンスと rerender, getByRole を含むオブジェクト。
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

  const { rerender, getByRole } = render(<FoodForm {...mergedProps} />);
  return {
    user,
    rerender,
    getByRole,
  };
};

/**
 * Shadcn‑Calendar が採用している
 *   aria-label="EEEE, MMMM do, yyyy"   形式を生成するヘルパー
 *
 * 将来フォーマットが変わった場合は ここ 1 か所を直すだけで
 * すべてのテストが追随できる。
 */
export const calcShadcnAriaLabel = (date: Date, locale = enUS): string =>
  format(date, 'EEEE, MMMM do, yyyy', { locale });