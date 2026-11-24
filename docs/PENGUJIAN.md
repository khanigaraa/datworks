# Pengujian

```bash
npm test                 # 35 unit test (Vitest)
npm run test:e2e         # 61 tes end-to-end (Playwright) terhadap build produksi
BASE_URL=https://datworks-w9bw.vercel.app npm run test:e2e   # tes yang sama terhadap situs live
```

Tes end-to-end memakai **Microsoft Edge** yang sudah terpasang (Playwright `channel: 'msedge'`). Di komputer tanpa Edge, jalankan `npx playwright install chromium` lalu hapus baris `channel` di `playwright.config.ts`.

## Unit test (Vitest): 35 tes di 5 file

| File | Yang dicek |
|---|---|
| `src/content/catalog.test.ts` | Query katalog, setiap aturan validasi, dan jaminan bahwa foto `exclude` tidak pernah bocor |
| `src/content/photo-meta.test.ts` | Hasil pipeline foto: file dan ukurannya |
| `src/ui/editorial.test.ts` | Ritme editorial (full-bleed, pasangan, satuan) |
| `src/ui/lightbox.test.ts` | Navigasi berputar di kedua ujung, dan swipe kiri/kanan (tap dan scroll vertikal diabaikan) |
| `src/ui/velocity.test.ts` | Kecepatan scroll diubah jadi kemiringan dan blur, dengan batas maksimum |

## Tes end-to-end (Playwright): 61 tes di 10 file

Mencakup:
- routing dan tombol back/forward, filter di URL, dan halaman 404;
- menu dan focus trap, serta lightbox (keyboard, swipe, backdrop);
- preloader: kunjungan pertama, skip, dan fallback tanpa WebGL;
- strip yang di-pin, pelacakan bab, dan motion blur;
- efek hover dengan dan tanpa WebGL;
- *reduced motion*, tanpa layout shift, dan tanpa scroll horizontal di lebar 375 px.

Dua tes WebGL (`aquatics.spec.ts`, `hover.spec.ts`) otomatis dilewati di browser tanpa WebGL.
