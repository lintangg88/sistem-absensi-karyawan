<?php

function responseSuccess(
    $message = "Berhasil",
    $data = null,
    $code = 200
) {

    http_response_code($code);

    echo json_encode([
        "success" => true,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}


function responseError(
    $message = "Terjadi kesalahan",
    $code = 400,
    $data = null
) {

    http_response_code($code);

    echo json_encode([
        "success" => false,
        "message" => $message,
        "data" => $data
    ]);

    exit;
}