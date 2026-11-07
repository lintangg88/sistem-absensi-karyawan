<?php

// =====================================================
// DATA FORM JADWAL ADMIN
// =====================================================

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


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

    if ($koneksi->connect_error) {
        throw new Exception(
            "Koneksi database gagal: " . $koneksi->connect_error
        );
    }

    $koneksi->set_charset("utf8mb4");


    // =================================================
    // DATA KARYAWAN
    // =================================================

    $karyawan = [];

    $query = "
        SELECT
            id_karyawan,
            nama_karyawan,
            id_cabang
        FROM karyawan
        WHERE status = 'aktif'
        ORDER BY nama_karyawan ASC
    ";

    $result = $koneksi->query($query);

    if (!$result) {
        throw new Exception(
            "Gagal mengambil data karyawan: " . $koneksi->error
        );
    }

    while ($row = $result->fetch_assoc()) {
        $karyawan[] = $row;
    }


    // =================================================
    // DATA CABANG
    // =================================================

    $cabang = [];

    $query = "
        SELECT
            id_cabang,
            nama_cabang
        FROM cabang
        WHERE status = 'aktif'
        ORDER BY nama_cabang ASC
    ";

    $result = $koneksi->query($query);

    if (!$result) {
        throw new Exception(
            "Gagal mengambil data cabang: " . $koneksi->error
        );
    }

    while ($row = $result->fetch_assoc()) {
        $cabang[] = $row;
    }


    $koneksi->close();


    // =================================================
    // RESPONSE
    // =================================================

    echo json_encode([
        "success" => true,
        "data" => [
            "karyawan" => $karyawan,
            "cabang" => $cabang
        ]
    ]);


} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

?>