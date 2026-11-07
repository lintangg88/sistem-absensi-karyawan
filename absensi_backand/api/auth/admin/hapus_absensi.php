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
            "message" => "Data tidak valid"
        ]);

        exit;
    }

    $id_absensi = isset($input['id_absensi'])
        ? intval($input['id_absensi'])
        : 0;

    if ($id_absensi <= 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "ID absensi tidak valid"
        ]);

        exit;
    }

    $stmt = $koneksi->prepare("
        DELETE FROM absensi
        WHERE id_absensi = ?
    ");

    if (!$stmt) {
        throw new Exception($koneksi->error);
    }

    $stmt->bind_param("i", $id_absensi);

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    if ($stmt->affected_rows === 0) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Data absensi tidak ditemukan"
        ]);

        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Data absensi berhasil dihapus"
    ]);

    $stmt->close();

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}