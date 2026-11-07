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
| AMBIL DATA
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| VALIDASI
|--------------------------------------------------------------------------
*/

if ($id_user <= 0) {

    responseError(
        "ID user tidak valid",
        422
    );

}


if (
    $latitude == 0 ||
    $longitude == 0
) {

    responseError(
        "Lokasi tidak valid",
        422
    );

}


if (
    !isset($_FILES["foto"]) ||
    $_FILES["foto"]["error"] !== UPLOAD_ERR_OK
) {

    responseError(
        "Foto selfie wajib diambil",
        422
    );

}


/*
|--------------------------------------------------------------------------
| TANGGAL HARI INI
|--------------------------------------------------------------------------
*/

$tanggal =
    date("Y-m-d");


/*
|--------------------------------------------------------------------------
| CARI JADWAL KERJA HARI INI
|--------------------------------------------------------------------------
|
| PENTING:
|
| id_cabang diambil dari jadwal_kerja.
|
|--------------------------------------------------------------------------
*/

$query = "

    SELECT

        j.id_jadwal,

        j.id_karyawan,

        j.id_cabang,

        j.tanggal,

        j.nama_shift,

        j.pagi,

        j.malam,

        j.status AS status_jadwal,

        k.nama_karyawan,

        c.nama_cabang,

        c.latitude AS kantor_latitude,

        c.longitude AS kantor_longitude,

        c.radius_meter

    FROM jadwal_kerja j

    INNER JOIN karyawan k
        ON j.id_karyawan = k.id_karyawan

    INNER JOIN cabang c
        ON j.id_cabang = c.id_cabang

    WHERE k.id_user = ?

      AND j.tanggal = ?

      AND j.status = 'terjadwal'

      AND k.status = 'aktif'

      AND c.status = 'aktif'

    ORDER BY j.id_jadwal DESC

    LIMIT 1

";


$stmt =
    $koneksi->prepare($query);


if (!$stmt) {

    responseError(
        "Query jadwal gagal: " .
        $koneksi->error,
        500
    );

}


$stmt->bind_param(
    "is",
    $id_user,
    $tanggal
);


if (!$stmt->execute()) {

    responseError(
        "Gagal mengambil jadwal kerja",
        500
    );

}


$result =
    $stmt->get_result();


$data =
    $result->fetch_assoc();


$stmt->close();


/*
|--------------------------------------------------------------------------
| JADWAL TIDAK DITEMUKAN
|--------------------------------------------------------------------------
*/

if (!$data) {

    responseError(
        "Anda tidak memiliki jadwal kerja hari ini",
        403
    );

}


/*
|--------------------------------------------------------------------------
| HITUNG JARAK
|--------------------------------------------------------------------------
*/

function hitungJarak(
    $lat1,
    $lon1,
    $lat2,
    $lon2
) {

    $earthRadius =
        6371000;


    $dLat =
        deg2rad(
            $lat2 - $lat1
        );


    $dLon =
        deg2rad(
            $lon2 - $lon1
        );


    $a =
        sin($dLat / 2) *
        sin($dLat / 2)

        +

        cos(
            deg2rad($lat1)
        )

        *

        cos(
            deg2rad($lat2)
        )

        *

        sin($dLon / 2) *
        sin($dLon / 2);


    $c =
        2 *
        atan2(
            sqrt($a),
            sqrt(1 - $a)
        );


    return
        $earthRadius *
        $c;

}


/*
|--------------------------------------------------------------------------
| HITUNG JARAK KE CABANG DARI JADWAL
|--------------------------------------------------------------------------
*/

$jarak =
    hitungJarak(
        $latitude,
        $longitude,
        $data["kantor_latitude"],
        $data["kantor_longitude"]
    );


$radius =
    (int) $data["radius_meter"];


/*
|--------------------------------------------------------------------------
| CEK RADIUS
|--------------------------------------------------------------------------
*/

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
                round($jarak, 2),

            "radius_meter" =>
                $radius,

            "id_cabang" =>
                (int) $data["id_cabang"],

            "nama_cabang" =>
                $data["nama_cabang"],

            "status_lokasi" =>
                "di_luar_area"

        ]
    );

}


/*
|--------------------------------------------------------------------------
| CEK ABSENSI HARI INI
|--------------------------------------------------------------------------
*/

$queryCek = "

    SELECT

        id_absensi,

        jam_masuk,

        status

    FROM absensi

    WHERE id_karyawan = ?

      AND tanggal = ?

    LIMIT 1

";


$stmtCek =
    $koneksi->prepare(
        $queryCek
    );


if (!$stmtCek) {

    responseError(
        "Query pengecekan absensi gagal",
        500
    );

}


$stmtCek->bind_param(
    "is",
    $data["id_karyawan"],
    $tanggal
);


$stmtCek->execute();


