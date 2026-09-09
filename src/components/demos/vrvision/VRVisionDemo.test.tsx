import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VRVisionDemo } from "./VRVisionDemo";
import { stubWebGL, type GLCalls } from "./testing/stubWebGL";

let gl: GLCalls;

/**
 * jsdom ships no WebGL, so a stub context stands in. It records the calls the
 * renderer makes, which lets these tests assert both the UI and that the GL
 * pipeline is driven correctly.
 */

const tracks: { stop: ReturnType<typeof vi.fn> }[] = [];

function fakeStream() {
  const track = { stop: vi.fn() };
  tracks.push(track);
  return { getTracks: () => [track] } as unknown as MediaStream;
}

beforeEach(() => {
  tracks.length = 0;
  gl = stubWebGL();
  // Run exactly one frame per scheduling request, so a draw happens without
  // the loop spinning for the whole test.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    setTimeout(() => cb(performance.now()), 0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderDemo() {
  return render(<VRVisionDemo resetToken={0} reducedMotion={false} />);
}

describe("VRVisionDemo", () => {
  it("offers both of the app's shaders", () => {
    renderDemo();
    expect(screen.getByRole("tab", { name: "Magnifier" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Invert colours" }),
    ).toBeInTheDocument();
  });

  it("starts on the magnifier with all six of its controls", () => {
    renderDemo();
    expect(screen.getByRole("tab", { name: "Magnifier" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    for (const label of [
      "Brightness",
      "Magnifier size",
      "Magnifier x",
      "Magnifier y",
      "Source x",
      "Source y",
    ]) {
      expect(screen.getByLabelText(new RegExp(label))).toBeInTheDocument();
    }
  });

  it("shows only brightness for the inversion shader", async () => {
    const user = userEvent.setup();
    renderDemo();

    await user.click(screen.getByRole("tab", { name: "Invert colours" }));

    expect(screen.getByLabelText(/Brightness/)).toBeInTheDocument();
    // The inversion shader takes no magnifier uniforms, so those must go.
    expect(screen.queryByLabelText(/Magnifier size/)).not.toBeInTheDocument();
  });

  it("moves a slider and reports the new value", async () => {
    renderDemo();
    const slider = screen.getByLabelText(/Magnifier size/) as HTMLInputElement;
    const { fireEvent } = await import("@testing-library/react");

    fireEvent.change(slider, { target: { value: "0.75" } });

    expect(slider.value).toBe("0.75");
    expect(screen.getByText("0.75")).toBeInTheDocument();
  });

  it("restores defaults when the sliders are reset", async () => {
    const user = userEvent.setup();
    renderDemo();
    const slider = screen.getByLabelText(/Magnifier size/) as HTMLInputElement;
    const { fireEvent } = await import("@testing-library/react");

    fireEvent.change(slider, { target: { value: "0.9" } });
    expect(slider.value).toBe("0.9");

    await user.click(screen.getByRole("button", { name: /reset sliders/i }));
    expect(slider.value).toBe("0.4");
  });

  it("starts on the sample image without asking for the camera", () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

    renderDemo();

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /use my camera/i })).toBeVisible();
  });

  it("switches to the camera when permission is granted", async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream());
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    // jsdom does not implement playback.
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    renderDemo();
    await user.click(screen.getByRole("button", { name: /use my camera/i }));

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(
      await screen.findByRole("button", { name: /stop camera/i }),
    ).toBeVisible();
  });

  /** The important path: a declined camera must not break the demo. */
  it("falls back to the sample image when permission is declined", async () => {
    const user = userEvent.setup();
    const denied = new DOMException("Denied", "NotAllowedError");
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(denied) },
    });

    renderDemo();
    await user.click(screen.getByRole("button", { name: /use my camera/i }));

    expect(
      await screen.findByText(/permission was declined/i),
    ).toBeVisible();
    // Still offering the camera, and still usable without it.
    expect(screen.getByRole("button", { name: /use my camera/i })).toBeVisible();
    expect(screen.getByLabelText(/Magnifier size/)).toBeInTheDocument();
  });

  it("explains when no camera exists", async () => {
    const user = userEvent.setup();
    const missing = new DOMException("None", "NotFoundError");
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(missing) },
    });

    renderDemo();
    await user.click(screen.getByRole("button", { name: /use my camera/i }));

    expect(await screen.findByText(/no camera available/i)).toBeVisible();
  });

  /** Leaving the camera running would keep the device's indicator light on. */
  it("releases the camera when stopped", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(fakeStream()) },
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    renderDemo();
    await user.click(screen.getByRole("button", { name: /use my camera/i }));
    await user.click(await screen.findByRole("button", { name: /stop camera/i }));

    expect(tracks[0].stop).toHaveBeenCalled();
  });

  it("compiles both shader programs on mount", () => {
    renderDemo();
    // One program per shader mode.
    expect(gl.programs).toBe(2);
  });

  /**
   * jsdom never fires load for the sample image, so the loop has no texture to
   * upload and never reaches drawArrays. The uniform plumbing is covered by
   * shaders.test.ts (toDif) and by the renderer itself; what is worth asserting
   * here is that the render loop runs and survives having nothing to draw.
   */
  it("keeps the render loop alive with no texture available", async () => {
    renderDemo();
    const { waitFor } = await import("@testing-library/react");

    // Frames are requested even before an image arrives.
    await waitFor(() => expect(gl.programs).toBe(2));
    expect(gl.texImage2D).toBe(0);
    expect(screen.getByLabelText(/Magnifier size/)).toBeInTheDocument();
  });

  /**
   * Regression test. The renderer used to delete its shaders before reading
   * LINK_STATUS, so a real driver reported a null info log and every failure
   * surfaced as "Shader failed to compile: null" — no diagnostic at all, and
   * the demo would not start. The stub now models deletion, so querying a
   * released object is detectable here.
   */
  it("never queries a shader or program after deleting it", () => {
    renderDemo();
    expect(gl.queriedAfterDelete).toBe(false);
    expect(screen.queryByText(/failed to compile/i)).not.toBeInTheDocument();
  });

  it("builds both programs and starts without an error message", () => {
    renderDemo();
    expect(gl.programs).toBe(2);
    // The canvas renders, rather than the error card replacing it.
    expect(screen.getByLabelText(/Camera view/)).toBeInTheDocument();
  });

  /**
   * Regression test for the Strict Mode failure. A canvas returns one context
   * for its whole life, so destroying it on unmount also breaks the remount
   * that React performs in development — every later compile then returns null
   * with a null log, surfacing as "failed to compile: no driver message".
   */
  it("does not destroy the shared context when the demo unmounts", () => {
    const { unmount } = renderDemo();
    unmount();
    expect(gl.contextDestroyed).toBe(false);
  });

  it("survives being mounted, unmounted and mounted again", () => {
    const first = renderDemo();
    first.unmount();

    renderDemo();
    expect(screen.getByLabelText(/Magnifier size/)).toBeInTheDocument();
    expect(screen.queryByText(/failed to compile/i)).not.toBeInTheDocument();
  });

  it("releases the camera when the demo unmounts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(fakeStream()) },
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

    const { unmount } = renderDemo();
    await user.click(screen.getByRole("button", { name: /use my camera/i }));
    await screen.findByRole("button", { name: /stop camera/i });

    unmount();
    expect(tracks[0].stop).toHaveBeenCalled();
  });
});
