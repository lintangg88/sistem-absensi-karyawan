<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../../config/database.php";

try {

    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Data yang dikirim tidak valid"
        ]);

        exit;
    }

    $id_absensi = isset($input['id_absensi'])
        ? intval($input['id_absensi'])
        : 0;

    $tanggal = isset($input['tanggal'])
        ? trim($input['tanggal'])
        : '';

    $jam_masuk = isset($input['jam_masuk'])
        ? trim($input['jam_masuk'])
        : '';

    $jam_keluar = isset($input['jam_keluar'])
        ? trim($input['jam_keluar'])
        : '';

    $status = isset($input['status'])
        ? trim($input['status'])
        : '';

    $keterangan = isset($input['keterangan'])
        ? trim($input['keterangan'])
        : '';

    if ($id_absensi <= 0) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "ID absensi tidak valid"
        ]);

        exit;
    }

    if ($tanggal === '') {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Tanggal wajib diisi"
        ]);

        exit;
    }

    if ($status === '') {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Status wajib diisi"
        ]);

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | Ubah string kosong menjadi NULL
    |--------------------------------------------------------------------------
    */

    $jamMasukDb = ($jam_masuk === '') ? null : $jam_masuk;
    $jamKeluarDb = ($jam_keluar === '') ? null : $jam_keluar;
    $keteranganDb = ($keterangan === '') ? null : $keterangan;

    /*
    |--------------------------------------------------------------------------
    | Update data absensi
    |--------------------------------------------------------------------------
    */

    $sql = "
        UPDATE absensi
        SET
            tanggal = ?,
            jam_masuk = ?,
            jam_keluar = ?,
            status = ?,
            keterangan = ?,
            updated_at = NOW()
        WHERE id_absensi = ?
    ";

    $stmt = $koneksi->prepare($sql);

    if (!$stmt) {
        throw new Exception($koneksi->error);
    }

    $stmt->bind_param(
        "sssssi",
        $tanggal,
        $jamMasukDb,
        $jamKeluarDb,
        $status,
        $keteranganDb,
        $id_absensi
    );

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    if ($stmt->affected_rows === 0) {

        echo json_encode([
            "success" => true,
            "message" => "Tidak ada perubahan data"
        ]);

    } else {

        echo json_encode([
            "success" => true,
            "message" => "Data absensi berhasil diperbarui"
        ]);
    }

    $stmt->close();

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}