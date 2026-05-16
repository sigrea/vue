import {
	getCurrentInstance,
	onActivated,
	onBeforeUnmount,
	onDeactivated,
	onMounted,
	onScopeDispose,
	watchEffect,
} from "vue";

import type {
	MoleculeArgs,
	MoleculeFactory,
	MoleculeGetArgs,
	MoleculeInstance,
	MoleculePropsGetter,
	ResolvedMoleculeProps,
} from "@sigrea/core";
import {
	disposeMolecule,
	mountMolecule,
	unmountMolecule,
	updateMoleculeProps,
} from "@sigrea/core";
import { registerSsrCleanup } from "./ssrCleanup";

export function useMolecule<
	TReturn extends object,
	TProps extends object | void = void,
>(
	molecule: MoleculeFactory<TReturn, TProps>,
	...args: MoleculeGetArgs<TProps>
): MoleculeInstance<TReturn, TProps> {
	if (getCurrentInstance() === null) {
		throw new Error(
			"useMolecule can only be used within a Vue component setup().",
		);
	}

	const propsSource = args[0];
	const initialProps = resolveProps(propsSource);

	const moleculeArgs =
		initialProps === undefined
			? ([] as MoleculeArgs<TProps>)
			: ([initialProps as TProps] as MoleculeArgs<TProps>);

	const instance = molecule(...moleculeArgs);
	const disposeState = { disposed: false };
	let stopPropsSync: (() => void) | undefined;

	const dispose = () => {
		if (disposeState.disposed) {
			return;
		}

		disposeState.disposed = true;
		stopPropsSync?.();
		disposeMolecule(instance);
	};

	try {
		if (isPropsGetter<TProps>(propsSource)) {
			const propsGetter = propsSource as MoleculePropsGetter<TProps>;
			let syncedInitialProps = false;
			stopPropsSync = watchEffect(() => {
				const nextProps = resolvePropsForUpdate<TProps>(propsGetter);
				if (!syncedInitialProps) {
					syncedInitialProps = true;
					return;
				}
				updateMoleculeProps(instance, nextProps);
			});
		}
	} catch (error) {
		dispose();
		throw error;
	}

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

function resolveProps<TProps extends object | void>(
	source: MoleculeGetArgs<TProps>[0],
): Exclude<TProps, void> | undefined {
	const props = isPropsGetter<TProps>(source) ? source() : source;
	if (props !== undefined && (typeof props !== "object" || props === null)) {
		throw new TypeError("useMolecule props must be an object.");
	}
	return props as Exclude<TProps, void> | undefined;
}

function resolvePropsForUpdate<TProps extends object | void>(
	source: MoleculeGetArgs<TProps>[0],
): ResolvedMoleculeProps<TProps> {
	return (resolveProps(source) ?? {}) as ResolvedMoleculeProps<TProps>;
}

function isPropsGetter<TProps extends object | void>(
	source: MoleculeGetArgs<TProps>[0],
): source is Extract<MoleculeGetArgs<TProps>[0], () => object> {
	return typeof source === "function";
}
