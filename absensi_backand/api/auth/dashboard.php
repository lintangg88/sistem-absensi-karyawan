
<?php
date_default_timezone_set("Asia/Jakarta");

header("Content-Type: application/json; charset=UTF-8");

require_once "../../config/cors.php";
require_once "../../config/database.php";

// =====================================================
// FUNGSI RESPONS JSON
// =====================================================
function kirimJSON($success, $message, $data = null, $code = 200) {
    http_response_code($code);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// =====================================================
// VALIDASI REQUEST
// =====================================================
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    kirimJSON(false, "Method tidak diperbolehkan", null, 405);
}

$id_user = isset($_GET["id_user"])
    ? intval($_GET["id_user"])
    : 0;

if ($id_user <= 0) {
    kirimJSON(false, "ID user tidak valid", null, 400);
}

// =====================================================
// PERIODE BULAN BERJALAN
// =====================================================
$hariIni = date("Y-m-d");
$tahun = intval(date("Y"));
$bulan = intval(date("n"));

$awalBulan = date("Y-m-01");
$akhirBulan = date("Y-m-t");
$totalHariDalamBulan = intval(date("t"));

// =====================================================
// AMBIL KARYAWAN BERDASARKAN AKUN LOGIN
// =====================================================
$sql = "
    SELECT id_karyawan, nama_karyawan
    FROM karyawan
    WHERE id_user = ?
    LIMIT 1
";

$stmt = $koneksi->prepare($sql);

if (!$stmt) {
    kirimJSON(false, "Gagal menyiapkan query karyawan", null, 500);
}

$stmt->bind_param("i", $id_user);
$stmt->execute();

$karyawan = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$karyawan) {
    kirimJSON(false, "Data karyawan tidak ditemukan", null, 404);
}

$id_karyawan = intval($karyawan["id_karyawan"]);
$nama_karyawan = $karyawan["nama_karyawan"];


 // =====================================================
 // REKAP HADIR DARI ABSENSI
 // REKAP IZIN/SAKIT DARI PENGAJUAN_IZIN
 // =====================================================

 // Total hadir berdasarkan tabel absensi
 $sql = "
     SELECT COUNT(DISTINCT tanggal) AS total_hadir
     FROM absensi
     WHERE id_karyawan = ?
       AND tanggal >= ?
       AND tanggal <= ?
       AND LOWER(TRIM(status)) IN ('hadir', 'terlambat')
 ";

 $stmt = $koneksi->prepare($sql);

 if (!$stmt) {
     kirimJSON(false, "Gagal menghitung total hadir", null, 500);
 }

 $stmt->bind_param("iss", $id_karyawan, $awalBulan, $hariIni);
 $stmt->execute();

 $rekapHadir = $stmt->get_result()->fetch_assoc();
 $totalHadir = intval($rekapHadir["total_hadir"] ?? 0);

 $stmt->close();

 // =====================================================
 // HITUNG IZIN/SAKIT YANG SUDAH DISETUJUI
 // Setiap tanggal izin/sakit dihitung maksimal satu kali.
 // Hanya menghitung tanggal bulan berjalan sampai hari ini.
 // =====================================================

 $sql = "
     SELECT COUNT(DISTINCT tanggal_izin) AS total_izin
     FROM (
         SELECT
             p.id_karyawan,
             DATE_ADD(p.tanggal_mulai, INTERVAL angka.hari DAY)
                 AS tanggal_izin
         FROM pengajuan_izin p
         INNER JOIN (
             SELECT 0 AS hari UNION ALL SELECT 1
             UNION ALL SELECT 2 UNION ALL SELECT 3
             UNION ALL SELECT 4 UNION ALL SELECT 5
             UNION ALL SELECT 6 UNION ALL SELECT 7
             UNION ALL SELECT 8 UNION ALL SELECT 9
             UNION ALL SELECT 10 UNION ALL SELECT 11
             UNION ALL SELECT 12 UNION ALL SELECT 13
             UNION ALL SELECT 14 UNION ALL SELECT 15
             UNION ALL SELECT 16 UNION ALL SELECT 17
             UNION ALL SELECT 18 UNION ALL SELECT 19
             UNION ALL SELECT 20 UNION ALL SELECT 21
             UNION ALL SELECT 22 UNION ALL SELECT 23
             UNION ALL SELECT 24 UNION ALL SELECT 25
             UNION ALL SELECT 26 UNION ALL SELECT 27
             UNION ALL SELECT 28 UNION ALL SELECT 29
             UNION ALL SELECT 30 UNION ALL SELECT 31
             UNION ALL SELECT 32 UNION ALL SELECT 33
             UNION ALL SELECT 34 UNION ALL SELECT 35
             UNION ALL SELECT 36 UNION ALL SELECT 37
             UNION ALL SELECT 38 UNION ALL SELECT 39
             UNION ALL SELECT 40 UNION ALL SELECT 41
             UNION ALL SELECT 42 UNION ALL SELECT 43
             UNION ALL SELECT 44 UNION ALL SELECT 45
             UNION ALL SELECT 46 UNION ALL SELECT 47
             UNION ALL SELECT 48 UNION ALL SELECT 49
             UNION ALL SELECT 50 UNION ALL SELECT 51
             UNION ALL SELECT 52 UNION ALL SELECT 53
             UNION ALL SELECT 54 UNION ALL SELECT 55
             UNION ALL SELECT 56 UNION ALL SELECT 57
             UNION ALL SELECT 58 UNION ALL SELECT 59
             UNION ALL SELECT 60
         ) angka
           ON DATE_ADD(p.tanggal_mulai, INTERVAL angka.hari DAY)
              <= p.tanggal_selesai
         WHERE p.id_karyawan = ?
           AND LOWER(TRIM(p.status)) = 'disetujui'
           AND LOWER(TRIM(p.jenis_izin)) IN ('izin', 'sakit')
           AND p.tanggal_mulai <= ?
           AND p.tanggal_selesai >= ?
     ) AS daftar_izin
     WHERE tanggal_izin >= ?
       AND tanggal_izin <= ?
 ";

 $stmt = $koneksi->prepare($sql);

 if (!$stmt) {
     kirimJSON(false, "Gagal menghitung total izin/sakit", null, 500);
 }

 $stmt->bind_param(
     "issss",
     $id_karyawan,
     $hariIni,
     $awalBulan,
     $awalBulan,
     $hariIni
 );

 $stmt->execute();

 $rekapIzin = $stmt->get_result()->fetch_assoc();
 $totalIzin = intval($rekapIzin["total_izin"] ?? 0);

 $stmt->close();


