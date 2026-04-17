# @sigrea/vue

`@sigrea/vue` adapts [@sigrea/core](https://www.npmjs.com/package/@sigrea/core) molecule modules and signals for Vue 3's Composition API. It aligns lifecycle scopes with component lifecycles, preserves deep reactivity, and provides composables for `<script setup>` and traditional setup functions.

- **Signal subscriptions.** `useSignal` subscribes to signals and computed values, returning a readonly ref that updates when they change.
- **Computed subscriptions.** `useComputed` subscribes to computed values, mirroring Vue's `computed` while tracking through Sigrea scopes.
- **Deep signal subscriptions.** `useDeepSignal` subscribes to deep signal objects and exposes them as mutable refs with automatic cleanup.
- **Two-way bindings.** `useMutableSignal` wraps primitive signals as `WritableComputedRef` for two-way bindings like `v-model`.
- **Molecule lifecycles.** `useMolecule` mounts molecule factories and binds their lifecycles to Vue components.

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
  - [useMolecule](#usemolecule)
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
import { molecule, readonly, signal } from "@sigrea/core";

type CounterProps = {
  initialCount: number;
  initialStep: number;
};

export const CounterMolecule = molecule((props: CounterProps) => {
  const count = signal(props.initialCount);
  const step = signal(props.initialStep);

  function setStep(next: number) {
    step.value = next;
  }

  function increment() {
    count.value += step.value;
  }

  function reset() {
    count.value = props.initialCount;
  }

  return {
    count: readonly(count),
    step: readonly(step),
    setStep,
    increment,
    reset,
  };
});
```

```vue
<!-- Counter.vue -->
<script setup lang="ts">
import { useMolecule, useSignal } from "@sigrea/vue";
import { CounterMolecule } from "./CounterMolecule";

const props = defineProps<{ initialCount: number; initialStep: number }>();

const counter = useMolecule(CounterMolecule, {
  initialCount: props.initialCount,
  initialStep: props.initialStep,
});

const count = useSignal(counter.count);
const step = useSignal(counter.step);
</script>

<template>
  <div>
    <span>{{ count }}</span>
    <button @click="counter.increment">Increment</button>
    <button @click="counter.reset">Reset</button>
    <button @click="counter.setStep(step + 1)">Step +</button>
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

## API Reference

### useSignal

```ts
function useSignal<T>(
  signal: Signal<T> | ReadonlySignal<T> | Computed<T>
): DeepReadonly<ShallowRef<T>>
```

Subscribes to a signal or computed value and returns a readonly Vue ref that updates when the signal changes. The subscription is cleaned up when the component unmounts, or after server rendering, including any `onServerPrefetch()` work, completes.

### useComputed

```ts
function useComputed<T>(source: Computed<T>): DeepReadonly<ShallowRef<T>>
```

Subscribes to a computed value and returns a readonly Vue ref that updates when the computed value changes. The subscription is cleaned up when the component unmounts, or after server rendering, including any `onServerPrefetch()` work, completes.

### useDeepSignal

```ts
function useDeepSignal<T extends object>(signal: DeepSignal<T>): ShallowRef<T>
```

Subscribes to a deep signal and returns a mutable Vue ref. Updates to the deep signal trigger reactivity, and the subscription is cleaned up when the component unmounts, or after server rendering, including any `onServerPrefetch()` work, completes. Templates unwrap the ref automatically, so accessing nested properties requires no `.value`. In script blocks, use `state.value` to access the underlying object.

### useMutableSignal

```ts
function useMutableSignal<T>(signal: Signal<T>): WritableComputedRef<T>
```

Wraps a Sigrea signal as a Vue `WritableComputedRef` for two-way bindings like `v-model`. Expects a writable signal created by `signal()`. Passing a readonly signal throws at runtime.

### useMolecule

```ts
function useMolecule<TReturn extends object, TProps extends object | void = void>(
  molecule: MoleculeFactory<TReturn, TProps>,
  ...args: MoleculeArgs<TProps>
): MoleculeInstance<TReturn>
```

Mounts a molecule factory and returns its MoleculeInstance. Sigrea augments the molecule with lifecycle metadata: `onMount` callbacks run after the component mounts, and `onUnmount` callbacks run before it unmounts.

**Server Rendering**

During server rendering, `useMolecule` creates the molecule instance for the render pass but does not mount it. `onMount`, `watch`, `watchEffect`, `onActivated`, and `onDeactivated` do not run on the server. Unmounted instances created during SSR are disposed automatically in a microtask after server rendering, including any `onServerPrefetch()` work, completes.

**KeepAlive Support**

When used inside Vue's `<KeepAlive>`, molecule side effects are automatically managed for optimal resource efficiency:

- **On deactivation** (`onDeactivated`): `watch` effects and ongoing work are paused via `unmountMolecule`. The molecule instance itself remains alive, preserving its internal state.
- **On reactivation** (`onActivated`): Side effects resume via `mountMolecule`, allowing watches and subscriptions to pick up where they left off.
- **On final unmount**: The molecule is fully disposed via `disposeMolecule`, releasing all resources.

This design prevents unnecessary computation and subscriptions while components are cached but invisible, reducing CPU and memory usage without losing state.

**Props Handling**

Props are treated as an initial snapshot. Updating component props does not recreate the molecule instance or update the snapshot; model dynamic values via signals or explicit molecule methods (for example, `setStep`).

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
