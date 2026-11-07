<?php

// =====================================================
// EDIT AKUN KARYAWAN
// ADMIN - DIMSUM HOKYA
// =====================================================

require_once "../../../config/cors.php";
require_once "../../../config/database.php";
require_once "../../../config/response.php";


// =====================================================
// CEK METHOD
// =====================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    responseError(
        "Method tidak diperbolehkan.",
        405
    );

    exit;
}


// =====================================================
// AMBIL JSON
// =====================================================

$rawInput = file_get_contents("php://input");

$input = json_decode(
    $rawInput,
    true
);


if (!is_array($input)) {

    responseError(
        "Data JSON tidak valid.",
        400
    );

    exit;
}


// =====================================================
// AMBIL ID USER
// =====================================================

$id_user = isset($input["id_user"])
    ? (int) $input["id_user"]
    : 0;


// =====================================================
// AMBIL NAMA LENGKAP
// =====================================================

$nama_lengkap = isset($input["nama_lengkap"])
    ? trim($input["nama_lengkap"])
    : "";


// =====================================================
// AMBIL EMAIL
//
// Frontend boleh mengirim:
// email
// atau username
//
// Karena database menggunakan kolom email,
// maka username akan disimpan ke email.
// =====================================================

$email = "";

if (isset($input["email"])) {

    $email = trim($input["email"]);

} elseif (isset($input["username"])) {

    $email = trim($input["username"]);
}


// =====================================================
// PASSWORD
// =====================================================

$password = isset($input["password"])
    ? trim($input["password"])
    : "";


// =====================================================
// STATUS
// =====================================================

$status = isset($input["status"])
    ? trim($input["status"])
    : "aktif";


// =====================================================
// VALIDASI ID
// =====================================================

if ($id_user <= 0) {

    responseError(
        "ID user tidak valid.",
        400
    );

    exit;
}


// =====================================================
// VALIDASI NAMA
// =====================================================

if ($nama_lengkap === "") {

    responseError(
        "Nama lengkap wajib diisi.",
        400
    );

    exit;
}


// =====================================================
// VALIDASI EMAIL
// =====================================================

if ($email === "") {

    responseError(
        "Username / email wajib diisi.",
        400
    );

    exit;
}


// =====================================================
// VALIDASI STATUS
// =====================================================

if (
    $status !== "aktif" &&
    $status !== "nonaktif"
) {

    responseError(
        "Status akun tidak valid.",
        400
    );

    exit;
}


// =====================================================
// CEK USER
// =====================================================

$stmtCheck = $koneksi->prepare(
    "
    SELECT
        id_user,
        role
    FROM users
    WHERE id_user = ?
    LIMIT 1
    "
);


if (!$stmtCheck) {

    responseError(
        "Prepare cek user gagal: " .
        $koneksi->error,
        500
    );

    exit;
}


$stmtCheck->bind_param(
    "i",
    $id_user
);


$stmtCheck->execute();


$resultCheck = $stmtCheck->get_result();


if ($resultCheck->num_rows === 0) {

    $stmtCheck->close();

    responseError(
        "Akun user tidak ditemukan.",
        404
    );

    exit;
}


$user = $resultCheck->fetch_assoc();

$stmtCheck->close();


// =====================================================
// PASTIKAN ROLE KARYAWAN
// =====================================================

if ($user["role"] !== "karyawan") {

    responseError(
        "Akun tersebut bukan akun karyawan.",
        403
    );

    exit;
}


// =====================================================
// CEK EMAIL DUPLIKAT
// =====================================================

$stmtEmail = $koneksi->prepare(
    "
    SELECT
        id_user
    FROM users
    WHERE
        email = ?
        AND id_user != ?
    LIMIT 1
    "
);


if (!$stmtEmail) {

    responseError(
        "Prepare cek email gagal: " .
        $koneksi->error,
        500
    );

    exit;
}


$stmtEmail->bind_param(
    "si",
    $email,
    $id_user
);


$stmtEmail->execute();


$resultEmail = $stmtEmail->get_result();


if ($resultEmail->num_rows > 0) {

    $stmtEmail->close();

    responseError(
        "Username / email tersebut sudah digunakan.",
        409
    );

    exit;
}


$stmtEmail->close();


// =====================================================
// UPDATE TANPA PASSWORD
// =====================================================

if ($password === "") {

    $stmt = $koneksi->prepare(
        "
        UPDATE users
        SET
            nama_lengkap = ?,
            email = ?,
            status = ?,
            updated_at = NOW()
        WHERE
            id_user = ?
        "
    );


    if (!$stmt) {

        responseError(
            "Prepare update akun gagal: " .
            $koneksi->error,
            500
        );

        exit;
    }


    $stmt->bind_param(
        "sssi",
        $nama_lengkap,
        $email,
        $status,
        $id_user
    );


// =====================================================
// UPDATE DENGAN PASSWORD
// =====================================================

} else {


    if (strlen($password) < 4) {

        responseError(
            "Password minimal 4 karakter.",
            400
        );

        exit;
    }


    // =================================================
    // HASH PASSWORD
    // =================================================

    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );


    if ($passwordHash === false) {

        responseError(
            "Gagal mengenkripsi password.",
            500
        );

        exit;
    }


    $stmt = $koneksi->prepare(
        "
        UPDATE users
        SET
            nama_lengkap = ?,
            email = ?,
            password = ?,
            status = ?,
            updated_at = NOW()
        WHERE
            id_user = ?
        "
    );


    if (!$stmt) {

        responseError(
            "Prepare update password gagal: " .
            $koneksi->error,
            500
        );

        exit;
    }


    $stmt->bind_param(
        "ssssi",
        $nama_lengkap,
        $email,
        $passwordHash,
        $status,
        $id_user
    );
}


// =====================================================
// EKSEKUSI UPDATE
// =====================================================

if (!$stmt->execute()) {

    $error = $stmt->error;

    $stmt->close();

    responseError(
        "Gagal menyimpan perubahan ke database: " .
        $error,
        500
    );

    exit;
}


// =====================================================
// CEK APAKAH ADA DATA YANG BERUBAH
// =====================================================

$affectedRows = $stmt->affected_rows;

$stmt->close();


// =====================================================
// RESPONSE BERHASIL
// =====================================================

responseSuccess(
    "Data akun karyawan berhasil diperbarui dan disimpan ke database.",
    [
        "id_user"      => $id_user,
        "nama_lengkap" => $nama_lengkap,
        "email"        => $email,

        // frontend tetap bisa menggunakan username
        "username"     => $email,

        "status"       => $status,

        "updated"      => $affectedRows > 0
    ]
);

?>