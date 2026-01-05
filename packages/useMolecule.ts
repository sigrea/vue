import { getCurrentInstance, onScopeDispose, toRaw } from "vue";

import type {
	MoleculeArgs,
	MoleculeFactory,
	MoleculeInstance,
} from "@sigrea/core";
import { disposeMolecule } from "@sigrea/core";

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

	onScopeDispose(() => {
		disposeMolecule(instance);
	});

	return instance;
}
