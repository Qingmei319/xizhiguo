/**
 * @file 认证模块 Mock 数据
 * @description 提供登录场景的模拟数据，包括：
 *   - mockToken：模拟 JWT Token，用于 Authorization 头部鉴权
 *   - defaultUser：默认用户信息对象，登录成功后写入 store 和 localStorage
 *   - mockLoginForm：登录表单默认填充值（用户名、密码、记住登录）
 */
import type { UserInfo } from '@/types/auth';

/** 模拟 JWT Token —— 所有 Mock API 请求的 Authorization 头使用此值 */
export const mockToken = 'mock-jwt-token';

/** Mock 验证码内容 */
export const mockCaptchaCode = '0000';

/** Mock 验证码 ID */
export const mockCaptchaId = 'mock-captcha-id';

/** Mock 验证码图片 */
export const mockCaptchaImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
    <rect width="120" height="40" rx="6" fill="#12324a" />
    <text x="50%" y="50%" fill="#ffffff" font-size="18" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle">${mockCaptchaCode}</text>
  </svg>`,
)}`;

/** 默认用户信息 —— 登录成功后作为当前用户写入 store */
export const defaultUser: UserInfo = {
  id: 'u001',             // 用户唯一标识
  name: '张农业',          // 用户姓名
  role: 'researcher',     // 用户角色：研究员
  roleName: '研究员',      // 角色显示名
  organization: '华南农业大学', // 所属机构
  avatar: '',             // 头像 URL（空则使用默认头像）
};

/** 登录表单 Mock 数据 —— 用于自动填充登录表单的测试数据 */
export const mockLoginForm = {
  username: defaultUser.name,  // 默认用户名
  password: '123456',          // 默认密码（仅 Mock，非真实验证）
  remember: true,              // 是否记住登录状态
};
