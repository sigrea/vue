import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import type { Signal } from "@sigrea/core";
import { readonly, signal } from "@sigrea/core";

import { useMutableSignal } from "../useMutableSignal";
import { flushEffects } from "./testUtils";

describe("useMutableSignal", () => {
	it("reflects the signal value and reacts to external updates", async () => {
		const state = signal(false);

		const wrapper = mount(
			defineComponent({
				template: '<input type="checkbox" v-model="model" />',
				setup() {
					const model = useMutableSignal(state);
					return { model };
				},
			}),
		);

		const input = wrapper.get("input").element as HTMLInputElement;
		expect(input.checked).toBe(false);

		state.value = true;
		await flushEffects();

		expect(input.checked).toBe(true);

		await wrapper.unmount();
	});

	it("writes back through the computed setter", async () => {
		const state = signal(false);

		const wrapper = mount(
			defineComponent({
				template: '<input type="checkbox" v-model="model" />',
				setup() {
					const model = useMutableSignal(state);
					return { model };
				},
			}),
		);

		const checkbox = wrapper.get("input");
		await checkbox.setValue(true);
		await flushEffects();

		expect(state.value).toBe(true);

		await checkbox.setValue(false);
		await flushEffects();

		expect(state.value).toBe(false);

		await wrapper.unmount();
	});

	it("throws when the source is readonly", () => {
		const state = readonly(signal(false));
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		expect(() =>
			mount(
				defineComponent(() => {
					useMutableSignal(state as unknown as Signal<boolean>);
					return () => null;
				}),
			),
		).toThrowError(
			"useMutableSignal requires a writable signal instance created by signal().",
		);

		warn.mockRestore();
	});
});
