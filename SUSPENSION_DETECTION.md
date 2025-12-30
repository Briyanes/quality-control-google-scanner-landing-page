# Deteksi Risiko Suspend Google Ads

## Ringkasan

Fitur ini mendeteksi 5 jenis pelanggaran umum yang menyebabkan suspend akun Google Ads. Sistem menggunakan pendekatan 3-tier (Tier 1, 2, 3) untuk analisis komprehensif.

## 5 Jenis Suspend yang Dicek

### 1. Circumventing Systems: Multiple Account Abuse (10 poin)

**Deskripsi**: Mendeteksi pola penggunaan multiple account untuk menghindari suspend.

**Pengecekan**:
- ✅ Pola redirect domain baru → domain lama
- ✅ Email yang sama di banyak landing page
- ✅ Gambar yang sama di landing page berbeda
- ✅ Domain yang sama dipakai di banyak akun

**Teknologi**:
- Tier 1: Rule-based redirect analysis
- Tier 2: Database cross-referencing
- Tier 3: AI pattern recognition

---

### 2. Unacceptable Business Practice (12 poin)

**Deskripsi**: Mendeteksi praktik bisnis yang tidak dapat diterima oleh Google Ads.

**Pengecekan**:
- ✅ Gambar organ tubuh (produk kesehatan)
- ✅ Homepage tidak sesuai dengan URL
- ✅ Jualan senjata/barang ilegal
- ✅ Gambar medis/dokter/alat kesehatan
- ✅ Promosi agama berlebihan pada produk
- ✅ Pura-pura terafiliasi dengan brand besar
- ✅ Info perusahaan kurang detail

**Teknologi**:
- Tier 1: Keyword matching, URL analysis
- Tier 2: Historical data comparison
- Tier 3: Vision AI (gambar), Text AI (konten)

---

### 3. Impersonasi Figur Publik (5 poin)

**Deskripsi**: Mendeteksi penggunaan foto/nama figur publik tanpa izin.

**Pengecekan**:
- ✅ Foto figur publik (artis, selebriti, tokoh)
- ✅ Klaim dukungan/endorsemen palsu

**Teknologi**:
- Tier 1: Text-based celebrity name detection
- Tier 2: N/A
- Tier 3: Vision AI face recognition

---

### 4. Circumventing Systems: Teknis (13 poin)

**Deskripsi**: Mendeteksi teknik manipulasi teknis untuk menghindari deteksi.

**Pengecekan**:
- ✅ Cloaking (konten beda untuk bot vs manusia)
- ✅ URL tersembunyi dalam gambar
- ✅ Auto-redirect ke domain lain
- ✅ Terlalu banyak gambar (>50)
- ✅ Info perusahaan tidak ada

**Teknologi**:
- Tier 1: HTML parsing, pattern matching
- Tier 2: N/A
- Tier 3: Multi-user-agent comparison, AI cloaking detection

---

### 5. Counterfeit Goods (10 poin)

**Deskripsi**: Mendeteksi penjualan barang palsu/kw dan pelanggaran hak cipta.

**Pengecekan**:
- ✅ Foto produk brand (tanpa izin)
- ✅ Logo brand (tanpa izin)
- ✅ Klaim toko official/resmi palsu
- ✅ Deteksi nama brand terkenal

**Teknologi**:
- Tier 1: Brand keyword detection, domain verification
- Tier 2: Image hash duplication detection
- Tier 3: Vision AI logo recognition

---

## Arsitektur Sistem

### Pendekatan 3-Tier

```
┌─────────────────────────────────────────────────────────────┐
│                     ANALISIS SUSPEND                         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐         ┌───▼────┐
   │ Tier 1  │          │  Tier 2   │         │ Tier 3 │
   │  Rule   │          │ Database  │         │   AI   │
   │  Based  │          │           │         │        │
   └────┬────┘          └─────┬─────┘         └───┬────┘
        │                    │                    │
        │                ┌───▼────┐              │
        │                │ Supabase│              │
        │                └────────┘              │
        │                                        │
        └────────────────────────────────────────┘
                         │
                  ┌──────▼──────┐
                  │  Hasil Gabungan│
                  └───────────────┘
```

### Tier 1: Rule-Based (Selalu Aktif)

Pengecekan yang tidak memerlukan external dependencies:

- ✅ Redirect chain analysis
- ✅ Keyword matching (senjata, barang ilegal, dll)
- ✅ Text pattern detection (klaim toko resmi, dll)
- ✅ HTML parsing (hidden URLs, auto-redirects)
- ✅ Image counting
- ✅ Domain extraction dan verification

**Kelebihan**:
- Cepat (tidak perlu API call)
- 100% tersedia
- Deterministik (hasil konsisten)

**Keterbatasan**:
- Tidak bisa mendeteksi pola kompleks
- Tidak ada konteks historis

---

### Tier 2: Database Checks (Aktif dengan Database)

Pengecekan yang memerlukan data historis:

- ✅ Image hash tracking
  - Generate perceptual hash untuk setiap gambar
  - Simpan ke database
  - Cek duplikasi dengan gambar dari scan sebelumnya

