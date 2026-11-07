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
| WAKTU SEKARANG
|--------------------------------------------------------------------------
*/

$tanggalHariIni = date("Y-m-d");
$jamSekarang    = date("H:i:s");


/*
|--------------------------------------------------------------------------
| AMBIL SEMUA JADWAL AKTIF
|--------------------------------------------------------------------------
|
| Tidak lagi menggunakan:
| - jam_masuk
| - jam_pulang
|
| Karena sekarang jadwal menggunakan:
| - pagi
| - malam
|
|--------------------------------------------------------------------------
*/

$queryJadwal = "

    SELECT

        j.id_jadwal,
        j.id_karyawan,
        j.id_cabang,
        j.tanggal,
        j.nama_shift,
        j.pagi,
        j.malam,
        j.status

    FROM jadwal_kerja j

    INNER JOIN karyawan k
        ON j.id_karyawan = k.id_karyawan

    WHERE k.status = 'aktif'

      AND j.status = 'terjadwal'

      AND j.tanggal <= ?

    ORDER BY
        j.tanggal ASC,
        j.id_karyawan ASC

";


$stmtJadwal =
    $koneksi->prepare($queryJadwal);


if (!$stmtJadwal) {

    responseError(
        "Query jadwal gagal: " .
        $koneksi->error,
        500
    );

}


$stmtJadwal->bind_param(
    "s",
    $tanggalHariIni
);


if (!$stmtJadwal->execute()) {

    responseError(
        "Gagal mengambil jadwal: " .
        $stmtJadwal->error,
        500
    );

}


$resultJadwal =
    $stmtJadwal->get_result();


/*
|--------------------------------------------------------------------------
| COUNTER
|--------------------------------------------------------------------------
*/

$jumlahDiproses   = 0;
$jumlahTidakHadir = 0;
$jumlahSudahAda   = 0;
$jumlahDilewati   = 0;


/*
|--------------------------------------------------------------------------
| FUNGSI AMBIL JAM SELESAI
|--------------------------------------------------------------------------
|
| Contoh:
|
| 09-30 - 15.30
|
| akan dibaca menjadi:
|
| 15:30:00
|
|--------------------------------------------------------------------------
*/

function ambilJamSelesai($jamString)
{

    if (
        !$jamString ||
        trim($jamString) === "" ||
        trim($jamString) === "-"
    ) {

        return null;

    }


    $jamString =
        trim($jamString);


    /*
    |--------------------------------------------------------------------------
    | Normalisasi pemisah jam
    |--------------------------------------------------------------------------
    |
    | 09-30 -> 09:30
    | 09.30 -> 09:30
    |
    */

    $jamString =
        str_replace(
            ".",
            ":",
            $jamString
        );


    /*
    |--------------------------------------------------------------------------
    | Ambil bagian setelah tanda "-"
    |--------------------------------------------------------------------------
    |
    | 09-30 - 15:30
    |               ^
    |
    */

    $parts =
        preg_split(
            '/\s+-\s+/',
            $jamString
        );


    /*
    |--------------------------------------------------------------------------
    | Kalau format tidak terpisah dengan benar,
    | coba regex.
    |--------------------------------------------------------------------------
    */

    if (count($parts) < 2) {

        preg_match_all(
            '/(\d{1,2})[:\-](\d{2})/',
            $jamString,
            $matches
        );


        if (
            !empty($matches[0]) &&
            count($matches[0]) >= 2
        ) {

            $jamAkhir =
                end($matches[0]);

        } else {

            return null;

        }

    } else {

        $jamAkhir =
            trim(
                $parts[count($parts) - 1]
            );

    }


    /*
    |--------------------------------------------------------------------------
    | Bersihkan jam
    |--------------------------------------------------------------------------
    */

    $jamAkhir =
        str_replace(
            ".",
            ":",
            $jamAkhir
        );


    /*
    |--------------------------------------------------------------------------
    | Ambil HH:MM
    |--------------------------------------------------------------------------
    */

    if (
        !preg_match(
            '/(\d{1,2})\s*[:\-]\s*(\d{2})/',
            $jamAkhir,
            $match
        )
    ) {

        return null;

    }


    $jam =
        str_pad(
            $match[1],
            2,
            "0",
            STR_PAD_LEFT
        );


    $menit =
        str_pad(
            $match[2],
            2,
            "0",
            STR_PAD_LEFT
        );


    return $jam . ":" . $menit . ":00";

}


/*
|--------------------------------------------------------------------------
| LOOP JADWAL
|--------------------------------------------------------------------------
*/

