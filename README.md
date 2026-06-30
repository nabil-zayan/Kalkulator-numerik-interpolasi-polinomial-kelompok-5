# 🧮 Kalkulator Interpolasi Polinomial
### Proyek Metode Numerik — Kelompok 5

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

Aplikasi web kalkulator berbasis browser untuk menyelesaikan permasalahan **Interpolasi Polinomial** secara interaktif. Mendukung tiga metode: **Interpolasi Linear, Kuadratik, dan Kubik** — dihitung menggunakan **Matriks Vandermonde** dan **Eliminasi Gauss**, dilengkapi visualisasi grafik, perhitungan galat, serta tampilan langkah penyelesaian step-by-step.

---

## ✨ Fitur

- **3 Metode Interpolasi** — Linear (2 titik), Kuadratik (3 titik), Kubik (4 titik)
- **Matriks Vandermonde + Eliminasi Gauss** — satu algoritma generik untuk semua derajat polinomial
- **Visualisasi Grafik Interaktif** — titik data, kurva polinomial (garis putus-putus), dan titik prediksi
- **Persamaan Polinomial** — hasil persamaan ditampilkan lengkap dengan animasi
- **Perhitungan Galat** — input nilai sejati opsional untuk menghitung Galat Mutlak |Y prediksi − Y sejati|
- **Langkah Penyelesaian** — modal pop-up yang menampilkan:
  - Proses **Eliminasi Gauss-Jordan** tahap demi tahap (Linear & Kuadratik)
  - **Tabel Newton Beda Terbagi** dengan kolom ST-1, ST-2, ST-3 (Kubik)
- **Validasi Input** — deteksi kolom kosong dan nilai X yang duplikat secara real-time
- **Data Contoh** — tombol isi otomatis untuk simulasi cepat tiap metode
- **Dark Mode** — tema gelap modern, tidak memerlukan instalasi apapun

---

## 📁 Struktur File

```
kalkulator-interpolasi/
├── index.html      # Struktur halaman utama
├── style.css       # Tema dark mode & seluruh styling
└── script.js       # Logika perhitungan & interaksi UI
```

---

## 🚀 Cara Menjalankan

Tidak memerlukan server, framework, atau instalasi apapun.

1. **Clone** repository ini:
   ```bash
   git clone https://github.com/nabil-zayan/kalkulator-numerik-interpolasi-kelompok-5.git
   ```
2. **Buka** file `index.html` langsung di browser (Chrome / Firefox / Edge).
3. Selesai — aplikasi langsung berjalan.

> Pastikan ketiga file (`index.html`, `style.css`, `script.js`) berada dalam **satu folder yang sama**.

---

## 📖 Cara Penggunaan

1. **Pilih metode** interpolasi pada tab — Linear, Kuadratik, atau Kubik. Form input otomatis menyesuaikan jumlah titik (2/3/4).
2. **Isi koordinat** titik data (X₀, Y₀ dst), atau klik **"Isi Data Contoh"** untuk simulasi cepat.
3. **Isi nilai X target** yang ingin diprediksi nilainya.
4. *(Opsional)* Isi **Nilai Sejati Y** untuk menghitung galat mutlak.
5. Klik **"Hitung Prediksi Sekarang"** — hasil, persamaan, dan grafik langsung muncul.
6. Klik **"Lihat Langkah Penyelesaian"** untuk melihat proses perhitungan step-by-step.

---

## 🔢 Dasar Teori & Algoritma

### Metode yang Didukung

| Metode | Titik Dibutuhkan | Bentuk Persamaan |
|--------|-----------------|-----------------|
| Linear | 2 | y = a₀ + a₁x |
| Kuadratik | 3 | y = a₀ + a₁x + a₂x² |
| Kubik | 4 | y = a₀ + a₁x + a₂x² + a₃x³ |

### Matriks Vandermonde

Setiap titik (xᵢ, yᵢ) diubah menjadi baris matriks berupa pangkat-pangkat dari x:

```
[1, x, x², x³, ...]
```

Pendekatan ini memungkinkan **satu algoritma generik** menangani semua derajat polinomial tanpa kode terpisah per metode.

### Eliminasi Gauss (dengan Partial Pivoting)

Digunakan untuk menyelesaikan sistem persamaan linear Ax = b dari Matriks Vandermonde. Partial pivoting diterapkan agar hasil lebih stabil secara numerik.

### Newton Beda Terbagi (untuk tampilan langkah Kubik)

Tabel beda terbagi digunakan pada modal "Langkah Penyelesaian" metode Kubik untuk menampilkan proses pencarian koefisien secara bertahap sesuai format:

| Iterasi | xi | f(xi) | ST-1 | ST-2 | ST-3 |

> Hasil akhir dari Newton Beda Terbagi **ekuivalen** dengan hasil Eliminasi Gauss pada Matriks Vandermonde — keduanya menghasilkan koefisien polinomial yang sama.

### Perhitungan Galat

```
Galat Mutlak = |Y prediksi − Y sejati|
```

---

## 🛠️ Teknologi

| Teknologi | Kegunaan |
|-----------|----------|
| HTML5 | Struktur halaman |
| CSS3 (Custom Properties) | Tema dark mode & layout responsif |
| Vanilla JavaScript (ES6+) | Logika perhitungan & interaksi UI |
| [Chart.js v4.4.1](https://www.chartjs.org/) | Visualisasi grafik interaktif |
| [Google Fonts](https://fonts.google.com/) | Space Grotesk, IBM Plex Mono, Inter |

Tidak menggunakan framework frontend (React, Vue, dll) — murni HTML/CSS/JS.

---

## 👥 Anggota Kelompok 5

| Nama | NIM |
|------|-----|
| Moch Nabil Atsila Zayan | 2403010073 |
| Juliani | 2403010058 |
| Abin Subia Fauji | 2403010070 |

**Mata Kuliah:** Metode Numerik  
**Dosen Pengampu:** Rosita Kartikasari, S.T., M.T. & Evi Sundari, M.Pd.  
**Program Studi:** Teknik Informatika — Universitas Perjuangan Tasikmalaya  
**Tahun:** 2026

---

## 📚 Referensi

- Munir, R. (2015). *Metode Numerik* (Edisi Revisi 4). Informatika Bandung.
- Chapra, S. C., & Canale, R. P. (2015). *Numerical Methods for Engineers* (7th ed.). McGraw-Hill Education.

---

<p align="center">Dibuat dengan ❤️ oleh Kelompok 5 — Teknik Informatika, Universitas Perjuangan Tasikmalaya</p>
