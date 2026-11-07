<?php

require_once "../../../config/cors.php";
require_once "../../../config/database.php";
require_once "../../../config/response.php";


/*
|--------------------------------------------------------------------------
| CEK METHOD
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
| TIMEZONE
|--------------------------------------------------------------------------
*/

date_default_timezone_set("Asia/Jakarta");


/*
|--------------------------------------------------------------------------
| AMBIL DATA JSON
|--------------------------------------------------------------------------
*/

$data = json_decode(
    file_get_contents("php://input"),
    true
);


$id_user = intval(
    $data["id_user"] ?? 0
);


/*
|--------------------------------------------------------------------------
| VALIDASI ID USER
|--------------------------------------------------------------------------
*/

if ($id_user <= 0) {

    responseError(
        "ID user tidak valid",
        422
    );

}


/*
|--------------------------------------------------------------------------
| CARI DATA KARYAWAN
|--------------------------------------------------------------------------
*/

$query = "

    SELECT

        id_karyawan,

        nama_karyawan

    FROM karyawan

    WHERE id_user = ?

      AND status = 'aktif'

    LIMIT 1

";


$stmt =
    $koneksi->prepare($query);


if (!$stmt) {

    responseError(
        "Query karyawan gagal: " .
        $koneksi->error,
        500
    );

}


$stmt->bind_param(
    "i",
    $id_user
);


if (!$stmt->execute()) {

    responseError(
        "Gagal mengambil data karyawan",
        500
    );

}


$result =
    $stmt->get_result();


$karyawan =
    $result->fetch_assoc();


$stmt->close();


/*
|--------------------------------------------------------------------------
| KARYAWAN TIDAK DITEMUKAN
|--------------------------------------------------------------------------
*/

if (!$karyawan) {

    responseError(
        "Data karyawan tidak ditemukan",
        404
    );

}


/*
|--------------------------------------------------------------------------
| TANGGAL HARI INI
|--------------------------------------------------------------------------
*/

$tanggalHariIni =
    date("Y-m-d");


/*
|--------------------------------------------------------------------------
| CEK ABSENSI HARI INI
|--------------------------------------------------------------------------
*/

$queryAbsensi = "

    SELECT

        id_absensi,

        tanggal,

        jam_masuk,

        jam_keluar,

        status,

        keterangan

    FROM absensi

    WHERE id_karyawan = ?

      AND tanggal = ?

    ORDER BY id_absensi DESC

    LIMIT 1

";


$stmtAbsensi =
    $koneksi->prepare(
        $queryAbsensi
    );


if (!$stmtAbsensi) {

    responseError(
        "Query absensi gagal: " .
        $koneksi->error,
        500
    );

}


$stmtAbsensi->bind_param(
    "is",

    $karyawan["id_karyawan"],

    $tanggalHariIni
);


if (!$stmtAbsensi->execute()) {

    responseError(
        "Gagal mengecek absensi",
        500
    );

}


$resultAbsensi =
    $stmtAbsensi->get_result();


$absensi =
    $resultAbsensi->fetch_assoc();


$stmtAbsensi->close();


/*
|--------------------------------------------------------------------------
| BELUM ADA RECORD ABSENSI
|--------------------------------------------------------------------------
*/

if (!$absensi) {

    responseSuccess(
        "Belum melakukan absensi hari ini",
        [

            "sudah_absen" =>
                false,

            "boleh_checkin" =>
                true,

            "status_absensi" =>
                null,

            "id_absensi" =>
                null,

            "tanggal" =>
                $tanggalHariIni,

            "jam_masuk" =>
                null,

            "jam_keluar" =>
                null,

            "keterangan" =>
                null

        ]
    );

}


/*
|--------------------------------------------------------------------------
| AMBIL STATUS
|--------------------------------------------------------------------------
*/

$statusAbsensi =
    strtolower(
        trim(
            $absensi["status"] ?? ""
        )
    );


/*
|--------------------------------------------------------------------------
| CEK APAKAH SUDAH CHECK IN
|--------------------------------------------------------------------------
*/

$sudahCheckin =
    !empty(
        $absensi["jam_masuk"]
    );


/*
|--------------------------------------------------------------------------
| STATUS TIDAK HADIR
|--------------------------------------------------------------------------
|
| PENTING:
|
| Record "tidak hadir" BUKAN berarti sudah check-in.
|
| Karena checkin.php memang dirancang untuk
| mengubah record tidak hadir menjadi hadir.
|
|--------------------------------------------------------------------------
*/

if (
    $statusAbsensi === "tidak hadir"
    &&
    !$sudahCheckin
) {

    responseSuccess(
        "Anda belum melakukan check in. Status sementara tidak hadir.",
        [

            "sudah_absen" =>
                false,

            "boleh_checkin" =>
                true,

            "status_absensi" =>
                "tidak hadir",

            "id_absensi" =>
                $absensi["id_absensi"],

            "tanggal" =>
                $absensi["tanggal"],

            "jam_masuk" =>
                null,

            "jam_keluar" =>
                $absensi["jam_keluar"],

            "keterangan" =>
                $absensi["keterangan"]

        ]
    );

}


/*
|--------------------------------------------------------------------------
| STATUS IZIN
|--------------------------------------------------------------------------
|
| Kalau sudah ada izin, jangan izinkan check-in.
|
|--------------------------------------------------------------------------
*/

if (
    $statusAbsensi === "izin"
) {

    responseSuccess(
        "Hari ini tercatat sebagai izin.",
        [

            "sudah_absen" =>
                true,

            "boleh_checkin" =>
                false,

            "status_absensi" =>
                "izin",

            "id_absensi" =>
                $absensi["id_absensi"],

            "tanggal" =>
                $absensi["tanggal"],

            "jam_masuk" =>
                $absensi["jam_masuk"],

            "jam_keluar" =>
                $absensi["jam_keluar"],

            "keterangan" =>
                $absensi["keterangan"]

        ]
    );

}


/*
|--------------------------------------------------------------------------
| SUDAH CHECK IN
|--------------------------------------------------------------------------
*/

if ($sudahCheckin) {

    responseSuccess(
        "Sudah melakukan absensi hari ini.",
        [

            "sudah_absen" =>
                true,

            "boleh_checkin" =>
                false,

            "status_absensi" =>
                $statusAbsensi,

            "id_absensi" =>
                $absensi["id_absensi"],

            "tanggal" =>
                $absensi["tanggal"],

            "jam_masuk" =>
                $absensi["jam_masuk"],

            "jam_keluar" =>
                $absensi["jam_keluar"],

            "keterangan" =>
                $absensi["keterangan"]

        ]
    );

}


/*
|--------------------------------------------------------------------------
| DEFAULT
|--------------------------------------------------------------------------
*/

responseSuccess(
    "Data absensi hari ini.",
    [

        "sudah_absen" =>
            false,

        "boleh_checkin" =>
            true,

        "status_absensi" =>
            $statusAbsensi,

        "id_absensi" =>
            $absensi["id_absensi"],

        "tanggal" =>
            $absensi["tanggal"],

        "jam_masuk" =>
            $absensi["jam_masuk"],

        "jam_keluar" =>
            $absensi["jam_keluar"],

        "keterangan" =>
            $absensi["keterangan"]

    ]
);

?>