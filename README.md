# @sigrea/vue

`@sigrea/vue` adapts [@sigrea/core](https://www.npmjs.com/package/@sigrea/core) molecule modules and signals for Vue 3's Composition API. It aligns lifecycle scopes with component lifecycles, preserves deep reactivity, and provides composables for `<script setup>` and traditional setup functions.

- **Signal subscriptions.** `useSignal` subscribes to signals and computed values, returning a readonly ref that updates when they change.
- **Computed subscriptions.** `useComputed` subscribes to computed values, mirroring Vue's `computed` while tracking through Sigrea scopes.
- **Deep signal subscriptions.** `useDeepSignal` subscribes to deep signal objects and exposes them as mutable refs with automatic cleanup.
- **Two-way bindings.** `useMutableSignal` wraps primitive signals as `WritableComputedRef` for two-way bindings like `v-model`.
- **Molecule lifecycles.** `useMolcule` mounts molecule factories and binds their lifecycles to Vue components.

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
  - [Consume a Signal](#consume-a-signal)
  - [Bridge Framework-Agnostic Molecules](#bridge-framework-agnostic-molecules)
  - [Bind Writable Primitive Signals](#bind-writable-primitive-signals)
  - [Bind Deep Reactive Objects](#bind-deep-reactive-objects)
- [API Reference](#api-reference)
  - [useSignal](#usesignal)
  - [useComputed](#usecomputed)
  - [useDeepSignal](#usedeepsignal)
  - [useMutableSignal](#usemutablesignal)
  - [useMolcule](#usemolcule)
- [Testing](#testing)
- [Handling Scope Cleanup Errors](#handling-scope-cleanup-errors)
- [Development](#development)
- [License](#license)

## Install

```bash
npm install @sigrea/vue @sigrea/core vue
```

Requires Vue 3.4+ and Node.js 20 or later.

## Quick Start

### Consume a Signal

```vue
<script setup lang="ts">
import { signal } from "@sigrea/core";
import { useSignal } from "@sigrea/vue";

const count = signal(0);
const value = useSignal(count);
</script>

<template>
  <span>{{ value }}</span>
</template>
```

### Bridge Framework-Agnostic Molecules

```ts
// CounterMolecule.ts
import { molecule, signal } from "@sigrea/core";

export const CounterMolecule = molecule((props: { initialCount: number }) => {
  const count = signal(props.initialCount);

  const increment = () => {
    count.value += 1;
  };

  const reset = () => {
    count.value = props.initialCount;
  };

  return { count, increment, reset };
});
```

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { useMolcule, useSignal } from "@sigrea/vue";
import { CounterMolecule } from "./CounterMolecule";

const props = defineProps<{ initialCount: number }>();
const counter = useMolcule(CounterMolecule, props);
const value = useSignal(counter.count);
</script>

<template>
  <div>
    <span>{{ value }}</span>
    <button @click="counter.increment">Increment</button>
    <button @click="counter.reset">Reset</button>
  </div>
</template>
```

### Bind Writable Primitive Signals

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

`useMutableSignal` expects a writable signal produced by `signal()`. Passing a readonly signal throws at runtime so incorrect bindings fail fast.

### Bind Deep Reactive Objects

```vue
<script setup lang="ts">
import { deepSignal } from "@sigrea/core";
import { useDeepSignal } from "@sigrea/vue";

const profile = deepSignal({ name: "Sigrea" });
const model = useDeepSignal(profile);
</script>

<template>
  <label>
    Name
    <input v-model="model.name" />
  </label>
</template>
```

## API Reference

### useSignal

```ts
function useSignal<T>(
  signal: Signal<T> | ReadonlySignal<T>
): DeepReadonly<ShallowRef<T>>
```

Subscribes to a signal or computed value and returns a readonly Vue ref that updates when the signal changes. The subscription is cleaned up when the component unmounts.

### useComputed

```ts
function useComputed<T>(source: Computed<T>): DeepReadonly<ShallowRef<T>>
```

Subscribes to a computed value and returns a readonly Vue ref that updates when the computed value changes. The subscription is cleaned up when the component unmounts.

### useDeepSignal

```ts
function useDeepSignal<T extends object>(signal: DeepSignal<T>): ShallowRef<T>
```

Subscribes to a deep signal and returns a mutable Vue ref. Updates to the deep signal trigger reactivity, and the subscription is cleaned up when the component unmounts. Templates unwrap the ref automatically, so accessing nested properties requires no `.value`. In script blocks, use `state.value` to access the underlying object.

### useMutableSignal

```ts
function useMutableSignal<T>(signal: Signal<T>): WritableComputedRef<T>
```

Wraps a Sigrea signal as a Vue `WritableComputedRef` for two-way bindings like `v-model`. Expects a writable signal created by `signal()`. Passing a readonly signal throws at runtime.

### useMolcule

```ts
function useMolcule<TReturn extends object, TProps = void>(
  molecule: MoleculeFactory<TReturn, TProps>,
  ...args: MoleculeArgs<TProps>
): MoleculeInstance<TReturn>
```

Mounts a molecule factory and returns its MoleculeInstance. Sigrea augments the molecule with lifecycle metadata: `onMount` callbacks run after the component mounts, and `onUnmount` callbacks run before it unmounts.

## Testing

```ts
// tests/Counter.test.ts
import { mount } from "@vue/test-utils";
import Counter from "../components/Counter.vue";

it("increments and displays the updated count", async () => {
  const wrapper = mount(Counter, {
    props: { initialCount: 10 },
  });

  await wrapper.find("button").trigger("click");

  expect(wrapper.text()).toContain("11");
});
```

## Handling Scope Cleanup Errors

For global error handling configuration, see [@sigrea/core - Handling Scope Cleanup Errors](https://github.com/sigrea/core#handling-scope-cleanup-errors).

In Vue apps, configure the handler in your application entry point before mounting:

```ts
// main.ts
import { setScopeCleanupErrorHandler } from "@sigrea/core";
import { createApp } from "vue";
import App from "./App.vue";

setScopeCleanupErrorHandler((error, context) => {
  console.error(`Cleanup failed:`, error);

  // Forward to monitoring service
  if (typeof Sentry !== "undefined") {
    Sentry.captureException(error, {
      tags: { scopeId: context.scopeId, phase: context.phase },
    });
  }
});

createApp(App).mount("#app");
```

## Development

This repo targets Node.js 20 or later.

If you use mise:

- `mise trust -y` — trust `mise.toml` (first run only).
- `mise run ci` — run CI-equivalent checks locally.
- `mise run notes` — preview release notes (optional).

You can also run pnpm scripts directly:

- `pnpm install` — install dependencies.
- `pnpm test` — run the Vitest suite once (no watch).
- `pnpm typecheck` — run TypeScript type checking.
- `pnpm test:coverage` — collect coverage.
- `pnpm build` — compile via unbuild to produce dual CJS/ESM bundles.
- `pnpm cicheck` — run CI checks locally.
- `pnpm dev` — launch the playground counter demo.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow details.

## License

MIT — see [LICENSE](./LICENSE).