// =====================================================
// TOTAL HARI KERJA TERJADWAL SAMPAI HARI INI
// Digunakan sebagai pembagi persentase kehadiran.
// Jadwal mendatang tidak ikut mengurangi persentase.
// =====================================================
$sql = "
    SELECT COUNT(DISTINCT tanggal) AS total_jadwal
    FROM jadwal_kerja
    WHERE id_karyawan = ?
      AND tanggal >= ?
      AND tanggal <= ?
      AND LOWER(TRIM(COALESCE(status, 'terjadwal'))) <> 'libur'
";

$stmt = $koneksi->prepare($sql);

if (!$stmt) {
    kirimJSON(false, "Gagal menghitung jadwal kerja", null, 500);
}

$stmt->bind_param(
    "iss",
    $id_karyawan,
    $awalBulan,
    $hariIni
);

$stmt->execute();

$dataJadwalBerjalan = $stmt->get_result()->fetch_assoc();

$totalJadwalBerjalan = intval(
    $dataJadwalBerjalan["total_jadwal"] ?? 0
);

$stmt->close();

// =====================================================
// TOTAL LIBUR OTOMATIS DALAM SATU BULAN
//
// Total libur = jumlah hari dalam bulan
//               - jumlah tanggal unik yang memiliki
//                 jadwal kerja nonlibur.
//
// PENTING: Gunakan $id_karyawan, bukan $idKaryawan.
// =====================================================
$sql = "
    SELECT COUNT(DISTINCT tanggal) AS total_jadwal
    FROM jadwal_kerja
    WHERE id_karyawan = ?
      AND tanggal >= ?
      AND tanggal <= ?
      AND LOWER(TRIM(COALESCE(status, 'terjadwal'))) <> 'libur'
";

$stmtLibur = $koneksi->prepare($sql);

if (!$stmtLibur) {
    kirimJSON(false, "Gagal menghitung total libur", null, 500);
}

$stmtLibur->bind_param(
    "iss",
    $id_karyawan,
    $awalBulan,
    $akhirBulan
);

$stmtLibur->execute();

$dataLibur = $stmtLibur->get_result()->fetch_assoc();

$totalTanggalTerjadwal = intval(
    $dataLibur["total_jadwal"] ?? 0
);

$stmtLibur->close();

// Menghindari hasil negatif jika data jadwal tidak wajar.
$totalLibur = max(
    0,
    $totalHariDalamBulan - $totalTanggalTerjadwal
);

