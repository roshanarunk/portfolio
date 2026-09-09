import { describe, it, expect } from "vitest";
import {
  INVERT_SHADER,
  MAGNIFIER_SHADER,
  UNIFORM_RANGES,
  VERTEX_SHADER,
  clampBrightness,
  defaultUniforms,
  toDif,
} from "./shaders";

describe("shader source", () => {
  /**
   * The value of this demo is that it runs the app's real shaders. These
   * assertions pin the arithmetic to the Java original, so an "improvement"
   * that quietly diverges from MyShaders.java fails here.
   */
  it("keeps the magnifier's bounded region test", () => {
    expect(MAGNIFIER_SHADER).toContain("textureCoordinate.x > pos_x");
    expect(MAGNIFIER_SHADER).toContain("textureCoordinate.x < pos_x + size");
    expect(MAGNIFIER_SHADER).toContain("textureCoordinate.y > pos_y");
    expect(MAGNIFIER_SHADER).toContain("textureCoordinate.y < pos_y + size");
  });

  it("keeps the offset sampling inside the magnified region", () => {
    expect(MAGNIFIER_SHADER).toContain("position.x = position.x + dif_x");
    expect(MAGNIFIER_SHADER).toContain("position.y = position.y + dif_y");
  });

  it("applies brightness as a multiply, as the original does", () => {
    expect(MAGNIFIER_SHADER).toContain("brightness * gl_FragColor");
  });

  it("inverts each colour channel the way fragmentShaderCodeInverse does", () => {
    expect(INVERT_SHADER).toContain("(1.0 - color.r)");
    expect(INVERT_SHADER).toContain("(1.0 - color.g)");
    expect(INVERT_SHADER).toContain("(1.0 - color.b)");
    // Alpha passes through untouched.
    expect(INVERT_SHADER).toContain("color.a");
  });

  /**
   * The one deliberate change from the Android source: a browser cannot bind a
   * camera to samplerExternalOES, so the sampler is an ordinary sampler2D and
   * the OES extension pragma must not survive the port.
   */
  it("uses sampler2D rather than the Android external sampler", () => {
    for (const shader of [MAGNIFIER_SHADER, INVERT_SHADER]) {
      expect(shader).toContain("uniform sampler2D s_texture");
      expect(shader).not.toContain("samplerExternalOES");
      expect(shader).not.toContain("GL_OES_EGL_image_external");
    }
  });

  it("declares a precision, which WebGL requires of fragment shaders", () => {
    expect(MAGNIFIER_SHADER).toContain("precision mediump float");
    expect(INVERT_SHADER).toContain("precision mediump float");
  });

  it("passes the texture coordinate through the vertex shader unchanged", () => {
    expect(VERTEX_SHADER).toContain("gl_Position = position");
    expect(VERTEX_SHADER).toContain("textureCoordinate = inputTextureCoordinate");
  });

  it("declares every uniform the renderer sets", () => {
    for (const name of ["size", "brightness", "pos_x", "pos_y", "dif_x", "dif_y"]) {
      expect(MAGNIFIER_SHADER, name).toContain(`uniform float ${name}`);
    }
    expect(INVERT_SHADER).toContain("uniform float brightness");
  });
});

describe("toDif", () => {
  /** MainActivity computes dif = off - pos; the sign matters. */
  it("derives the offset difference the way MainActivity does", () => {
    const values = { ...defaultUniforms(), pos_x: 0.3, pos_y: 0.4, off_x: 0.1, off_y: 0.9 };
    expect(toDif(values)).toEqual({
      dif_x: 0.1 - 0.3,
      dif_y: 0.9 - 0.4,
    });
  });

  it("is zero when the source region matches the magnifier position", () => {
    const values = { ...defaultUniforms(), pos_x: 0.5, pos_y: 0.5, off_x: 0.5, off_y: 0.5 };
    const { dif_x, dif_y } = toDif(values);
    expect(dif_x).toBeCloseTo(0, 10);
    expect(dif_y).toBeCloseTo(0, 10);
  });
});

describe("clampBrightness", () => {
  /** MainActivity clamps to [0.1, 2.0] before handing the value to GL. */
  it("clamps to the range the app enforces", () => {
    expect(clampBrightness(-5)).toBe(0.1);
    expect(clampBrightness(0.05)).toBe(0.1);
    expect(clampBrightness(1)).toBe(1);
    expect(clampBrightness(2.5)).toBe(2);
  });
});

describe("UNIFORM_RANGES", () => {
  it("keeps brightness within the app's own clamp", () => {
    expect(UNIFORM_RANGES.brightness.min).toBe(0.1);
    expect(UNIFORM_RANGES.brightness.max).toBe(2);
  });

  it("gives every uniform a default inside its range", () => {
    for (const [name, range] of Object.entries(UNIFORM_RANGES)) {
      expect(range.default, name).toBeGreaterThanOrEqual(range.min);
      expect(range.default, name).toBeLessThanOrEqual(range.max);
      expect(range.step, name).toBeGreaterThan(0);
    }
  });

  it("keeps texture-coordinate uniforms inside the unit square", () => {
    for (const name of ["size", "pos_x", "pos_y", "off_x", "off_y"] as const) {
      expect(UNIFORM_RANGES[name].min, name).toBeGreaterThanOrEqual(0);
      expect(UNIFORM_RANGES[name].max, name).toBeLessThanOrEqual(1);
    }
  });

  it("starts with a magnifier that is visible but not full-frame", () => {
    const defaults = defaultUniforms();
    expect(defaults.size).toBeGreaterThan(0.1);
    expect(defaults.size).toBeLessThan(1);
    // The default box must fit inside the frame.
    expect(defaults.pos_x + defaults.size).toBeLessThanOrEqual(1);
    expect(defaults.pos_y + defaults.size).toBeLessThanOrEqual(1);
  });

  it("starts with a non-zero offset so the magnifier visibly does something", () => {
    const { dif_x, dif_y } = toDif(defaultUniforms());
    expect(Math.abs(dif_x) + Math.abs(dif_y)).toBeGreaterThan(0);
  });
});
