import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";

import { computed as createComputed, readonly, signal } from "@sigrea/core";

import { useSignal } from "../useSignal";
import { flushEffects } from "./testUtils";

describe("useSignal", () => {
	it("reflects updates from readable signals", async () => {
		const count = signal(0);
		const readable = readonly(count);

		const wrapper = mount(
			defineComponent(() => {
				const value = useSignal(readable);
				return () => h("span", value.value);
			}),
		);

		expect(wrapper.text()).toBe("0");

		count.value = 1;
		await flushEffects();

		expect(wrapper.text()).toBe("1");

		await wrapper.unmount();
	});

	it("reflects updates from computed sources", async () => {
		const count = signal(2);
		const doubled = createComputed(() => count.value * 2);

		const wrapper = mount(
			defineComponent(() => {
				const value = useSignal(doubled);
				return () => h("span", value.value);
			}),
		);

		expect(wrapper.text()).toBe("4");

		count.value = 3;
		await flushEffects();

		expect(wrapper.text()).toBe("6");

		await wrapper.unmount();
	});
});
