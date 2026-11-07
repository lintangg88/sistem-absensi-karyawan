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
$id_izin = filter_var(
    is_array($input) ? ($input["id_izin"] ?? null) : null,
    FILTER_VALIDATE_INT
);

if (!$id_izin || $id_izin < 1) {
    kirimResponse(false, "ID pengajuan tidak valid.", 400);
}

$fileBukti = null;

try {
    $koneksi->begin_transaction();

    // Gunakan kunci yang sama dengan proses pengajuan dan perubahan status.
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

    $stmt = $koneksi->prepare("
        SELECT foto_bukti
        FROM pengajuan_izin
        WHERE id_izin = ?
        FOR UPDATE
    ");

    $stmt->bind_param("i", $id_izin);
    $stmt->execute();
    $data = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$data) {
        $koneksi->rollback();
        kirimResponse(false, "Pengajuan izin tidak ditemukan.", 404);
    }

    $fileBukti = $data["foto_bukti"];

    $stmtDelete = $koneksi->prepare("
        DELETE FROM pengajuan_izin
        WHERE id_izin = ?
    ");

    $stmtDelete->bind_param("i", $id_izin);
    $stmtDelete->execute();
    $stmtDelete->close();

    $koneksi->commit();

    // Hapus file setelah transaksi database berhasil.
    if (
        !empty($fileBukti) &&
        preg_match('/^uploads\/izin\/[a-zA-Z0-9_.-]+$/', $fileBukti)
    ) {
        $rootBackend = dirname(__DIR__, 3);
        $pathFile = $rootBackend . DIRECTORY_SEPARATOR .
            str_replace("/", DIRECTORY_SEPARATOR, $fileBukti);

        if (is_file($pathFile)) {
            if (!@unlink($pathFile)) {
                error_log("Gagal menghapus file bukti izin: " . $fileBukti);
            }
        }
    }

    kirimResponse(true, "Pengajuan izin berhasil dihapus.");

} catch (Throwable $e) {
    try {
        $koneksi->rollback();
    } catch (Throwable $ignored) {
        // Abaikan jika transaksi sudah selesai.
    }

    error_log("API hapus izin: " . $e->getMessage());
    kirimResponse(false, "Terjadi kesalahan saat menghapus pengajuan izin.", 500);

} finally {
    if (isset($koneksi) && $koneksi instanceof mysqli) {
        $koneksi->close();
    }
}
