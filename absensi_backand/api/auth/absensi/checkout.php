<?php

require_once "../../../config/cors.php";
require_once "../../../config/database.php";
require_once "../../../config/response.php";


// =====================================================
// CEK METHOD
// =====================================================

if (
    $_SERVER["REQUEST_METHOD"] !== "POST"
) {

    responseError(
        "Method tidak diperbolehkan",
        405
    );
}


// =====================================================
// AMBIL DATA
// =====================================================

$id_user =
    intval(
        $_POST["id_user"] ?? 0
    );


$latitude =
    floatval(
        $_POST["latitude"] ?? 0
    );


$longitude =
    floatval(
        $_POST["longitude"] ?? 0
    );


// =====================================================
// VALIDASI USER
// =====================================================

if (
    $id_user <= 0
) {

    responseError(
        "ID user tidak valid",
        422
    );
}


// =====================================================
// VALIDASI LOKASI
// =====================================================

if (
    $latitude == 0 ||
    $longitude == 0
) {

    responseError(
        "Lokasi tidak valid",
        422
    );
}


// =====================================================
// VALIDASI FOTO
// =====================================================

if (
    !isset($_FILES["foto"])
) {

    responseError(
        "Foto selfie wajib diambil",
        422
    );
}


if (
    $_FILES["foto"]["error"] !==
    UPLOAD_ERR_OK
) {

    responseError(
        "Foto selfie gagal diterima server",
        422
    );
}


// =====================================================
// CARI KARYAWAN + CABANG
// =====================================================

$query = "

    SELECT

        k.id_karyawan,

        k.id_cabang,

        c.nama_cabang,

        c.latitude AS kantor_latitude,

        c.longitude AS kantor_longitude,

        c.radius_meter

    FROM karyawan k

    INNER JOIN cabang c

        ON k.id_cabang =
           c.id_cabang

    WHERE

        k.id_user = ?

        AND k.status = 'aktif'

        AND c.status = 'aktif'

    LIMIT 1

";


$stmt =
    $koneksi->prepare(
        $query
    );


if (
    !$stmt
) {

    responseError(
        "Query data karyawan gagal: " .
        $koneksi->error,
        500
    );
}


$stmt->bind_param(
    "i",
    $id_user
);


if (
    !$stmt->execute()
) {

    responseError(
        "Gagal mengambil data karyawan: " .
        $stmt->error,
        500
    );
}


$result =
    $stmt->get_result();


$data =
    $result->fetch_assoc();


if (
    !$data
) {

    responseError(
        "Data karyawan tidak ditemukan",
        404
    );
}


// =====================================================
// FUNGSI HITUNG JARAK
// =====================================================

function hitungJarak(

    $lat1,
    $lon1,
    $lat2,
    $lon2

) {

    $R =
        6371000;


    $dLat =
        deg2rad(
            $lat2 -
            $lat1
        );


    $dLon =
        deg2rad(
            $lon2 -
            $lon1
        );


    $a =

        sin(
            $dLat / 2
        )
        *
        sin(
            $dLat / 2
        )

        +

        cos(
            deg2rad($lat1)
        )

        *

        cos(
            deg2rad($lat2)
        )

        *

        sin(
            $dLon / 2
        )

        *

        sin(
            $dLon / 2
        );


    $c =

        2 *
        atan2(

            sqrt($a),

            sqrt(
                1 - $a
            )

        );


    return $R * $c;

}


// =====================================================
// HITUNG JARAK USER KE CABANG
// =====================================================

$jarak =
    hitungJarak(

        $latitude,

        $longitude,

        $data["kantor_latitude"],

        $data["kantor_longitude"]

    );


$radius =
    (int)
    $data["radius_meter"];


// =====================================================
// CEK RADIUS
// =====================================================

if (
    $jarak >
    $radius
) {

    responseError(

        "Anda berada di luar area absensi. " .

        "Jarak Anda " .

        round($jarak) .

        " meter. Maksimal " .

        $radius .

        " meter.",

        403,

        [

            "jarak_meter" =>
                round(
                    $jarak,
                    2
                ),

            "radius_meter" =>
                $radius,

            "status_lokasi" =>
                "di_luar_area"

        ]

    );

}


// =====================================================
// TANGGAL HARI INI
// =====================================================

$tanggal =
    date(
        "Y-m-d"
    );


// =====================================================
// CARI ABSENSI HARI INI
// =====================================================

$queryAbsensi = "

    SELECT

        id_absensi,

        jam_masuk,

        jam_keluar

    FROM absensi

    WHERE

        id_karyawan = ?

        AND tanggal = ?

    LIMIT 1

";


$stmtAbsensi =
    $koneksi->prepare(
        $queryAbsensi
    );


if (
    !$stmtAbsensi
) {

    responseError(

        "Query absensi gagal: " .
        $koneksi->error,

        500

    );

}


