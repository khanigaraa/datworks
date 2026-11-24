# Performa dan aksesibilitas

## Skor Lighthouse

Diukur dengan Lighthouse (emulasi HP), median dari 3 kali percobaan, pada build produksi. Angkanya dicatat setelah perbaikan performa di ticket 10 (commit `a96ca4c`) dan pertama kali ditulis di README pada commit `4257566` (24 November 2026). Laporan aslinya tidak disimpan di repo, jadi angka ini bisa berbeda kalau diukur ulang.

| Halaman | Performance | Accessibility |
|---|---|---|
| Beranda `/` | 89 | 100 |
| Work `/work` | 92 | 100 |
| Seri `/series/dara-grad` | 95 | 100 |

## Perbaikan yang paling berpengaruh

- **Preload gambar LCP per rute**, disuntikkan ke `index.html` saat build oleh plugin `datworks:preload-lcp-image` di `vite.config.ts`. Ini aplikasi client-side, jadi tanpa preload browser baru menemukan gambar utama terlambat.
- **Gambar 960 px untuk HP.**
- **Tanpa smooth scroll, parallax, atau grain beranimasi di perangkat sentuh.**
- **OGL dipisah dari bundle utama**, sehingga HP tidak mengunduh kode WebGL.
- **CSS reveal menggantikan ScrollTrigger per elemen**, yang menghilangkan long task sekitar 1 detik di HP yang dibatasi.

## Aksesibilitas

- Warna aksen merah disesuaikan jadi `#f2453a` supaya kontrasnya **5,36:1** terhadap latar `#0b0a0a` (lolos WCAG AA).
- Setiap foto wajib punya alt text, dan ini dicek saat build.
- Lightbox memakai `<dialog>` native: bisa dipakai dengan tombol panah, swipe, dan Escape; fokus terkunci di dalam dan kembali ke tombol pemicu.
- Semua efek gerak mati saat `prefers-reduced-motion` aktif.
