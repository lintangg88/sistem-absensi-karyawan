<?php

require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../config/response.php";


/*
|--------------------------------------------------------------------------
| 1. CEK METHOD REQUEST
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    responseError(
        "Method tidak diperbolehkan",
        405
    );
}


/*
|--------------------------------------------------------------------------
| 2. MENGAMBIL DATA JSON DARI FRONTEND
|--------------------------------------------------------------------------
*/

$input = json_decode(
    file_get_contents("php://input"),
    true
);


/*
|--------------------------------------------------------------------------
| 3. AMBIL EMAIL DAN PASSWORD
|--------------------------------------------------------------------------
*/

$email = trim(
    $input["email"] ?? ""
);

$password = $input["password"] ?? "";


/*
|--------------------------------------------------------------------------
| 4. VALIDASI INPUT
|--------------------------------------------------------------------------
*/

if ($email === "") {

    responseError(
        "Email wajib diisi",
        422
    );
}


if ($password === "") {

    responseError(
        "Password wajib diisi",
        422
    );
}


/*
|--------------------------------------------------------------------------
| 5. CARI USER BERDASARKAN EMAIL
|--------------------------------------------------------------------------
*/

$query = "
    SELECT
        id_user,
        email,
        password,
        nama_lengkap,
        role,
        status
    FROM users
    WHERE email = ?
    LIMIT 1
";

$stmt = $koneksi->prepare($query);

if (!$stmt) {

    responseError(
        "Query database gagal: " . $koneksi->error,
        500
    );
}


$stmt->bind_param(
    "s",
    $email
);


$stmt->execute();


$result = $stmt->get_result();


$user = $result->fetch_assoc();


/*
|--------------------------------------------------------------------------
| 6. CEK USER
|--------------------------------------------------------------------------
*/

if (!$user) {

    responseError(
        "Email atau password salah",
        401
    );
}


/*
|--------------------------------------------------------------------------
| 7. CEK STATUS AKUN
|--------------------------------------------------------------------------
*/

if ($user["status"] !== "aktif") {

    responseError(
        "Akun kamu tidak aktif",
        403
    );
}


/*
|--------------------------------------------------------------------------
| 8. VERIFIKASI PASSWORD
|--------------------------------------------------------------------------
*/

if (!password_verify(
    $password,
    $user["password"]
)) {

    responseError(
        "Email atau password salah",
        401
    );
}


/*
|--------------------------------------------------------------------------
| 9. JANGAN KIRIM PASSWORD KE FRONTEND
|--------------------------------------------------------------------------
*/

unset($user["password"]);

/*
|--------------------------------------------------------------------------
| 10. LOGIN BERHASIL
|--------------------------------------------------------------------------
*/

responseSuccess(
    "Login berhasil",
    $user
);