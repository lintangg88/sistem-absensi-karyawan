<?php

// =====================================================
// TAMBAH JADWAL KERJA ADMIN
// DIMSUM HOKYA
// =====================================================

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// =====================================================
// DATABASE
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

    if ($koneksi->connect_error) {
        throw new Exception(
            "Koneksi database gagal: " . $koneksi->connect_error
        );
    }

    $koneksi->set_charset("utf8mb4");


    // =================================================
    // AMBIL DATA JSON
    // =================================================

    $input = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!$input) {
        throw new Exception("Data yang dikirim tidak valid.");
    }


    // =================================================
    // DATA INPUT
    // =================================================

    $id_karyawan = isset($input['id_karyawan'])
        ? (int)$input['id_karyawan']
        : 0;

    $id_cabang = isset($input['id_cabang'])
        ? (int)$input['id_cabang']
        : 0;

    $tanggal = isset($input['tanggal'])
        ? trim($input['tanggal'])
        : "";

    $nama_shift = isset($input['nama_shift'])
        ? trim($input['nama_shift'])
        : "";

    $pagi = isset($input['pagi'])
        ? trim($input['pagi'])
        : null;

    $malam = isset($input['malam'])
        ? trim($input['malam'])
        : null;

    $keterangan = isset($input['keterangan'])
        ? trim($input['keterangan'])
        : null;


    // =================================================
    // VALIDASI
    // =================================================

    if ($id_karyawan <= 0) {
        throw new Exception("Karyawan belum dipilih.");
    }

    if ($id_cabang <= 0) {
        throw new Exception("Cabang belum dipilih.");
    }

    if (empty($tanggal)) {
        throw new Exception("Tanggal belum dipilih.");
    }

    if (empty($nama_shift)) {
        throw new Exception("Shift belum diisi.");
    }


    // =================================================
    // CEK KARYAWAN
    // =================================================

    $stmt = $koneksi->prepare(
        "SELECT id_karyawan
         FROM karyawan
         WHERE id_karyawan = ?
         LIMIT 1"
    );

    $stmt->bind_param("i", $id_karyawan);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Data karyawan tidak ditemukan.");
    }

    $stmt->close();


    // =================================================
    // CEK CABANG
    // =================================================

    $stmt = $koneksi->prepare(
        "SELECT id_cabang
         FROM cabang
         WHERE id_cabang = ?
         LIMIT 1"
    );

    $stmt->bind_param("i", $id_cabang);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Data cabang tidak ditemukan.");
    }

    $stmt->close();


    // =================================================
    // CEK JADWAL DUPLIKAT
    // =================================================

    $stmt = $koneksi->prepare(
        "SELECT id_jadwal
         FROM jadwal_kerja
         WHERE id_karyawan = ?
         AND tanggal = ?
         LIMIT 1"
    );

    $stmt->bind_param(
        "is",
        $id_karyawan,
        $tanggal
    );

    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        throw new Exception(
            "Karyawan tersebut sudah memiliki jadwal pada tanggal tersebut."
        );
    }

    $stmt->close();


    // =================================================
    // INSERT JADWAL
    // =================================================

    $status = "terjadwal";

    $stmt = $koneksi->prepare(
        "INSERT INTO jadwal_kerja
        (
            id_karyawan,
            id_cabang,
            tanggal,
            nama_shift,
            pagi,
            malam,
            keterangan,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $stmt->bind_param(
        "iissssss",
        $id_karyawan,
        $id_cabang,
        $tanggal,
        $nama_shift,
        $pagi,
        $malam,
        $keterangan,
        $status
    );


    if (!$stmt->execute()) {
        throw new Exception(
            "Gagal menyimpan jadwal: " . $stmt->error
        );
    }


    $id_jadwal = $stmt->insert_id;

    $stmt->close();
    $koneksi->close();


    // =================================================
    // RESPONSE BERHASIL
    // =================================================

    echo json_encode([
        "success" => true,
        "message" => "Jadwal kerja berhasil disimpan.",
        "data" => [
            "id_jadwal" => $id_jadwal
        ]
    ]);


} catch (Throwable $e) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>