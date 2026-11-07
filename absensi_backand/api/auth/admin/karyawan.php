<?php

// =====================================================
// API DATA KARYAWAN ADMIN
// DIMSUM HOKYA
//
// GET  = menampilkan data karyawan
// PUT  = mengedit data karyawan
// =====================================================

header("Content-Type: application/json; charset=UTF-8");

require_once "../../../config/cors.php";
require_once "../../../config/database.php";
require_once "../../../config/response.php";


// =====================================================
// CEK METHOD
// =====================================================

$method = $_SERVER["REQUEST_METHOD"];


// =====================================================
// FUNGSI BACA JSON
// =====================================================

function getJsonInput()
{
    $input = file_get_contents("php://input");

    if (!$input) {
        return [];
    }

    $data = json_decode($input, true);

    return is_array($data) ? $data : [];
}


// =====================================================
// GET DATA KARYAWAN
// =====================================================

if ($method === "GET") {

    $sql = "
        SELECT
            id_karyawan,
            id_user,
            id_cabang,
            nik,
            nama_karyawan,
            jabatan,
            no_hp,
            alamat,
            foto,
            tanggal_masuk,
            status,
            created_at
        FROM karyawan
        ORDER BY id_karyawan ASC
    ";

    $result = $koneksi->query($sql);

    if (!$result) {

        responseError(
            "Gagal mengambil data karyawan: " . $koneksi->error,
            500
        );

        exit;
    }


    $data = [];

    while ($row = $result->fetch_assoc()) {

        $data[] = [
            "id_karyawan"   => (int) $row["id_karyawan"],
            "id_user"       => $row["id_user"] !== null
                ? (int) $row["id_user"]
                : null,
            "id_cabang"     => $row["id_cabang"] !== null
                ? (int) $row["id_cabang"]
                : null,
            "nik"           => $row["nik"],
            "nama_karyawan" => $row["nama_karyawan"],
            "jabatan"       => $row["jabatan"],
            "no_hp"         => $row["no_hp"],
            "alamat"        => $row["alamat"],
            "foto"          => $row["foto"],
            "tanggal_masuk" => $row["tanggal_masuk"],
            "status"        => $row["status"],
            "created_at"    => $row["created_at"]
        ];
    }


    responseSuccess(
        "Data karyawan berhasil diambil",
        $data
    );

    exit;
}


// =====================================================
// PUT - EDIT DATA KARYAWAN
// =====================================================

if ($method === "PUT") {

    $data = getJsonInput();


    $id_karyawan = isset($data["id_karyawan"])
        ? (int) $data["id_karyawan"]
        : 0;

    $id_cabang = isset($data["id_cabang"])
        ? (int) $data["id_cabang"]
        : 0;

    $nik = trim($data["nik"] ?? "");
    $nama_karyawan = trim($data["nama_karyawan"] ?? "");
    $jabatan = trim($data["jabatan"] ?? "");
    $no_hp = trim($data["no_hp"] ?? "");
    $alamat = trim($data["alamat"] ?? "");
    $tanggal_masuk = trim($data["tanggal_masuk"] ?? "");
    $status = trim($data["status"] ?? "");
    $foto = trim($data["foto"] ?? "");


    // =================================================
    // VALIDASI
    // =================================================

    if ($id_karyawan <= 0) {

        responseError(
            "ID karyawan tidak valid.",
            400
        );

        exit;
    }


    if ($id_cabang <= 0) {

        responseError(
            "ID cabang wajib diisi.",
            400
        );

        exit;
    }


    if ($nik === "") {

        responseError(
            "NIK wajib diisi.",
            400
        );

        exit;
    }


    if ($nama_karyawan === "") {

        responseError(
            "Nama karyawan wajib diisi.",
            400
        );

        exit;
    }


    if ($jabatan === "") {

        responseError(
            "Jabatan wajib diisi.",
            400
        );

        exit;
    }


    if ($no_hp === "") {

        responseError(
            "No. HP wajib diisi.",
            400
        );

        exit;
    }


    if ($alamat === "") {

        responseError(
            "Alamat wajib diisi.",
            400
        );

        exit;
    }


    if ($tanggal_masuk === "") {

        responseError(
            "Tanggal masuk wajib diisi.",
            400
        );

        exit;
    }


    if (!in_array($status, ["aktif", "nonaktif"], true)) {

        responseError(
            "Status tidak valid.",
            400
        );

        exit;
    }


    // =================================================
    // CEK DATA KARYAWAN
    // =================================================

    $stmt = $koneksi->prepare("
        SELECT id_karyawan
        FROM karyawan
        WHERE id_karyawan = ?
        LIMIT 1
    ");

    if (!$stmt) {

        responseError(
            "Prepare gagal: " . $koneksi->error,
            500
        );

        exit;
    }


    $stmt->bind_param(
        "i",
        $id_karyawan
    );

    $stmt->execute();

    $result = $stmt->get_result();


    if ($result->num_rows === 0) {

        $stmt->close();

        responseError(
            "Data karyawan tidak ditemukan.",
            404
        );

        exit;
    }


    $stmt->close();


    // =================================================
    // CEK NIK DUPLIKAT
    // =================================================

    $stmt = $koneksi->prepare("
        SELECT id_karyawan
        FROM karyawan
        WHERE nik = ?
        AND id_karyawan != ?
        LIMIT 1
    ");

    $stmt->bind_param(
        "si",
        $nik,
        $id_karyawan
    );

    $stmt->execute();

    $result = $stmt->get_result();


    if ($result->num_rows > 0) {

        $stmt->close();

        responseError(
            "NIK sudah digunakan oleh karyawan lain.",
            400
        );

        exit;
    }


    $stmt->close();


    // =================================================
    // CEK CABANG
    // =================================================

    $stmt = $koneksi->prepare("
        SELECT id_cabang
        FROM cabang
        WHERE id_cabang = ?
        LIMIT 1
    ");

    $stmt->bind_param(
        "i",
        $id_cabang
    );

    $stmt->execute();

    $result = $stmt->get_result();


    if ($result->num_rows === 0) {

        $stmt->close();

        responseError(
            "Cabang tidak ditemukan.",
            400
        );

        exit;
    }


    $stmt->close();


    // =================================================
    // UPDATE TANPA FOTO
    // =================================================

    if ($foto === "") {

        $stmt = $koneksi->prepare("
            UPDATE karyawan
            SET
                id_cabang = ?,
                nik = ?,
                nama_karyawan = ?,
                jabatan = ?,
                no_hp = ?,
                alamat = ?,
                tanggal_masuk = ?,
                status = ?
            WHERE id_karyawan = ?
        ");


        $stmt->bind_param(
            "isssssssi",
            $id_cabang,
            $nik,
            $nama_karyawan,
            $jabatan,
            $no_hp,
            $alamat,
            $tanggal_masuk,
            $status,
            $id_karyawan
        );

    } else {

        // =================================================
        // UPDATE DENGAN FOTO
        // =================================================

        $stmt = $koneksi->prepare("
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
        ");


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
    }


    // =================================================
    // EKSEKUSI UPDATE
    // =================================================

    if (!$stmt->execute()) {

        $error = $stmt->error;

        $stmt->close();

        responseError(
            "Gagal mengubah data karyawan: " . $error,
            500
        );

        exit;
    }


    $stmt->close();


    responseSuccess(
        "Data karyawan berhasil diperbarui.",
        null
    );

    exit;
}


// =====================================================
// METHOD TIDAK DIIZINKAN
// =====================================================

responseError(
    "Method tidak diperbolehkan.",
    405
);

exit;

?>