$stmtAbsensi->bind_param(

    "is",

    $data["id_karyawan"],

    $tanggal

);


if (
    !$stmtAbsensi->execute()
) {

    responseError(

        "Gagal mengambil data absensi: " .
        $stmtAbsensi->error,

        500

    );

}


$resultAbsensi =
    $stmtAbsensi->get_result();


$absensi =
    $resultAbsensi->fetch_assoc();


// =====================================================
// BELUM CHECK IN
// =====================================================

if (
    !$absensi
) {

    responseError(

        "Anda belum melakukan check in hari ini",

        400

    );

}


// =====================================================
// SUDAH CHECK OUT
// =====================================================

if (
    !empty(
        $absensi["jam_keluar"]
    )
) {

    responseError(

        "Anda sudah melakukan check out hari ini",

        409

    );

}


// =====================================================
// VALIDASI FOTO
// =====================================================

$foto =
    $_FILES["foto"];


$allowedTypes = [

    "image/jpeg",

    "image/png",

    "image/webp"

];


if (
    !in_array(
        $foto["type"],
        $allowedTypes
    )
) {

    responseError(

        "Format foto tidak diperbolehkan",

        422

    );

}


if (
    $foto["size"] >
    5 * 1024 * 1024
) {

    responseError(

        "Ukuran foto maksimal 5 MB",

        422

    );

}


// =====================================================
// FOLDER UPLOAD
//
// checkout.php:
//
// api/auth/absensi/checkout.php
//
// uploads:
//
// uploads/absensi/
//
// ../../../ = keluar dari:
//
// absensi
// auth
// api
//
// kemudian masuk uploads
// =====================================================

$uploadDir =
    "../../../uploads/absensi/";


// =====================================================
// BUAT FOLDER JIKA BELUM ADA
// =====================================================

if (
    !is_dir(
        $uploadDir
    )
) {

    if (
        !mkdir(
            $uploadDir,
            0777,
            true
        )
    ) {

        responseError(

            "Folder upload tidak dapat dibuat",

            500

        );

    }

}


// =====================================================
// NAMA FILE
// =====================================================

$namaFile =

    "keluar_" .

    $data["id_karyawan"] .

    "_" .

    date(
        "Ymd_His"
    ) .

    "_" .

    uniqid() .

    ".jpg";


// =====================================================
// PATH FOTO
// =====================================================

$pathFoto =

    $uploadDir .
    $namaFile;


// =====================================================
// PINDAHKAN FOTO
// =====================================================

if (
    !move_uploaded_file(

        $foto["tmp_name"],

        $pathFoto

    )
) {

    responseError(

        "Gagal menyimpan foto",

        500

    );

}


// =====================================================
// JAM KELUAR
// =====================================================

$jamKeluar =
    date(
        "H:i:s"
    );


// =====================================================
// UPDATE ABSENSI
// =====================================================

$queryUpdate = "

    UPDATE absensi

    SET

        jam_keluar = ?,

        foto_keluar = ?,

        latitude_keluar = ?,

        longitude_keluar = ?,

        jarak_keluar = ?

    WHERE

        id_absensi = ?

";


// =====================================================
// PREPARE
// =====================================================

$stmtUpdate =
    $koneksi->prepare(
        $queryUpdate
    );


if (
    !$stmtUpdate
) {

    unlink(
        $pathFoto
    );


    responseError(

        "Query update absensi gagal: " .
        $koneksi->error,

        500

    );

}


// =====================================================
// BIND PARAMETER
// =====================================================

$stmtUpdate->bind_param(

    "ssdddi",

    $jamKeluar,

    $namaFile,

    $latitude,

    $longitude,

    $jarak,

    $absensi["id_absensi"]

);


// =====================================================
// EKSEKUSI UPDATE
// =====================================================

if (
    !$stmtUpdate->execute()
) {

    unlink(
        $pathFoto
    );


    responseError(

        "Gagal menyimpan check out: " .
        $stmtUpdate->error,

        500

    );

}


// =====================================================
// CEK AFFECTED ROW
// =====================================================

if (
    $stmtUpdate->affected_rows <= 0
) {

    unlink(
        $pathFoto
    );


    responseError(

        "Data absensi tidak berhasil diperbarui",

        500

    );

}


// =====================================================
// RESPONSE BERHASIL
// =====================================================

responseSuccess(

    "Check out berhasil",

    [

        "id_absensi" =>
            $absensi["id_absensi"],


        "tanggal" =>
            $tanggal,


        "jam_keluar" =>
            $jamKeluar,


        "nama_cabang" =>
            $data["nama_cabang"],


        "jarak_meter" =>
            round(
                $jarak,
                2
            ),


        "radius_meter" =>
            $radius,


        "foto" =>
            "uploads/absensi/" .
            $namaFile

    ]

);