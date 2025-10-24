import { computed } from "vue";

import type { Signal } from "@sigrea/core";

import { useSignal } from "./useSignal";

function assertWritableSignal(source: Signal<unknown>): void {
	let prototype: object | null = source;
	let descriptor: PropertyDescriptor | undefined;

	while (prototype !== null) {
		descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
		if (descriptor !== undefined) {
			break;
		}
		prototype = Object.getPrototypeOf(prototype);
	}

	if (descriptor?.set === undefined) {
		throw new Error(
			"useMutableSignal requires a writable signal instance created by signal().",
		);
	}
}

export function useMutableSignal<T>(source: Signal<T>) {
	assertWritableSignal(source);

	const state = useSignal(source);

	return computed({
		get: () => state.value,
		set: (value: T) => {
			source.value = value;
		},
	});
}
