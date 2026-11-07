<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

function kirimResponse($success, $message, $code = 200) {
    http_response_code($code);
    echo json_encode([
        "success" => $success,
        "message" => $message
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    kirimResponse(false, "Metode permintaan tidak diizinkan.", 405);
}

require_once __DIR__ . "/../../../config/database.php";

if (!isset($koneksi) || !($koneksi instanceof mysqli)) {
    kirimResponse(false, "Koneksi database tidak tersedia.", 500);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    kirimResponse(false, "Data permintaan tidak valid.", 400);
}

/*
|--------------------------------------------------------------------------
| 1. Ambil dan validasi data
|--------------------------------------------------------------------------
*/

$id_izin = filter_var(
    $input["id_izin"] ?? null,
    FILTER_VALIDATE_INT
);

$id_karyawan = filter_var(
    $input["id_karyawan"] ?? null,
    FILTER_VALIDATE_INT
);

$tanggal_mulai = trim((string)($input["tanggal_mulai"] ?? ""));
$tanggal_selesai = trim((string)($input["tanggal_selesai"] ?? ""));
$jenis_izin = trim((string)($input["jenis_izin"] ?? ""));
$alasan = trim((string)($input["alasan"] ?? ""));
$status = trim((string)($input["status"] ?? ""));
$catatan_admin = trim((string)($input["catatan_admin"] ?? ""));

if (!$id_izin || $id_izin < 1) {
    kirimResponse(false, "ID pengajuan tidak valid.", 400);
}

if (!$id_karyawan || $id_karyawan < 1) {
    kirimResponse(false, "Nama karyawan wajib dipilih.", 400);
}

$formatTanggal = function ($tanggal) {
    $hasil = DateTime::createFromFormat("!Y-m-d", $tanggal);

    return $hasil && $hasil->format("Y-m-d") === $tanggal;
};

if (
    !$formatTanggal($tanggal_mulai) ||
    !$formatTanggal($tanggal_selesai)
) {
    kirimResponse(false, "Format tanggal tidak valid.", 400);
}

if ($tanggal_selesai < $tanggal_mulai) {
    kirimResponse(
        false,
        "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        400
    );
}

$jenisValid = [
    "izin",
    "sakit",
    "keperluan_pribadi",
    "lainnya"
];

if (!in_array($jenis_izin, $jenisValid, true)) {
    kirimResponse(false, "Jenis izin tidak valid.", 400);
}

if ($alasan === "") {
    kirimResponse(false, "Alasan pengajuan wajib diisi.", 400);
}

if (!in_array($status, ["disetujui", "ditolak"], true)) {
    kirimResponse(
        false,
        "Status hanya boleh disetujui atau ditolak.",
        400
    );
}

try {
    $koneksi->begin_transaction();

    /*
    |--------------------------------------------------------------------------
    | 2. Kunci baris karyawan untuk menjaga pemeriksaan kuota
    |--------------------------------------------------------------------------
    | Penguncian ini membantu menyelaraskan proses perubahan data
    | dengan endpoint lain yang menggunakan penguncian yang sama.
    */

    $lock = $koneksi->query("
        SELECT id_karyawan
        FROM karyawan
        ORDER BY id_karyawan
        LIMIT 1
        FOR UPDATE
    ");

    if (!$lock || $lock->num_rows === 0) {
        throw new RuntimeException("Data karyawan belum tersedia.");
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Pastikan pengajuan yang diedit tersedia
    |--------------------------------------------------------------------------
    */

    $stmt = $koneksi->prepare("
        SELECT id_izin, status
        FROM pengajuan_izin
        WHERE id_izin = ?
        FOR UPDATE
    ");

    $stmt->bind_param("i", $id_izin);
    $stmt->execute();

    $pengajuan = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$pengajuan) {
        $koneksi->rollback();

        kirimResponse(
            false,
            "Pengajuan izin tidak ditemukan.",
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Pastikan karyawan yang dipilih tersedia
    |--------------------------------------------------------------------------
    */

    $stmtKaryawan = $koneksi->prepare("
        SELECT id_karyawan
        FROM karyawan
        WHERE id_karyawan = ?
        LIMIT 1
    ");

    $stmtKaryawan->bind_param("i", $id_karyawan);
    $stmtKaryawan->execute();

    $karyawanAda = $stmtKaryawan->get_result()->fetch_assoc();
    $stmtKaryawan->close();

    if (!$karyawanAda) {
        $koneksi->rollback();

        kirimResponse(
            false,
            "Karyawan yang dipilih tidak ditemukan.",
            404
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Periksa kuota untuk setiap tanggal yang baru
    |--------------------------------------------------------------------------
    | Aturan:
    | - Maksimal 2 karyawan per tanggal untuk seluruh cabang.
    | - Pengajuan menunggu dan disetujui ikut menggunakan kuota.
    | - Pengajuan yang sedang diedit tidak dihitung sebagai pengajuan lain.
    | - Pengajuan ditolak tidak menggunakan kuota.
    */

    if ($status === "disetujui") {
        $cekKuota = $koneksi->prepare("
            SELECT COUNT(DISTINCT id_karyawan) AS total
            FROM pengajuan_izin
            WHERE id_izin <> ?
              AND status IN ('menunggu', 'pending', 'disetujui')
              AND tanggal_mulai <= ?
              AND tanggal_selesai >= ?
        ");

        $tanggal = new DateTime($tanggal_mulai);
        $batasTanggal = new DateTime($tanggal_selesai);

        while ($tanggal <= $batasTanggal) {
            $tanggalCek = $tanggal->format("Y-m-d");

            $cekKuota->bind_param(
                "iss",
                $id_izin,
                $tanggalCek,
                $tanggalCek
            );

            $cekKuota->execute();

            $hasilKuota = $cekKuota
                ->get_result()
                ->fetch_assoc();

            $totalKaryawan = (int)($hasilKuota["total"] ?? 0);

            if ($totalKaryawan >= 2) {
                $cekKuota->close();
                $koneksi->rollback();

                kirimResponse(
                    false,
                    "Tanggal " . $tanggalCek .
                    " tidak dapat dipilih karena kuota maksimal 2 karyawan " .
                    "per hari sudah terpenuhi. Silakan pilih tanggal lain.",
                    409
                );
            }

            $tanggal->modify("+1 day");
        }

        $cekKuota->close();
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Simpan SELURUH perubahan dari formulir edit
    |--------------------------------------------------------------------------
    */

    $stmtUpdate = $koneksi->prepare("
        UPDATE pengajuan_izin
        SET id_karyawan = ?,
            tanggal_mulai = ?,
            tanggal_selesai = ?,
            jenis_izin = ?,
            alasan = ?,
            status = ?,
            catatan_admin = ?,
            tanggal_diproses = NOW()
        WHERE id_izin = ?
    ");

    $stmtUpdate->bind_param(
        "issssssi",
        $id_karyawan,
        $tanggal_mulai,
        $tanggal_selesai,
        $jenis_izin,
        $alasan,
        $status,
        $catatan_admin,
        $id_izin
    );

    $stmtUpdate->execute();
    $stmtUpdate->close();

    $koneksi->commit();

    kirimResponse(
        true,
        "Pengajuan izin berhasil diperbarui."
    );

} catch (Throwable $e) {
    try {
        $koneksi->rollback();
    } catch (Throwable $ignored) {
        // Abaikan jika transaksi sudah selesai.
    }

    error_log("API update izin: " . $e->getMessage());

    kirimResponse(
        false,
        "Terjadi kesalahan saat memperbarui pengajuan izin. Periksa log PHP untuk detailnya.",
        500
    );

} finally {
    if (isset($koneksi) && $koneksi instanceof mysqli) {
        $koneksi->close();
    }
}