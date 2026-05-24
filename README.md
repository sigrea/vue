# @sigrea/vue

Vue 3 composables for [@sigrea/core](https://www.npmjs.com/package/@sigrea/core).
Use this package when a Vue component needs to mount a molecule, read a Sigrea
signal, bind a writable signal, or subscribe to a deep signal object.

`@sigrea/vue` does not replace Vue reactivity. It subscribes components to
Sigrea signals and mounts molecules with the component lifecycle.

## Install

```bash
npm install @sigrea/vue @sigrea/core vue
```

Requires Vue 3.4+ and Node.js 24 or later.

Install [`@sigrea/use`][sigrea-use] too if your shared molecules use helpers
from that package, such as `createEvents`.

## Quick Start

Define state in a molecule. Mount that molecule in `<script setup>` with
`useMolecule()`, then read returned signals with `useSignal()`.

```vue
<script setup lang="ts">
import { molecule, readonly, signal } from "@sigrea/core";
import { useMolecule, useSignal } from "@sigrea/vue";

const CounterMolecule = molecule(() => {
  const count = signal(0);

  const increment = () => {
    count.value++;
  };

  return {
    count: readonly(count),
    increment,
  };
});

const counter = useMolecule(CounterMolecule);
const count = useSignal(counter.count);
</script>

<template>
  <button type="button" @click="counter.increment">
    Count: {{ count }}
  </button>
</template>
```

Templates unwrap refs automatically. In script blocks, read the current value as
`count.value`.

Use `useComputed()` when the source is known to be a `computed()` value and you
want TypeScript to enforce that. `useSignal()` also works with computed values.

## Molecules With Props

Pass a props object when the molecule only needs the initial values. The
instance keeps the same snapshot even if the Vue component props change later.

```vue
<script setup lang="ts">
import { molecule, readonly, signal } from "@sigrea/core";
import { useMolecule, useSignal } from "@sigrea/vue";

const componentProps = defineProps<{
  initialCount: number;
}>();

const CounterMolecule = molecule((props: { initialCount: number }) => {
  const count = signal(props.initialCount);

  const reset = () => {
    count.value = props.initialCount;
  };

  const increment = () => {
    count.value++;
  };

  return {
    count: readonly(count),
    increment,
    reset,
  };
});

const counter = useMolecule(CounterMolecule, componentProps);
const count = useSignal(counter.count);
</script>

<template>
  <span>Count: {{ count }}</span>
  <button type="button" @click="counter.increment">Increment</button>
  <button type="button" @click="counter.reset">Reset</button>
</template>
```

Pass a props getter when the molecule must keep reading updated Vue values. Vue
tracks dependencies inside the getter through `watchEffect()`.

```vue
<script setup lang="ts">
import { computed, molecule } from "@sigrea/core";
import { useMolecule, useSignal } from "@sigrea/vue";

const componentProps = defineProps<{
  label: string;
}>();

const LabelMolecule = molecule((props: { label: string }) => {
  return {
    label: computed(() => props.label.trim()),
  };
});

const model = useMolecule(LabelMolecule, () => ({ label: componentProps.label }));
const label = useSignal(model.label);
</script>

<template>
  <span>{{ label }}</span>
</template>
```

Inside a molecule, read props as `props.name`. Destructuring copies the current
value and loses reactivity.

## Writable Signals

Use `useMutableSignal()` when a Vue control needs to write back to a primitive
`signal()`. It returns a `WritableComputedRef`, so it works with `v-model`.

```vue
<script setup lang="ts">
import { signal } from "@sigrea/core";
import { useMutableSignal } from "@sigrea/vue";

const count = signal(0);
const model = useMutableSignal(count);
</script>

<template>
  <label>
    Count
    <input type="number" v-model.number="model" />
  </label>
</template>
```

`useMutableSignal()` expects a writable signal created by `signal()`. Passing a
readonly signal throws at runtime.

## Deep Signals

Use `useDeepSignal()` when a component reads or mutates a `deepSignal()` object.
Templates unwrap the returned ref, so nested properties work without `.value`.

```vue
<script setup lang="ts">
import { deepSignal } from "@sigrea/core";
import { useDeepSignal } from "@sigrea/vue";

const profile = deepSignal({ name: "Mendako" });
const model = useDeepSignal(profile);
</script>

<template>
  <label>
    Name
    <input v-model="model.name" />
  </label>
</template>
```

In script blocks, use `model.value` to access the underlying object.

## Controlled Values

For controlled UI, keep the value in a controller molecule. A child molecule
calls `send("update:open", next)` when it wants the value to change.
[`@sigrea/use`][sigrea-use] provides [`createEvents()`][create-events] for this
pattern.

```ts
// DialogMolecule.ts
import {
  computed,
  get,
  molecule,
  readonly,
  signal,
  toSignal,
} from "@sigrea/core";
import { createEvents } from "@sigrea/use";

type DialogProps = {
  open: boolean;
  disabled?: boolean;
};

type DialogEvents = {
  "update:open": [next: boolean];
};

export const DialogMolecule = molecule((props: DialogProps) => {
  const { send, on } = createEvents<DialogEvents>();
  const isOpen = toSignal(props, "open");
  const isDisabled = computed(() => props.disabled ?? false);

  const setOpen = async (next: boolean) => {
    if (isDisabled.value || isOpen.value === next) {
      return;
    }

    await send("update:open", next);
  };

  return {
    on,
    toggle: () => setOpen(!isOpen.value),
  };
});

export const DialogControllerMolecule = molecule(() => {
  const isOpen = signal(false);
  const dialog = get(DialogMolecule, () => ({ open: isOpen.value }));

  dialog.on("update:open", (next) => {
    isOpen.value = next;
  });

  return {
    isOpen: readonly(isOpen),
    toggle: dialog.toggle,
  };
});
```

```vue
<!-- DialogButton.vue -->
<script setup lang="ts">
import { useMolecule, useSignal } from "@sigrea/vue";
import { DialogControllerMolecule } from "./DialogMolecule";

const dialog = useMolecule(DialogControllerMolecule);
const isOpen = useSignal(dialog.isOpen);
</script>

<template>
  <button type="button" @click="dialog.toggle">
    {{ isOpen ? "Close" : "Open" }}
  </button>
</template>
```

Components should not call `dialog.on(...)` in setup. Put those event
subscriptions in controller molecules. If a Vue wrapper needs `v-model`, wire
that at the component boundary with Vue's component API.

## API Reference

### `useMolecule`

```ts
function useMolecule<TReturn extends object, TProps extends object | void = void>(
  molecule: MoleculeFactory<TReturn, TProps>,
  ...args: MoleculeGetArgs<TProps>
): MoleculeInstance<TReturn, TProps>
```

Mounts a molecule and returns its instance. `onMount`, `watch`, and
`watchEffect` run after the component mounts. `onUnmount` runs before the
component unmounts, then the molecule is disposed with the component scope.

During server rendering, `useMolecule()` creates the instance for the render
pass but does not mount it. Mount-scope work such as `onMount`, `watch`, and
`watchEffect` does not run on the server. Unmounted SSR instances are disposed
after server rendering and `onServerPrefetch()` work complete.

Inside Vue's `<KeepAlive>`, `useMolecule()` unmounts mount-scope work when the
component is deactivated and mounts it again when the component is activated.
The molecule instance remains alive until the component is finally disposed.

### `useSignal`

```ts
function useSignal<T>(
  source: Signal<T> | ReadonlySignal<T> | Computed<T>
): DeepReadonly<ShallowRef<T>>
```

Subscribes to a signal or computed value and returns a readonly Vue ref.
Templates unwrap the ref automatically. In script blocks, use `state.value`.

### `useComputed`

```ts
function useComputed<T>(source: Computed<T>): DeepReadonly<ShallowRef<T>>
```

Subscribes to a computed value and returns a readonly Vue ref. Use this when the
call site should only accept `Computed<T>`.

### `useMutableSignal`

```ts
function useMutableSignal<T>(source: Signal<T>): WritableComputedRef<T>
```

Wraps a writable Sigrea signal as a Vue `WritableComputedRef`.

### `useDeepSignal`

```ts
function useDeepSignal<T extends object>(source: DeepSignal<T>): ShallowRef<T>
```

Subscribes to a deep signal object and returns a mutable shallow ref. Nested
writes trigger Vue updates, and cleanup runs when the component scope is
disposed or after SSR cleanup.

### `useSnapshot`

```ts
function useSnapshot<T>(handler: SnapshotHandler<T>): DeepReadonly<ShallowRef<T>>
function useSnapshot<T>(
  handler: SnapshotHandler<T>,
  options: { mode: "mutable" }
): ShallowRef<T>
```

Low-level composable for custom snapshot handlers from `@sigrea/core`. Most
apps use `useSignal`, `useComputed`, `useMutableSignal`, or `useDeepSignal`
instead.

## Testing

Use the same shape in tests as in components: mount the component, interact with
it, and assert the rendered result.

```ts
import { mount } from "@vue/test-utils";
import Counter from "./Counter.vue";

it("increments the counter", async () => {
  const wrapper = mount(Counter);

  await wrapper.find("button").trigger("click");

  expect(wrapper.text()).toContain("Count: 1");
});
```

For molecule-only tests, use `trackMolecule()` and
`disposeTrackedMolecules()` from `@sigrea/core` so mount-scope work is cleaned
up after each test.

## Handling Scope Cleanup Errors

For global error handling configuration, see
[@sigrea/core - Handling Scope Cleanup Errors][core-cleanup-errors].

Configure the handler in your application entry point before mounting:

```ts
import { setScopeCleanupErrorHandler } from "@sigrea/core";
import { createApp } from "vue";
import App from "./App.vue";

setScopeCleanupErrorHandler((error, context) => {
  console.error("Cleanup failed:", error);

  if (typeof Sentry !== "undefined") {
    Sentry.captureException(error, {
      tags: { scopeId: context.scopeId, phase: context.phase },
    });
  }
});

createApp(App).mount("#app");
```

## Development

This repo targets Node.js 24 or later.

- `pnpm install` installs dependencies.
- `pnpm test` runs the Vitest suite once.
- `pnpm typecheck` runs TypeScript checks.
- `pnpm test:coverage` collects coverage.
- `pnpm build` builds CJS and ESM bundles with unbuild.
- `pnpm -s cicheck` runs the local CI chain.
- `pnpm dev` launches the playground counter demo.

If you use mise, run `mise trust -y` once before using mise tasks.

See [CONTRIBUTING.md](https://github.com/sigrea/vue/blob/main/CONTRIBUTING.md)
for workflow details.

## License

MIT. See [LICENSE](./LICENSE).

[core-cleanup-errors]: https://github.com/sigrea/core#handling-scope-cleanup-errors
[create-events]: https://github.com/sigrea/use/tree/main/packages/use/createEvents
[sigrea-use]: https://www.npmjs.com/package/@sigrea/use
