type AcousticHost = { classList: { add(name: string): unknown; remove(name: string): unknown } };

/** A lost context stays on the CSS fallback until its owner remounts and recreates resources. */
export function watchAcousticContext(canvas: EventTarget, host: AcousticHost | null, stopAnimation: () => void) {
  let active = true;
  const stop = () => {
    if (!active) return;
    active = false;
    stopAnimation();
    host?.classList.remove('has-acoustic-webgl');
  };
  canvas.addEventListener('webglcontextlost', stop);
  host?.classList.add('has-acoustic-webgl');
  return {
    isActive: () => active,
    dispose: () => {
      canvas.removeEventListener('webglcontextlost', stop);
      stop();
    },
  };
}
