import path from "node:path";
import vue from "@vitejs/plugin-vue";
// @ts-nocheck
import { defineConfig } from "vite";

const rootDir = __dirname;
const projectRoot = path.resolve(rootDir, "..");

export default defineConfig({
	root: rootDir,
	plugins: [vue()],
	server: {
		fs: {
			allow: [projectRoot],
		},
	},
	resolve: {
		alias: {
			"@sigrea/vue": path.resolve(projectRoot, "index.ts"),
		},
	},
	build: {
		outDir: path.resolve(rootDir, "dist"),
		emptyOutDir: true,
	},
});
