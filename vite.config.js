import path from "path";
import { defineConfig } from "vite";
import packageJson from "./package.json";
import { externalizeDeps } from "vite-plugin-externalize-deps";

const getPackageName = () => {
  return packageJson.name;
};

const getPackageNameCamelCase = () => {
  try {
    return getPackageName().replace(/-./g, (char) => char[1].toUpperCase());
  } catch (err) {
    throw new Error("Name property in package.json is missing.");
  }
};

const fileName = {
  es: `use-zod.mjs`,
  cjs: `use-zod.cjs`,
  umd: `use-zod.js`,
};

module.exports = defineConfig({
  plugins: [
    externalizeDeps({
      deps: true,
      devDeps: false,
      except: [],
      nodeBuiltins: true,
      optionalDeps: true,
      peerDeps: true,
      useFile: path.join(process.cwd(), "package.json"),
    }),
  ],
  test: {
    globals: true,
  },
  base: "./",
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: getPackageNameCamelCase(),
      formats: ["es", "cjs", "umd"],
      fileName: (format) => fileName[format],
    },
  },
});
