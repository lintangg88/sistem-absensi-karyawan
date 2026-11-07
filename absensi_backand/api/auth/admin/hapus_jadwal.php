<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "../../../config/database.php";


try {

    $input =
        json_decode(
            file_get_contents("php://input"),
            true
        );


    $id_jadwal =
        isset($input["id_jadwal"])
            ? (int)$input["id_jadwal"]
            : 0;


    if ($id_jadwal <= 0) {

        throw new Exception(
            "ID jadwal tidak valid."
        );

    }


    $stmt =
        $koneksi->prepare(
            "DELETE FROM jadwal_kerja
             WHERE id_jadwal = ?"
        );


    if (!$stmt) {

        throw new Exception(
            $koneksi->error
        );

    }


    $stmt->bind_param(
        "i",
        $id_jadwal
    );


    if (!$stmt->execute()) {

        throw new Exception(
            $stmt->error
        );

    }


    if ($stmt->affected_rows === 0) {

        throw new Exception(
            "Data jadwal tidak ditemukan."
        );

    }


    echo json_encode([
        "success" => true,
        "message" =>
            "Jadwal berhasil dihapus."
    ]);


} catch (Throwable $e) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);

}

?>