<?php

require_once "../../../config/cors.php";
require_once "../../../config/database.php";
require_once "../../../config/response.php";


/*
|--------------------------------------------------------------------------
| TIMEZONE
|--------------------------------------------------------------------------
*/

date_default_timezone_set("Asia/Jakarta");


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


if (!is_array($input)) {

    responseError(
        "Data request tidak valid",
        400
    );

}


/*
|--------------------------------------------------------------------------
| AMBIL DATA REQUEST
|--------------------------------------------------------------------------
*/

$id_user = intval(
    $input["id_user"] ?? 0
);


$tanggal_mulai = trim(
    $input["tanggal_mulai"] ?? ""
);


$tanggal_akhir = trim(
    $input["tanggal_akhir"] ?? ""
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
| DEFAULT TANGGAL
|--------------------------------------------------------------------------
*/

if ($tanggal_mulai === "") {

    $tanggal_mulai = date("Y-m-01");

}


if ($tanggal_akhir === "") {

    $tanggal_akhir = date("Y-m-d");

}


/*
|--------------------------------------------------------------------------
| VALIDASI TANGGAL
|--------------------------------------------------------------------------
*/

if ($tanggal_mulai > $tanggal_akhir) {

    responseError(
        "Tanggal mulai tidak boleh lebih besar dari tanggal akhir",
        422
    );

}


/*
|--------------------------------------------------------------------------
| FUNGSI VALIDASI TANGGAL
|--------------------------------------------------------------------------
*/

function tanggalValid($tanggal)
{

    $d = DateTime::createFromFormat(
        "Y-m-d",
        $tanggal
    );

    return $d &&
           $d->format("Y-m-d") === $tanggal;

}


/*
|--------------------------------------------------------------------------
| VALIDASI FORMAT TANGGAL
|--------------------------------------------------------------------------
*/

if (
    !tanggalValid($tanggal_mulai) ||
    !tanggalValid($tanggal_akhir)
) {

    responseError(
        "Format tanggal tidak valid",
        422
    );

}


/*
|--------------------------------------------------------------------------
| FUNGSI PARSE JAM SELESAI
|--------------------------------------------------------------------------
|
| Contoh:
| 09-30 - 15.30
| hasil:
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


    $jamString = trim($jamString);


    /*
    |--------------------------------------------------------------------------
    | Normalisasi titik menjadi :
    |--------------------------------------------------------------------------
    */

    $jamString = str_replace(
        ".",
        ":",
        $jamString
    );


    /*
    |--------------------------------------------------------------------------
    | Cari semua jam
    |--------------------------------------------------------------------------
    */

    preg_match_all(
        '/(\d{1,2})\s*[:\-]\s*(\d{2})/',
        $jamString,
        $matches
    );


    if (
        empty($matches[0]) ||
        count($matches[0]) < 2
    ) {

        return null;

    }


    /*
    |--------------------------------------------------------------------------
    | Ambil jam terakhir
    |--------------------------------------------------------------------------
    */

    $jamAkhir =
        end($matches[0]);


    if (
        !preg_match(
            '/(\d{1,2})\s*[:\-]\s*(\d{2})/',
            $jamAkhir,
            $match
        )
    ) {

        return null;

    }


    $jam = str_pad(
        $match[1],
        2,
        "0",
        STR_PAD_LEFT
    );


    $menit = str_pad(
        $match[2],
        2,
        "0",
        STR_PAD_LEFT
    );


    return $jam . ":" . $menit . ":00";

}


/*
|--------------------------------------------------------------------------
| CEK APAKAH TANGGAL MEMILIKI IZIN
|--------------------------------------------------------------------------
|
| Karena sistem kamu TIDAK menggunakan persetujuan admin,
| semua pengajuan dianggap otomatis berlaku kecuali:
|
| - ditolak
| - rejected
| - dibatalkan
| - cancelled
|
|--------------------------------------------------------------------------
*/

