<?php

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/response.php';
require_once __DIR__ . '/../../../config/database.php';


// =========================================================
// CEK METHOD
// =========================================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method tidak diizinkan. Gunakan POST.'
    ]);

    exit();
}


// =========================================================
// AMBIL DATA JSON
// =========================================================

$rawInput = file_get_contents("php://input");

$data = json_decode($rawInput, true);


if (!is_array($data)) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Data JSON tidak valid.'
    ]);

    exit();
}


// =========================================================
// AMBIL DATA
// =========================================================

$karyawan_id = isset($data['karyawan_id'])
    ? (int) $data['karyawan_id']
    : 0;

$bulan = isset($data['bulan'])
    ? (int) $data['bulan']
    : 0;

$tahun = isset($data['tahun'])
    ? (int) $data['tahun']
    : 0;

$hari_efektif = isset($data['hari_efektif'])
    ? (int) $data['hari_efektif']
    : 20;

$min_jam_kerja = isset($data['min_jam_kerja'])
    ? (float) $data['min_jam_kerja']
    : 159.70;


// =========================================================
// VALIDASI DATA
// =========================================================

if ($karyawan_id <= 0) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Karyawan wajib dipilih.'
    ]);

    exit();
}


if ($bulan < 1 || $bulan > 12) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Bulan tidak valid.'
    ]);

    exit();
}


if ($tahun < 2020 || $tahun > 2099) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Tahun tidak valid.'
    ]);

    exit();
}


if ($hari_efektif <= 0) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Hari efektif harus lebih dari 0.'
    ]);

    exit();
}


if ($min_jam_kerja <= 0) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Minimal jam kerja harus lebih dari 0.'
    ]);

    exit();
}


// =========================================================
// SIMPAN DATA
// =========================================================

try {

    /*
     * Menggunakan tabel sesuai struktur database:
     *
     * target_kerja_karyawan
     *
     */

    $sql = "
        INSERT INTO target_kerja_karyawan
        (
            karyawan_id,
            bulan,
            tahun,
            hari_efektif,
            min_jam_kerja
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?
        )
    ";


    // =====================================================
    // PREPARED STATEMENT MYSQLI
    // =====================================================

    $stmt = mysqli_prepare($koneksi, $sql);


    if (!$stmt) {

        throw new Exception(
            mysqli_error($koneksi)
        );

    }


    mysqli_stmt_bind_param(
        $stmt,
        "iiidd",
        $karyawan_id,
        $bulan,
        $tahun,
        $hari_efektif,
        $min_jam_kerja
    );


    // =====================================================
    // EKSEKUSI
    // =====================================================

    $executed =
        mysqli_stmt_execute($stmt);


    if (!$executed) {

        throw new Exception(
            mysqli_stmt_error($stmt)
        );

    }


    // =====================================================
    // BERHASIL
    // =====================================================

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Target kerja berhasil ditambahkan.',
        'data' => [
            'id' => mysqli_insert_id($koneksi),
            'karyawan_id' => $karyawan_id,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'hari_efektif' => $hari_efektif,
            'min_jam_kerja' => $min_jam_kerja
        ]
    ]);


    mysqli_stmt_close($stmt);


} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Gagal menyimpan target kerja.',
        'error' => $e->getMessage()
    ]);

}

?>