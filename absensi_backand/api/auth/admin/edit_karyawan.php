<?php

// =====================================================
// EDIT DATA KARYAWAN - ADMIN
// DIMSUM HOKYA
// =====================================================

header("Content-Type: application/json; charset=UTF-8");

require_once "../../../config/cors.php";
require_once "../../../config/database.php";
require_once "../../../config/response.php";


// =====================================================
// CEK METHOD
// =====================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method tidak diperbolehkan."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// =====================================================
// AMBIL JSON
// =====================================================

$input = json_decode(
    file_get_contents("php://input"),
    true
);


if (!is_array($input)) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Data JSON tidak valid."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// =====================================================
// AMBIL DATA
// =====================================================

$id_karyawan =
    isset($input["id_karyawan"])
        ? (int) $input["id_karyawan"]
        : 0;

$id_cabang =
    isset($input["id_cabang"])
        ? (int) $input["id_cabang"]
        : 0;

$nik =
    trim($input["nik"] ?? "");

$nama_karyawan =
    trim($input["nama_karyawan"] ?? "");

$jabatan =
    trim($input["jabatan"] ?? "");

$no_hp =
    trim($input["no_hp"] ?? "");

$alamat =
    trim($input["alamat"] ?? "");

$foto =
    trim($input["foto"] ?? "");

$tanggal_masuk =
    trim($input["tanggal_masuk"] ?? "");

$status =
    trim($input["status"] ?? "");


// =====================================================
// VALIDASI
// =====================================================

if ($id_karyawan <= 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID karyawan tidak valid."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


if (
    $id_cabang <= 0 ||
    $nik === "" ||
    $nama_karyawan === "" ||
    $jabatan === "" ||
    $no_hp === "" ||
    $alamat === "" ||
    $tanggal_masuk === "" ||
    $status === ""
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Semua data wajib diisi."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


if (
    $status !== "aktif" &&
    $status !== "nonaktif"
) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Status tidak valid."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// =====================================================
// PROSES
// =====================================================

try {

    // =================================================
    // CEK DATA KARYAWAN
    // =================================================

    $stmtCheck = $koneksi->prepare(
        "
        SELECT id_karyawan
        FROM karyawan
        WHERE id_karyawan = ?
        LIMIT 1
        "
    );


    if (!$stmtCheck) {

        throw new Exception(
            "Prepare cek karyawan gagal: " .
            $koneksi->error
        );
    }


    $stmtCheck->bind_param(
        "i",
        $id_karyawan
    );


    $stmtCheck->execute();


    $resultCheck =
        $stmtCheck->get_result();


    if ($resultCheck->num_rows === 0) {

        $stmtCheck->close();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Data karyawan tidak ditemukan."
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    $stmtCheck->close();


    // =================================================
    // CEK NIK DUPLIKAT
    // =================================================

    $stmtNik = $koneksi->prepare(
        "
        SELECT id_karyawan
        FROM karyawan
        WHERE nik = ?
        AND id_karyawan != ?
        LIMIT 1
        "
    );


    if (!$stmtNik) {

        throw new Exception(
            "Prepare cek NIK gagal: " .
            $koneksi->error
        );
    }


    $stmtNik->bind_param(
        "si",
        $nik,
        $id_karyawan
    );


    $stmtNik->execute();


    $resultNik =
        $stmtNik->get_result();


    if ($resultNik->num_rows > 0) {

        $stmtNik->close();

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "NIK sudah digunakan oleh karyawan lain."
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    $stmtNik->close();


    // =================================================
    // UPDATE DATA
    // =================================================

    $sql = "
        UPDATE karyawan
        SET
            id_cabang = ?,
            nik = ?,
            nama_karyawan = ?,
            jabatan = ?,
            no_hp = ?,
            alamat = ?,
            foto = ?,
            tanggal_masuk = ?,
            status = ?
        WHERE id_karyawan = ?
    ";


    $stmt = $koneksi->prepare($sql);


    if (!$stmt) {

        throw new Exception(
            "Prepare update gagal: " .
            $koneksi->error
        );
    }


    $stmt->bind_param(
        "issssssssi",
        $id_cabang,
        $nik,
        $nama_karyawan,
        $jabatan,
        $no_hp,
        $alamat,
        $foto,
        $tanggal_masuk,
        $status,
        $id_karyawan
    );


    if (!$stmt->execute()) {

        throw new Exception(
            $stmt->error
        );
    }


    $stmt->close();


    // =================================================
    // RESPONSE BERHASIL
    // =================================================

    http_response_code(200);

    echo json_encode([
        "success" => true,
        "message" => "Data karyawan berhasil diperbarui.",
        "data" => [
            "id_karyawan"   => $id_karyawan,
            "id_cabang"     => $id_cabang,
            "nik"           => $nik,
            "nama_karyawan" => $nama_karyawan,
            "jabatan"       => $jabatan,
            "no_hp"         => $no_hp,
            "alamat"        => $alamat,
            "foto"          => $foto,
            "tanggal_masuk" => $tanggal_masuk,
            "status"        => $status
        ]
    ], JSON_UNESCAPED_UNICODE);


} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal memperbarui data karyawan.",
        "error"   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

?>