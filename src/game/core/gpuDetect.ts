/** WebGPU capability detection — Phase 8 groundwork.
 *  Detects WebGPU support without loading a WebGPU renderer bundle: we only
 *  probe `navigator.gpu` and request an adapter. The renderer itself stays a
 *  lazy dynamic import so non-supporting browsers never download it.
 *  WebGL2 remains the default and fallback — stability over effects. */

export interface GpuCapability {
  webgpu: boolean;
  adapterName: string | null;
}

export async function detectGpu(): Promise<GpuCapability> {
  const nav = navigator as Navigator & {
    gpu?: { requestAdapter(): Promise<unknown> };
  };
  if (!nav.gpu) {
    return { webgpu: false, adapterName: null };
  }
  try {
    const adapter = (await nav.gpu.requestAdapter()) as
      | { features?: unknown; limits?: unknown }
      | null;
    if (!adapter) return { webgpu: false, adapterName: null };
    // Adapter present: WebGPU is usable. (Renderer integration is a later
    // milestone — this gate exists so the settings UI can show real status.)
    return { webgpu: true, adapterName: 'WebGPU adapter available' };
  } catch {
    return { webgpu: false, adapterName: null };
  }
}
