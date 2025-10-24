import { getCurrentInstance, onScopeDispose } from "vue";

import type { LogicArgs, LogicFunction, LogicInstance } from "@sigrea/core";
import { cleanupLogic, mountLogic } from "@sigrea/core";

export function useLogic<TReturn extends object, TProps = void>(
	logic: LogicFunction<TReturn, TProps>,
	...args: LogicArgs<TProps>
): LogicInstance<TReturn> {
	if (getCurrentInstance() === null) {
		throw new Error("useLogic can only be used within a Vue component setup().");
	}

	const instance = mountLogic(logic, ...args);

	onScopeDispose(() => {
		cleanupLogic(instance);
	});

	return instance;
}

