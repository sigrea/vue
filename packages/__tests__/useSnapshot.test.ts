import type { SnapshotHandler } from "@sigrea/core";
import { createSignalHandler, signal } from "@sigrea/core";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import { useSnapshot } from "../useSnapshot";
import { flushEffects } from "./testUtils";

describe("useSnapshot", () => {
	it("subscribes to the handler and updates state", async () => {
		const count = signal(0);
		const handler = createSignalHandler(count);

		const wrapper = mount(
			defineComponent(() => {
				const state = useSnapshot(handler);
				return () => h("span", state.value);
			}),
		);

		expect(wrapper.text()).toBe("0");

		count.value = 1;
		await flushEffects();

		expect(wrapper.text()).toBe("1");

		await wrapper.unmount();
	});

	it("unsubscribes from the handler when the component unmounts", async () => {
		const teardown = vi.fn();
		const subscribe = vi
			.fn<(listener: () => void) => () => void>()
			.mockImplementation(() => teardown);

		const handler: SnapshotHandler<number> = {
			getSnapshot: () => ({ value: 42, version: 0 }),
			subscribe,
		};

		const wrapper = mount(
			defineComponent(() => {
				useSnapshot(handler);
				return () => null;
			}),
		);

		expect(subscribe).toHaveBeenCalledTimes(1);

		await wrapper.unmount();

		expect(teardown).toHaveBeenCalledTimes(1);
	});

	it("throws when used outside of setup()", () => {
		const handler: SnapshotHandler<number> = {
			getSnapshot: () => ({ value: 0, version: 0 }),
			subscribe: () => () => {},
		};

		expect(() => useSnapshot(handler)).toThrow(
			"useSnapshot can only be used within a Vue component setup().",
		);
	});
});