function adaPengajuanIzin(
    $koneksi,
    $idKaryawan,
    $tanggal
) {

    $query = "

        SELECT
            id_izin

        FROM pengajuan_izin

        WHERE id_karyawan = ?

          AND tanggal_mulai <= ?

          AND tanggal_selesai >= ?

          AND LOWER(
                TRIM(
                    COALESCE(status, '')
                )
              )
              NOT IN (
                  'ditolak',
                  'rejected',
                  'dibatalkan',
                  'cancelled'
              )

        LIMIT 1

    ";


    $stmt = $koneksi->prepare(
        $query
    );


    if (!$stmt) {

        return false;

    }


    $stmt->bind_param(
        "iss",
        $idKaryawan,
        $tanggal,
        $tanggal
    );


    $stmt->execute();


    $result = $stmt->get_result();


    $ada = $result->fetch_assoc();


    $stmt->close();


    return !empty($ada);

}


/*
|--------------------------------------------------------------------------
| PROSES TIDAK HADIR OTOMATIS
|--------------------------------------------------------------------------
|
| PENTING:
|
| Jika karyawan mempunyai pengajuan izin/libur/cuti
| pada tanggal tersebut, JANGAN dibuat sebagai
| "tidak hadir".
|
|--------------------------------------------------------------------------
*/

