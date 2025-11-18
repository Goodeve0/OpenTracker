// src/env.d.ts（关键：扩展 ImportMeta 类型）
/// <reference types="vite/client" />

// 扩展 Vite 的 ImportMetaEnv 接口，声明自定义环境变量的类型（可选但推荐）
interface ImportMetaEnv {
  // 示例：你之前用到的 VITE_API_BASE_URL（根据实际需求修改）
  readonly VITE_API_BASE_URL: string
  // 可添加其他自定义环境变量（如 VITE_APP_TITLE 等）
  // readonly VITE_APP_TITLE: string;
}

// 让 TypeScript 识别 import.meta.env
interface ImportMeta {
  readonly env: ImportMetaEnv
}
