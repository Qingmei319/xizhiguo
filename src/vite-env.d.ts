/**
 * @file Vite 环境类型声明
 * @description 为 Vite 构建、React Three Fiber 3D 库和 Less 样式文件提供 TypeScript 类型支持。
 *              确保导入 .less 文件和 @react-three/fiber 资源时不报类型错误。
 */

/// <reference types="vite/client" />
/// <reference types="@react-three/fiber" />

/** 声明 .less 模块，使 TypeScript 能识别样式文件导入 */
declare module '*.less';
