import { getCurrentInstance, onScopeDispose } from "vue";

import type {
	MoleculeArgs,
	MoleculeFactory,
	MoleculeInstance,
} from "@sigrea/core";
import { disposeMolecule } from "@sigrea/core";

export function useMolecule<TReturn extends object, TProps = void>(
	molecule: MoleculeFactory<TReturn, TProps>,
	...args: MoleculeArgs<TProps>
): MoleculeInstance<TReturn> {
	if (getCurrentInstance() === null) {
		throw new Error(
			"useMolecule can only be used within a Vue component setup().",
		);
	}

	const instance = molecule(...args);

	onScopeDispose(() => {
		disposeMolecule(instance);
	});

	return instance;
}
