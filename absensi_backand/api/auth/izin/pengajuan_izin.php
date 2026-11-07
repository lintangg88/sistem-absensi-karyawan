
<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

date_default_timezone_set("Asia/Jakarta");

// =====================================================
// FUNGSI RESPONSE JSON
// =====================================================

function kirimResponse($success, $message, $data = [], $httpCode = 200)
{
    http_response_code($httpCode);

    echo json_encode(
        array_merge([
            "success" => $success,
            "message" => $message
        ], $data),
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// =====================================================
// IZINKAN PREFLIGHT REQUEST
// =====================================================

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// =====================================================
// HANYA MENERIMA POST
// =====================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    kirimResponse(
        false,
        "Method harus POST.",
        [],
        405
    );
}

// =====================================================
// KONEKSI DATABASE
// =====================================================

require_once __DIR__ . "/../../../config/database.php";

if (!isset($koneksi) || !($koneksi instanceof mysqli)) {
    kirimResponse(
        false,
        "Koneksi database tidak ditemukan.",
        [],
        500
    );
}

if ($koneksi->connect_error) {
    kirimResponse(
        false,
        "Koneksi database gagal.",
        [],
        500
    );
}

// =====================================================
// AMBIL ID USER DARI FORM
// =====================================================

$id_user = isset($_POST["id_user"])
    ? (int) $_POST["id_user"]
    : 0;

if ($id_user <= 0) {
    kirimResponse(
        false,
        "ID user tidak ditemukan. Silakan login kembali.",
        [],
        400
    );
}

// =====================================================
// CARI ID KARYAWAN BERDASARKAN ID USER
// ID KARYAWAN DIAMBIL DARI DATABASE, BUKAN FORM
// =====================================================

