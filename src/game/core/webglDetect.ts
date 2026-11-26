/** WebGL capability detection — Phase B (audit A4).
 *  Probes webgl2 -> webgl before the renderer is constructed, returning a
 *  machine category and a human message. The renderer constructor alone
 *  does not reliably throw when WebGL is unavailable in some browsers;
 *  the failure can surface at first render instead, which produced
 *  confusing "Failed to start:" errors on production. */

export type WebGLCapability =
  | { kind: 'ok'; webgl2: boolean; maxTextureSize: number; message: null }
  | { kind: 'blocked'; webgl2: false; message: string }
  | { kind: 'unavailable'; webgl2: false; message: string };

export function detectWebGL(canvas: HTMLCanvasElement): WebGLCapability {
  // Probe WebGL2 first (three.js uses it when present)
  let gl: WebGL2RenderingContext | WebGLRenderingContext | null = null;
  let webgl2 = false;
  try {
    gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) as
      | WebGL2RenderingContext
      | null;
    if (gl) webgl2 = true;
  } catch {
    gl = null;
  }
  if (!gl) {
    try {
      gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    } catch {
      gl = null;
    }
  }

  if (!gl) {
    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    return {
      kind: 'unavailable',
      webgl2: false,
      message: isIOS
        ? 'WebGL is disabled or blocked on this device. Enable it in your browser settings (Safari: Settings > Safari > Advanced > Experimental Features).'
        : 'WebGL is unavailable or blocked. Your browser settings, a privacy extension, or the GPU blocklist may be preventing 3D graphics.'
    };
  }

  // Successfully got a context — ask for the max texture size as a cheap
  // "the driver actually answers" probe. A dead driver can return a
  // context that throws on first parameter query.
  let maxTextureSize = 0;
  try {
    maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if (typeof maxTextureSize !== 'number' || maxTextureSize <= 0) {
      return {
        kind: 'blocked',
        webgl2: false,
        message:
          'This device reported an invalid WebGL configuration (bad driver or GPU blocklist). The game cannot start here.'
      };
    }
  } catch {
    return {
      kind: 'blocked',
      webgl2: false,
      message:
        'WebGL context was created but the driver failed to respond. Your GPU may be blocklisted or the browser is in a software-fallback state.'
    };
  }

  // Release the probe context so the renderer can create its own
  try {
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  } catch {
    /* non-fatal */
  }

  return { kind: 'ok', webgl2, maxTextureSize, message: null };
}
