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


$karyawan_id =
    isset($input["karyawan_id"])
        ? (int)$input["karyawan_id"]
        : 0;


$bulan =
    isset($input["bulan"])
        ? (int)$input["bulan"]
        : 0;


$tahun =
    isset($input["tahun"])
        ? (int)$input["tahun"]
        : 0;


$hari_efektif =
    isset($input["hari_efektif"])
        ? (int)$input["hari_efektif"]
        : 0;


$min_jam_kerja =
    isset($input["min_jam_kerja"])
        ? (float)$input["min_jam_kerja"]
        : 0;


if ($id <= 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID target kerja tidak valid."
    ]);

    exit;
}


if ($karyawan_id <= 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Karyawan wajib dipilih."
    ]);

    exit;
}


if ($bulan < 1 || $bulan > 12) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Bulan tidak valid."
    ]);

    exit;
}


if ($tahun < 2020) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Tahun tidak valid."
    ]);

    exit;
}


if ($hari_efektif < 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Hari efektif tidak valid."
    ]);

    exit;
}


if ($min_jam_kerja < 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Minimal jam kerja tidak valid."
    ]);

    exit;
}


/* =====================================================
   CEK DATA TARGET
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
        "message" => "Data target kerja tidak ditemukan."
    ]);

    exit;
}


$stmt->close();


/* =====================================================
   CEK KARYAWAN
===================================================== */

$stmt =
    $koneksi->prepare(
        "SELECT id_karyawan
         FROM karyawan
         WHERE id_karyawan = ?
         LIMIT 1"
    );


$stmt->bind_param(
    "i",
    $karyawan_id
);


$stmt->execute();


$result =
    $stmt->get_result();


if ($result->num_rows === 0) {

    $stmt->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Karyawan tidak ditemukan."
    ]);

    exit;
}


$stmt->close();


/* =====================================================
   CEK DUPLIKAT
===================================================== */

$stmt =
    $koneksi->prepare(
        "SELECT id
         FROM target_kerja_karyawan
         WHERE karyawan_id = ?
           AND bulan = ?
           AND tahun = ?
           AND id <> ?
         LIMIT 1"
    );


$stmt->bind_param(
    "iiii",
    $karyawan_id,
    $bulan,
    $tahun,
    $id
);


$stmt->execute();


$result =
    $stmt->get_result();


if ($result->num_rows > 0) {

    $stmt->close();

    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" =>
            "Target kerja untuk karyawan, bulan, dan tahun tersebut sudah ada."
    ]);

    exit;
}


$stmt->close();


/* =====================================================
   UPDATE DATA
===================================================== */

$stmt =
    $koneksi->prepare(
        "UPDATE target_kerja_karyawan
         SET
            karyawan_id = ?,
            bulan = ?,
            tahun = ?,
            hari_efektif = ?,
            min_jam_kerja = ?
         WHERE id = ?"
    );


$stmt->bind_param(
    "iiiidi",
    $karyawan_id,
    $bulan,
    $tahun,
    $hari_efektif,
    $min_jam_kerja,
    $id
);


if (!$stmt->execute()) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Gagal memperbarui target kerja.",
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
        "Target kerja berhasil diperbarui."
]);

?>