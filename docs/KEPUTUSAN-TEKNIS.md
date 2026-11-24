# Keputusan teknis

| Keputusan | Alasan |
|---|---|
| **TypeScript murni + router History API ±120 baris**, tanpa framework UI | Situs ini isinya gerak dan gambar. Router kecil dengan hook `leave → unmount → swap → enter` memberi kontrol penuh atas transisi halaman dan pembersihan animasi. |
| **Modul `content` yang dalam** dengan query murni dan `validate()` | Roll, seri, dan foto hanyalah data. Aturan kurasi dicek saat build, jadi konten yang salah tidak bisa ter-deploy. Detail di [ARSITEKTUR.md](ARSITEKTUR.md#modul-konten). |
| **Izin (consent) adalah bagian dari data** (`ok` / `anonymize` / `exclude`) | Ada orang asli di foto-foto ini. Lihat [KONTEN-DAN-PRIVASI.md](KONTEN-DAN-PRIVASI.md). |
| **Pipeline gambar sendiri** (`npm run photos`) | Mengubah foto asli jadi AVIF + WebP di beberapa ukuran, dengan pratinjau blur dan tanpa metadata EXIF/GPS. Lihat [PIPELINE-FOTO.md](PIPELINE-FOTO.md). |
| **`sharp` versi wasm** dan **`@rollup/wasm-node`** | Binary native diblokir oleh Windows Application Control di laptop pengembang, jadi dipakai build WebAssembly (lihat `overrides` di `package.json`). |
| **Satu konteks WebGL per efek**, bukan per foto | Hemat memori GPU dan menghindari batas jumlah konteks di browser. |
| **WebGL hanya di perangkat yang mampu** | Shader hanya jalan dengan mouse, WebGL, ≥ 4 core / 4 GB, dan gerak diizinkan. OGL ada di chunk terpisah yang tidak diunduh HP. |
| **CSS reveal + IntersectionObserver**, bukan ScrollTrigger per elemen | Menghilangkan long task sekitar 1 detik di HP yang dibatasi (throttled). ScrollTrigger tetap dipakai untuk pin, parallax, dan efek kecepatan. |
