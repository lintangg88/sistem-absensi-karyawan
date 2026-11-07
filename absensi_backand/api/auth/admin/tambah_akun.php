<?php

// =====================================================
// TAMBAH AKUN KARYAWAN ADMIN
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
$username_db = "root";
$password_db = "";
$database = "db_absensi_hokya";


try {

    // =================================================
    // KONEKSI
    // =================================================

    $koneksi = new mysqli(
        $host,
        $username_db,
        $password_db,
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


    // =================================================
    // AMBIL DATA JSON
    // =================================================

    $rawData = file_get_contents("php://input");

    $input = json_decode(
        $rawData,
        true
    );


    if (!is_array($input)) {

        throw new Exception(
            "Data yang dikirim tidak valid."
        );

    }


    // =================================================
    // DATA INPUT
    // =================================================

    $email = isset($input["email"])
        ? trim($input["email"])
        : "";

    $password = isset($input["password"])
        ? $input["password"]
        : "";

    $nama_lengkap = isset($input["nama_lengkap"])
        ? trim($input["nama_lengkap"])
        : "";


    // =================================================
    // VALIDASI EMAIL
    // =================================================

    if ($email === "") {

        throw new Exception(
            "Email wajib diisi."
        );

    }


    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

        throw new Exception(
            "Format email tidak valid."
        );

    }


    // =================================================
    // VALIDASI PASSWORD
    // =================================================

    if ($password === "") {

        throw new Exception(
            "Password wajib diisi."
        );

    }


    if (strlen($password) < 6) {

        throw new Exception(
            "Password minimal 6 karakter."
        );

    }


    // =================================================
    // VALIDASI NAMA
    // =================================================

    if ($nama_lengkap === "") {

        throw new Exception(
            "Nama lengkap wajib diisi."
        );

    }


    // =================================================
    // CEK EMAIL
    // =================================================

    $stmt = $koneksi->prepare(
        "SELECT id_user
         FROM users
         WHERE email = ?
         LIMIT 1"
    );


    if (!$stmt) {

        throw new Exception(
            "Gagal menyiapkan pengecekan email: " .
            $koneksi->error
        );

    }


    $stmt->bind_param(
        "s",
        $email
    );

    $stmt->execute();

    $result = $stmt->get_result();


    if ($result->num_rows > 0) {

        $stmt->close();

        throw new Exception(
            "Email sudah digunakan. Silakan gunakan email lain."
        );

    }


    $stmt->close();


    // =================================================
    // HASH PASSWORD
    // =================================================

    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );


    if (!$passwordHash) {

        throw new Exception(
            "Gagal mengenkripsi password."
        );

    }


    // =================================================
    // ROLE DAN STATUS
    // =================================================

    $role = "karyawan";
    $status = "aktif";


    // =================================================
    // INSERT KE USERS
    // =================================================

    $stmt = $koneksi->prepare(
        "INSERT INTO users
        (
            email,
            password,
            nama_lengkap,
            role,
            status
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?
        )"
    );


    if (!$stmt) {

        throw new Exception(
            "Gagal menyiapkan query tambah akun: " .
            $koneksi->error
        );

    }


    $stmt->bind_param(
        "sssss",
        $email,
        $passwordHash,
        $nama_lengkap,
        $role,
        $status
    );


    // =================================================
    // SIMPAN
    // =================================================

    if (!$stmt->execute()) {

        throw new Exception(
            "Gagal menyimpan akun: " .
            $stmt->error
        );

    }


    // =================================================
    // ID USER
    // =================================================

    $id_user = $stmt->insert_id;


    $stmt->close();
    $koneksi->close();


    // =================================================
    // RESPONSE
    // =================================================

    http_response_code(200);

    echo json_encode([
        "success" => true,
        "message" => "Akun karyawan berhasil dibuat.",
        "data" => [
            "id_user" => $id_user,
            "email" => $email,
            "nama_lengkap" => $nama_lengkap,
            "role" => $role,
            "status" => $status
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