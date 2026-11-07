<?php

// =====================================================
// GET JADWAL KERJA ADMIN - DIMSUM HOKYA
// =====================================================

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

// =====================================================
// KONEKSI DATABASE
// =====================================================

require_once "../../../config/database.php";

// Pastikan koneksi tersedia
if (!isset($koneksi)) {
    echo json_encode([
        "success" => false,
        "message" => "Koneksi database tidak tersedia.",
        "data" => []
    ]);
    exit;
}

// =====================================================
// CEK ERROR DATABASE
// =====================================================

if ($koneksi->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Koneksi database gagal: " . $koneksi->connect_error,
        "data" => []
    ]);
    exit;
}

// =====================================================
// AMBIL FILTER TANGGAL
// =====================================================

$tanggal = isset($_GET["tanggal"])
    ? trim($_GET["tanggal"])
    : "";

// =====================================================
// QUERY DATA JADWAL
// =====================================================
//
// Struktur tabel jadwal_kerja:
// id_jadwal
// id_karyawan
// id_cabang
// tanggal
// nama_shift
// pagi
// malam
// keterangan
// status
// created_at
//
// JOIN:
// jadwal_kerja -> karyawan
// jadwal_kerja -> cabang
// =====================================================

$sql = "
    SELECT
        j.id_jadwal,
        j.id_karyawan,
        j.id_cabang,
        j.tanggal,
        j.nama_shift,
        j.pagi,
        j.malam,
        j.keterangan,
        j.status,
        j.created_at,

        k.nama_karyawan,
        c.nama_cabang

    FROM jadwal_kerja j

    LEFT JOIN karyawan k
        ON j.id_karyawan = k.id_karyawan

    LEFT JOIN cabang c
        ON j.id_cabang = c.id_cabang
";

// =====================================================
// FILTER TANGGAL
// =====================================================

if ($tanggal !== "") {

    $sql .= "
        WHERE j.tanggal = ?
    ";

}

// =====================================================
// URUTKAN DATA
// =====================================================

$sql .= "
    ORDER BY j.tanggal ASC, j.id_jadwal ASC
";

// =====================================================
// PREPARE QUERY
// =====================================================

$stmt = $koneksi->prepare($sql);

if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Query gagal dipersiapkan: " . $koneksi->error,
        "data" => []
    ]);

    exit;
}

// =====================================================
// BIND PARAMETER TANGGAL
// =====================================================

if ($tanggal !== "") {

    $stmt->bind_param("s", $tanggal);

}

// =====================================================
// EKSEKUSI
// =====================================================

if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil data jadwal: " . $stmt->error,
        "data" => []
    ]);

    exit;
}

// =====================================================
// AMBIL HASIL
// =====================================================

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {

    $data[] = $row;

}

// =====================================================
// RESPONSE
// =====================================================

echo json_encode([
    "success" => true,
    "message" => "Data jadwal berhasil diambil.",
    "data" => $data
], JSON_UNESCAPED_UNICODE);

// =====================================================
// TUTUP
// =====================================================

$stmt->close();
$koneksi->close();

?>