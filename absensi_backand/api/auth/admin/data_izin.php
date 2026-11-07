<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

function responseJSON($success, $message, $data = [], $code = 200) {
    http_response_code($code);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "total" => count($data),
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responseJSON(false, "Metode permintaan tidak diizinkan.", [], 405);
}

require_once __DIR__ . "/../../../config/database.php";

if (!isset($koneksi) || !($koneksi instanceof mysqli)) {
    responseJSON(false, "Koneksi database tidak tersedia.", [], 500);
}

try {
    $tanggal = trim($_GET["tanggal"] ?? "");
    $bulan = trim($_GET["bulan"] ?? "");
    $tahun = trim($_GET["tahun"] ?? "");
    $semua = ($_GET["semua"] ?? "") === "1";

    if (!$semua) {
        $jumlahFilter = (int)($tanggal !== "")
            + (int)($bulan !== "")
            + (int)($tahun !== "");

        if ($jumlahFilter > 1) {
            responseJSON(false, "Gunakan satu jenis filter saja.", [], 400);
        }
    }

    $sql = "
        SELECT
            pi.id_izin,
            pi.id_karyawan,
            k.nama_karyawan,
            k.id_cabang,
            c.nama_cabang,
            pi.tanggal_mulai,
            pi.tanggal_selesai,
            pi.jenis_izin,
            pi.alasan,
            pi.foto_bukti,
            pi.status,
            pi.catatan_admin,
            pi.tanggal_pengajuan,
            pi.tanggal_diproses
        FROM pengajuan_izin pi
        INNER JOIN karyawan k
            ON pi.id_karyawan = k.id_karyawan
        LEFT JOIN cabang c
            ON k.id_cabang = c.id_cabang
        WHERE 1 = 1
    ";

    $types = "";
    $params = [];

    if (!$semua && $tanggal !== "") {
        $tanggalObj = DateTime::createFromFormat("!Y-m-d", $tanggal);

        if (!$tanggalObj || $tanggalObj->format("Y-m-d") !== $tanggal) {
            responseJSON(false, "Format tanggal tidak valid.", [], 400);
        }

        $sql .= " AND pi.tanggal_mulai <= ? AND pi.tanggal_selesai >= ?";
        $types .= "ss";
        $params[] = $tanggal;
        $params[] = $tanggal;

    } elseif (!$semua && $bulan !== "") {
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $bulan)) {
            responseJSON(false, "Format bulan harus YYYY-MM.", [], 400);
        }

        $awal = $bulan . "-01";
        $akhir = date("Y-m-t", strtotime($awal));

        // Menampilkan pengajuan yang bersinggungan dengan bulan terpilih.
        $sql .= " AND pi.tanggal_mulai <= ? AND pi.tanggal_selesai >= ?";
        $types .= "ss";
        $params[] = $akhir;
        $params[] = $awal;

    } elseif (!$semua && $tahun !== "") {
        if (!preg_match('/^\d{4}$/', $tahun)) {
            responseJSON(false, "Format tahun harus YYYY.", [], 400);
        }

        $awal = $tahun . "-01-01";
        $akhir = $tahun . "-12-31";

        $sql .= " AND pi.tanggal_mulai <= ? AND pi.tanggal_selesai >= ?";
        $types .= "ss";
        $params[] = $akhir;
        $params[] = $awal;
    }

    $sql .= " ORDER BY pi.tanggal_pengajuan DESC, pi.id_izin DESC";

    $stmt = $koneksi->prepare($sql);

    if (!$stmt) {
        throw new RuntimeException("Gagal menyiapkan query data izin.");
    }

    if (count($params) > 0) {
        $bindParams = [$types];

        foreach ($params as $key => $value) {
            $bindParams[] = &$params[$key];
        }

        call_user_func_array([$stmt, "bind_param"], $bindParams);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    $stmt->close();

    responseJSON(true, "Data pengajuan izin berhasil dimuat.", $data);

} catch (Throwable $e) {
    error_log("API data izin: " . $e->getMessage());
    responseJSON(false, "Terjadi kesalahan saat mengambil data izin.", [], 500);
}
