'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleQuickScan = () => {
    if (url.trim()) {
      router.push(`/scanner?url=${encodeURIComponent(url)}`)
    } else {
      router.push('/scanner')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f9fafb, #ffffff, #f3f4f6)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header className="floating-header" style={{
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
      }}>
        <div className="responsive-header" style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link href="/home" style={{ textDecoration: 'none', cursor: 'pointer' }}>
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
          </Link>
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

      {/* Spacer for fixed header */}
      <div className="header-spacer" style={{ height: '120px' }}></div>

      {/* Main Content */}
      <main className="responsive-container" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px'
      }}>
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
            Validasikan Landing Page Anda<br />
            <span style={{ color: '#2563eb' }}>Untuk Kepatuhan Google Ads</span>
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#4b5563',
            maxWidth: '700px',
            margin: '0 auto 32px auto',
            lineHeight: '1.6'
          }}>
            Scan landing page Anda secara instan dan dapatkan laporan detail dengan analisis bertenaga AI.
            Hindari penolakan dan pastikan iklan Anda berjalan lancar!
          </p>

          {/* Quick Scan Input */}
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
                placeholder="Masukkan URL landing page Anda (cth: https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleQuickScan()
                }}
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
                onClick={handleQuickScan}
                style={{
                  padding: '16px 32px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="bi bi-rocket-takeoff"></i>
                Mulai Scan
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="responsive-statistics" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#2563eb',
              marginBottom: '8px'
            }}>
              50+
            </div>
            <div style={{
              fontSize: '16px',
              color: '#4b5563',
              fontWeight: '600'
            }}>
              Persyaratan Google Ads Diperiksa
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '8px'
            }}>
              10-30s
            </div>
            <div style={{
              fontSize: '16px',
              color: '#4b5563',
              fontWeight: '600'
            }}>
              Rata-rata Waktu Scan
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: '8px'
            }}>
              0-100
            </div>
            <div style={{
              fontSize: '16px',
              color: '#4b5563',
              fontWeight: '600'
            }}>
              Skor Kepatuhan
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '8px'
            }}>
              100%
            </div>
            <div style={{
              fontSize: '16px',
              color: '#4b5563',
              fontWeight: '600'
            }}>
              Gratis & Tanpa Batas
            </div>
          </div>
        </div>

        {/* What We Check Section */}
        <div className="responsive-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          border: '1px solid #e5e7eb',
          marginBottom: '48px'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Yang Kami Periksa
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '700px',
            margin: '0 auto 48px auto'
          }}>
            Analisis komprehensif berdasarkan persyaratan Landing Page Google Ads
          </p>

          <div className="responsive-grid-2" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '32px'
          }}>
            {/* Domain & Redirect */}
            <div style={{
              padding: '28px',
              backgroundColor: '#2B46BB',
              borderRadius: '12px',
              border: '2px solid #2B46BB',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-globe" style={{ color: '#ffffff' }}></i>
                Domain & Redirect
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#ffffff',
                lineHeight: '1.8'
              }}>
                <li>Verifikasi kepemilikan domain</li>
                <li>Tidak ada redirect pihak ketiga</li>
                <li>Pemeriksaan konsistensi URL</li>
                <li>Analisis rantai redirect</li>
              </ul>
            </div>

            {/* Content Originality */}
            <div style={{
              padding: '28px',
              backgroundColor: '#2B46BB',
              borderRadius: '12px',
              border: '2px solid #2B46BB',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-file-earmark-text" style={{ color: '#ffffff' }}></i>
                Orisinalitas Konten
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#ffffff',
                lineHeight: '1.8'
              }}>
                <li>Deteksi konten unik</li>
                <li>Pemeriksaan duplikat bertenaga AI</li>
                <li>Penilaian kualitas konten</li>
                <li>Deteksi tidak ada arbitrase</li>
              </ul>
            </div>

            {/* Form Integration */}
            <div style={{
              padding: '28px',
              backgroundColor: '#2B46BB',
              borderRadius: '12px',
              border: '2px solid #2B46BB',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-input-cursor-text" style={{ color: '#ffffff' }}></i>
                Integrasi Formulir
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#ffffff',
                lineHeight: '1.8'
              }}>
                <li>Pemeriksaan formulir tersemat</li>
                <li>Tidak ada redirect formulir eksternal</li>
                <li>Validasi UX konsisten</li>
                <li>Analisis aksi formulir</li>
              </ul>
            </div>

            {/* Footer & Company */}
            <div style={{
              padding: '28px',
              backgroundColor: '#2B46BB',
              borderRadius: '12px',
              border: '2px solid #2B46BB',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-building" style={{ color: '#ffffff' }}></i>
                Footer & Perusahaan
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#ffffff',
                lineHeight: '1.8'
              }}>
                <li>Pemeriksaan keberadaan footer</li>
                <li>Informasi perusahaan</li>
                <li>Link kebijakan privasi</li>
                <li>Link syarat ketentuan layanan</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="responsive-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          border: '1px solid #e5e7eb',
          marginBottom: '48px'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Cara Kerja
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '700px',
            margin: '0 auto 48px auto'
          }}>
            Proses 4 langkah sederhana untuk memvalidasi landing page Anda
          </p>

          <div className="responsive-workflow" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            {/* Step 1 */}
            <div style={{
              flex: '1',
              minWidth: '220px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '3px solid #3b82f6',
                position: 'relative'
              }}>
                <i className="bi bi-link-45deg" style={{ fontSize: '32px', color: '#2563eb' }}></i>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid #ffffff'
                }}>
                  1
                </div>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Masukkan URL
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Tempel URL landing page yang ingin Anda validasi
              </p>
            </div>

            {/* Arrow */}
            <div className="arrow" style={{ fontSize: '24px', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
              <i className="bi bi-arrow-right"></i>
            </div>

            {/* Step 2 */}
            <div style={{
              flex: '1',
              minWidth: '220px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#f0fdf4',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '3px solid #10b981',
                position: 'relative'
              }}>
                <i className="bi bi-robot" style={{ fontSize: '32px', color: '#059669' }}></i>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid #ffffff'
                }}>
                  2
                </div>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Analisis AI
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                AI kami memindai LP Anda dan memeriksa semua persyaratan Google Ads
              </p>
            </div>

            {/* Arrow */}
            <div className="arrow" style={{ fontSize: '24px', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
              <i className="bi bi-arrow-right"></i>
            </div>

            {/* Step 3 */}
            <div style={{
              flex: '1',
              minWidth: '220px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#fef3c7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '3px solid #f59e0b',
                position: 'relative'
              }}>
                <i className="bi bi-clipboard-data" style={{ fontSize: '32px', color: '#d97706' }}></i>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid #ffffff'
                }}>
                  3
                </div>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Dapatkan Laporan
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Terima skor (0-100), nilai (A-F), dan breakdown detail
              </p>
            </div>

            {/* Arrow */}
            <div className="arrow" style={{ fontSize: '24px', color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
              <i className="bi bi-arrow-right"></i>
            </div>

            {/* Step 4 */}
            <div style={{
              flex: '1',
              minWidth: '220px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#fce7f3',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                border: '3px solid #ec4899',
                position: 'relative'
              }}>
                <i className="bi bi-tools" style={{ fontSize: '32px', color: '#db2777' }}></i>
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '28px',
                  height: '28px',
                  backgroundColor: '#ec4899',
                  color: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: '2px solid #ffffff'
                }}>
                  4
                </div>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Perbaiki Masalah
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Ikuti rekomendasi untuk memperbaiki masalah dan meningkatkan kepatuhan
              </p>
            </div>
          </div>
        </div>

        {/* What You Get - Result Preview */}
        <div className="responsive-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          border: '1px solid #e5e7eb',
          marginBottom: '48px'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Yang Anda Dapatkan
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '700px',
            margin: '0 auto 48px auto'
          }}>
            Laporan komprehensif dengan wawasan yang dapat ditindaklanjuti
          </p>

          <div className="responsive-grid-2" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '32px'
          }}>
            {/* Score Card */}
            <div className="result-card" style={{
              padding: '32px',
              backgroundColor: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              border: '2px solid #86efac',
              textAlign: 'center'
            }}>
              <div className="result-card-score" style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#10b981',
                marginBottom: '8px'
              }}>
                0-100
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Skor Keseluruhan
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Dapatkan skor komprehensif berdasarkan semua persyaratan Google Ads
              </p>
            </div>

            {/* Grade Card */}
            <div className="result-card" style={{
              padding: '32px',
              backgroundColor: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '12px',
              border: '2px solid #93c5fd',
              textAlign: 'center'
            }}>
              <div className="result-card-score" style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#2563eb',
                marginBottom: '8px'
              }}>
                A-F
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Nilai Huruf
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Nilai yang mudah dipahami dari A (Sangat Baik) hingga F (Gagal)
              </p>
            </div>

            {/* Breakdown Card */}
            <div className="result-card" style={{
              padding: '32px',
              backgroundColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '12px',
              border: '2px solid #fcd34d',
              textAlign: 'center'
            }}>
              <div className="result-card-icon" style={{
                fontSize: '48px',
                marginBottom: '8px'
              }}>
                <i className="bi bi-list-check" style={{ color: '#d97706' }}></i>
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Breakdown Kategori
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Analisis detail untuk setiap kategori persyaratan
              </p>
            </div>

            {/* Recommendations Card */}
            <div className="result-card" style={{
              padding: '32px',
              backgroundColor: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
              borderRadius: '12px',
              border: '2px solid #c4b5fd',
              textAlign: 'center'
            }}>
              <div className="result-card-icon" style={{
                fontSize: '48px',
                marginBottom: '8px'
              }}>
                <i className="bi bi-lightbulb" style={{ color: '#9333ea' }}></i>
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Rekomendasi
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Langkah yang dapat ditindaklanjuti untuk memperbaiki masalah dan meningkatkan kepatuhan
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="responsive-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          border: '1px solid #e5e7eb',
          marginBottom: '48px'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Mengapa Menggunakan Tool Ini?
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '700px',
            margin: '0 auto 48px auto'
          }}>
            Hemat waktu dan hindari kesalahan mahal dengan kampanye Google Ads Anda
          </p>

          <div className="responsive-grid-4" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '32px'
          }}>
            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-lightning-fill" style={{ color: '#2563eb' }}></i>
                Hasil Cepat
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Dapatkan analisis komprehensif dalam hitungan detik, bukan jam
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-shield-check" style={{ color: '#10b981' }}></i>
                Hindari Penolakan
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Tangkap masalah sebelum Google Ads meninjau landing page Anda
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-robot" style={{ color: '#9333ea' }}></i>
                Analisis Bertenaga AI
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                AI canggih menganalisis kualitas dan orisinalitas konten
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-wallet2" style={{ color: '#f59e0b' }}></i>
                Gratis Digunakan
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Tool 100% gratis untuk memvalidasi landing page tanpa batas
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="responsive-section" style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          border: '1px solid #e5e7eb',
          marginBottom: '48px'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Pertanyaan yang Sering Diajukan
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Semua yang perlu Anda ketahui tentang QC Scanner
          </p>

          <div className="responsive-faq" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-question-circle" style={{ color: '#2563eb' }}></i>
                Persyaratan Google Ads apa saja yang Anda periksa?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Kami memeriksa kepemilikan domain, rantai redirect, orisinalitas konten, integrasi formulir, footer dengan info perusahaan, dan link halaman kebijakan - semua berdasarkan persyaratan resmi Google Ads.
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-clock" style={{ color: '#10b981' }}></i>
                Berapa lama waktu scan?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Sebagian besar scan selesai dalam 10-30 detik tergantung ukuran dan kompleksitas landing page. Analisis AI dilakukan secara real-time.
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-graph-up" style={{ color: '#f59e0b' }}></i>
                Apa artinya nilai tersebut?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Nilai A (90-100) = Sangat Baik, B (80-89) = Baik, C (70-79) = Cukup, D (60-69) = Kurang, F (0-59) = Gagal. Ikuti rekomendasi untuk meningkatkan nilai Anda.
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-shield-lock" style={{ color: '#9333ea' }}></i>
                Apakah data saya disimpan?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#4b5563',
                margin: 0,
                lineHeight: '1.6'
              }}>
                Kami menyimpan hasil scan selama 24 jam untuk meningkatkan performa. Anda dapat menghapus riwayat scan kapan saja. Konten landing page Anda dianalisis secara aman.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges & Support Section */}
        <div className="responsive-trust" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '12px'
        }}>
          {/* Trust Badges */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '32px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Kepercayaan & Keamanan
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <i className="bi bi-shield-check" style={{ fontSize: '24px', color: '#10b981' }}></i>
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px',
                    fontSize: '14px'
                  }}>
                    Aman & Privat
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    Data Anda diproses secara aman
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <i className="bi bi-database-x" style={{ fontSize: '24px', color: '#2563eb' }}></i>
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px',
                    fontSize: '14px'
                  }}>
                    Tidak Ada Penyimpanan Data
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    File hanya diproses sesuai permintaan
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <i className="bi bi-building" style={{ fontSize: '24px', color: '#9333ea' }}></i>
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px',
                    fontSize: '14px'
                  }}>
                    Powered by <span style={{ fontWeight: '600' }}>Hadona Digital Media</span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    Agensi pemasaran digital terpercaya
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Contact */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '32px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Butuh Bantuan?
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <a href="mailto:support@hadona.id" className="social-link" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="bi bi-envelope" style={{ fontSize: '24px', color: '#2563eb' }}></i>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      Dukungan Email
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      support@hadona.id
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://wa.me/6285158000123" target="_blank" rel="noopener noreferrer" className="social-link" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="bi bi-whatsapp" style={{ fontSize: '24px', color: '#25d366' }}></i>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      WhatsApp
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      +62 851 5800 0123
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Follow Us */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '32px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Ikuti Kami
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <a href="https://www.instagram.com/hadona.id" target="_blank" rel="noopener noreferrer" className="social-link" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="bi bi-instagram" style={{ fontSize: '24px', color: '#ec4899' }}></i>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      Media Sosial
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      @hadona.id
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://www.linkedin.com/company/pt-hadona-digital-media/" target="_blank" rel="noopener noreferrer" className="social-link" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="bi bi-linkedin" style={{ fontSize: '24px', color: '#0077b5' }}></i>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      LinkedIn
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      PT. Hadona Digital Media
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61552533756847" target="_blank" rel="noopener noreferrer" className="social-link" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="bi bi-facebook" style={{ fontSize: '24px', color: '#1877f2' }}></i>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      Facebook
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      Hadona Digital Media
                    </div>
                  </div>
                </div>
              </a>
              <a href="https://www.tiktok.com/@hadona.id" target="_blank" rel="noopener noreferrer" className="social-link" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="bi bi-tiktok" style={{ fontSize: '24px', color: '#000000' }}></i>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      TikTok
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      @hadona.id
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="responsive-cta-section" style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          borderRadius: '16px',
          padding: '64px 48px',
          marginTop: '48px',
          marginBottom: '0px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.3)'
        }}>
          <h2 className="responsive-cta-heading" style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '16px'
          }}>
            Siap Memvalidasi Landing Page Anda?
          </h2>
          <p className="cta-description-single-line" style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '600px',
            margin: '0 auto 32px auto',
            lineHeight: '1.6'
          }}>
            Mulai scan sekarang dan pastikan kampanye Google Ads Anda berjalan lancar tanpa masalah kepatuhan
          </p>
          <button
            className="responsive-cta-button"
            onClick={() => router.push('/scanner')}
            style={{
              padding: '18px 40px',
              fontSize: '18px',
              fontWeight: '600',
              backgroundColor: '#ffffff',
              color: '#2563eb',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <i className="bi bi-rocket-takeoff" style={{ marginRight: '8px' }}></i>
            Mulai Scan Sekarang
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        marginTop: '48px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px 48px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 8px 0'
          }}>
            <span>© 2025 QC Landing Page Scanner. Powered by</span>
            <span style={{ fontWeight: '600', color: '#2563eb', marginLeft: '4px' }}>
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
