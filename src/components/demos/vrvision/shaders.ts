/**
 * The VRVision fragment shaders, ported from MyShaders.java to WebGL.
 *
 * The Android originals are GLSL ES 2.0, which is the same language WebGL 1.0
 * speaks, so the bodies are unchanged. The single difference is the sampler:
 * Android binds the camera to a `samplerExternalOES` (requiring the
 * GL_OES_EGL_image_external extension), whereas a browser gives us an ordinary
 * `sampler2D` uploaded from a <video> element. Everything else — the bounded
 * magnifier region, the offset sampling, the brightness multiply, the channel
 * inversion — is the original arithmetic.
 */

export const VERTEX_SHADER = `
attribute vec4 position;
attribute vec2 inputTextureCoordinate;
varying vec2 textureCoordinate;
void main() {
  gl_Position = position;
  textureCoordinate = inputTextureCoordinate;
}
`;

/**
 * Magnifier plus brightness.
 *
 * Inside the square region anchored at (pos_x, pos_y) with side `size`, the
 * shader samples from a position shifted by (dif_x, dif_y) instead of the
 * fragment's own — pulling another part of the scene into the box. Outside it,
 * the image passes through. Brightness scales the result either way.
 *
 * In the app, dif is derived as `off - pos`, so the offset is expressed as the
 * source region the box reads from. That relationship is preserved here.
 */
export const MAGNIFIER_SHADER = `
precision mediump float;
varying vec2 textureCoordinate;
uniform sampler2D s_texture;
uniform float size;
uniform float brightness;
uniform float pos_x;
uniform float pos_y;
uniform float dif_x;
uniform float dif_y;
void main(void) {
  if ((textureCoordinate.x > pos_x) && (textureCoordinate.x < pos_x + size) &&
      (textureCoordinate.y > pos_y) && (textureCoordinate.y < pos_y + size)) {
    vec2 position = textureCoordinate;
    position.x = position.x + dif_x;
    position.y = position.y + dif_y;
    gl_FragColor = texture2D(s_texture, position);
  } else {
    gl_FragColor = texture2D(s_texture, textureCoordinate);
  }
  gl_FragColor = brightness * gl_FragColor;
}
`;

/**
 * Colour inversion, from fragmentShaderCodeInverse. Inverting the channels
 * raises apparent contrast, which helps some kinds of low vision — light text
 * on dark tends to be far more legible than the reverse.
 */
export const INVERT_SHADER = `
precision mediump float;
varying vec2 textureCoordinate;
uniform sampler2D s_texture;
uniform float brightness;
void main() {
  vec4 color = texture2D(s_texture, textureCoordinate);
  float colorR = (1.0 - color.r) / 1.0;
  float colorG = (1.0 - color.g) / 1.0;
  float colorB = (1.0 - color.b) / 1.0;
  gl_FragColor = brightness * vec4(colorR, colorG, colorB, color.a);
}
`;

/** Uniform ranges, matching the clamps and defaults in MainActivity.java. */
export const UNIFORM_RANGES = {
  // MainActivity clamps brightness to [0.1, 2.0]; the same bounds apply here.
  brightness: { min: 0.1, max: 2, step: 0.05, default: 1 },
  size: { min: 0.05, max: 1, step: 0.01, default: 0.4 },
  pos_x: { min: 0, max: 1, step: 0.01, default: 0.3 },
  pos_y: { min: 0, max: 1, step: 0.01, default: 0.3 },
  /** Expressed in the UI as the source region, then converted to dif = off - pos. */
  off_x: { min: 0, max: 1, step: 0.01, default: 0.15 },
  off_y: { min: 0, max: 1, step: 0.01, default: 0.15 },
} as const;

export type UniformName = keyof typeof UNIFORM_RANGES;

export type UniformValues = Record<UniformName, number>;

export function defaultUniforms(): UniformValues {
  return {
    brightness: UNIFORM_RANGES.brightness.default,
    size: UNIFORM_RANGES.size.default,
    pos_x: UNIFORM_RANGES.pos_x.default,
    pos_y: UNIFORM_RANGES.pos_y.default,
    off_x: UNIFORM_RANGES.off_x.default,
    off_y: UNIFORM_RANGES.off_y.default,
  };
}

/** `dif_x = off_x - pos_x`, exactly as MainActivity computes it. */
export function toDif(values: UniformValues): { dif_x: number; dif_y: number } {
  return {
    dif_x: values.off_x - values.pos_x,
    dif_y: values.off_y - values.pos_y,
  };
}

/** Applies MainActivity's brightness clamp. */
export function clampBrightness(value: number): number {
  return Math.min(2, Math.max(0.1, value));
}
