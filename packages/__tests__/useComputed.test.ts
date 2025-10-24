import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";

import { computed as createComputed, signal } from "@sigrea/core";

import { useComputed } from "../useComputed";
import { flushEffects } from "./testUtils";

describe("useComputed", () => {
	it("recomputes when dependencies change", async () => {
		const base = signal(2);
		const doubled = createComputed(() => base.value * 2);

		const wrapper = mount(
			defineComponent(() => {
				const value = useComputed(doubled);
				return () => h("span", value.value);
			}),
		);

		expect(wrapper.text()).toBe("4");

		base.value = 4;
		await flushEffects();

		expect(wrapper.text()).toBe("8");

		base.value = 4;
		await flushEffects();

		expect(wrapper.text()).toBe("8");

		await wrapper.unmount();
	});
});
