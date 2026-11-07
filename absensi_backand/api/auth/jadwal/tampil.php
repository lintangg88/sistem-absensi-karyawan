<?php
header("Content-Type: application/json; charset=UTF-8");

require_once dirname(__DIR__, 3) . "/config/database.php";

function responseJSON($status, $message, $data = [])
{
    echo json_encode(
        array_merge([
            "status" => $status,
            "message" => $message
        ], $data),
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

// =====================================================
// 1. VALIDASI KONEKSI DATABASE
// =====================================================

if (!isset($koneksi) || !($koneksi instanceof mysqli)) {
    responseJSON(false, "Koneksi database tidak tersedia.");
}

// =====================================================
// 2. AMBIL PARAMETER DARI HALAMAN
// =====================================================

$idUser = filter_input(INPUT_GET, "id_user", FILTER_VALIDATE_INT);
$idCabang = filter_input(INPUT_GET, "id_cabang", FILTER_VALIDATE_INT);
$bulan = $_GET["bulan"] ?? date("Y-m");

if (!$idUser || $idUser <= 0) {
    responseJSON(false, "ID akun tidak valid. Silakan login kembali.");
}

if (!$idCabang || $idCabang <= 0) {
    responseJSON(false, "Cabang belum dipilih. Silakan pilih cabang terlebih dahulu.");
}

if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $bulan)) {
    responseJSON(false, "Format bulan tidak valid.");
}

$tanggalAwal = $bulan . "-01";
$tanggalBerikutnya = date(
    "Y-m-d",
    strtotime($tanggalAwal . " +1 month")
);

// =====================================================
// 3. VALIDASI AKUN KARYAWAN YANG LOGIN
// =====================================================

$sqlUser = "
    SELECT
        u.id_user,
        u.role,
        u.status AS status_user,
        k.id_karyawan,
        k.nama_karyawan
    FROM users u
    INNER JOIN karyawan k
        ON k.id_user = u.id_user
    WHERE u.id_user = ?
    LIMIT 1
";

$stmtUser = $koneksi->prepare($sqlUser);

if (!$stmtUser) {
    responseJSON(false, "Gagal menyiapkan pencarian akun.");
}

$stmtUser->bind_param("i", $idUser);
$stmtUser->execute();

$resultUser = $stmtUser->get_result();
$user = $resultUser->fetch_assoc();

$stmtUser->close();

if (!$user) {
    responseJSON(false, "Data karyawan untuk akun ini tidak ditemukan.");
}

if (strtolower($user["role"]) !== "karyawan") {
    responseJSON(false, "Halaman ini khusus untuk akun karyawan.");
}

if (strtolower($user["status_user"]) !== "aktif") {
    responseJSON(false, "Akun tidak aktif.");
}

$idKaryawan = (int) $user["id_karyawan"];
$namaKaryawan = $user["nama_karyawan"];

// =====================================================
// 4. VALIDASI CABANG YANG DIPILIH
// =====================================================

$sqlCabang = "
    SELECT id_cabang, nama_cabang
    FROM cabang
    WHERE id_cabang = ?
    LIMIT 1
";

$stmtCabang = $koneksi->prepare($sqlCabang);

if (!$stmtCabang) {
    responseJSON(false, "Gagal menyiapkan pencarian cabang.");
}

$stmtCabang->bind_param("i", $idCabang);
$stmtCabang->execute();

$resultCabang = $stmtCabang->get_result();
$cabang = $resultCabang->fetch_assoc();

$stmtCabang->close();

if (!$cabang) {
    responseJSON(false, "Cabang yang dipilih tidak ditemukan.");
}

$namaCabang = $cabang["nama_cabang"];

// =====================================================
// 5. AMBIL JADWAL BERDASARKAN:
//    - AKUN KARYAWAN YANG LOGIN
//    - CABANG YANG DIPILIH
//    - BULAN DAN TAHUN
//
// CATATAN:
// Gunakan j.id_cabang, bukan k.id_cabang.
// Cabang jadwal bisa berbeda dari cabang utama karyawan.
// =====================================================

$sqlJadwal = "
    SELECT
        j.id_jadwal,
        j.id_karyawan,
        j.id_cabang,
        c.nama_cabang,
        j.tanggal,
        j.pagi,
        j.malam,
        j.nama_shift,
        j.keterangan,
        j.status
    FROM jadwal_kerja j
    INNER JOIN karyawan k
        ON k.id_karyawan = j.id_karyawan
    INNER JOIN users u
        ON u.id_user = k.id_user
    LEFT JOIN cabang c
        ON c.id_cabang = j.id_cabang
    WHERE u.id_user = ?
      AND j.id_cabang = ?
      AND j.tanggal >= ?
      AND j.tanggal < ?
    ORDER BY j.tanggal ASC, j.id_jadwal ASC
";

$stmtJadwal = $koneksi->prepare($sqlJadwal);

if (!$stmtJadwal) {
    responseJSON(false, "Gagal menyiapkan pengambilan jadwal.");
}

$stmtJadwal->bind_param(
    "iiss",
    $idUser,
    $idCabang,
    $tanggalAwal,
    $tanggalBerikutnya
);

if (!$stmtJadwal->execute()) {
    $stmtJadwal->close();
    responseJSON(false, "Gagal mengambil data jadwal.");
}

$resultJadwal = $stmtJadwal->get_result();
$data = [];

while ($row = $resultJadwal->fetch_assoc()) {
    $data[] = [
        "id_jadwal" => (int) $row["id_jadwal"],
        "id_karyawan" => (int) $row["id_karyawan"],
        "id_cabang" => (int) $row["id_cabang"],
        "nama_cabang" => $row["nama_cabang"] ?? "-",
        "tanggal" => date("d-m-Y", strtotime($row["tanggal"])),
        "tanggal_raw" => $row["tanggal"],
        "pagi" => $row["pagi"] ?? "",
        "malam" => $row["malam"] ?? "",
        "nama_shift" => $row["nama_shift"] ?? "",
        "keterangan" => $row["keterangan"] ?? "",
        "status" => $row["status"] ?? ""
    ];
}

$stmtJadwal->close();

// =====================================================
// 6. KIRIM RESPONS KE HALAMAN
// =====================================================

responseJSON(
    true,
    "Jadwal karyawan berhasil diambil.",
    [
        "id_user" => (int) $user["id_user"],
        "id_karyawan" => $idKaryawan,
        "nama_karyawan" => $namaKaryawan,
        "id_cabang" => (int) $cabang["id_cabang"],
        "nama_cabang" => $namaCabang,
        "bulan" => $bulan,
        "total_data" => count($data),
        "data" => $data
    ]
);
