import {
	getCurrentInstance,
	onScopeDispose,
	readonly,
	shallowRef,
	triggerRef,
} from "vue";
import type { DeepReadonly, ShallowRef } from "vue";

import type { SnapshotHandler } from "@sigrea/core";

export interface UseSnapshotOptions {
	mode?: "readonly" | "mutable";
}

export function useSnapshot<T>(
	handler: SnapshotHandler<T>,
): DeepReadonly<ShallowRef<T>>;
export function useSnapshot<T>(
	handler: SnapshotHandler<T>,
	options: UseSnapshotOptions & { mode: "mutable" },
): ShallowRef<T>;
export function useSnapshot<T>(
	handler: SnapshotHandler<T>,
	options?: UseSnapshotOptions,
) {
	if (getCurrentInstance() === null) {
		throw new Error(
			"useSnapshot can only be used within a Vue component setup().",
		);
	}

	const state = shallowRef(handler.getSnapshot().value) as ShallowRef<T>;
	const update = () => {
		const next = handler.getSnapshot().value;
		if (!Object.is(next, state.value)) {
			state.value = next;
			return;
		}

		triggerRef(state);
	};

	const unsubscribe = handler.subscribe(update);

	onScopeDispose(() => {
		unsubscribe();
	});

	if (options?.mode === "mutable") {
		return state;
	}

	return readonly(state);
}
