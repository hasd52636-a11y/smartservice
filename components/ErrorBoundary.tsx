import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo: errorInfo.componentStack || null });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/admin/dashboard';
  };

  handleCopyError = (): void => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack: ${this.state.errorInfo}`;
    navigator.clipboard.writeText(errorText);
    alert('错误信息已复制到剪贴板');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] flex flex-col items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-[3rem] border-2 border-red-500/30 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h1 className="text-2xl font-black text-red-800 mb-4">系统错误</h1>
              <p className="text-slate-600 text-center mb-4">
                系统遇到了一个错误，请尝试刷新页面或返回首页。
              </p>

              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-red-800 font-medium mb-2">
                    <strong>错误信息：</strong>
                  </p>
                  <p className="text-xs text-red-700 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 py-3 px-6 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors"
              >
                <RefreshCw size={18} />
                刷新页面
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 py-3 px-6 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
              >
                <Home size={18} />
                返回首页
              </button>
            </div>

            <button
              onClick={this.handleCopyError}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-slate-500 text-sm hover:text-slate-700 transition-colors"
            >
              <Copy size={14} />
              复制错误信息
            </button>

            <div className="border-t border-red-200 pt-6 mt-6">
              <p className="text-xs text-slate-500 text-center">
                系统版本：AI虚拟客服 v1.0.0
              </p>
              <p className="text-xs text-slate-500 text-center mt-1">
                错误时间：{new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
