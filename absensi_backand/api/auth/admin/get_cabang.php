<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$host = "127.0.0.1";
$port = 3306;
$username = "root";
$password = "";
$database = "db_absensi_hokya";

try {

    // =====================================================
    // KONEKSI DATABASE
    // =====================================================

    $koneksi = new mysqli(
        $host,
        $username,
        $password,
        $database,
        $port
    );

    if ($koneksi->connect_error) {
        throw new Exception(
            "Koneksi database gagal: " .
            $koneksi->connect_error
        );
    }

    $koneksi->set_charset("utf8mb4");


    // =====================================================
    // QUERY CABANG
    // =====================================================

    $sql = "
        SELECT
            id_cabang,
            nama_cabang
        FROM cabang
        WHERE status = 'aktif'
        ORDER BY id_cabang ASC
    ";

    $result = $koneksi->query($sql);

    if (!$result) {
        throw new Exception(
            "Gagal mengambil data cabang: " .
            $koneksi->error
        );
    }


    // =====================================================
    // DATA
    // =====================================================

    $data = [];

    while ($row = $result->fetch_assoc()) {

        $data[] = [
            "id_cabang" => (int) $row["id_cabang"],
            "nama_cabang" => $row["nama_cabang"]
        ];

    }


    // =====================================================
    // RESPONSE
    // =====================================================

    echo json_encode([
        "success" => true,
        "message" => "Data cabang berhasil diambil",
        "total_data" => count($data),
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);


    $koneksi->close();


} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

}

?>