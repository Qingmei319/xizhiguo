import { http, unwrapData, type ApiResponse } from '@/services/http';
import { defaultUser, mockCaptchaCode, mockCaptchaId, mockCaptchaImage, mockToken } from '@/services/mock/auth.mock';
import type { UserInfo, UserRole } from '@/types/auth';

interface CaptchaResponse {
  captcha_id: string;
  captcha_image: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  captcha_id: string;
  captcha_code: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  nickname?: string;
  role?: 'admin' | 'user' | 'guest';
}

export interface BackendUserInfo {
  id: number;
  username: string;
  nickname: string | null;
  role: 'admin' | 'user' | 'guest' | string;
  is_active: boolean;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_info: BackendUserInfo;
}

function mapRole(role: BackendUserInfo['role']): UserRole {
  if (role === 'admin') return 'admin';
  if (role === 'guest') return 'farmer';
  return 'researcher';
}

export function mapUserInfo(user: BackendUserInfo): UserInfo {
  const role = mapRole(user.role);
  const roleNameMap: Record<UserRole, string> = {
    admin: '管理员',
    expert: '农业专家',
    researcher: '研究员',
    farmer: '用户',
  };

  return {
    id: String(user.id),
    name: user.nickname || user.username,
    role,
    roleName: roleNameMap[role],
    organization: 'Yago Intellect',
    avatar: '',
  };
}

export async function getCaptcha() {
  if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
    return {
      captcha_id: mockCaptchaId,
      captcha_image: mockCaptchaImage,
    };
  }
  return unwrapData(await http.get<ApiResponse<CaptchaResponse>>('/auth/captcha'));
}

export async function loginApi(payload: LoginPayload) {
  if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
    if (payload.captcha_code !== mockCaptchaCode) {
      throw new Error('验证码错误');
    }
    return {
      token: mockToken,
      expiresIn: 7 * 24 * 60 * 60,
      user: defaultUser,
    };
  }
  const data = unwrapData(await http.post<ApiResponse<TokenResponse>>('/auth/login', payload));
  return {
    token: data.access_token,
    expiresIn: data.expires_in,
    user: mapUserInfo(data.user_info),
  };
}

export async function getCurrentUser() {
  if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
    return defaultUser;
  }
  return mapUserInfo(unwrapData(await http.get<ApiResponse<BackendUserInfo>>('/auth/me')));
}

export async function createUserApi(payload: CreateUserPayload) {
  return unwrapData(await http.post<ApiResponse<unknown>>('/auth/users', payload));
}
