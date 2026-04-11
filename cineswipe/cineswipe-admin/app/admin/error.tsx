'use client';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 16,
        }}>
            <div style={{
                fontSize: 48,
                marginBottom: 8,
            }}>
                ⚠️
            </div>
            <h2 style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--text-primary)',
            }}>
                Something went wrong
            </h2>
            <p style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                maxWidth: 400,
            }}>
                {error.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
                className="btn btn-primary"
                onClick={reset}
                style={{ marginTop: 8 }}
            >
                🔄 Try Again
            </button>
        </div>
    );
}
