/**
 * Minimal WebGL pipeline for the VRVision shaders: one full-screen quad with a
 * video (or image) bound as a texture.
 *
 * Kept free of React so the GL lifecycle is explicit — contexts and textures
 * have to be released deterministically, which is awkward to express in render
 * logic.
 */

import {
  INVERT_SHADER,
  MAGNIFIER_SHADER,
  VERTEX_SHADER,
  toDif,
  type UniformValues,
} from "./shaders";

export type ShaderMode = "magnifier" | "invert";

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log}`);
  }
  return shader;
}

function link(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");

  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  // Shaders are reference-counted by the program once attached.
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program failed to link: ${log}`);
  }
  return program;
}

export interface Renderer {
  draw(source: TexImageSource, mode: ShaderMode, values: UniformValues): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: false });
  if (!gl) throw new Error("WebGL is not available in this browser");

  const programs: Record<ShaderMode, WebGLProgram> = {
    magnifier: link(gl, VERTEX_SHADER, MAGNIFIER_SHADER),
    invert: link(gl, VERTEX_SHADER, INVERT_SHADER),
  };

  // A single quad covering clip space, with texture coordinates flipped
  // vertically: GL samples from the bottom left, images arrive top left.
  const vertices = new Float32Array([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    1, 1, 1, 0,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // CLAMP_TO_EDGE matters: the magnifier's offset sampling reads outside the
  // texture, and repeating would wrap the far edge into the box.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  let disposed = false;

  return {
    draw(source, mode, values) {
      if (disposed) return;

      const program = programs[mode];
      gl.useProgram(program);

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const stride = 4 * Float32Array.BYTES_PER_ELEMENT;

      const positionLocation = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);

      const texLocation = gl.getAttribLocation(program, "inputTextureCoordinate");
      gl.enableVertexAttribArray(texLocation);
      gl.vertexAttribPointer(
        texLocation,
        2,
        gl.FLOAT,
        false,
        stride,
        2 * Float32Array.BYTES_PER_ELEMENT,
      );

      gl.uniform1i(gl.getUniformLocation(program, "s_texture"), 0);
      gl.uniform1f(
        gl.getUniformLocation(program, "brightness"),
        values.brightness,
      );

      if (mode === "magnifier") {
        const { dif_x, dif_y } = toDif(values);
        gl.uniform1f(gl.getUniformLocation(program, "size"), values.size);
        gl.uniform1f(gl.getUniformLocation(program, "pos_x"), values.pos_x);
        gl.uniform1f(gl.getUniformLocation(program, "pos_y"), values.pos_y);
        gl.uniform1f(gl.getUniformLocation(program, "dif_x"), dif_x);
        gl.uniform1f(gl.getUniformLocation(program, "dif_y"), dif_y);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },

    resize(width, height) {
      if (disposed) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      for (const program of Object.values(programs)) gl.deleteProgram(program);
      // Frees the backing context rather than waiting for GC; browsers cap how
      // many live WebGL contexts a page may hold.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
