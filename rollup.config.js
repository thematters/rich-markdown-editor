import resolve from "@rollup/plugin-node-resolve";
import postcss from 'rollup-plugin-postcss';
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
// import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser";
// import peerDepsExternal from "rollup-plugin-peer-deps-external";

const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      /* {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      }, */
      {
        file: packageJson.main,
        format: 'umd',
        name: packageJson.name,
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      // peerDepsExternal(),
      resolve(),
      commonjs({
        include: 'node_modules/**',
      }),
      json(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
      postcss({
        plugins: []
      }),

    ],
    external: ["react", "react-dom", "styled-components"],
  },
  {
    input: `src/all.css`,
    output: [
      {
        file: `dist/all.min.css`,
        format: 'es',
      },
    ],
    plugins: [
      postcss({
        extract: true,
      }),
    ],
  },
];
