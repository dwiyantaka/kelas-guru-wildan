# Google Apps Script Deployment Guide

Panduan ini menjelaskan cara men-deploy backend Google Apps Script untuk Dashboard Administrasi Guru, mengikuti aturan CORS yang telah ditentukan.

## Langkah 1: Buat Project Google Apps Script Baru

1. Buka [Google Apps Script](https://script.google.com) di browser Anda
2. Klik "New Project"
3. Hapus kode yang ada di editor
4. Salin dan tempel seluruh isi file `code.gs` ke dalam editor
5. Klik "Untitled project" di bagian atas dan ubah namanya menjadi "Admin Guru Backend"
6. Klik "Save" (Ctrl+S atau ⌘+S)

## Langkah 2: Deploy sebagai Web App

1. Klik "Deploy" > "New deployment"
2. Pada dialog yang muncul, klik ikon roda gigi di sebelah "Select type"
3. Pilih "Web app"
4. Isi informasi berikut:
   - Description: "Admin Guru API v1"
   - Execute as: **Me** (akun Google Anda)
   - Who has access: **Anyone** (penting untuk bypass CORS)
5. Klik "Deploy"

## Langkah 3: Dapatkan URL Deployment

Setelah deployment, Anda akan melihat URL seperti:
```
https://script.google.com/macros/s/DEPLOYMENT_ID_HERE/exec
```

Salin URL ini, karena Anda akan membutuhkannya di kode frontend.

## Langkah 4: Perbarui Kode Frontend Anda

1. Buka file `index.html` di project Anda
2. Ganti placeholder URL dengan URL deployment aktual Anda:

```javascript
const API_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID_HERE/exec';
```

## Langkah 5: Pengujian

1. Buka file `index.html` di browser Anda
2. Buka Developer Console (F12) untuk memastikan tidak ada error CORS
3. Coba uji endpoint API yang berbeda untuk memverifikasi koneksi

## Catatan Penting CORS

Seperti yang dijelaskan dalam dokumen aturan CORS, pendekatan ini berhasil karena:

1. Kita menggunakan request POST sederhana dengan URLSearchParams (data form-encoded)
2. Tidak mengatur custom headers
3. Google secara otomatis mengizinkan CORS untuk request sederhana ketika Web App di-deploy dengan akses "Anyone"
4. Kita mengakses parameter melalui `e.parameter` dalam kode Google Apps Script

## Pemecahan Masalah

Jika Anda mengalami masalah CORS:

1. Pastikan pengaturan deployment Anda benar (Execute as: Me, Access: Anyone)
2. Verifikasi Anda menggunakan URLSearchParams tanpa custom headers di frontend
3. Periksa bahwa Anda mengakses parameter melalui `e.parameter` di GAS
4. Coba buat versi deployment baru jika Anda telah membuat perubahan

## Pertimbangan Keamanan

Meskipun pendekatan ini memungkinkan CORS berfungsi, ingatlah:

1. Siapa pun dapat mengakses endpoint API Anda karena di-deploy dengan akses "Anyone"
2. Pertimbangkan untuk mengimplementasikan autentikasi yang tepat di aplikasi Anda
3. Operasi sensitif harus mencakup validasi di luar username/password saja 