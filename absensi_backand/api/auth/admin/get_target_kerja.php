<?php

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/response.php';
require_once __DIR__ . '/../../../config/database.php';


header(
    'Content-Type: application/json; charset=UTF-8'
);


// =====================================================
// CEK METHOD
// =====================================================

if (
    $_SERVER['REQUEST_METHOD'] !== 'GET'
) {


    http_response_code(405);


    echo json_encode([

        'success' => false,

        'message' =>
            'Method tidak diizinkan. Gunakan GET.'

    ]);


    exit();

}


// =====================================================
// PROSES
// =====================================================

try {


    // =================================================
    // FILTER BULAN
    // =================================================

    $bulan =
        isset($_GET['bulan']) &&
        $_GET['bulan'] !== ''

        ? (int) $_GET['bulan']

        : null;


    // =================================================
    // FILTER TAHUN
    // =================================================

    $tahun =
        isset($_GET['tahun']) &&
        $_GET['tahun'] !== ''

        ? (int) $_GET['tahun']

        : null;


    // =================================================
    // QUERY
    // =================================================

    $sql = "

        SELECT

            tk.id,

            tk.karyawan_id,

            k.nama_karyawan,

            tk.bulan,

            tk.tahun,

            tk.hari_efektif,

            tk.min_jam_kerja,

            tk.created_at,

            tk.updated_at


        FROM target_kerja_karyawan tk


        LEFT JOIN karyawan k

            ON tk.karyawan_id =
               k.id_karyawan


        WHERE 1 = 1

    ";


    // =================================================
    // PARAMETER
    // =================================================

    $params = [];

    $types = "";


    // =================================================
    // FILTER BULAN
    // =================================================

    if (
        $bulan !== null
    ) {


        $sql .= "
            AND tk.bulan = ?
        ";


        $params[] =
            $bulan;


        $types .=
            "i";

    }


    // =================================================
    // FILTER TAHUN
    // =================================================

    if (
        $tahun !== null
    ) {


        $sql .= "
            AND tk.tahun = ?
        ";


        $params[] =
            $tahun;


        $types .=
            "i";

    }


    // =================================================
    // URUTKAN
    // =================================================

    $sql .= "

        ORDER BY

            tk.tahun DESC,

            tk.bulan DESC,

            k.nama_karyawan ASC

    ";


    // =================================================
    // PREPARE
    // =================================================

    $stmt =
        $koneksi->prepare(
            $sql
        );


    if (
        !$stmt
    ) {


        throw new Exception(

            "Gagal menyiapkan query: "
            .
            $koneksi->error

        );

    }


    // =================================================
    // BIND PARAMETER
    // =================================================

    if (
        count($params) > 0
    ) {


        $stmt->bind_param(

            $types,

            ...$params

        );

    }


    // =================================================
    // EXECUTE
    // =================================================

    $stmt->execute();


    // =================================================
    // RESULT
    // =================================================

    $result =
        $stmt->get_result();


    // =================================================
    // DATA
    // =================================================

    $data = [];


    while (
        $row =
        $result->fetch_assoc()
    ) {


        $data[] =
            $row;

    }


    // =================================================
    // RESPONSE
    // =================================================

    echo json_encode([

        'success' => true,

        'message' =>
            'Data target kerja berhasil diambil.',

        'data' =>
            $data

    ]);


    // =================================================
    // CLOSE
    // =================================================

    $stmt->close();


}


// =====================================================
// ERROR
// =====================================================

catch (
    Exception $e
) {


    http_response_code(
        500
    );


    echo json_encode([

        'success' => false,

        'message' =>
            'Gagal mengambil data target kerja.',

        'error' =>
            $e->getMessage()

    ]);

}

?>