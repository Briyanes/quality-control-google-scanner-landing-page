'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

function ScannerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasAutoScanned, setHasAutoScanned] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/history')
      const data = await response.json()
      if (data.success) {
        setHistory(data.scans)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }, [])

  const handleAutoScan = useCallback(async (urlToScan: string) => {
    let targetUrl = urlToScan

    // Auto-add https:// if protocol is missing
    if (!targetUrl.match(/^https?:\/\//i)) {
      targetUrl = 'https://' + targetUrl
    }

    setUrl(targetUrl)
    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      })

      const data = await response.json()

      if (data.success) {
        setScanResult(data.scan)
        fetchHistory()
      } else {
        setError(data.error || 'Failed to scan landing page')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Scan error:', error)
    } finally {
      setScanning(false)
    }
  }, [fetchHistory])

  useEffect(() => {
    // Get URL from query params if available
    const urlParam = searchParams.get('url')
    if (urlParam && !hasAutoScanned) {
      const decodedUrl = decodeURIComponent(urlParam)
      setUrl(decodedUrl)
      setHasAutoScanned(true)
      // Auto-scan after component is mounted
      setTimeout(() => {
        handleAutoScan(decodedUrl)
      }, 200)
    }
    fetchHistory()
  }, [searchParams, hasAutoScanned, handleAutoScan, fetchHistory])

  const performScan = async (urlToScan?: string) => {
    let targetUrl = urlToScan || url

    if (!targetUrl.trim()) {
      setError('Please enter a URL')
      return
    }

    // Auto-add https:// if protocol is missing
    if (!targetUrl.match(/^https?:\/\//i)) {
      targetUrl = 'https://' + targetUrl
      // Update the URL state if we're using the state value
      if (!urlToScan) {
        setUrl(targetUrl)
      }
    }

    // Validate URL format
    try {
      new URL(targetUrl)
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)')
      return
    }

    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      })

      const data = await response.json()

      if (data.success) {
        setScanResult(data.scan)
        fetchHistory()
      } else {
        setError(data.error || 'Failed to scan landing page')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Scan error:', error)
    } finally {
      setScanning(false)
    }
  }

  const handleScan = () => {
    performScan()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10b981'
      case 'B': return '#3b82f6'
      case 'C': return '#f59e0b'
      case 'D': return '#f97316'
      case 'F': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getGradeLabel = (grade: string) => {
    switch (grade) {
      case 'A': return 'Excellent'
      case 'B': return 'Good'
      case 'C': return 'Fair'
      case 'D': return 'Poor'
      case 'F': return 'Fail'
      default: return 'N/A'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <i className="bi bi-check-circle-fill" style={{ color: '#10b981' }}></i>
      case 'fail':
        return <i className="bi bi-x-circle-fill" style={{ color: '#ef4444' }}></i>
      case 'warning':
        return <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f59e0b' }}></i>
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f9fafb, #ffffff, #f3f4f6)' }}>
      {/* Header */}
      <header
        className="floating-header"
        style={{
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: isScrolled
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e5e7eb',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        <div
          className="responsive-header"
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '24px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0,
              marginBottom: '4px'
            }}>
              QC Landing Page Scanner
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              Powered by <span style={{ fontWeight: '600' }}>Hadona Digital Media</span>
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <a
              href="https://hadona.id"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <Image
                src="/logo/logo-hadona.png"
                alt="Hadona Digital Media"
                width={200}
                height={80}
                className="responsive-header-logo"
                style={{
                  height: '80px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
              />
            </a>
          </div>
        </div>
      </header>

      <div className="header-spacer" style={{ height: '120px' }}></div>

      {/* Back to Home Button - Fixed Position */}
      <button
        className="back-to-home-fixed"
        onClick={() => router.push('/home')}
        style={{
          position: 'fixed',
          top: '120px',
          left: '24px',
          zIndex: 999,
          color: '#000000',
          background: '#ECDC43',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          padding: '10px 20px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 6px -1px rgba(236, 220, 67, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#d4c539'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(236, 220, 67, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ECDC43'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(236, 220, 67, 0.3)'
        }}
      >
        <i className="bi bi-arrow-left"></i>
        <span className="back-to-home-text">Back to Home</span>
      </button>

      {/* Main Content */}
      <main className="responsive-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px' }}>
        {/* Back to Home Button - Mobile Position */}
        <div className="back-to-home-mobile-container" style={{ display: 'none' }}>
          <button
            className="back-to-home-mobile"
            onClick={() => router.push('/home')}
            style={{
              color: '#000000',
              background: '#ECDC43',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              padding: '10px 20px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 6px -1px rgba(236, 220, 67, 0.3)',
              marginBottom: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d4c539'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(236, 220, 67, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ECDC43'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(236, 220, 67, 0.3)'
            }}
          >
            <i className="bi bi-arrow-left"></i>
            <span className="back-to-home-text">Back to Home</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="responsive-hero" style={{
          textAlign: 'center',
          marginBottom: '64px',
          padding: '64px 32px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
          borderRadius: '16px',
          border: '1px solid #e0f2fe'
        }}>
          <h1 style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '24px',
            lineHeight: '1.2'
          }}>
            Google Ads Landing Page<br />
            <span style={{ color: '#2563eb' }}>Quality Scanner</span>
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#4b5563',
            maxWidth: '700px',
            margin: '0 auto 32px auto',
            lineHeight: '1.6'
          }}>
            Validate your landing pages against Google Ads requirements. Get instant feedback on compliance, content quality, and user experience.
          </p>

          {/* URL Input */}
          <div style={{ maxWidth: '600px', margin: '0 auto 24px auto' }}>
            <div className="responsive-hero-input-container" style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '2px solid #e5e7eb',
              padding: '8px',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                className="responsive-hero-input"
                type="url"
                placeholder="Enter landing page URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={scanning}
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent'
                }}
              />
              <button
                className="responsive-hero-button"
                onClick={handleScan}
                disabled={scanning}
                style={{
                  padding: '16px 32px',
                  backgroundColor: scanning ? '#9ca3af' : '#2563eb',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: scanning ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                {scanning ? (
                  <>
                    <span className="loading" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                    Scanning...
                  </>
                ) : (
                  <>
                    <i className="bi bi-rocket-takeoff"></i>
                    Scan Now
                  </>
                )}
              </button>
            </div>
            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                borderLeft: '4px solid #ef4444',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '14px'
              }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '8px' }}></i>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Scan Results */}
        {scanResult && (
          <>
            {/* Score Card */}
            <div className="responsive-section scan-result-card" style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              padding: '32px',
              marginBottom: '32px'
            }}>
              <div className="scan-result-content" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '32px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 className="scan-result-title" style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: '0 0 8px 0'
                  }}>
                    Scan Results
                  </h3>
                  <p className="scan-result-url" style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {scanResult.url}
                  </p>
                </div>

                <div className="scan-result-stats" style={{
                  display: 'flex',
                  gap: '24px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="scan-result-score" style={{
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: getGradeColor(scanResult.grade),
                      lineHeight: 1
                    }}>
                      {scanResult.score}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginTop: '4px'
                    }}>
                      Score
                    </div>
                  </div>

                  <div className="scan-result-grade" style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: getGradeColor(scanResult.grade),
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    boxShadow: `0 10px 30px ${getGradeColor(scanResult.grade)}40`
                  }}>
                    <div className="scan-result-grade-letter" style={{
                      fontSize: '42px',
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}>
                      {scanResult.grade}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      marginTop: '2px'
                    }}>
                      {getGradeLabel(scanResult.grade)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div className="scan-result-number" style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#10b981',
                      lineHeight: 1
                    }}>
                      {[
                        ...Object.values(scanResult.requirements).flatMap((r: any) =>
                          r.requirements.filter((req: any) => req.status === 'pass')
                        )
                      ].length}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginTop: '4px'
                    }}>
                      Passed
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#ef4444',
                      lineHeight: 1
                    }}>
                      {[
                        ...Object.values(scanResult.requirements).flatMap((r: any) =>
                          r.requirements.filter((req: any) => req.status === 'fail')
                        )
                      ].length}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginTop: '4px'
                    }}>
                      Failed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirement Categories */}
            {Object.values(scanResult.requirements).map((category: any, idx: number) => (
              <div
                key={idx}
                className="responsive-section"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  padding: '32px',
                  marginBottom: '24px'
                }}
              >
                <div className="category-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #f3f4f6'
                }}>
                  <h3 className="category-title" style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    margin: 0
                  }}>
                    {category.categoryName}
                  </h3>
                  <div className="category-stats" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="category-score" style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      Score: {category.totalPoints}/{category.maxPoints}
                    </span>
                    <span className="category-passed" style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563'
                    }}>
                      {category.passed} passed
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {category.requirements.map((req: any, reqIdx: number) => (
                    <div
                      key={reqIdx}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: req.status === 'pass' ? '#f0fdf4' :
                                        req.status === 'fail' ? '#fef2f2' :
                                        '#fef3c7',
                        borderLeft: `4px solid ${req.status === 'pass' ? '#10b981' :
                                               req.status === 'fail' ? '#ef4444' :
                                               '#f59e0b'}`
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <div style={{ fontSize: '20px', marginTop: '2px' }}>
                          {getStatusIcon(req.status)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <h4 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#111827',
                              margin: 0
                            }}>
                              {req.name}
                            </h4>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: req.status === 'pass' ? '#d1fae5' :
                                              req.status === 'fail' ? '#fecaca' :
                                              '#fde68a',
                              color: req.status === 'pass' ? '#065f46' :
                                             req.status === 'fail' ? '#991b1b' :
                                             '#92400e'
                            }}>
                              {req.status.toUpperCase()}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '14px',
                            color: '#4b5563',
                            margin: '0 0 8px 0'
                          }}>
                            {req.description}
                          </p>
                          {req.evidence && (
                            <div style={{
                              padding: '8px 12px',
                              backgroundColor: 'rgba(0,0,0,0.05)',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#6b7280',
                              marginBottom: '8px',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all'
                            }}>
                              {req.evidence}
                            </div>
                          )}
                          {req.recommendation && (
                            <div style={{
                              padding: '8px 12px',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderRadius: '4px',
                              fontSize: '13px',
                              color: '#1e40af'
                            }}>
                              <i className="bi bi-lightbulb" style={{ marginRight: '6px' }}></i>
                              <strong>Recommendation:</strong> {req.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              marginBottom: '32px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  setUrl('')
                  setScanResult(null)
                  setError('')
                }}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Scan Another URL
              </button>
            </div>
          </>
        )}

        {/* Scan History */}
        {history.length > 0 && (
          <div className="responsive-section scan-history-container" style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '32px'
          }}>
            <h3 className="scan-history-title" style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '24px'
            }}>
              Recent Scans
            </h3>

            {/* Desktop Table */}
            <div className="scan-history-desktop">
              <table className="scan-history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    <th className="scan-history-th" style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>URL</th>
                    <th className="scan-history-th scan-history-th-center" style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Score</th>
                    <th className="scan-history-th scan-history-th-center" style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Grade</th>
                    <th className="scan-history-th" style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((scan) => (
                    <tr
                      key={scan.id}
                      className="scan-history-row"
                      style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                      onClick={() => {
                        setScanResult(scan.scan_results)
                        setUrl(scan.url)
                      }}
                    >
                      <td className="scan-history-td scan-history-url" style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                        {scan.url.length > 50 ? scan.url.substring(0, 50) + '...' : scan.url}
                      </td>
                      <td className="scan-history-td scan-history-td-center scan-history-score" style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {scan.score}
                      </td>
                      <td className="scan-history-td scan-history-td-center" style={{ padding: '12px', textAlign: 'center' }}>
                        <span className="scan-history-grade" style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: `${getGradeColor(scan.grade)}20`,
                          color: getGradeColor(scan.grade)
                        }}>
                          {scan.grade}
                        </span>
                      </td>
                      <td className="scan-history-td scan-history-date" style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                        {new Date(scan.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="scan-history-mobile" style={{ display: 'none' }}>
              {history.map((scan) => (
                <div
                  key={scan.id}
                  className="scan-history-card"
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setScanResult(scan.scan_results)
                    setUrl(scan.url)
                  }}
                >
                  <div className="scan-history-card-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div className="scan-history-card-grade" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: `${getGradeColor(scan.grade)}20`,
                        color: getGradeColor(scan.grade)
                      }}>
                        {scan.grade}
                      </span>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: getGradeColor(scan.grade)
                      }}>
                        {scan.score}
                      </span>
                    </div>
                    <span className="scan-history-card-date" style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {new Date(scan.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="scan-history-card-url" style={{
                    fontSize: '13px',
                    color: '#111827',
                    wordBreak: 'break-all',
                    lineHeight: '1.4'
                  }}>
                    {scan.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        marginTop: '48px'
      }}>
        <div className="responsive-footer" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px 48px',
          textAlign: 'center'
        }}>
          <p className="footer-line-1" style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 8px 0'
          }}>
            <span className="footer-text-1">© 2025 Quality Control Scanner. Powered by</span>
            <span className="footer-hadona" style={{ fontWeight: '600', color: '#2563eb', marginLeft: '4px' }}>
              Hadona Digital Media
            </span>
          </p>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: 0
          }}>
            Designed & Developed by <span style={{ fontWeight: '600', color: '#6b7280' }}>Briyanes</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function ScannerPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading scanner...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  )
}
