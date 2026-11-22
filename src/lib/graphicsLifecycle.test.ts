import { describe, expect, it, vi } from 'vitest';
import { watchAcousticContext } from './graphicsLifecycle';

function fixture() {
  const canvas = new EventTarget();
  const addedListener = vi.spyOn(canvas, 'addEventListener');
  const removedListener = vi.spyOn(canvas, 'removeEventListener');
  const classes = new Set<string>();
  const pendingFrames = new Set([42]);
  const host = { classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name) } };
  let cancellations = 0;
  const lifecycle = watchAcousticContext(canvas, host, () => {
    cancellations++;
    pendingFrames.delete(42);
  });
  return { canvas, classes, pendingFrames, lifecycle, addedListener, removedListener, cancellations: () => cancellations };
}

describe('acoustic WebGL context lifecycle', () => {
  it('cancels pending animation and reveals the CSS fallback when the context is lost', () => {
    const f = fixture();
    expect(f.classes.has('has-acoustic-webgl')).toBe(true);
    f.canvas.dispatchEvent(new Event('webglcontextlost'));
    expect(f.pendingFrames.size).toBe(0);
    expect(f.classes.has('has-acoustic-webgl')).toBe(false);
    expect(f.lifecycle.isActive()).toBe(false);
  });

  it('keeps fallback active after context restoration until resources are recreated by remounting', () => {
    const f = fixture();
    f.canvas.dispatchEvent(new Event('webglcontextlost'));
    f.canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(f.lifecycle.isActive()).toBe(false);
    expect(f.classes.has('has-acoustic-webgl')).toBe(false);
  });

  it('removes its context listener and stops animation on disposal', () => {
    const f = fixture();
    f.lifecycle.dispose();
    expect(f.removedListener).toHaveBeenCalledExactlyOnceWith('webglcontextlost', f.addedListener.mock.calls[0][1]);
    const cancellationsAfterDisposal = f.cancellations();
    expect(f.pendingFrames.size).toBe(0);
    expect(f.classes.has('has-acoustic-webgl')).toBe(false);
    expect(f.lifecycle.isActive()).toBe(false);
    f.canvas.dispatchEvent(new Event('webglcontextlost'));
    expect(f.cancellations()).toBe(cancellationsAfterDisposal);
  });
});
