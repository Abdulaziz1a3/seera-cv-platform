'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// Error reporting function - can be connected to Sentry or other services
function reportError(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error caught by boundary:', error);
        console.error('Error info:', errorInfo);
    }

    // Send to Sentry if configured
    if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureException: (error: Error, context?: object) => void } }).Sentry) {
        (window as unknown as { Sentry: { captureException: (error: Error, context?: object) => void } }).Sentry.captureException(error, {
            extra: {
                componentStack: errorInfo.componentStack,
            },
        });
    }

    // Send to custom error endpoint
    if (process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
        fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                componentStack: errorInfo.componentStack,
                url: typeof window !== 'undefined' ? window.location.href : '',
                timestamp: new Date().toISOString(),
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            }),
        }).catch(() => {
            // Silently fail if error reporting fails
        });
    }
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        reportError(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                        <p className="text-muted-foreground mb-6">
                            We apologize for the inconvenience. An error has occurred and our team has been notified.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-muted rounded-lg text-start overflow-auto max-h-40">
                                <p className="text-sm font-mono text-destructive">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <Button onClick={this.handleReset} variant="outline">
                                <RefreshCw className="h-4 w-4 me-2" />
                                Try Again
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard">
                                    <Home className="h-4 w-4 me-2" />
                                    Go Home
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component for easier use
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
