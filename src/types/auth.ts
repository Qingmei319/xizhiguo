/**
 * @file 认证与用户相关类型定义
 * @description 定义用户角色枚举和用户信息接口，用于登录鉴权和用户信息展示。
 */

/** 用户角色枚举：管理员、专家、研究员、农户 */
export type UserRole = 'admin' | 'expert' | 'researcher' | 'farmer';

/** 用户信息接口，包含身份、角色、所属组织和头像等基本信息 */
export interface UserInfo {
  /** 用户唯一标识 */
  id: string;
  /** 用户姓名 */
  name: string;
  /** 用户角色类型 */
  role: UserRole;
  /** 角色中文名称（如"研究员"） */
  roleName: string;
  /** 所属机构/组织 */
  organization: string;
  /** 用户头像 URL */
  avatar: string;
}
