<?php

ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

require_once "../../../config/database.php";

// =====================================================
// FUNGSI RESPONSE JSON
// =====================================================

function responseJSON($success, $message, $data = [])
{
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}

// =====================================================
// CEK REQUEST
// =====================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    responseJSON(
        false,
        "Method request tidak diperbolehkan."
    );
}

// =====================================================
// AMBIL DATA JSON
// =====================================================

$input = json_decode(
    file_get_contents("php://input"),
    true
);

// Jika JSON tidak valid
if (!is_array($input)) {

    http_response_code(400);

    responseJSON(
        false,
        "Data JSON tidak valid."
    );
}

// =====================================================
// AMBIL DATA
// =====================================================

$id_jadwal = isset($input["id_jadwal"])
    ? intval($input["id_jadwal"])
    : 0;

$tanggal = isset($input["tanggal"])
    ? trim($input["tanggal"])
    : "";

$nama_shift = isset($input["nama_shift"])
    ? trim($input["nama_shift"])
    : "";

$pagi = isset($input["pagi"])
    ? trim($input["pagi"])
    : "";

$malam = isset($input["malam"])
    ? trim($input["malam"])
    : "";

$status = isset($input["status"])
    ? trim($input["status"])
    : "";

$keterangan = isset($input["keterangan"])
    ? trim($input["keterangan"])
    : "";

// =====================================================
// VALIDASI
// =====================================================

if ($id_jadwal <= 0) {

    http_response_code(400);

    responseJSON(
        false,
        "ID jadwal tidak ditemukan."
    );
}

if ($tanggal === "") {

    http_response_code(400);

    responseJSON(
        false,
        "Tanggal wajib diisi."
    );
}

if ($nama_shift === "") {

    http_response_code(400);

    responseJSON(
        false,
        "Nama shift wajib diisi."
    );
}

// =====================================================
// CEK DATA JADWAL
// =====================================================

try {

    /*
     * PENTING:
     * Nama tabel di sini menggunakan:
     *
     * jadwal_kerja
     *
     * Sesuaikan dengan nama tabel sebenarnya
     * di database db_absensi_hokya.
     */

    $cek = $koneksi->prepare("
        SELECT id_jadwal
        FROM jadwal_kerja
        WHERE id_jadwal = ?
        LIMIT 1
    ");

    if (!$cek) {

        throw new Exception(
            "Gagal membuat query pengecekan: " .
            $koneksi->error
        );
    }

    $cek->bind_param(
        "i",
        $id_jadwal
    );

    $cek->execute();

    $hasilCek = $cek->get_result();

    if ($hasilCek->num_rows === 0) {

        http_response_code(404);

        responseJSON(
            false,
            "Data jadwal tidak ditemukan."
        );
    }

    $cek->close();

    // =================================================
    // UPDATE JADWAL
    // =================================================

    $sql = "
        UPDATE jadwal_kerja
        SET
            tanggal = ?,
            nama_shift = ?,
            pagi = ?,
            malam = ?,
            keterangan = ?,
            status = ?
        WHERE id_jadwal = ?
    ";

    $stmt = $koneksi->prepare($sql);

    if (!$stmt) {

        throw new Exception(
            "Gagal membuat query update: " .
            $koneksi->error
        );
    }

    $stmt->bind_param(
        "ssssssi",
        $tanggal,
        $nama_shift,
        $pagi,
        $malam,
        $keterangan,
        $status,
        $id_jadwal
    );

    // =================================================
    // EKSEKUSI
    // =================================================

    if (!$stmt->execute()) {

        throw new Exception(
            "Gagal memperbarui data: " .
            $stmt->error
        );
    }

    // =================================================
    // RESPONSE
    // =================================================

    responseJSON(
        true,
        "Data jadwal berhasil diperbarui.",
        [
            "id_jadwal" => $id_jadwal,
            "tanggal" => $tanggal,
            "nama_shift" => $nama_shift,
            "pagi" => $pagi,
            "malam" => $malam,
            "keterangan" => $keterangan,
            "status" => $status
        ]
    );

    $stmt->close();

} catch (Throwable $e) {

    http_response_code(500);

    responseJSON(
        false,
        $e->getMessage()
    );
}

// =====================================================
// CLOSE DATABASE
// =====================================================

$koneksi->close();