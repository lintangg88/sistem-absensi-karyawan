<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}


require_once __DIR__ . "/../../../config/database.php";


if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method harus POST."
    ]);

    exit;
}


$input =
    json_decode(
        file_get_contents("php://input"),
        true
    );


if (!is_array($input)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Data JSON tidak valid."
    ]);

    exit;
}


$id =
    isset($input["id"])
        ? (int)$input["id"]
        : 0;


if ($id <= 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID target kerja tidak valid."
    ]);

    exit;
}


/* =====================================================
   CEK DATA
===================================================== */

$stmt =
    $koneksi->prepare(
        "SELECT id
         FROM target_kerja_karyawan
         WHERE id = ?
         LIMIT 1"
    );


$stmt->bind_param(
    "i",
    $id
);


$stmt->execute();


$result =
    $stmt->get_result();


if ($result->num_rows === 0) {

    $stmt->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" =>
            "Data target kerja tidak ditemukan."
    ]);

    exit;
}


$stmt->close();


/* =====================================================
   HAPUS
===================================================== */

$stmt =
    $koneksi->prepare(
        "DELETE FROM target_kerja_karyawan
         WHERE id = ?"
    );


$stmt->bind_param(
    "i",
    $id
);


if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Gagal menghapus target kerja.",
        "error" =>
            $stmt->error
    ]);

    $stmt->close();

    exit;
}


$stmt->close();


echo json_encode([
    "success" => true,
    "message" =>
        "Target kerja berhasil dihapus."
]);

?>