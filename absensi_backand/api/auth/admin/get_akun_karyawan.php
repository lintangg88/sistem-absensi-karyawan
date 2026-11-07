<?php

// =====================================================
// GET DATA AKUN KARYAWAN - ADMIN
// DIMSUM HOKYA
// =====================================================

header("Content-Type: application/json; charset=UTF-8");

require_once "../../../config/cors.php";
require_once "../../../config/database.php";


// =====================================================
// FUNGSI RESPONSE
// =====================================================

function responseJSON($success, $message, $data = [])
{
    http_response_code($success ? 200 : 500);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data"    => $data
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


// =====================================================
// CEK METHOD
// =====================================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method tidak diperbolehkan.",
        "data"    => []
    ]);

    exit;
}


// =====================================================
// CEK KONEKSI
// =====================================================

if (!isset($koneksi)) {

    responseJSON(
        false,
        "Koneksi database tidak ditemukan."
    );
}


// =====================================================
// QUERY DATA USERS
// =====================================================
//
// Struktur tabel users:
//
// id_user
// email
// password
// nama_lengkap
// role
// status
// created_at
// updated_at
//
// username TIDAK ADA.
// Maka username yang ditampilkan menggunakan email.
//
// =====================================================

$sql = "
    SELECT
        id_user,
        email,
        nama_lengkap,
        role,
        status,
        created_at,
        updated_at
    FROM users
    WHERE role = 'karyawan'
    ORDER BY id_user DESC
";


// =====================================================
// EKSEKUSI QUERY
// =====================================================

$result = $koneksi->query($sql);


if (!$result) {

    responseJSON(
        false,
        "Gagal mengambil data akun: " . $koneksi->error
    );
}


// =====================================================
// AMBIL DATA
// =====================================================

$data = [];

while ($row = $result->fetch_assoc()) {

    $data[] = [

        // ID USER
        "id_user" =>
            (int) $row["id_user"],

        // NAMA KARYAWAN
        // Diambil dari users.nama_lengkap
        "nama_karyawan" =>
            $row["nama_lengkap"] ?? "",

        // NAMA LENGKAP
        "nama_lengkap" =>
            $row["nama_lengkap"] ?? "",

        // USERNAME
        // Karena tidak ada kolom username,
        // username menggunakan email
        "username" =>
            $row["email"] ?? "",

        // EMAIL
        "email" =>
            $row["email"] ?? "",

        // ROLE
        "role" =>
            $row["role"] ?? "",

        // STATUS
        "status" =>
            $row["status"] ?? "",

        // WAKTU DIBUAT
        "created_at" =>
            $row["created_at"] ?? "",

        // WAKTU DIUPDATE
        "updated_at" =>
            $row["updated_at"] ?? ""
    ];
}


// =====================================================
// RESPONSE BERHASIL
// =====================================================

responseJSON(
    true,
    "Data akun karyawan berhasil diambil.",
    $data
);

?>