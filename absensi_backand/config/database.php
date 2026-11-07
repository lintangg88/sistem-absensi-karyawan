<?php

$host = "127.0.0.1";
$port = 3306;
$username = "root";
$password = "";
$database = "db_absensi_hokya";

$koneksi = new mysqli(
    $host,
    $username,
    $password,
    $database,
    $port
);

if ($koneksi->connect_error) {
    die("Koneksi database gagal: " . $koneksi->connect_error);
}

$koneksi->set_charset("utf8mb4");

?>