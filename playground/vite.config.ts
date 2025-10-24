// @ts-nocheck
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";

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

