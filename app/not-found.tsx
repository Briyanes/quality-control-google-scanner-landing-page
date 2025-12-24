'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #f9fafb, #ffffff, #f3f4f6)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px'
      }}>
        <h2 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '16px',
          margin: '0 0 16px 0'
        }}>
          404
        </h2>
        <h3 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px',
          margin: '0 0 8px 0'
        }}>
          Page Not Found
        </h3>
        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          margin: '0 0 24px 0'
        }}>
          The page you are looking for does not exist.
        </p>
        <Link
          href="/scanner"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: '8px',
            fontWeight: '600',
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Go to Scanner
        </Link>
      </div>
    </div>
  )
}
