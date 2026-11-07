<?php

// =====================================================
// HAPUS DATA KARYAWAN ADMIN
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
// AMBIL ID KARYAWAN
// =====================================================

$id_karyawan = isset($input["id_karyawan"])
    ? (int) $input["id_karyawan"]
    : 0;


if ($id_karyawan <= 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID karyawan tidak valid."
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

    $stmtCheck = $koneksi->prepare("
        SELECT
            id_karyawan,
            id_user,
            nama_karyawan
        FROM karyawan
        WHERE id_karyawan = ?
        LIMIT 1
    ");


    if (!$stmtCheck) {

        throw new Exception(
            "Prepare cek data gagal: " .
            $koneksi->error
        );
    }


    $stmtCheck->bind_param(
        "i",
        $id_karyawan
    );

    $stmtCheck->execute();

    $result = $stmtCheck->get_result();


    if ($result->num_rows === 0) {

        $stmtCheck->close();

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Data karyawan tidak ditemukan."
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    $karyawan = $result->fetch_assoc();

    $id_user = $karyawan["id_user"];

    $stmtCheck->close();


    // =================================================
    // CEK ABSENSI
    // =================================================

    $stmt = $koneksi->prepare("
        SELECT COUNT(*) AS total
        FROM absensi
        WHERE id_karyawan = ?
    ");


    if (!$stmt) {

        throw new Exception(
            "Gagal mengecek data absensi: " .
            $koneksi->error
        );
    }


    $stmt->bind_param(
        "i",
        $id_karyawan
    );

    $stmt->execute();

    $result = $stmt->get_result();

    $totalAbsensi =
        (int) $result->fetch_assoc()["total"];

    $stmt->close();


    // =================================================
    // CEK JADWAL
    // =================================================

    $stmt = $koneksi->prepare("
        SELECT COUNT(*) AS total
        FROM jadwal_kerja
        WHERE id_karyawan = ?
    ");


    if (!$stmt) {

        throw new Exception(
            "Gagal mengecek jadwal kerja: " .
            $koneksi->error
        );
    }


    $stmt->bind_param(
        "i",
        $id_karyawan
    );

    $stmt->execute();

    $result = $stmt->get_result();

    $totalJadwal =
        (int) $result->fetch_assoc()["total"];

    $stmt->close();


    // =================================================
    // CEK PENGAJUAN IZIN
    // =================================================

    $totalIzin = 0;


    $cekTable = $koneksi->query("
        SHOW TABLES LIKE 'pengajuan_izin'
    ");


    if (
        $cekTable &&
        $cekTable->num_rows > 0
    ) {

        $stmt = $koneksi->prepare("
            SELECT COUNT(*) AS total
            FROM pengajuan_izin
            WHERE id_karyawan = ?
        ");


        if ($stmt) {

            $stmt->bind_param(
                "i",
                $id_karyawan
            );

            $stmt->execute();

            $result = $stmt->get_result();

            $totalIzin =
                (int) $result->fetch_assoc()["total"];

            $stmt->close();
        }
    }


    // =================================================
    // JIKA MASIH ADA DATA TERKAIT
    // =================================================

    if (
        $totalAbsensi > 0 ||
        $totalJadwal > 0 ||
        $totalIzin > 0
    ) {

        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" =>
                "Karyawan tidak dapat dihapus karena masih memiliki data absensi, jadwal kerja, atau pengajuan izin. Silakan ubah status menjadi nonaktif."
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    // =================================================
    // TRANSACTION
    // =================================================

    $koneksi->begin_transaction();


    // =================================================
    // HAPUS DATA KARYAWAN
    // =================================================

    $stmt = $koneksi->prepare("
        DELETE FROM karyawan
        WHERE id_karyawan = ?
    ");


    if (!$stmt) {

        throw new Exception(
            "Prepare hapus karyawan gagal: " .
            $koneksi->error
        );
    }


    $stmt->bind_param(
        "i",
        $id_karyawan
    );


    if (!$stmt->execute()) {

        throw new Exception(
            "Gagal menghapus data karyawan: " .
            $stmt->error
        );
    }


    $stmt->close();


    // =================================================
    // HAPUS AKUN USER
    // =================================================

    if (!empty($id_user)) {

        $stmt = $koneksi->prepare("
            DELETE FROM users
            WHERE id_user = ?
        ");


        if (!$stmt) {

            throw new Exception(
                "Prepare hapus akun gagal: " .
                $koneksi->error
            );
        }


        $stmt->bind_param(
            "i",
            $id_user
        );


        if (!$stmt->execute()) {

            throw new Exception(
                "Gagal menghapus akun user: " .
                $stmt->error
            );
        }


        $stmt->close();
    }


    // =================================================
    // COMMIT
    // =================================================

    $koneksi->commit();


    http_response_code(200);

    echo json_encode([
        "success" => true,
        "message" =>
            "Data karyawan dan akun berhasil dihapus."
    ], JSON_UNESCAPED_UNICODE);


} catch (Exception $e) {

    if ($koneksi->connect_errno === 0) {
        $koneksi->rollback();
    }


    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" =>
            "Data karyawan gagal dihapus.",
        "error" =>
            $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

?>