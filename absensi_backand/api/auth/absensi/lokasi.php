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
| AMBIL INPUT JSON
|--------------------------------------------------------------------------
*/

$input = json_decode(
    file_get_contents("php://input"),
    true
);


$id_user = intval(
    $input["id_user"] ?? 0
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
| TANGGAL HARI INI
|--------------------------------------------------------------------------
*/

$tanggalHariIni =
    date("Y-m-d");


/*
|--------------------------------------------------------------------------
| CARI JADWAL KERJA HARI INI
|--------------------------------------------------------------------------
|
| PENTING:
|
| id_cabang DIAMBIL DARI jadwal_kerja,
| BUKAN dari karyawan.id_cabang
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

        c.alamat,

        c.latitude,

        c.longitude,

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
        "Query jadwal kerja gagal: " .
        $koneksi->error,
        500
    );

}


$stmt->bind_param(
    "is",
    $id_user,
    $tanggalHariIni
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
| JIKA JADWAL TIDAK ADA
|--------------------------------------------------------------------------
*/

if (!$data) {

    responseError(
        "Jadwal kerja hari ini tidak ditemukan",
        404
    );

}


/*
|--------------------------------------------------------------------------
| TENTUKAN JAM SHIFT
|--------------------------------------------------------------------------
*/

$jamShift = "-";


$pagi =
    trim(
        $data["pagi"] ?? ""
    );


$malam =
    trim(
        $data["malam"] ?? ""
    );


/*
|--------------------------------------------------------------------------
| JIKA SHIFT PAGI TERISI
|--------------------------------------------------------------------------
*/

if (
    $pagi !== "" &&
    $pagi !== "-"
) {

    $jamShift =
        $pagi;

}


/*
|--------------------------------------------------------------------------
| JIKA PAGI KOSONG DAN MALAM ADA
|--------------------------------------------------------------------------
*/

elseif (
    $malam !== "" &&
    $malam !== "-"
) {

    $jamShift =
        $malam;

}


/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

responseSuccess(
    "Data lokasi berdasarkan jadwal kerja berhasil diambil",
    [

        "id_jadwal" =>
            (int) $data["id_jadwal"],

        "id_karyawan" =>
            (int) $data["id_karyawan"],

        "id_cabang" =>
            (int) $data["id_cabang"],

        "tanggal" =>
            $data["tanggal"],

        "nama_karyawan" =>
            $data["nama_karyawan"],

        "nama_shift" =>
            $data["nama_shift"],

        "pagi" =>
            $data["pagi"],

        "malam" =>
            $data["malam"],

        "jam_shift" =>
            $jamShift,

        "status_jadwal" =>
            $data["status_jadwal"],

        "nama_cabang" =>
            $data["nama_cabang"],

        "alamat" =>
            $data["alamat"],

        "latitude" =>
            (float) $data["latitude"],

        "longitude" =>
            (float) $data["longitude"],

        "radius_meter" =>
            (int) $data["radius_meter"]

    ]
);

?>