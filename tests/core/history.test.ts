import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDocument } from '../../src/renderer/core/document';
import {
  HISTORY_LIMIT,
  History,
  snapshotLayerList,
  snapshotLayerPixels,
  type Snapshot,
} from '../../src/renderer/core/history';
import { createLayer, type Layer } from '../../src/renderer/core/layer';
import { stubOffscreenCanvas } from '../helpers/fakeOffscreenCanvas';

// The simplest state there is: one number, saved and restored like a layer would be.
function snapshotValue(state: { value: number }): Snapshot {
  const saved = state.value;
  return {
    restore() {
      const current = snapshotValue(state);
      state.value = saved;
      return current;
    },
  };
}

// Runs one action the way the editor does: record the state, then change it.
function act(history: History, state: { value: number }, value: number): void {
  history.record(snapshotValue(state));
  state.value = value;
}

describe('History', () => {
  it('undoes the last action, then redoes it', () => {
    const history = new History();
    const state = { value: 0 };
    act(history, state, 1);

    expect(history.undo()).toBe(true);
    expect(state.value).toBe(0);
    expect(history.redo()).toBe(true);
    expect(state.value).toBe(1);
  });

  it('undoes actions newest first and redoes them oldest first', () => {
    const history = new History();
    const state = { value: 0 };
    act(history, state, 1);
    act(history, state, 2);
    act(history, state, 3);

    const undone: number[] = [];
    while (history.undo()) {
      undone.push(state.value);
    }
    const redone: number[] = [];
    while (history.redo()) {
      redone.push(state.value);
    }

    expect(undone).toEqual([2, 1, 0]);
    expect(redone).toEqual([1, 2, 3]);
  });

  it('does nothing when there is nothing to undo or redo', () => {
    const history = new History();
    const state = { value: 7 };

    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
    expect(state.value).toBe(7);
  });

  it('forgets the undone actions once a new action is made', () => {
    const history = new History();
    const state = { value: 0 };
    act(history, state, 1);
    act(history, state, 2);
    history.undo();

    act(history, state, 5);

    expect(history.redo()).toBe(false);
    expect(state.value).toBe(5);
    history.undo();
    expect(state.value).toBe(1);
  });

  it(`keeps the last ${HISTORY_LIMIT} actions and drops older ones`, () => {
    const history = new History();
    const state = { value: 0 };
    for (let value = 1; value <= HISTORY_LIMIT + 5; value++) {
      act(history, state, value);
    }

    let undos = 0;
    while (history.undo()) {
      undos++;
    }

    expect(undos).toBe(HISTORY_LIMIT);
    expect(state.value).toBe(5);
  });

  it(`can redo all ${HISTORY_LIMIT} actions after undoing them`, () => {
    const history = new History();
    const state = { value: 0 };
    for (let value = 1; value <= HISTORY_LIMIT; value++) {
      act(history, state, value);
    }
    while (history.undo());

    let redos = 0;
    while (history.redo()) {
      redos++;
    }

    expect(redos).toBe(HISTORY_LIMIT);
    expect(state.value).toBe(HISTORY_LIMIT);
  });
});

describe('History state, for the Undo / Redo buttons', () => {
  it('tells whether there is something to undo or redo', () => {
    const history = new History();
    const state = { value: 0 };
    expect([history.canUndo, history.canRedo]).toEqual([false, false]);

    act(history, state, 1);
    expect([history.canUndo, history.canRedo]).toEqual([true, false]);
    history.undo();
    expect([history.canUndo, history.canRedo]).toEqual([false, true]);
    history.redo();
    expect([history.canUndo, history.canRedo]).toEqual([true, false]);
  });

  it('calls its listeners after each change of the stacks, and only then', () => {
    const history = new History();
    const state = { value: 0 };
    let changes = 0;
    let otherChanges = 0;
    history.subscribe(() => changes++);
    history.subscribe(() => otherChanges++);

    act(history, state, 1);
    history.undo();
    history.undo();
    history.redo();
    history.redo();

    // record, undo, redo: the 2nd undo and the 2nd redo had nothing to do.
    expect(changes).toBe(3);
    expect(otherChanges).toBe(3);
  });

  it('has already updated the stacks when a listener is called', () => {
    const history = new History();
    const seen: boolean[] = [];
    history.subscribe(() => seen.push(history.canUndo));

    act(history, { value: 0 }, 1);
    history.undo();

    expect(seen).toEqual([true, false]);
  });
});

