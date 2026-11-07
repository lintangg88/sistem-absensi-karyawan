<?php

// =====================================================
// DASHBOARD ADMIN - DIMSUM HOKYA
// =====================================================

// Header JSON
header("Content-Type: application/json; charset=UTF-8");

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Jika OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// =====================================================
// KONEKSI DATABASE
// =====================================================

$host = "127.0.0.1";
$port = 3306;
$username = "root";
$password = "";
$database = "db_absensi_hokya";

try {

    $koneksi = new mysqli(
        $host,
        $username,
        $password,
        $database,
        $port
    );

    // Cek koneksi
    if ($koneksi->connect_error) {
        throw new Exception(
            "Koneksi database gagal: " . $koneksi->connect_error
        );
    }

    $koneksi->set_charset("utf8mb4");


    // =================================================
    // TOTAL KARYAWAN
    // =================================================

    $queryKaryawan = "SELECT COUNT(*) AS total FROM karyawan";

    $resultKaryawan = $koneksi->query($queryKaryawan);

    if (!$resultKaryawan) {
        throw new Exception(
            "Query karyawan gagal: " . $koneksi->error
        );
    }

    $dataKaryawan = $resultKaryawan->fetch_assoc();

    $totalKaryawan = (int) $dataKaryawan['total'];


    // =================================================
    // TOTAL ABSENSI
    // =================================================

    $queryAbsensi = "SELECT COUNT(*) AS total FROM absensi";

    $resultAbsensi = $koneksi->query($queryAbsensi);

    if (!$resultAbsensi) {
        throw new Exception(
            "Query absensi gagal: " . $koneksi->error
        );
    }

    $dataAbsensi = $resultAbsensi->fetch_assoc();

    $totalAbsensi = (int) $dataAbsensi['total'];


    // =================================================
    // TOTAL JADWAL KERJA
    // =================================================

    $queryJadwal = "SELECT COUNT(*) AS total FROM jadwal_kerja";

    $resultJadwal = $koneksi->query($queryJadwal);

    if (!$resultJadwal) {
        throw new Exception(
            "Query jadwal kerja gagal: " . $koneksi->error
        );
    }

    $dataJadwal = $resultJadwal->fetch_assoc();

    $totalJadwal = (int) $dataJadwal['total'];


    // =================================================
    // TOTAL PENGAJUAN IZIN
    // =================================================

    $queryIzin = "SELECT COUNT(*) AS total FROM pengajuan_izin";

    $resultIzin = $koneksi->query($queryIzin);

    if (!$resultIzin) {
        throw new Exception(
            "Query pengajuan izin gagal: " . $koneksi->error
        );
    }

    $dataIzin = $resultIzin->fetch_assoc();

    $totalPengajuanIzin = (int) $dataIzin['total'];


    // =================================================
    // RESPONSE
    // =================================================

    echo json_encode([
        "success" => true,
        "message" => "Data dashboard berhasil diambil",
        "data" => [
            "total_karyawan" => $totalKaryawan,
            "total_absensi" => $totalAbsensi,
            "total_jadwal" => $totalJadwal,
            "total_pengajuan_izin" => $totalPengajuanIzin
        ]
    ]);


    // Tutup koneksi
    $koneksi->close();


} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}