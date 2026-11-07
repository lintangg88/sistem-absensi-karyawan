<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once "../../database.php";

$data = json_decode(file_get_contents("php://input"), true);

$id_cabang = isset($data['id_cabang'])
    ? intval($data['id_cabang'])
    : 0;

$id_user = isset($data['id_user'])
    ? intval($data['id_user'])
    : 0;

$tanggal = isset($data['tanggal'])
    ? $data['tanggal']
    : '';

$shift = isset($data['shift'])
    ? $data['shift']
    : '';

if (
    $id_cabang <= 0 ||
    $id_user <= 0 ||
    empty($tanggal) ||
    empty($shift)
) {

    echo json_encode([
        "status" => false,
        "message" => "Data hapus tidak lengkap"
    ]);

    exit;
}

$stmt = $koneksi->prepare("
    DELETE FROM jadwal_kerja

    WHERE id_cabang = ?
    AND id_user = ?
    AND tanggal = ?
    AND shift = ?
");

$stmt->bind_param(
    "iiss",
    $id_cabang,
    $id_user,
    $tanggal,
    $shift
);

if ($stmt->execute()) {

    echo json_encode([
        "status" => true,
        "message" => "Jadwal berhasil dihapus"
    ]);

} else {

    echo json_encode([
        "status" => false,
        "message" => "Gagal menghapus jadwal"
    ]);
}

?>