while (
    $jadwal =
        $resultJadwal->fetch_assoc()
) {


    $idKaryawan =
        (int)$jadwal["id_karyawan"];


    $idCabang =
        (int)$jadwal["id_cabang"];


    $tanggal =
        $jadwal["tanggal"];


    $jumlahDiproses++;


    /*
    |--------------------------------------------------------------------------
    | CEK STATUS JADWAL
    |--------------------------------------------------------------------------
    |
    | Jadwal libur/off/cuti/izin tidak dibuat tidak hadir.
    |--------------------------------------------------------------------------
    */

    $statusJadwal =
        strtolower(
            trim(
                $jadwal["status"] ?? ""
            )
        );


    if (
        in_array(
            $statusJadwal,
            [
                "libur",
                "off",
                "cuti",
                "izin"
            ]
        )
    ) {

        $jumlahDilewati++;

        continue;

    }


    /*
    |--------------------------------------------------------------------------
    | AMBIL JAM SELESAI PAGI
    |--------------------------------------------------------------------------
    */

    $jamSelesaiPagi =
        ambilJamSelesai(
            $jadwal["pagi"] ?? null
        );


    /*
    |--------------------------------------------------------------------------
    | AMBIL JAM SELESAI MALAM
    |--------------------------------------------------------------------------
    */

    $jamSelesaiMalam =
        ambilJamSelesai(
            $jadwal["malam"] ?? null
        );


    /*
    |--------------------------------------------------------------------------
    | TENTUKAN JAM SELESAI JADWAL
    |--------------------------------------------------------------------------
    |
    | Kalau hanya pagi:
    |
    | 09:30 - 15:30
    |
    | maka jam selesai = 15:30
    |
    | Kalau hanya malam:
    |
    | 15:30 - 21:30
    |
    | maka jam selesai = 21:30
    |
    | Kalau keduanya terisi, gunakan yang paling akhir.
    |--------------------------------------------------------------------------
    */

    $jamSelesai = null;


    if ($jamSelesaiPagi) {

        $jamSelesai =
            $jamSelesaiPagi;

    }


    if ($jamSelesaiMalam) {

        if (
            $jamSelesai === null ||
            $jamSelesaiMalam > $jamSelesai
        ) {

            $jamSelesai =
                $jamSelesaiMalam;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | JIKA TIDAK ADA JAM
    |--------------------------------------------------------------------------
    */

    if (!$jamSelesai) {

        $jumlahDilewati++;

        continue;

    }


    /*
    |--------------------------------------------------------------------------
    | CEK APAKAH JAM KERJA SUDAH SELESAI
    |--------------------------------------------------------------------------
    |
    | PENTING:
    |
    | Kalau hari ini:
    |
    | 09:30 - 15:30
    |
    | dan sekarang masih 14:00,
    | JANGAN dibuat tidak hadir.
    |--------------------------------------------------------------------------
    */

    if ($tanggal === $tanggalHariIni) {

        if ($jamSekarang < $jamSelesai) {

            /*
            |--------------------------------------------------------------
            | MASIH DALAM JAM KERJA
            |--------------------------------------------------------------
            */

            $jumlahDilewati++;

            continue;

        }

    }


    /*
    |--------------------------------------------------------------------------
    | CEK APAKAH SUDAH ADA ABSENSI
    |--------------------------------------------------------------------------
    */

    $queryCek = "

        SELECT

            id_absensi

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

        continue;

    }


    $stmtCek->bind_param(
        "is",
        $idKaryawan,
        $tanggal
    );


    $stmtCek->execute();


    $resultCek =
        $stmtCek->get_result();


    $absensi =
        $resultCek->fetch_assoc();


    $stmtCek->close();


    /*
    |--------------------------------------------------------------------------
    | KALAU SUDAH ABSEN
    |--------------------------------------------------------------------------
    */

    if ($absensi) {

        $jumlahSudahAda++;

        continue;

    }


    /*
    |--------------------------------------------------------------------------
    | INSERT TIDAK HADIR
    |--------------------------------------------------------------------------
    */

    $status =
        "tidak hadir";


    $keterangan =
        "Tidak melakukan absensi masuk";


    $queryInsert = "

        INSERT INTO absensi
        (
            id_karyawan,
            id_cabang,
            tanggal,
            jam_masuk,
            jam_keluar,
            foto_masuk,
            foto_keluar,
            latitude_masuk,
            longitude_masuk,
            jarak_masuk,
            latitude_keluar,
            longitude_keluar,
            jarak_keluar,
            status,
            keterangan
        )

        VALUES
        (
            ?,
            ?,
            ?,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            NULL,
            ?,
            ?
        )

    ";


    $stmtInsert =
        $koneksi->prepare(
            $queryInsert
        );


    if (!$stmtInsert) {

        continue;

    }


    $stmtInsert->bind_param(
        "iisss",
        $idKaryawan,
        $idCabang,
        $tanggal,
        $status,
        $keterangan
    );


    if (
        $stmtInsert->execute()
    ) {

        $jumlahTidakHadir++;

    }


    $stmtInsert->close();

}


$stmtJadwal->close();


/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

responseSuccess(

    "Pengecekan absensi otomatis berhasil",

    [

        "tanggal" =>
            $tanggalHariIni,

        "jam" =>
            $jamSekarang,

        "jumlah_jadwal_diproses" =>
            $jumlahDiproses,

        "jumlah_tidak_hadir" =>
            $jumlahTidakHadir,

        "jumlah_sudah_ada_absensi" =>
            $jumlahSudahAda,

        "jumlah_dilewati" =>
            $jumlahDilewati

    ]

);

?>