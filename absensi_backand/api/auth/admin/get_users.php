<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$host = "127.0.0.1";
$port = 3306;
$username_db = "root";
$password_db = "";
$database = "db_absensi_hokya";

try {

    $koneksi = new mysqli(
        $host,
        $username_db,
        $password_db,
        $database,
        $port
    );

    if ($koneksi->connect_error) {
        throw new Exception(
            "Koneksi database gagal."
        );
    }

    $koneksi->set_charset("utf8mb4");


    $query = "
        SELECT
            id_user,
            email,
            nama_lengkap
        FROM users
        WHERE role = 'karyawan'
        AND status = 'aktif'
        ORDER BY nama_lengkap ASC
    ";


    $result =
        $koneksi->query($query);


    if (!$result) {

        throw new Exception(
            "Gagal mengambil data users: " .
            $koneksi->error
        );

    }


    $data = [];


    while (
        $row =
        $result->fetch_assoc()
    ) {

        $data[] = $row;

    }


    echo json_encode([
        "success" => true,
        "data" => $data
    ]);


    $koneksi->close();


} catch (Throwable $e) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);

}

?>