<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once "../../database.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "status" => false,
        "message" => "Data tidak ditemukan"
    ]);
    exit;
}

$id_cabang = isset($data['id_cabang'])
    ? intval($data['id_cabang'])
    : 0;

$tanggal = isset($data['tanggal'])
    ? $data['tanggal']
    : '';

$shift = isset($data['shift'])
    ? $data['shift']
    : '';

$id_users = isset($data['id_users'])
    ? $data['id_users']
    : [];


/*
|--------------------------------------------------------------------------
| Validasi
|--------------------------------------------------------------------------
*/

if ($id_cabang <= 0) {
    echo json_encode([
        "status" => false,
        "message" => "Cabang belum dipilih"
    ]);
    exit;
}

if (empty($tanggal)) {
    echo json_encode([
        "status" => false,
        "message" => "Tanggal belum dipilih"
    ]);
    exit;
}

if (!in_array($shift, ['shift1', 'shift2'])) {
    echo json_encode([
        "status" => false,
        "message" => "Shift tidak valid"
    ]);
    exit;
}

if (!is_array($id_users) || count($id_users) == 0) {
    echo json_encode([
        "status" => false,
        "message" => "Karyawan belum dipilih"
    ]);
    exit;
}


/*
|--------------------------------------------------------------------------
| Tentukan jam berdasarkan shift
|--------------------------------------------------------------------------
*/

if ($shift === 'shift1') {

    $jam_masuk = "10:00:00";
    $jam_keluar = "15:30:00";

} else {

    $jam_masuk = "15:30:00";
    $jam_keluar = "21:30:00";

}


/*
|--------------------------------------------------------------------------
| Simpan jadwal
|--------------------------------------------------------------------------
*/

$koneksi->begin_transaction();

try {

    $stmt = $koneksi->prepare("
        INSERT INTO jadwal_kerja
        (
            id_cabang,
            id_user,
            tanggal,
            shift,
            jam_masuk,
            jam_keluar
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            jam_masuk = VALUES(jam_masuk),
            jam_keluar = VALUES(jam_keluar)
    ");

    foreach ($id_users as $id_user) {

        $id_user = intval($id_user);

        if ($id_user <= 0) {
            continue;
        }

        $stmt->bind_param(
            "iissss",
            $id_cabang,
            $id_user,
            $tanggal,
            $shift,
            $jam_masuk,
            $jam_keluar
        );

        $stmt->execute();
    }

    $koneksi->commit();

    echo json_encode([
        "status" => true,
        "message" => "Jadwal berhasil disimpan",
        "shift" => $shift,
        "jam_masuk" => $jam_masuk,
        "jam_keluar" => $jam_keluar
    ]);

} catch (Exception $e) {

    $koneksi->rollback();

    echo json_encode([
        "status" => false,
        "message" => "Gagal menyimpan jadwal",
        "error" => $e->getMessage()
    ]);
}

?>