// =====================================================
// PERSENTASE KEHADIRAN BULAN BERJALAN
// =====================================================
$persentase = $totalJadwalBerjalan > 0
    ? round(($totalHadir / $totalJadwalBerjalan) * 100, 2)
    : 0;

$persentase = min(100, $persentase);

// =====================================================
// GRAFIK JANUARI - DESEMBER TAHUN BERJALAN
//
// Bulan lampau  : data sampai akhir bulan.
// Bulan berjalan: data sampai hari ini.
// Bulan mendatang: nilai 0.
// =====================================================
$grafik = [];

$namaBulan = [
    1  => "Jan",
    2  => "Feb",
    3  => "Mar",
    4  => "Apr",
    5  => "Mei",
    6  => "Jun",
    7  => "Jul",
    8  => "Agu",
    9  => "Sep",
    10 => "Okt",
    11 => "Nov",
    12 => "Des"
];

for ($i = 1; $i <= 12; $i++) {

    $awal = sprintf("%04d-%02d-01", $tahun, $i);
    $akhirBulanGrafik = date("Y-m-t", strtotime($awal));

    // Bulan mendatang belum memiliki data.
    if ($i > $bulan) {
        $grafik[] = [
            "bulan" => $namaBulan[$i],
            "nomor_bulan" => $i,
            "tahun" => $tahun,
            "hadir" => 0,
            "jadwal" => 0,
            "persentase" => 0
        ];

        continue;
    }

    // Bulan sekarang sampai hari ini.
    // Bulan sebelumnya sampai akhir bulan.
    $batasTanggal = ($i === $bulan)
        ? $hariIni
        : $akhirBulanGrafik;

    // ---------------------------------------------
    // JUMLAH TANGGAL KERJA TERJADWAL
    // ---------------------------------------------
    $sql = "
        SELECT COUNT(DISTINCT tanggal) AS total
        FROM jadwal_kerja
        WHERE id_karyawan = ?
          AND tanggal >= ?
          AND tanggal <= ?
          AND LOWER(TRIM(COALESCE(status, 'terjadwal'))) <> 'libur'
    ";

    $stmt = $koneksi->prepare($sql);

    if (!$stmt) {
        kirimJSON(false, "Gagal mengambil jadwal grafik", null, 500);
    }

    $stmt->bind_param(
        "iss",
        $id_karyawan,
        $awal,
        $batasTanggal
    );

    $stmt->execute();

    $dataGrafikJadwal = $stmt->get_result()->fetch_assoc();

    $jadwal = intval($dataGrafikJadwal["total"] ?? 0);

    $stmt->close();

    // ---------------------------------------------
    // JUMLAH TANGGAL HADIR
    // ---------------------------------------------
    $sql = "
        SELECT COUNT(DISTINCT tanggal) AS total
        FROM absensi
        WHERE id_karyawan = ?
          AND tanggal >= ?
          AND tanggal <= ?
          AND LOWER(TRIM(status)) IN ('hadir', 'terlambat')
    ";

    $stmt = $koneksi->prepare($sql);

    if (!$stmt) {
        kirimJSON(false, "Gagal mengambil presensi grafik", null, 500);
    }

    $stmt->bind_param(
        "iss",
        $id_karyawan,
        $awal,
        $batasTanggal
    );

    $stmt->execute();

    $dataGrafikHadir = $stmt->get_result()->fetch_assoc();

    $hadir = intval($dataGrafikHadir["total"] ?? 0);

    $stmt->close();

    // ---------------------------------------------
    // PERSENTASE GRAFIK
    // ---------------------------------------------
    $persentaseGrafik = $jadwal > 0
        ? round(($hadir / $jadwal) * 100, 2)
        : 0;

    $persentaseGrafik = min(100, $persentaseGrafik);

    $grafik[] = [
        "bulan" => $namaBulan[$i],
        "nomor_bulan" => $i,
        "tahun" => $tahun,
        "hadir" => $hadir,
        "jadwal" => $jadwal,
        "persentase" => $persentaseGrafik
    ];
}

// =====================================================
// KIRIM DATA KE FRONTEND
// =====================================================
kirimJSON(true, "Data dashboard berhasil diambil", [
    "nama_karyawan" => $nama_karyawan,
    "total_hadir" => $totalHadir,
    "total_izin" => $totalIzin,
    "total_libur" => $totalLibur,
    "persentase" => $persentase,
    "bulan_berjalan" => $bulan,
    "tahun_berjalan" => $tahun,
    "tanggal_hari_ini" => $hariIni,
    "grafik" => $grafik
]);
?>
