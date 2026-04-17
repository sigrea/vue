import {
	getCurrentInstance,
	onActivated,
	onBeforeUnmount,
	onDeactivated,
	onMounted,
	onScopeDispose,
	toRaw,
} from "vue";

import type {
	MoleculeArgs,
	MoleculeFactory,
	MoleculeInstance,
} from "@sigrea/core";
import { disposeMolecule, mountMolecule, unmountMolecule } from "@sigrea/core";
import { registerSsrCleanup } from "./ssrCleanup";

export function useMolecule<
	TReturn extends object,
	TProps extends object | void = void,
>(
	molecule: MoleculeFactory<TReturn, TProps>,
	...args: MoleculeArgs<TProps>
): MoleculeInstance<TReturn> {
	if (getCurrentInstance() === null) {
		throw new Error(
			"useMolecule can only be used within a Vue component setup().",
		);
	}

	const props = args.length === 0 ? undefined : (args[0] as TProps | undefined);

	if (props !== undefined && (typeof props !== "object" || props === null)) {
		throw new TypeError("useMolecule props must be an object.");
	}

	const snapshot =
		props === undefined
			? undefined
			: ({ ...toRaw(props) } as Exclude<TProps, void>);
	const moleculeArgs =
		snapshot === undefined
			? ([] as MoleculeArgs<TProps>)
			: ([snapshot as TProps] as MoleculeArgs<TProps>);

	const instance = molecule(...moleculeArgs);
	const disposeState = { disposed: false };

	const dispose = () => {
		if (disposeState.disposed) {
			return;
		}

		disposeState.disposed = true;
		disposeMolecule(instance);
	};
	registerSsrCleanup(dispose);

	onMounted(() => {
		mountMolecule(instance);
	});

	onActivated(() => {
		mountMolecule(instance);
	});

	onDeactivated(() => {
		unmountMolecule(instance);
	});

	onBeforeUnmount(() => {
		unmountMolecule(instance);
	});

	onScopeDispose(() => {
		dispose();
	});

	return instance;
}
