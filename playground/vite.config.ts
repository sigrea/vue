import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";

const rootDir = import.meta.dirname;
const projectRoot = path.resolve(rootDir, "..");

export default defineConfig({
	test: {
		// Vitest v4 compatibility: preserve mock call history.
		// Remove after tests no longer rely on calls from setup or earlier tests.
		// https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
		// https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
		clearMocks: false,
	},
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
