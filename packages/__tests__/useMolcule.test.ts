import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import {
	type MoleculeInstance,
	disposeTrackedMolecules,
	molecule,
	onUnmount,
} from "@sigrea/core";

import { useMolcule } from "../useMolcule";
import { flushEffects } from "./testUtils";

describe("useMolcule", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("throws when invoked without an active component instance", () => {
		const counterMolcule = molecule(() => ({}));

		expect(() => useMolcule(counterMolcule)).toThrow(
			"useMolcule can only be used within a Vue component setup().",
		);
	});

	it("mounts molecule and disposes it alongside the component", async () => {
		const cleanups = vi.fn();
		const counterMolcule = molecule((value: number) => {
			onUnmount(() => cleanups(value));
			return { value };
		});

		const observed: Array<MoleculeInstance<{ value: number }>> = [];

		const wrapper = mount(
			defineComponent(() => {
				const instance = useMolcule(counterMolcule, 1);
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