$stmtKaryawan = $koneksi->prepare("
    SELECT id_karyawan
    FROM karyawan
    WHERE id_user = ?
    LIMIT 1
");

if (!$stmtKaryawan) {
    kirimResponse(
        false,
        "Gagal menyiapkan pencarian data karyawan.",
        [],
        500
    );
}

$stmtKaryawan->bind_param("i", $id_user);
$stmtKaryawan->execute();

$resultKaryawan = $stmtKaryawan->get_result();

if ($resultKaryawan->num_rows === 0) {
    $stmtKaryawan->close();

    kirimResponse(
        false,
        "Data karyawan tidak ditemukan untuk akun ini.",
        [],
        404
    );
}

$dataKaryawan = $resultKaryawan->fetch_assoc();
$id_karyawan = (int) $dataKaryawan["id_karyawan"];

$stmtKaryawan->close();

// =====================================================
// AMBIL DATA PENGAJUAN
// =====================================================

$jenis_izin = trim($_POST["jenis_izin"] ?? "");
$tanggal_mulai = trim($_POST["tanggal_mulai"] ?? "");
$tanggal_selesai = trim($_POST["tanggal_selesai"] ?? "");
$alasan = trim($_POST["alasan"] ?? "");

// =====================================================
// VALIDASI JENIS IZIN
// =====================================================

$jenisIzinMap = [
    "izin" => "izin",
    "cuti" => "cuti",
    "libur" => "libur",
    "sakit" => "sakit",
    "keperluan pribadi" => "keperluan_pribadi",
    "keperluan_pribadi" => "keperluan_pribadi"
];

$keyJenisIzin = strtolower($jenis_izin);

if (!isset($jenisIzinMap[$keyJenisIzin])) {
    kirimResponse(
        false,
        "Jenis izin tidak valid. Silakan pilih jenis izin yang tersedia.",
        [],
        400
    );
}

$jenis_izin = $jenisIzinMap[$keyJenisIzin];

// =====================================================
// VALIDASI ALASAN
// =====================================================

if ($alasan === "") {
    kirimResponse(
        false,
        "Alasan pengajuan wajib diisi.",
        [],
        400
    );
}

// =====================================================
// VALIDASI FORMAT TANGGAL
// =====================================================

function tanggalValid($tanggal)
{
    $date = DateTime::createFromFormat("!Y-m-d", $tanggal);

    return $date !== false
        && $date->format("Y-m-d") === $tanggal;
}

if (
    !tanggalValid($tanggal_mulai) ||
    !tanggalValid($tanggal_selesai)
) {
    kirimResponse(
        false,
        "Format tanggal tidak valid. Gunakan format YYYY-MM-DD.",
        [],
        400
    );
}

if ($tanggal_selesai < $tanggal_mulai) {
    kirimResponse(
        false,
        "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        [],
        400
    );
}

// =====================================================
// SIAPKAN FOTO BUKTI (OPSIONAL)
// =====================================================

$foto_bukti = null;
$uploadPath = null;

if (
    isset($_FILES["foto_bukti"]) &&
    $_FILES["foto_bukti"]["error"] !== UPLOAD_ERR_NO_FILE
) {
    $file = $_FILES["foto_bukti"];

    if ($file["error"] !== UPLOAD_ERR_OK) {
        kirimResponse(
            false,
            "Dokumen gagal diunggah.",
            [],
            400
        );
    }

    if ($file["size"] > 5 * 1024 * 1024) {
        kirimResponse(
            false,
            "Ukuran dokumen maksimal 5 MB.",
            [],
            400
        );
    }

    $extension = strtolower(
        pathinfo($file["name"], PATHINFO_EXTENSION)
    );

    $allowedExtensions = ["jpg", "jpeg", "png", "pdf"];

    if (!in_array($extension, $allowedExtensions, true)) {
        kirimResponse(
            false,
            "Format dokumen tidak diperbolehkan. Gunakan JPG, JPEG, PNG, atau PDF.",
            [],
            400
        );
    }

    // Folder upload berada di root backend/uploads/izin/
    $uploadDir = __DIR__ . "/../../../uploads/izin/";

    if (
        !is_dir($uploadDir) &&
        !mkdir($uploadDir, 0775, true) &&
        !is_dir($uploadDir)
    ) {
        kirimResponse(
            false,
            "Folder penyimpanan dokumen tidak dapat dibuat.",
            [],
            500
        );
    }

    // Nama unik agar file tidak tertimpa oleh unggahan lain
    try {
        $namaFile = "izin_" . $id_karyawan . "_" .
            bin2hex(random_bytes(8)) . "." . $extension;
    } catch (Throwable $e) {
        kirimResponse(
            false,
            "Gagal membuat nama file dokumen.",
            [],
            500
        );
    }

    $uploadPath = $uploadDir . $namaFile;

    if (!move_uploaded_file($file["tmp_name"], $uploadPath)) {
        kirimResponse(
            false,
            "Dokumen gagal disimpan.",
            [],
            500
        );
    }

    // Path relatif yang disimpan di database
    $foto_bukti = "uploads/izin/" . $namaFile;
}

// =====================================================
// PROSES KUOTA DAN SIMPAN PENGAJUAN
//
// ATURAN:
// - Maksimal 2 karyawan per tanggal.
// - Berlaku untuk semua cabang.
// - Hanya status disetujui yang memakai kuota.
// - Jika salah satu tanggal penuh, seluruh pengajuan ditolak.
// - Transaksi dan penguncian membantu mencegah kuota terlewati
//   ketika ada beberapa pengajuan yang masuk bersamaan.
// =====================================================

$status = "ditolak";
$catatan_admin = null;
$tanggal_diproses = date("Y-m-d H:i:s");
$pesan = "";
$id_izin = 0;

$transaksiDimulai = false;

try {
    if (!$koneksi->begin_transaction()) {
        throw new RuntimeException(
            "Gagal memulai transaksi database."
        );
    }

    $transaksiDimulai = true;

    // -------------------------------------------------
    // KUNCI BARIS PENGAMAN UNTUK MENGURUTKAN PROSES
    // -------------------------------------------------
    // Semua proses pengajuan harus menggunakan penguncian
    // yang sama agar pemeriksaan kuota tidak saling mendahului.
    // Tabel karyawan harus menggunakan InnoDB.
    // -------------------------------------------------

    $sqlLock = "
        SELECT id_karyawan
        FROM karyawan
        ORDER BY id_karyawan
        LIMIT 1
        FOR UPDATE
    ";

    $resultLock = $koneksi->query($sqlLock);

    if (!$resultLock || $resultLock->num_rows === 0) {
        throw new RuntimeException(
            "Data pengunci kuota tidak ditemukan."
        );
    }

    $resultLock->free();

    // -------------------------------------------------
    // PERIKSA KUOTA SETIAP TANGGAL DALAM RENTANG
    // -------------------------------------------------

    $tanggalAwal = new DateTimeImmutable($tanggal_mulai);
    $tanggalAkhir = new DateTimeImmutable($tanggal_selesai);

    $daftarTanggal = new DatePeriod(
        $tanggalAwal,
        new DateInterval("P1D"),
        $tanggalAkhir->modify("+1 day")
    );

    $tanggalPenuh = null;
    $jumlahTerpakai = 0;

    $sqlHitung = "
        SELECT COUNT(DISTINCT id_karyawan) AS total
        FROM pengajuan_izin
        WHERE status = 'disetujui'
          AND tanggal_mulai <= ?
          AND tanggal_selesai >= ?
    ";

    $stmtHitung = $koneksi->prepare($sqlHitung);

    if (!$stmtHitung) {
        throw new RuntimeException(
            "Gagal menyiapkan pemeriksaan kuota."
        );
    }

    foreach ($daftarTanggal as $tanggal) {
        $tanggalCek = $tanggal->format("Y-m-d");

        $stmtHitung->bind_param(
            "ss",
            $tanggalCek,
            $tanggalCek
        );

        if (!$stmtHitung->execute()) {
            throw new RuntimeException(
                "Gagal memeriksa kuota tanggal " . $tanggalCek
            );
        }

        $hasilHitung = $stmtHitung->get_result()->fetch_assoc();
        $jumlahTerpakai = (int) ($hasilHitung["total"] ?? 0);

        if ($jumlahTerpakai >= 2) {
            $tanggalPenuh = $tanggalCek;
            break;
        }
    }

    $stmtHitung->close();

    // -------------------------------------------------
    // TENTUKAN STATUS OTOMATIS
    // -------------------------------------------------

    if ($tanggalPenuh !== null) {
        $status = "ditolak";

        $catatan_admin =
            "Ditolak otomatis: kuota maksimal 2 karyawan " .
            "untuk seluruh cabang pada tanggal " .
            $tanggalPenuh . " sudah terpenuhi.";

        $pesan =
            "Pengajuan tercatat, tetapi otomatis ditolak. " .
            "Kuota pada tanggal " . $tanggalPenuh . " sudah penuh.";
    } else {
        $status = "disetujui";
        $catatan_admin = null;

        $pesan =
            "Pengajuan berhasil disimpan dan otomatis disetujui.";
    }

    // -------------------------------------------------
    // SIMPAN PENGAJUAN
    // -------------------------------------------------
    // Menggunakan tanggal_diproses sesuai nama kolom tabel.
    // Tidak menggunakan kolom tanggal_proses.
    // -------------------------------------------------

    $sqlInsert = "
        INSERT INTO pengajuan_izin
        (
            id_karyawan,
            tanggal_mulai,
            tanggal_selesai,
            jenis_izin,
            alasan,
            foto_bukti,
            status,
            catatan_admin,
            tanggal_pengajuan,
            tanggal_diproses
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    ";

    $stmtInsert = $koneksi->prepare($sqlInsert);

    if (!$stmtInsert) {
        throw new RuntimeException(
            "Gagal menyiapkan penyimpanan pengajuan izin."
        );
    }

    $stmtInsert->bind_param(
        "issssssss",
        $id_karyawan,
        $tanggal_mulai,
        $tanggal_selesai,
        $jenis_izin,
        $alasan,
        $foto_bukti,
        $status,
        $catatan_admin,
        $tanggal_diproses
    );

    if (!$stmtInsert->execute()) {
        $errorInsert = $stmtInsert->error;
        $stmtInsert->close();

        throw new RuntimeException(
            "Gagal menyimpan pengajuan izin: " . $errorInsert
        );
    }

    $id_izin = $stmtInsert->insert_id;
    $stmtInsert->close();

    // -------------------------------------------------
    // SIMPAN TRANSAKSI
    // -------------------------------------------------

    if (!$koneksi->commit()) {
        throw new RuntimeException(
            "Gagal menyimpan transaksi pengajuan."
        );
    }

    $transaksiDimulai = false;

    // -------------------------------------------------
    // RESPONSE SUKSES DIPROSES
    // success = true berarti pengajuan berhasil dicatat.
    // Status bisa disetujui ATAU ditolak otomatis.
    // -------------------------------------------------

    kirimResponse(
        true,
        $pesan,
        [
            "id_izin" => $id_izin,
            "id_karyawan" => $id_karyawan,
            "jenis_izin" => $jenis_izin,
            "tanggal_mulai" => $tanggal_mulai,
            "tanggal_selesai" => $tanggal_selesai,
            "status" => $status,
            "catatan_admin" => $catatan_admin,
            "jumlah_terpakai" => $jumlahTerpakai,
            "batas_kuota" => 2
        ],
        200
    );

} catch (Throwable $e) {

    if ($transaksiDimulai) {
        try {
            $koneksi->rollback();
        } catch (Throwable $rollbackError) {
            error_log(
                "Rollback pengajuan izin: " .
                $rollbackError->getMessage()
            );
        }
    }

    // Hapus file jika database gagal menyimpan pengajuan.
    if ($uploadPath !== null && is_file($uploadPath)) {
        @unlink($uploadPath);
    }

    error_log(
        "PENGAJUAN IZIN ERROR: " . $e->getMessage()
    );

    kirimResponse(
        false,
        "Terjadi kesalahan saat memproses pengajuan izin. Periksa log server jika masalah berlanjut.",
        [],
        500
    );

} finally {
    if (isset($koneksi) && $koneksi instanceof mysqli) {
        $koneksi->close();
    }
}