- ✅ Domain usage tracking
  - Track domain yang sudah di-scan
  - Cek apakah domain dipakai berulang kali
  - Deteksi pola multi-domain abuse

- ✅ Email extraction & tracking
  - Extract email dari landing page
  - Simpan ke database
  - Cek duplikasi email di landing page lain

**Kelebihan**:
- Bisa mendeteksi pola lintas-scan
- Semakin banyak scan, semakin akurat

**Keterbatasan**:
- Memerlukan data historis (akurat setelah beberapa scan)
- Tergantung koneksi database

**Database Schema**:

```sql
-- Image hashes table
CREATE TABLE image_hashes (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES scans(id),
  image_url TEXT NOT NULL,
  perceptual_hash TEXT NOT NULL,
  created_at TIMESTAMP
);

-- Domain usage table
CREATE TABLE domain_usage (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES scans(id),
  domain TEXT NOT NULL,
  business_context TEXT,
  created_at TIMESTAMP
);

-- Email usage table
CREATE TABLE email_usage (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES scans(id),
  email TEXT NOT NULL,
  source_location TEXT,
  created_at TIMESTAMP
);
```

---

### Tier 3: AI Checks (Opsional dengan AI API)

Pengecekan bertenaga AI untuk akurasi maksimal:

**Vision AI** (Analisis Gambar):
- Deteksi organ tubuh (produk kesehatan)
- Deteksi figur publik/selebriti
- Deteksi imaji medis
- Deteksi logo brand

**Text AI** (Analisis Konten):
- Deteksi afiliasi brand palsu
- Analisis kualitas info perusahaan
- Deteksi pola cloaking
- Brand mention extraction

**Kelebihan**:
- Akurasi tertinggi
- Bisa mendeteksi pola kompleks

**Keterbatasan**:
- Memerlukan API key (biaya tambahan)
- Lebih lambat (API call latency)
- Tergantung koneksi API

**Konfigurasi**:

```env
# .env.local
Z_AI_API_KEY=your_api_key_here
Z_AI_API_URL=https://your-ai-service.com/api
```

---

## Graceful Degradation

Sistem dirancang untuk tetap berfungsi meskipun beberapa tier tidak available:

```
Tier 3 (AI)     ──✗──► Fallback ke Tier 1 + 2
     │                      │
     ├─✓───┐              │
     │      │              ▼
Tier 2 (DB)  ──✗──► Fallback ke Tier 1
     │
     ├─✓───┐
     │      │
     ▼      ▼
Tier 1 (Rule) ───────► SELALU AKTIF ✅
```

**Contoh Scenario**:

1. **Semua Tier Aktif**: Hasil paling akurat dan lengkap
2. **Database Down**: Tetap jalan dengan Tier 1 + Tier 3 (AI)
3. **AI Down**: Tetap jalan dengan Tier 1 + Tier 2 (Database)
4. **Database + AI Down**: Tetap jalan dengan Tier 1 (Rule-based)

---

## File dan Implementasi

### Struktur File

```
lib/
├── suspensionAnalyzer.ts    # Main analyzer (Tier 1 + integrasi Tier 2 & 3)
├── suspensionDatabase.ts    # Database functions (Tier 2)
├── suspensionAI.ts          # AI functions (Tier 3)
└── imageAnalyzer.ts         # Image hashing dan analysis
```

### Flow Data

```
1. Landing Page di-Scan
        ↓
2. HTML Structure Parsed
        ↓
3. Tier 1: Rule-based Analysis (selalu jalan)
        ↓
4. Tier 2: Database Tracking (try-catch)
   - Track image hashes
   - Track domain usage
   - Track email usage
   - Check for duplicates
        ↓
5. Tier 3: AI Analysis (try-catch)
   - Vision AI: Analyze images
   - Text AI: Analyze content
        ↓
6. Gabungkan Hasil Semua Tier
        ↓
7. Return SuspicionAnalysis
```

---

## Output Format

### SuspensionAnalysis Interface

```typescript
{
  multipleAccountAbuse: {
    hasPattern: boolean,
    sameEmailDetected: boolean,
    sameImagesDetected: boolean,
    sameDomainDetected: boolean,
    newToOldRedirect: boolean,
    evidence?: string
  },
  unacceptableBusinessPractice: {
    bodyOrganImages: boolean,
    homepageMismatch: boolean,
    weaponsIllegalGoods: boolean,
    medicalImagery: boolean,
    religiousPromotion: boolean,
    fakeBrandAffiliation: boolean,
    insufficientCompanyInfo: boolean,
    evidence?: string[]
  },
  publicFigureImpersonation: {
    detected: boolean,
    publicFigures: string[],
    fakeEndorsements: boolean,
    evidence?: string
  },
  technicalCircumvention: {
    cloaking: boolean,
    hiddenUrls: boolean,
    autoRedirects: boolean,
    excessiveImages: boolean,
    evidence?: string[]
  },
  counterfeitGoods: {
    brandProductPhotos: boolean,
    brandLogos: boolean,
    fakeOfficialStore: boolean,
    detectedBrands: string[],
    evidence?: string[]
  }
}
```

