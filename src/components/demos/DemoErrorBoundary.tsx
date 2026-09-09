"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Bumped by the shell's reset button to clear a caught error. */
  resetToken: number;
  onRetry: () => void;
  sourceUrl?: string;
}

interface State {
  error: Error | null;
}

/**
 * Keeps a failing demo from taking down the whole project page. A demo is the
 * riskiest code on the site, so failure degrades to a card offering a retry and
 * a link to the source rather than a blank screen.
 */
export class DemoErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // A reset from the shell clears the error and remounts the demo.
    if (prev.resetToken !== this.props.resetToken && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 p-12 text-center">
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            This demo hit a snag.
          </p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            The rest of the page still works — you can retry or read the source.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.props.onRetry}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Try again
          </button>
          {this.props.sourceUrl && (
            <a
              href={this.props.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              View source
            </a>
          )}
        </div>
      </div>
    );
  }
}
