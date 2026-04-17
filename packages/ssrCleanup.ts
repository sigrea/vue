import { getCurrentInstance, onServerPrefetch } from "vue";

const IS_SERVER = typeof window === "undefined";

type Cleanup = () => void;
type VueInstance = NonNullable<ReturnType<typeof getCurrentInstance>>;
type SsrRenderInstance = VueInstance & {
	render?: (...args: unknown[]) => unknown;
};
type SsrRenderComponent = VueInstance["type"] & {
	ssrRender?: (...args: unknown[]) => unknown;
};

interface SsrCleanupState {
	cleanups: Cleanup[];
	registered: boolean;
	renderWrapped: boolean;
	flushed: boolean;
}

const cleanupStates = new WeakMap<VueInstance, SsrCleanupState>();
const wrappedSsrRenderComponents = new WeakSet<object>();

function getCleanupState(instance: VueInstance): SsrCleanupState {
	const existing = cleanupStates.get(instance);
	if (existing !== undefined) {
		return existing;
	}

	const state: SsrCleanupState = {
		cleanups: [],
		registered: false,
		renderWrapped: false,
		flushed: false,
	};
	cleanupStates.set(instance, state);
	return state;
}

function flushSsrCleanups(instance: VueInstance, state: SsrCleanupState): void {
	if (state.flushed) {
		return;
	}

	state.flushed = true;
	cleanupStates.delete(instance);

	const errors: unknown[] = [];
	const cleanups = state.cleanups.splice(0);

	for (const cleanup of cleanups) {
		try {
			cleanup();
		} catch (error) {
			errors.push(error);
		}
	}

	if (errors.length === 1) {
		throw errors[0];
	}

	if (errors.length > 1) {
		throw new AggregateError(errors, "Failed to run SSR cleanups.");
	}
}

function queueSsrCleanup(instance: VueInstance, state: SsrCleanupState): void {
	queueMicrotask(() => {
		flushSsrCleanups(instance, state);
	});
}

function wrapInstanceRender(
	instance: VueInstance,
	state: SsrCleanupState,
): void {
	if (state.renderWrapped || state.flushed) {
		return;
	}

	const renderInstance = instance as SsrRenderInstance;
	const render = renderInstance.render;
	if (typeof render !== "function") {
		return;
	}

	state.renderWrapped = true;
	renderInstance.render = ((...args: unknown[]) => {
		try {
			return render(...args);
		} finally {
			queueSsrCleanup(instance, state);
		}
	}) as typeof render;
}

function wrapComponentSsrRender(component: SsrRenderComponent): void {
	if (wrappedSsrRenderComponents.has(component)) {
		return;
	}

	const ssrRender = component.ssrRender;
	if (typeof ssrRender !== "function") {
		return;
	}

	wrappedSsrRenderComponents.add(component);
	component.ssrRender = ((...args: unknown[]) => {
		const instance = getCurrentInstance();
		const state = instance === null ? undefined : cleanupStates.get(instance);

		try {
			return ssrRender(...args);
		} finally {
			if (instance !== null && state !== undefined) {
				queueSsrCleanup(instance, state);
			}
		}
	}) as typeof ssrRender;
}

export function registerSsrCleanup(cleanup: Cleanup): void {
	if (!IS_SERVER) {
		return;
	}

	const instance = getCurrentInstance();
	if (instance === null) {
		return;
	}

	const state = getCleanupState(instance);
	state.cleanups.push(cleanup);

	if (state.registered) {
		return;
	}

	state.registered = true;
	onServerPrefetch(() => {
		wrapInstanceRender(instance, state);
		wrapComponentSsrRender(instance.type as SsrRenderComponent);
	});
}
