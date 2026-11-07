<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "../../../config/database.php";

try {

    // =====================================================
    // AMBIL FILTER
    // =====================================================

    $tanggal = isset($_GET["tanggal"])
        ? trim($_GET["tanggal"])
        : "";

    $id_cabang = isset($_GET["id_cabang"])
        ? trim($_GET["id_cabang"])
        : "";


    // =====================================================
    // VALIDASI TANGGAL
    // =====================================================

    if ($tanggal !== "") {

        $date = DateTime::createFromFormat(
            "Y-m-d",
            $tanggal
        );

        if (
            !$date ||
            $date->format("Y-m-d") !== $tanggal
        ) {

            throw new Exception(
                "Format tanggal tidak valid."
            );

        }

    }


    // =====================================================
    // VALIDASI CABANG
    // =====================================================

    if (
        $id_cabang !== "" &&
        !ctype_digit($id_cabang)
    ) {

        throw new Exception(
            "ID cabang tidak valid."
        );

    }


    // =====================================================
    // JIKA ADA TANGGAL
    // =====================================================
    //
    // Tampilkan SEMUA karyawan aktif.
    //
    // Jika sudah absen:
    //     ambil data absensi.
    //
    // Jika belum absen:
    //     otomatis ALPHA.
    //
    // Jika cabang dipilih:
    //     hanya karyawan dari cabang tersebut.
    //
    // =====================================================

    if ($tanggal !== "") {

        $sql = "
            SELECT

                a.id_absensi,

                k.id_karyawan,

                k.id_user,

                k.nik,

                k.nama_karyawan,

                k.id_cabang,

                c.nama_cabang,

                ? AS tanggal,

                a.jam_masuk,

                a.jam_keluar,

                CASE
                    WHEN a.id_absensi IS NULL
                        THEN 'alpha'
                    ELSE LOWER(a.status)
                END AS status,

                CASE
                    WHEN a.id_absensi IS NULL
                        THEN 'Tidak melakukan absensi'
                    ELSE a.keterangan
                END AS keterangan,

                a.foto_masuk,
                a.foto_keluar,

                a.latitude_masuk,
                a.longitude_masuk,
                a.jarak_masuk,

                a.latitude_keluar,
                a.longitude_keluar,
                a.jarak_keluar,

                a.created_at,
                a.updated_at

            FROM karyawan k

            INNER JOIN cabang c
                ON c.id_cabang = k.id_cabang

            LEFT JOIN absensi a
                ON a.id_karyawan = k.id_karyawan
                AND a.tanggal = ?

            WHERE
                k.status = 'aktif'
        ";


        // =================================================
        // FILTER CABANG
        // =================================================

        if ($id_cabang !== "") {

            $sql .= "
                AND k.id_cabang = ?
            ";

        }


        $sql .= "
            ORDER BY
                k.nama_karyawan ASC
        ";


        $stmt = $koneksi->prepare($sql);

        if (!$stmt) {

            throw new Exception(
                "Gagal menyiapkan query: " .
                $koneksi->error
            );

        }


        // =================================================
        // BIND
        // =================================================

        if ($id_cabang !== "") {

            $stmt->bind_param(
                "ssi",
                $tanggal,
                $tanggal,
                $id_cabang
            );

        } else {

            $stmt->bind_param(
                "ss",
                $tanggal,
                $tanggal
            );

        }

    }

    // =====================================================
    // JIKA TIDAK ADA TANGGAL
    // =====================================================
    //
    // Hanya mengambil absensi yang memang sudah ada.
    //
    // Filter cabang tetap berjalan.
    //
    // =====================================================

    else {

        $sql = "
            SELECT

                a.id_absensi,

                k.id_karyawan,

                k.id_user,

                k.nik,

                k.nama_karyawan,

                k.id_cabang,

                c.nama_cabang,

                a.tanggal,

                a.jam_masuk,

                a.jam_keluar,

                LOWER(a.status) AS status,

                a.keterangan,

                a.foto_masuk,
                a.foto_keluar,

                a.latitude_masuk,
                a.longitude_masuk,
                a.jarak_masuk,

                a.latitude_keluar,
                a.longitude_keluar,
                a.jarak_keluar,

                a.created_at,
                a.updated_at

            FROM absensi a

            INNER JOIN karyawan k
                ON a.id_karyawan = k.id_karyawan

            INNER JOIN cabang c
                ON a.id_cabang = c.id_cabang

            WHERE
                k.status = 'aktif'
        ";


        // =================================================
        // FILTER CABANG
        // =================================================

        if ($id_cabang !== "") {

            $sql .= "
                AND a.id_cabang = ?
            ";

        }


        $sql .= "
            ORDER BY
                a.tanggal DESC,
                a.jam_masuk DESC,
                k.nama_karyawan ASC
        ";


        $stmt = $koneksi->prepare($sql);

        if (!$stmt) {

            throw new Exception(
                "Gagal menyiapkan query: " .
                $koneksi->error
            );

        }


        if ($id_cabang !== "") {

            $stmt->bind_param(
                "i",
                $id_cabang
            );

        }

    }


    // =====================================================
    // EKSEKUSI
    // =====================================================

    $stmt->execute();

    $result = $stmt->get_result();


    // =====================================================
    // DATA
    // =====================================================

    $data = [];


    while ($row = $result->fetch_assoc()) {

        $row["status"] = strtolower(
            trim(
                $row["status"] ?? ""
            )
        );


        if ($row["status"] === "") {

            $row["status"] = "alpha";

        }


        if (
            $row["status"] === "alpha" &&
            empty($row["keterangan"])
        ) {

            $row["keterangan"] =
                "Tidak melakukan absensi";

        }


        $data[] = $row;

    }


    // =====================================================
    // RESPONSE
    // =====================================================

    echo json_encode(
        [
            "success" => true,

            "message" =>
                "Data absensi berhasil diambil",

            "filter" => [
                "tanggal" => $tanggal,
                "id_cabang" => $id_cabang
            ],

            "total_data" => count($data),

            "data" => $data
        ],
        JSON_UNESCAPED_UNICODE
    );


    $stmt->close();


} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode(
        [
            "success" => false,

            "message" =>
                $e->getMessage(),

            "data" => []
        ],
        JSON_UNESCAPED_UNICODE
    );

}

?>