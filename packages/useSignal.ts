import type { ReadonlySignal, Signal } from "@sigrea/core";
import { createSignalHandler } from "@sigrea/core";

import { useSnapshot } from "./useSnapshot";

type ReadableSignal<T> = Signal<T> | ReadonlySignal<T>;

export function useSignal<T>(source: ReadableSignal<T>) {
	const handler = createSignalHandler(source as Signal<T>);
	return useSnapshot(handler);
}
