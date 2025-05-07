/**
 * アプリケーション固有のエラークラス定義
 */

/**
 * ストレージ容量超過エラー
 */
export class QuotaExceededError extends Error {
  constructor(message = 'ストレージ容量が超過しました') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * ネットワークエラー
 */
export class NetworkError extends Error {
  constructor(message = 'ネットワーク接続に問題があります') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * データ検証エラー
 */
export class ValidationError extends Error {
  constructor(message = 'データの検証に失敗しました') {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * データ保存エラー
 */
export class StorageError extends Error {
  constructor(message = 'データの保存に失敗しました') {
    super(message);
    this.name = 'StorageError';
  }
} 