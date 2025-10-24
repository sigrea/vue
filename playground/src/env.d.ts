/// <reference types="vite/client" />

declare module "*.vue" {
	import type { DefineComponent } from "vue";

	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
	export default component;
}

