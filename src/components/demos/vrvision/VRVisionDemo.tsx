"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import type { DemoComponentProps } from "../registry";
import { createRenderer, type Renderer, type ShaderMode } from "./renderer";
import {
  UNIFORM_RANGES,
  defaultUniforms,
  type UniformName,
  type UniformValues,
} from "./shaders";
import { cn } from "@/lib/utils";

const SAMPLE_IMAGE = "/images/demos/vrvision-sample.png";

type Source = "sample" | "camera";

/**
 * Runs VRVision's own fragment shaders in WebGL.
 *
 * The Cardboard headset experience cannot be reproduced in a browser, but the
 * image processing is the substance of the project, and it is the same GLSL
 * either way — so this is the real thing rather than a mockup of it.
 */
export function VRVisionDemo({ reducedMotion }: DemoComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleRef = useRef<HTMLImageElement | null>(null);
  // Read inside the animation loop, so changes must not restart it.
  const stateRef = useRef({
    mode: "magnifier" as ShaderMode,
    values: defaultUniforms(),
    source: "sample" as Source,
  });

  const [mode, setMode] = useState<ShaderMode>("magnifier");
  const [values, setValues] = useState<UniformValues>(defaultUniforms);
  const [source, setSource] = useState<Source>("sample");
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Kept in sync via an effect rather than assigned during render: writing a
  // ref while rendering is unsafe, and the loop only needs the latest value by
  // the time the next frame runs.
  useEffect(() => {
    stateRef.current = { mode, values, source };
  }, [mode, values, source]);

  // One render loop for the life of the demo; it reads current settings from
  // the ref rather than being torn down and rebuilt on every slider move.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: Renderer;
    try {
      renderer = createRenderer(canvas);
    } catch (cause) {
      // Reported asynchronously so the effect does not set state as it runs.
      const message = (cause as Error).message;
      queueMicrotask(() => setError(message));
      return;
    }
    rendererRef.current = renderer;
    renderer.resize(640, 480);

    const image = new Image();
    image.src = SAMPLE_IMAGE;
    image.onload = () => {
      sampleRef.current = image;
    };
    image.onerror = () => setError("Could not load the sample image");

    let frame = 0;
    const tick = () => {
      const { mode: currentMode, values: currentValues, source: currentSource } =
        stateRef.current;
      const video = videoRef.current;

      const usingCamera =
        currentSource === "camera" && video && video.readyState >= 2;
      const texture = usingCamera ? video : sampleRef.current;

      if (texture) {
        try {
          renderer.draw(texture, currentMode, currentValues);
        } catch {
          // A transient upload failure (a video frame not ready, for instance)
          // should drop the frame, not kill the loop.
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Release the camera when the demo unmounts, or the indicator light stays on.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setSource("camera");
    } catch (cause) {
      const name = (cause as DOMException).name;
      setCameraError(
        name === "NotAllowedError"
          ? "Camera permission was declined — the sample image still works."
          : "No camera available — the sample image still works.",
      );
      setSource("sample");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setSource("sample");
  }, []);

  if (error) {
    return (
      <div className="p-12 text-center text-sm text-neutral-600 dark:text-neutral-400">
        {error}
      </div>
    );
  }

  const sliders: UniformName[] =
    mode === "magnifier"
      ? ["brightness", "size", "pos_x", "pos_y", "off_x", "off_y"]
      : ["brightness"];

  const labels: Record<UniformName, string> = {
    brightness: "Brightness",
    size: "Magnifier size",
    pos_x: "Magnifier x",
    pos_y: "Magnifier y",
    off_x: "Source x",
    off_y: "Source y",
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Shader"
          className="inline-flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900"
        >
          {(
            [
              ["magnifier", "Magnifier"],
              ["invert", "Invert colours"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                mode === id
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {source === "camera" ? (
          <button
            type="button"
            onClick={stopCamera}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <CameraOff aria-hidden className="size-3.5" />
            Stop camera
          </button>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <Camera aria-hidden className="size-3.5" />
            Use my camera
          </button>
        )}
      </div>

      {cameraError && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          {cameraError}
        </p>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg bg-neutral-900"
            aria-label={
              mode === "magnifier"
                ? "Camera view with a magnified region"
                : "Camera view with colours inverted"
            }
          />
          {/* Source only; the canvas shows the processed result. */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="sr-only"
            aria-hidden
          />
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {source === "camera"
              ? "Live camera, processed in your browser — no video leaves your device."
              : "Sample image. Use your camera for the real thing."}
          </p>
        </div>

        <div className="w-full space-y-3 lg:w-64">
          {sliders.map((name) => {
            const range = UNIFORM_RANGES[name];
            return (
              <div key={name}>
                <label
                  htmlFor={`vr-${name}`}
                  className="mb-1 flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400"
                >
                  <span>{labels[name]}</span>
                  <span className="font-mono tabular-nums">
                    {values[name].toFixed(2)}
                  </span>
                </label>
                <input
                  id={`vr-${name}`}
                  type="range"
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  value={values[name]}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [name]: Number(event.target.value),
                    }))
                  }
                  className="w-full accent-neutral-900 dark:accent-neutral-100"
                />
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setValues(defaultUniforms())}
            className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Reset sliders
          </button>

          <p className="border-t border-neutral-200 pt-3 text-xs leading-relaxed text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            These are the app&apos;s own fragment shaders from MyShaders.java,
            running in WebGL. On the phone the same GLSL reads the camera through
            a samplerExternalOES and renders to both eyes of a Cardboard headset.
          </p>
          {reducedMotion && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              The view updates continuously while the camera is on.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