---

## Penggunaan

### Basic Usage

```typescript
import { analyzeSuspensionRisk } from './lib/suspensionAnalyzer'

const suspensionAnalysis = await analyzeSuspensionRisk(
  html,           // HTML content dari landing page
  url,            // URL landing page
  redirectChain,  // Array redirect steps
  htmlStructure,  // Parsed HTML structure
  contentAnalysis // Content analysis result
)

console.log(suspensionAnalysis.multipleAccountAbuse.hasPattern)
console.log(suspensionAnalysis.unacceptableBusinessPractice.weaponsIllegalGoods)
// ... dll
```

### Integration dengan lpScanner

Sudah terintegrasi di [`lpScanner.ts`](lib/lpScanner.ts):

```typescript
// Step 5.5: Suspension Risk Analysis
const suspensionAnalysis = await analyzeSuspensionRisk(
  html,
  url,
  redirectChain,
  htmlStructure,
  contentAnalysis
)

// Step 6: Evaluate requirements
const requirements = {
  domainAndRedirect: evaluateDomainAndRedirect(...),
  contentOriginality: evaluateContentOriginality(...),
  formAndIntegration: evaluateFormAndIntegration(...),
  footerAndCompany: evaluateFooterAndCompany(...),
  suspensionRisk: evaluateSuspensionRisk(suspensionAnalysis) // ← NEW
}
```

---

## Performance Considerations

### Waktu Eksekusi

- **Tier 1**: ~100-500ms (synchronous)
- **Tier 2**: ~500-2000ms (database queries)
- **Tier 3**: ~2000-10000ms (AI API calls, tergantung service)

### Optimization

- **Parallel Processing**: Tier 2 dan Tier 3 berjalan paralel
- **Caching**: Image hashes dan domain usage di-cache
- **Lazy Loading**: Tier 3 hanya jalan jika AI API available
- **Timeout**: Maksimal 10 detik per AI call

### Database Indexing

```sql
-- Index untuk lookup cepat
CREATE INDEX idx_image_hashes_hash ON image_hashes(perceptual_hash);
CREATE INDEX idx_domain_usage_domain ON domain_usage(domain);
CREATE INDEX idx_email_usage_email ON email_usage(email);
```

---

## Monitoring dan Logging

### Console Logs

```
Tier 1 checks: ✓ Complete
Tier 2 checks: ✓ Complete (tracked 15 images, 1 domain, 3 emails)
Tier 3 checks: ! Skipped (AI not configured)
```

### Error Handling

```typescript
// Tier 2 fallback
catch (error) {
  console.log('Tier 2 checks unavailable (database or storage issue):', error)
  // Continue with Tier 1 results only
}

// Tier 3 fallback
catch (error) {
  console.log('Tier 3 checks unavailable (AI service issue):', error)
  // Continue with Tier 1 + Tier 2 results only
}
```

---

## Maintenance

### Cleanup Data Lama

Fungsi cleanup untuk menghapus data lama dari database:

```typescript
import { cleanupOldData } from './lib/suspensionDatabase'

// Hapus data lebih dari 90 hari
await cleanupOldData(90)
```

### Statistics

```typescript
import { getTrackingStats } from './lib/suspensionDatabase'

const stats = await getTrackingStats()
console.log('Total image hashes:', stats.totalImageHashes)
console.log('Unique domains:', stats.uniqueDomains)
console.log('Unique emails:', stats.uniqueEmails)
```

---

## Roadmap Pengembangan

### Short Term
- [ ] Integrasi Vision API sebenarnya (Google Cloud Vision, Azure, dll)
- [ ] Enhanced cloaking detection dengan multi-user-agent
- [ ] Real-time alert system

### Long Term
- [ ] Machine learning model untuk pattern recognition
- [ ] Threat scoring system
- [ ] Automated report generation
- [ ] API untuk integrasi dengan sistem lain

---

## Troubleshooting

### Tier 2 Tidak Berjalan

**Masalah**: "Tier 2 checks unavailable"

**Solusi**:
1. Cek koneksi database: `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY`
2. Verifikasi tabel sudah dibuat: jalankan SQL schema
3. Cek RLS policies di Supabase dashboard

### Tier 3 Tidak Berjalan

**Masalah**: "Tier 3 checks unavailable"

**Solusi**:
1. Cek API key: `Z_AI_API_KEY` dan `Z_AI_API_URL`
2. Verifikasi AI service accessible
3. Cek rate limits dan quota

---

## Referensi

- [Google Ads Landing Page Policy](https://support.google.com/google-ads/answer/6086369)
- [Google Ads Suspended Account Policy](https://support.google.com/google-ads/answer/2751279)
- [Circumventing Systems Policy](https://support.google.com/google-ads/answer/6085940)

---

## Credits

- **Developed by**: Briyanes
- **Powered by**: Hadona Digital Media
- **Version**: 1.0.0
- **Last Updated**: Desember 2024
