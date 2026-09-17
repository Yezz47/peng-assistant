import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // tmp/ 放的是本地截图与冒烟测试脚本，不属于应用源码
    ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts", "tmp/**"],
  },
];

export default eslintConfig;
