import type { Computed } from "@sigrea/core";
import { createComputedHandler } from "@sigrea/core";

import { useSnapshot } from "./useSnapshot";

export function useComputed<T>(source: Computed<T>) {
	const handler = createComputedHandler(source);
	return useSnapshot(handler);
}
