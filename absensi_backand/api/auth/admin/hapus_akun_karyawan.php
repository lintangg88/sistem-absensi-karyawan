<?php

// =====================================================
// HAPUS AKUN KARYAWAN
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

$input = json_decode(
    file_get_contents("php://input"),
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
// ID USER
// =====================================================

$id_user =
    isset($input["id_user"])
        ? (int) $input["id_user"]
        : 0;


if ($id_user <= 0) {

    responseError(
        "ID user tidak valid.",
        400
    );

    exit;
}


// =====================================================
// CEK USER
// =====================================================

$stmt = $koneksi->prepare(
    "
    SELECT
        id_user,
        email,
        role
    FROM users
    WHERE id_user = ?
    LIMIT 1
    "
);


if (!$stmt) {

    responseError(
        "Prepare query gagal: " .
        $koneksi->error,
        500
    );

    exit;
}


$stmt->bind_param(
    "i",
    $id_user
);


$stmt->execute();


$result =
    $stmt->get_result();


if ($result->num_rows === 0) {

    $stmt->close();

    responseError(
        "Akun tidak ditemukan.",
        404
    );

    exit;
}


$user =
    $result->fetch_assoc();


$stmt->close();


// =====================================================
// JANGAN HAPUS ADMIN
// =====================================================

if ($user["role"] !== "karyawan") {

    responseError(
        "Hanya akun karyawan yang dapat dihapus.",
        403
    );

    exit;
}


// =====================================================
// TRANSAKSI
// =====================================================

$koneksi->begin_transaction();


try {

    // =================================================
    // HAPUS DATA KARYAWAN
    // =================================================

    $stmtKaryawan = $koneksi->prepare(
        "
        DELETE FROM karyawan
        WHERE id_user = ?
        "
    );


    if (!$stmtKaryawan) {

        throw new Exception(
            "Prepare hapus data karyawan gagal: " .
            $koneksi->error
        );
    }


    $stmtKaryawan->bind_param(
        "i",
        $id_user
    );


    if (!$stmtKaryawan->execute()) {

        throw new Exception(
            "Gagal menghapus data karyawan: " .
            $stmtKaryawan->error
        );
    }


    $stmtKaryawan->close();


    // =================================================
    // HAPUS USER
    // =================================================

    $stmtUser = $koneksi->prepare(
        "
        DELETE FROM users
        WHERE id_user = ?
        "
    );


    if (!$stmtUser) {

        throw new Exception(
            "Prepare hapus akun gagal: " .
            $koneksi->error
        );
    }


    $stmtUser->bind_param(
        "i",
        $id_user
    );


    if (!$stmtUser->execute()) {

        throw new Exception(
            "Gagal menghapus akun: " .
            $stmtUser->error
        );
    }


    $stmtUser->close();


    // =================================================
    // COMMIT
    // =================================================

    $koneksi->commit();


    responseSuccess(
        "Akun karyawan berhasil dihapus.",
        [
            "id_user" => $id_user
        ]
    );


} catch (Exception $e) {

    $koneksi->rollback();


    responseError(
        $e->getMessage(),
        500
    );
}

?>