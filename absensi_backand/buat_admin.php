<?php

require_once "config/database.php";


$email = "indah@gmail.com";

$password = "indah123";

$nama_lengkap = "indah paraswati";

$role = "karyawan";

$status = "aktif";


/*
|--------------------------------------------------------------------------
| HASH PASSWORD
|--------------------------------------------------------------------------
*/

$password_hash = password_hash(
    $password,
    PASSWORD_DEFAULT
);


/*
|--------------------------------------------------------------------------
| INSERT USER
|--------------------------------------------------------------------------
*/

$query = "
    INSERT INTO users
    (
        email,
        password,
        nama_lengkap,
        role,
        status
    )
    VALUES
    (?, ?, ?, ?, ?)
";


$stmt = $koneksi->prepare($query);


if (!$stmt) {

    die(
        "Query gagal: " .
        $koneksi->error
    );

}


$stmt->bind_param(
    "sssss",
    $email,
    $password_hash,
    $nama_lengkap,
    $role,
    $status
);


if ($stmt->execute()) {

    echo "email berhasil dibuat.<br>";
    echo "Email: indah@gmail.com<br>";
    echo "Password: indah123";

} else {

    echo "Gagal membuat email: " .
        $stmt->error;
}