import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import {
	type MoleculeInstance,
	disposeTrackedMolecules,
	molecule,
	onUnmount,
	signal,
} from "@sigrea/core";

import { useMolecule } from "../useMolecule";
import { flushEffects } from "./testUtils";

describe("useMolecule", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("throws when invoked without an active component instance", () => {
		const counterMolecule = molecule(() => ({}));

		expect(() => useMolecule(counterMolecule)).toThrow(
			"useMolecule can only be used within a Vue component setup().",
		);
	});

	it("mounts molecule and disposes it alongside the component", async () => {
		const cleanups = vi.fn();
		const counterMolecule = molecule((props: { value: number }) => {
			onUnmount(() => cleanups(props.value));
			return { value: props.value };
		});

		const observed: Array<MoleculeInstance<{ value: number }>> = [];

		const wrapper = mount(
			defineComponent(() => {
				const instance = useMolecule(counterMolecule, { value: 1 });
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

	it("passes a snapshot of props and does not react to prop updates", async () => {
		const counterMolecule = molecule((props: { value: number }) => {
			const count = signal(props.value);

			const reset = () => {
				count.value = props.value;
			};

			return { count, reset };
		});

		let instance:
			| MoleculeInstance<{ count: { value: number }; reset: () => void }>
			| undefined;

		const wrapper = mount(
			defineComponent({
				props: {
					value: { type: Number, required: true },
				},
				setup(props) {
					instance = useMolecule(counterMolecule, props as { value: number });
					return () => null;
				},
			}),
			{
				props: {
					value: 1,
				},
			},
		);

		await flushEffects();

		if (instance === undefined) {
			throw new Error("Failed to capture molecule instance.");
		}

		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(1);

		await wrapper.setProps({ value: 2 });
		await flushEffects();

		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(1);

		await wrapper.unmount();
	});
});
