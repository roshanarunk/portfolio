import { vi } from "vitest";

/**
 * A minimal WebGL stub for jsdom, which ships no GL implementation.
 *
 * It records the calls the renderer makes so tests can assert the pipeline is
 * well-formed — programs linked, uniforms set — without a real GPU. Every query
 * reports success, since compile and link failures are not what these tests are
 * about.
 */
export interface GLCalls {
  uniforms: Record<string, number>;
  drawArrays: number;
  texImage2D: number;
  programs: number;
  disposed: boolean;
}

export function stubWebGL(): GLCalls {
  const calls: GLCalls = {
    uniforms: {},
    drawArrays: 0,
    texImage2D: 0,
    programs: 0,
    disposed: false,
  };

  // Uniform locations carry their own name, so uniform1f can record which
  // uniform was set without a real GL object.
  const location = (name: string) => ({ name }) as unknown as WebGLUniformLocation;

  const context = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    TEXTURE_2D: 7,
    TEXTURE_WRAP_S: 8,
    TEXTURE_WRAP_T: 9,
    TEXTURE_MIN_FILTER: 10,
    TEXTURE_MAG_FILTER: 11,
    CLAMP_TO_EDGE: 12,
    LINEAR: 13,
    RGBA: 14,
    UNSIGNED_BYTE: 15,
    FLOAT: 16,
    TRIANGLE_STRIP: 17,

    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => "",
    deleteShader: () => {},

    createProgram: () => {
      calls.programs++;
      return {};
    },
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => "",
    deleteProgram: () => {},
    useProgram: () => {},

    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    deleteBuffer: () => {},

    createTexture: () => ({}),
    bindTexture: () => {},
    texParameteri: () => {},
    texImage2D: () => {
      calls.texImage2D++;
    },
    deleteTexture: () => {},

    getAttribLocation: () => 0,
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    getUniformLocation: (_program: unknown, name: string) => location(name),
    uniform1i: () => {},
    uniform1f: (loc: { name: string }, value: number) => {
      calls.uniforms[loc.name] = value;
    },

    drawArrays: () => {
      calls.drawArrays++;
    },
    viewport: () => {},
    getExtension: (name: string) =>
      name === "WEBGL_lose_context"
        ? {
            loseContext: () => {
              calls.disposed = true;
            },
          }
        : null,
  };

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    ((type: string) =>
      type === "webgl" ? context : null) as HTMLCanvasElement["getContext"],
  );

  return calls;
}