describe('History.clear', () => {
  it('forgets everything, and tells its listeners', () => {
    const history = new History();
    const state = { value: 0 };
    act(history, state, 1);
    act(history, state, 2);
    history.undo();
    let changes = 0;
    history.subscribe(() => changes++);

    history.clear();

    expect([history.canUndo, history.canRedo]).toEqual([false, false]);
    expect(history.undo()).toBe(false);
    expect(state.value).toBe(1);
    expect(changes).toBe(1);
  });
});

// Layer whose fake context holds its pixels in a plain array, so a test can paint and read them back.
function makePixelLayer() {
  const image = { pixels: [0, 0, 0, 0] };
  const reads: number[][] = [];
  const ctx = {
    getImageData: (...rect: number[]) => {
      reads.push(rect);
      return { data: [...image.pixels] };
    },
    putImageData: (saved: { data: number[] }, x: number, y: number) => {
      expect([x, y]).toEqual([0, 0]);
      image.pixels = [...saved.data];
    },
  };
  const canvas = { width: 30, height: 20, getContext: () => ctx };
  const layer: Layer = { name: 'Background', canvas: canvas as unknown as OffscreenCanvas, opacity: 1, visible: true };
  return { layer, image, reads };
}

describe('snapshotLayerPixels', () => {
  it('reads the whole layer', () => {
    const { layer, reads } = makePixelLayer();

    snapshotLayerPixels(layer);

    expect(reads).toEqual([[0, 0, 30, 20]]);
  });

  it('puts back the saved pixels on undo and the newer ones on redo', () => {
    const { layer, image } = makePixelLayer();
    const history = new History();

    history.record(snapshotLayerPixels(layer));
    image.pixels = [255, 0, 0, 255];

    history.undo();
    expect(image.pixels).toEqual([0, 0, 0, 0]);
    history.redo();
    expect(image.pixels).toEqual([255, 0, 0, 255]);
  });
});

describe('snapshotLayerList', () => {
  beforeEach(stubOffscreenCanvas);
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('undoes adding, deleting and moving layers, and gives back the same layer objects', () => {
    const doc = createDocument(10, 10);
    const [background] = doc.layers;
    const top = createLayer('Top', 10, 10);
    const history = new History();

    history.record(snapshotLayerList(doc));
    doc.layers.push(top);
    history.record(snapshotLayerList(doc));
    doc.layers.reverse();
    history.record(snapshotLayerList(doc));
    doc.layers.splice(1, 1);
    expect(doc.layers).toEqual([top]);

    history.undo();
    expect(doc.layers).toEqual([top, background]);
    expect(doc.layers[1]).toBe(background);
    history.undo();
    expect(doc.layers).toEqual([background, top]);
    history.undo();
    expect(doc.layers).toEqual([background]);

    history.redo();
    history.redo();
    history.redo();
    expect(doc.layers).toEqual([top]);
  });

  it('gives back the active layer of that time', () => {
    const doc = createDocument(10, 10);
    const [background] = doc.layers;
    const top = createLayer('Top', 10, 10);
    const history = new History();

    history.record(snapshotLayerList(doc));
    doc.layers.push(top);
    doc.activeLayer = top;

    history.undo();
    expect(doc.activeLayer).toBe(background);
    history.redo();
    expect(doc.activeLayer).toBe(top);
  });
});