function prosesTidakHadirOtomatis($koneksi)
{

    date_default_timezone_set(
        "Asia/Jakarta"
    );


    $tanggalHariIni =
        date("Y-m-d");


    $jamSekarang =
        date("H:i:s");


    /*
    |--------------------------------------------------------------------------
    | AMBIL JADWAL
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


    $stmt =
        $koneksi->prepare(
            $queryJadwal
        );


    if (!$stmt) {

        return;

    }


    $stmt->bind_param(
        "s",
        $tanggalHariIni
    );


    if (!$stmt->execute()) {

        $stmt->close();

        return;

    }


    $result =
        $stmt->get_result();


    /*
    |--------------------------------------------------------------------------
    | LOOP JADWAL
    |--------------------------------------------------------------------------
    */

    while (
        $jadwal =
            $result->fetch_assoc()
    ) {

        $tanggal =
            $jadwal["tanggal"];


        $idKaryawan =
            (int)$jadwal["id_karyawan"];


        $idCabang =
            (int)$jadwal["id_cabang"];


        /*
        |--------------------------------------------------------------------------
        | CEK STATUS JADWAL
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
                ],
                true
            )
        ) {

            continue;

        }


        /*
        |--------------------------------------------------------------------------
        | PENTING:
        | CEK PENGAJUAN IZIN
        |--------------------------------------------------------------------------
        */

        if (
            adaPengajuanIzin(
                $koneksi,
                $idKaryawan,
                $tanggal
            )
        ) {

            /*
            |--------------------------------------------------------------
            | Jangan membuat Tidak Hadir
            |--------------------------------------------------------------
            */

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
        | TENTUKAN JAM SELESAI
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
        | TIDAK ADA JAM KERJA
        |--------------------------------------------------------------------------
        */

        if (!$jamSelesai) {

            continue;

        }


        /*
        |--------------------------------------------------------------------------
        | JIKA HARI INI DAN SHIFT BELUM SELESAI
        |--------------------------------------------------------------------------
        */

        if ($tanggal === $tanggalHariIni) {

            if ($jamSekarang < $jamSelesai) {

                continue;

            }

        }


        /*
        |--------------------------------------------------------------------------
        | CEK ABSENSI SUDAH ADA ATAU BELUM
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


        $adaAbsensi =
            $resultCek->fetch_assoc();


        $stmtCek->close();


        /*
        |--------------------------------------------------------------------------
        | SUDAH ADA ABSENSI
        |--------------------------------------------------------------------------
        */

        if ($adaAbsensi) {

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


        $stmtInsert->execute();


        $stmtInsert->close();

    }


    $stmt->close();

}


/*
|--------------------------------------------------------------------------
| JALANKAN PROSES TIDAK HADIR
|--------------------------------------------------------------------------
*/

prosesTidakHadirOtomatis(
    $koneksi
);


/*
|--------------------------------------------------------------------------
| CARI DATA KARYAWAN
|--------------------------------------------------------------------------
*/

$queryKaryawan = "

    SELECT

        id_karyawan,
        id_cabang,
        nama_karyawan

    FROM karyawan

    WHERE id_user = ?

      AND status = 'aktif'

    LIMIT 1

";


$stmtKaryawan =
    $koneksi->prepare(
        $queryKaryawan
    );


if (!$stmtKaryawan) {

    responseError(
        "Query karyawan gagal: " .
        $koneksi->error,
        500
    );

}


$stmtKaryawan->bind_param(
    "i",
    $id_user
);


$stmtKaryawan->execute();


$resultKaryawan =
    $stmtKaryawan->get_result();


$karyawan =
    $resultKaryawan->fetch_assoc();


$stmtKaryawan->close();


/*
|--------------------------------------------------------------------------
| CEK KARYAWAN
|--------------------------------------------------------------------------
*/

if (!$karyawan) {

    responseError(
        "Data karyawan tidak ditemukan",
        404
    );

}


$idKaryawan =
    (int)$karyawan["id_karyawan"];


/*
|--------------------------------------------------------------------------
| AMBIL ABSENSI ASLI
|--------------------------------------------------------------------------
*/

$query = "

    SELECT

        a.id_absensi,
        a.id_karyawan,
        a.id_cabang,

        c.nama_cabang,

        a.tanggal,
        a.jam_masuk,
        a.jam_keluar,

        a.foto_masuk,
        a.foto_keluar,

        a.latitude_keluar,
        a.jarak_keluar,

        a.status,
        a.keterangan

    FROM absensi a

    LEFT JOIN cabang c
        ON a.id_cabang = c.id_cabang

    WHERE a.id_karyawan = ?

      AND a.tanggal BETWEEN ? AND ?

    ORDER BY
        a.tanggal DESC,
        a.jam_masuk DESC

";


$stmt =
    $koneksi->prepare(
        $query
    );


if (!$stmt) {

    responseError(
        "Query riwayat gagal: " .
        $koneksi->error,
        500
    );

}


$stmt->bind_param(
    "iss",
    $idKaryawan,
    $tanggal_mulai,
    $tanggal_akhir
);


if (!$stmt->execute()) {

    responseError(
        "Gagal mengambil data riwayat: " .
        $stmt->error,
        500
    );

}


$result =
    $stmt->get_result();


$data = [];


/*
|--------------------------------------------------------------------------
| SIMPAN TANGGAL YANG SUDAH ADA DI ABSENSI
|--------------------------------------------------------------------------
*/

$tanggalSudahAda = [];


while (
    $row =
        $result->fetch_assoc()
) {

    $tanggalRow =
        $row["tanggal"];


    $tanggalSudahAda[$tanggalRow] = true;


    $data[] = [

        "id_absensi" =>
            (int)$row["id_absensi"],

        "id_karyawan" =>
            (int)$row["id_karyawan"],

        "id_cabang" =>
            (int)$row["id_cabang"],

        "nama_cabang" =>
            $row["nama_cabang"] ?? "-",

        "tanggal" =>
            $row["tanggal"],

        "jam_masuk" =>
            $row["jam_masuk"] ?? null,

        "jam_keluar" =>
            $row["jam_keluar"] ?? null,

        "foto_masuk" =>
            $row["foto_masuk"] ?? null,

        "foto_keluar" =>
            $row["foto_keluar"] ?? null,

        "latitude_keluar" =>
            $row["latitude_keluar"] ?? null,

        "jarak_keluar" =>
            $row["jarak_keluar"] ?? null,

        "status" =>
            $row["status"] ?? null,

        "keterangan" =>
            $row["keterangan"] ?? null,

        "jenis_izin" =>
            null

    ];

}


$stmt->close();


/*
|--------------------------------------------------------------------------
| AMBIL PENGAJUAN IZIN
|--------------------------------------------------------------------------
|
| Pengajuan berlaku otomatis.
|
| Tanggal:
|
| tanggal_mulai <= tanggal
| tanggal_selesai >= tanggal
|
|--------------------------------------------------------------------------
*/

$queryIzin = "

    SELECT

        pi.id_izin,
        pi.id_karyawan,
        pi.tanggal_mulai,
        pi.tanggal_selesai,
        pi.jenis_izin,
        pi.alasan,
        pi.status

    FROM pengajuan_izin pi

    WHERE pi.id_karyawan = ?

      AND pi.tanggal_mulai <= ?

      AND pi.tanggal_selesai >= ?

      AND LOWER(
            TRIM(
                COALESCE(pi.status, '')
            )
          )
          NOT IN (
              'ditolak',
              'rejected',
              'dibatalkan',
              'cancelled'
          )

    ORDER BY
        pi.tanggal_mulai ASC

";


$stmtIzin =
    $koneksi->prepare(
        $queryIzin
    );


if (!$stmtIzin) {

    responseError(
        "Query pengajuan izin gagal: " .
        $koneksi->error,
        500
    );

}


$stmtIzin->bind_param(
    "iss",
    $idKaryawan,
    $tanggal_akhir,
    $tanggal_mulai
);


$stmtIzin->execute();


$resultIzin =
    $stmtIzin->get_result();


/*
|--------------------------------------------------------------------------
| LOOP PENGAJUAN IZIN
|--------------------------------------------------------------------------
*/

while (
    $izin =
        $resultIzin->fetch_assoc()
) {


    /*
    |--------------------------------------------------------------------------
    | TANGGAL MULAI
    |--------------------------------------------------------------------------
    */

    $mulai =
        new DateTime(
            $izin["tanggal_mulai"]
        );


    /*
    |--------------------------------------------------------------------------
    | TANGGAL SELESAI
    |--------------------------------------------------------------------------
    */

    $selesai =
        new DateTime(
            $izin["tanggal_selesai"]
        );


    /*
    |--------------------------------------------------------------------------
    | BATASI DENGAN FILTER RIWAYAT
    |--------------------------------------------------------------------------
    */

    $filterMulai =
        new DateTime(
            $tanggal_mulai
        );


    $filterAkhir =
        new DateTime(
            $tanggal_akhir
        );


    if ($mulai < $filterMulai) {

        $mulai =
            clone $filterMulai;

    }


    if ($selesai > $filterAkhir) {

        $selesai =
            clone $filterAkhir;

    }


    /*
    |--------------------------------------------------------------------------
    | JENIS IZIN
    |--------------------------------------------------------------------------
    */

    $jenisIzin =
        trim(
            $izin["jenis_izin"] ?? "izin"
        );


    if ($jenisIzin === "") {

        $jenisIzin =
            "izin";

    }


    /*
    |--------------------------------------------------------------------------
    | BUAT DATA SETIAP TANGGAL
    |--------------------------------------------------------------------------
    */

    while (
        $mulai <= $selesai
    ) {

        $tanggalIzin =
            $mulai->format("Y-m-d");


        /*
        |--------------------------------------------------------------------------
        | JIKA SUDAH ADA ABSENSI ASLI
        |--------------------------------------------------------------------------
        |
        | Absensi asli lebih diprioritaskan.
        |
        |--------------------------------------------------------------------------
        */

        if (
            !isset(
                $tanggalSudahAda[
                    $tanggalIzin
                ]
            )
        ) {


            /*
            |--------------------------------------------------------------------------
            | CARI CABANG BERDASARKAN JADWAL
            |--------------------------------------------------------------------------
            |
            | Supaya tetap sinkron dengan jadwal kerja.
            |
            |--------------------------------------------------------------------------
            */

            $idCabangIzin =
                (int)$karyawan["id_cabang"];


            $namaCabangIzin =
                "-";


            $queryCabangJadwal = "

                SELECT

                    j.id_cabang,
                    c.nama_cabang

                FROM jadwal_kerja j

                LEFT JOIN cabang c
                    ON j.id_cabang = c.id_cabang

                WHERE j.id_karyawan = ?

                  AND j.tanggal = ?

                LIMIT 1

            ";


            $stmtCabangJadwal =
                $koneksi->prepare(
                    $queryCabangJadwal
                );


            if ($stmtCabangJadwal) {

                $stmtCabangJadwal->bind_param(
                    "is",
                    $idKaryawan,
                    $tanggalIzin
                );


                $stmtCabangJadwal->execute();


                $resultCabangJadwal =
                    $stmtCabangJadwal->get_result();


                $cabangJadwal =
                    $resultCabangJadwal->fetch_assoc();


                if ($cabangJadwal) {

                    $idCabangIzin =
                        (int)$cabangJadwal["id_cabang"];


                    $namaCabangIzin =
                        $cabangJadwal["nama_cabang"]
                        ?? "-";

                }


                $stmtCabangJadwal->close();

            }


            /*
            |--------------------------------------------------------------------------
            | MASUKKAN KE DATA RIWAYAT
            |--------------------------------------------------------------------------
            */

            $data[] = [

                "id_absensi" =>
                    null,

                "id_izin" =>
                    (int)$izin["id_izin"],

                "id_karyawan" =>
                    $idKaryawan,

                "id_cabang" =>
                    $idCabangIzin,

                "nama_cabang" =>
                    $namaCabangIzin,

                "tanggal" =>
                    $tanggalIzin,

                "jam_masuk" =>
                    null,

                "jam_keluar" =>
                    null,

                "foto_masuk" =>
                    null,

                "foto_keluar" =>
                    null,

                "latitude_keluar" =>
                    null,

                "jarak_keluar" =>
                    null,

                /*
                |--------------------------------------------------------------------------
                | STATUS UTAMA
                |--------------------------------------------------------------------------
                */

                "status" =>
                    "izin",

                /*
                |--------------------------------------------------------------------------
                | KETERANGAN
                |--------------------------------------------------------------------------
                */

                "keterangan" =>
                    $jenisIzin,

                /*
                |--------------------------------------------------------------------------
                | JENIS IZIN
                |--------------------------------------------------------------------------
                */

                "jenis_izin" =>
                    $jenisIzin,

                /*
                |--------------------------------------------------------------------------
                | ALASAN
                |--------------------------------------------------------------------------
                */

                "alasan_izin" =>
                    $izin["alasan"] ?? null

            ];

        }


        /*
        |--------------------------------------------------------------------------
        | NEXT DATE
        |--------------------------------------------------------------------------
        */

        $mulai->modify("+1 day");

    }

}


$stmtIzin->close();


/*
|--------------------------------------------------------------------------
| URUTKAN DATA
|--------------------------------------------------------------------------
*/

usort(
    $data,
    function ($a, $b) {

        if (
            $a["tanggal"] ===
            $b["tanggal"]
        ) {

            return strcmp(
                (string)($b["jam_masuk"] ?? ""),
                (string)($a["jam_masuk"] ?? "")
            );

        }


        return strcmp(
            $b["tanggal"],
            $a["tanggal"]
        );

    }
);


/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

responseSuccess(

    "Riwayat absensi berhasil diambil",

    [

        "id_karyawan" =>
            $idKaryawan,

        "nama_karyawan" =>
            $karyawan["nama_karyawan"],

        "tanggal_mulai" =>
            $tanggal_mulai,

        "tanggal_akhir" =>
            $tanggal_akhir,

        "jumlah_data" =>
            count($data),

        "absensi" =>
            $data

    ]

);

?>