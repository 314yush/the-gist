import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { colors, fonts } from '../lib/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TheGist] Render crash:', error, info.componentStack);
  }

  handleRecover = () => {
    this.setState({ hasError: false });
  };

  handleClose = () => {
    window.close();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-[400px] bg-darker flex flex-col items-center justify-center p-6 text-center"
          style={{ color: colors.cream }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(188,95,64,0.1)', border: `1px solid ${colors.terracotta}40` }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              style={{ color: colors.terracotta }}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium mb-1" style={{ fontFamily: fonts.newsreader }}>
            Something went wrong
          </h3>
          <p className="text-[12px] text-white/50 mb-5 max-w-[80%]">
            The Gist ran into an unexpected error. You can try recovering or close and reopen.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRecover}
              className="px-4 py-2 rounded text-[12px] font-medium transition-all hover:opacity-90"
              style={{ background: colors.gold, color: colors.dark }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleClose}
              className="px-4 py-2 rounded text-[12px] text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
