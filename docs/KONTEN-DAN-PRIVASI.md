# Konten dan privasi

Foto-foto di situs ini memuat orang sungguhan, seperti pasangan pre-wedding, wisudawan, dan peserta acara. Karena itu, izin tampil disimpan **di dalam data**, bukan hanya diingat.

## Status izin per foto

| Nilai `consent` | Artinya |
|---|---|
| `ok` | Boleh tampil apa adanya |
| `anonymize` | Boleh tampil, tapi nama klien diganti alias (misalnya `A & D`) |
| `exclude` | Tidak boleh tampil di mana pun |

Foto `exclude` disaring **satu kali** di `src/content/catalog.ts`, sebelum query apa pun berjalan, jadi tidak ada halaman yang bisa membocorkannya. Jaminan ini dikunci oleh unit test di `src/content/catalog.test.ts`.

Seri yang menampilkan orang memakai alias (`clientLabel`), dan tidak ada nama asli klien di data.

## Metadata foto

Pipeline foto membuang metadata EXIF/GPS dari setiap gambar, jadi lokasi dan info kamera tidak ikut terpublikasi. Lihat [PIPELINE-FOTO.md](PIPELINE-FOTO.md).

## Hak cipta

Semua foto **© datworks**, dan dipajang di repo ini dengan izin datworks. Foto **tidak termasuk** lisensi apa pun dan tidak boleh dipakai ulang. Lihat [LICENSE](../LICENSE).
