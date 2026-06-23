/**
 * @file HTTP 请求客户端配置
 * @description 基于 axios 创建统一的 API 请求实例，自动注入 Bearer Token 鉴权头。
 *              所有业务接口调用均通过此实例发出，baseURL 统一为 /api 前缀。
 */

import axios from 'axios';
import { message } from 'antd';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T> {
  code: number;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export class ApiError extends Error {
  code?: number;

  constructor(messageText: string, code?: number) {
    super(messageText);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * 全局 HTTP 客户端实例
 * - baseURL: '/api' — 所有请求自动附加此前缀
 * - timeout: 15 秒 — 超时后自动取消请求
 */
export const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
});

/** 请求拦截器：从 localStorage 取出登录令牌，自动附加到 Authorization 头 */
http.interceptors.request.use((config) => {
  // 从本地存储读取持久化的登录令牌
  const token = localStorage.getItem('rag_token');
  if (token) {
    // 令牌存在时，以 Bearer 方式注入到请求头
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'code' in payload && payload.code !== 200) {
      throw new ApiError(payload.message || '请求失败', payload.code);
    }
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || '网络请求失败';
    return Promise.reject(new ApiError(errorMessage, error.response?.status));
  },
);

export function unwrapData<T>(response: { data: ApiResponse<T> }) {
  return response.data.data;
}

export function unwrapPage<T>(response: { data: PaginatedApiResponse<T> }) {
  return response.data;
}

export function reportApiError(error: unknown, fallback = '请求失败') {
  const text = error instanceof Error ? error.message : fallback;
  message.error(text || fallback);
  return text || fallback;
}
