import type { DeepSignal } from "@sigrea/core";
import { createDeepSignalHandler } from "@sigrea/core";

import { useSnapshot } from "./useSnapshot";

export function useDeepSignal<T extends object>(source: DeepSignal<T>) {
	const handler = createDeepSignalHandler(source);
	return useSnapshot(handler, { mode: "mutable" });
}
