import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";

import {
	cleanupLogics,
	defineLogic,
	onUnmount,
	type LogicInstance,
} from "@sigrea/core";

import { useLogic } from "../useLogic";
import { flushEffects } from "./testUtils";

describe("useLogic", () => {
	afterEach(() => {
		cleanupLogics();
	});

	it("throws when invoked without an active component instance", () => {
		const logic = defineLogic<void>()(() => ({}));

		expect(() => useLogic(logic)).toThrow(
			"useLogic can only be used within a Vue component setup().",
		);
	});

	it("mounts logic and disposes it alongside the component", async () => {
		const cleanups = vi.fn();
		const logic = defineLogic<number>()((value) => {
			onUnmount(() => cleanups(value));
			return { value };
		});

		const observed: Array<LogicInstance<{ value: number }>> = [];

		const wrapper = mount(
			defineComponent(() => {
				const instance = useLogic(logic, 1);
				observed.push(instance);
				return () => null;
			}),
		);

		expect(observed).toHaveLength(1);
		expect(observed[0].value).toBe(1);

		await wrapper.unmount();
		await flushEffects();

		expect(cleanups).toHaveBeenCalledTimes(1);
		expect(cleanups).toHaveBeenCalledWith(1);
	});
});