$resultCek =
    $stmtCek->get_result();


$absensiHariIni =
    $resultCek->fetch_assoc();


$stmtCek->close();


/*
|--------------------------------------------------------------------------
| JIKA SUDAH CHECK IN
|--------------------------------------------------------------------------
*/

if (
    $absensiHariIni &&
    !empty($absensiHariIni["jam_masuk"])
) {

    responseError(
        "Anda sudah melakukan check in hari ini",
        409
    );

}


/*
|--------------------------------------------------------------------------
| VALIDASI FOTO
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| FOLDER UPLOAD
|--------------------------------------------------------------------------
*/

$uploadDir =
    "../../../uploads/absensi/";


if (
    !is_dir($uploadDir)
) {

    mkdir(
        $uploadDir,
        0777,
        true
    );

}


/*
|--------------------------------------------------------------------------
| NAMA FOTO
|--------------------------------------------------------------------------
*/

$namaFile =

    "masuk_" .

    $data["id_karyawan"] .

    "_" .

    date("Ymd_His") .

    "_" .

    uniqid() .

    ".jpg";


$pathFoto =
    $uploadDir .
    $namaFile;


/*
|--------------------------------------------------------------------------
| SIMPAN FOTO
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| JAM MASUK
|--------------------------------------------------------------------------
*/

$jamMasuk =
    date("H:i:s");


/*
|--------------------------------------------------------------------------
| JIKA ADA RECORD TIDAK HADIR
|--------------------------------------------------------------------------
|
| Record lama diperbarui menjadi HADIR.
|
|--------------------------------------------------------------------------
*/

if ($absensiHariIni) {

    $queryUpdate = "

        UPDATE absensi

        SET

            id_cabang = ?,

            jam_masuk = ?,

            foto_masuk = ?,

            latitude_masuk = ?,

            longitude_masuk = ?,

            jarak_masuk = ?,

            status = 'hadir',

            keterangan = NULL

        WHERE id_absensi = ?

    ";


    $stmtUpdate =
        $koneksi->prepare(
            $queryUpdate
        );


    if (!$stmtUpdate) {

        unlink($pathFoto);

        responseError(
            "Query update absensi gagal",
            500
        );

    }


    $stmtUpdate->bind_param(

        "issdddi",

        $data["id_cabang"],

        $jamMasuk,

        $namaFile,

        $latitude,

        $longitude,

        $jarak,

        $absensiHariIni["id_absensi"]

    );


    if (
        !$stmtUpdate->execute()
    ) {

        unlink($pathFoto);

        responseError(
            "Gagal memperbarui absensi",
            500
        );

    }


    $idAbsensi =
        $absensiHariIni["id_absensi"];


    $stmtUpdate->close();

}


/*
|--------------------------------------------------------------------------
| JIKA BELUM ADA ABSENSI
|--------------------------------------------------------------------------
*/

else {

    $queryInsert = "

        INSERT INTO absensi
        (

            id_karyawan,

            id_cabang,

            tanggal,

            jam_masuk,

            foto_masuk,

            latitude_masuk,

            longitude_masuk,

            jarak_masuk,

            status

        )

        VALUES
        (

            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            'hadir'

        )

    ";


    $stmtInsert =
        $koneksi->prepare(
            $queryInsert
        );


    if (!$stmtInsert) {

        unlink($pathFoto);

        responseError(
            "Query insert absensi gagal",
            500
        );

    }


    $stmtInsert->bind_param(

        "iisssddd",

        $data["id_karyawan"],

        $data["id_cabang"],

        $tanggal,

        $jamMasuk,

        $namaFile,

        $latitude,

        $longitude,

        $jarak

    );


    if (
        !$stmtInsert->execute()
    ) {

        unlink($pathFoto);

        responseError(
            "Gagal menyimpan absensi",
            500
        );

    }


    $idAbsensi =
        $stmtInsert->insert_id;


    $stmtInsert->close();

}


/*
|--------------------------------------------------------------------------
| RESPONSE BERHASIL
|--------------------------------------------------------------------------
*/

responseSuccess(
    "Check in berhasil",
    [

        "id_absensi" =>
            $idAbsensi,

        "id_jadwal" =>
            (int) $data["id_jadwal"],

        "id_karyawan" =>
            (int) $data["id_karyawan"],

        "id_cabang" =>
            (int) $data["id_cabang"],

        "tanggal" =>
            $tanggal,

        "jam_masuk" =>
            $jamMasuk,

        "nama_karyawan" =>
            $data["nama_karyawan"],

        "nama_cabang" =>
            $data["nama_cabang"],

        "nama_shift" =>
            $data["nama_shift"],

        "jarak_meter" =>
            round($jarak, 2),

        "radius_meter" =>
            $radius,

        "foto" =>
            "uploads/absensi/" .
            $namaFile

    ]
);

?>