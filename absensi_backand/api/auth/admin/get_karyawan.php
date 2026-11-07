<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "../../../config/database.php";

try {

    // =====================================================
    // AMBIL ID CABANG
    // =====================================================

    $id_cabang = isset($_GET['id_cabang'])
        ? trim($_GET['id_cabang'])
        : '';


    // =====================================================
    // QUERY DATA KARYAWAN
    // =====================================================

    $sql = "
        SELECT
            k.id_karyawan,
            k.nama_karyawan,
            k.id_cabang,
            k.nik,
            k.jabatan,
            k.status,
            c.nama_cabang

        FROM karyawan k

        LEFT JOIN cabang c
            ON k.id_cabang = c.id_cabang

        WHERE k.status = 'aktif'
    ";


    $params = [];
    $types = "";


    // =====================================================
    // FILTER CABANG
    //
    // Tetap dipertahankan supaya fungsi lama
    // tidak rusak.
    // =====================================================

    if ($id_cabang !== '') {

        $sql .= " AND k.id_cabang = ?";

        $params[] = (int) $id_cabang;

        $types .= "i";
    }


    // =====================================================
    // URUTKAN NAMA
    // =====================================================

    $sql .= "
        ORDER BY k.nama_karyawan ASC
    ";


    // =====================================================
    // PREPARE
    // =====================================================

    $stmt = $koneksi->prepare($sql);

    if (!$stmt) {

        throw new Exception(
            "Gagal menyiapkan query: " .
            $koneksi->error
        );

    }


    // =====================================================
    // BIND PARAMETER
    // =====================================================

    if (!empty($params)) {

        $stmt->bind_param(
            $types,
            ...$params
        );

    }


    // =====================================================
    // EXECUTE
    // =====================================================

    if (!$stmt->execute()) {

        throw new Exception(
            "Gagal menjalankan query: " .
            $stmt->error
        );

    }


    // =====================================================
    // AMBIL HASIL
    // =====================================================

    $result = $stmt->get_result();

    $data = [];


    while ($row = $result->fetch_assoc()) {

        $data[] = [

            "id_karyawan" =>
                (int) $row["id_karyawan"],

            "nama_karyawan" =>
                $row["nama_karyawan"],

            "id_cabang" =>
                $row["id_cabang"] !== null
                    ? (int) $row["id_cabang"]
                    : null,

            "nik" =>
                $row["nik"],

            "jabatan" =>
                $row["jabatan"],

            "status" =>
                $row["status"],

            "nama_cabang" =>
                $row["nama_cabang"]

        ];

    }


    // =====================================================
    // RESPONSE
    // =====================================================

    echo json_encode([

        "success" => true,

        "message" =>
            "Data karyawan berhasil diambil",

        "jumlah" =>
            count($data),

        "data" =>
            $data

    ], JSON_UNESCAPED_UNICODE);


    $stmt->close();


} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            $e->getMessage(),

        "data" => []

    ], JSON_UNESCAPED_UNICODE);

}