import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import type { ShallowRef } from "vue";

import { deepSignal } from "@sigrea/core";

import { useDeepSignal } from "../useDeepSignal";
import { flushEffects } from "./testUtils";

describe("useDeepSignal", () => {
	it("returns a mutable ref that preserves identity across updates", async () => {
		const state = deepSignal({ nested: { count: 0 } });
		let snapshotRef: ShallowRef<typeof state> | undefined;

		const wrapper = mount(
			defineComponent(() => {
				const snapshot = useDeepSignal(state);
				snapshotRef = snapshot;
				return () => h("span", snapshot.value.nested.count);
			}),
		);

		if (snapshotRef === undefined) {
			throw new Error("Failed to capture snapshot ref.");
		}

		const first = snapshotRef.value;

		expect(wrapper.text()).toBe("0");

		state.nested.count = 1;
		await flushEffects(2);

		expect(wrapper.text()).toBe("1");
		const second = snapshotRef.value;

		expect(second).toBe(state);
		expect(second).toBe(first);

		await wrapper.unmount();
	});
});
