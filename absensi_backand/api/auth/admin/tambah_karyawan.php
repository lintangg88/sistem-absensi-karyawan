<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "../../../config/database.php";
require_once "../../../config/cors.php";

try {

    // Hanya menerima POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);

        echo json_encode([
            "success" => false,
            "message" => "Method tidak diizinkan"
        ]);

        exit;
    }

    // Ambil JSON dari JavaScript
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Data JSON tidak valid"
        ]);

        exit;
    }

    // Ambil data
    $id_user = isset($input["id_user"]) ? intval($input["id_user"]) : 0;
    $id_cabang = isset($input["id_cabang"]) ? intval($input["id_cabang"]) : 0;
    $nik = trim($input["nik"] ?? "");
    $nama_karyawan = trim($input["nama_karyawan"] ?? "");
    $jabatan = trim($input["jabatan"] ?? "");
    $no_hp = trim($input["no_hp"] ?? "");
    $alamat = trim($input["alamat"] ?? "");
    $tanggal_masuk = trim($input["tanggal_masuk"] ?? "");
    $status = trim($input["status"] ?? "aktif");

    // Validasi
    if (
        $id_user <= 0 ||
        $id_cabang <= 0 ||
        empty($nik) ||
        empty($nama_karyawan) ||
        empty($jabatan) ||
        empty($no_hp) ||
        empty($alamat) ||
        empty($tanggal_masuk) ||
        empty($status)
    ) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Semua data wajib diisi"
        ]);

        exit;
    }

    // Cek status
    if (!in_array($status, ["aktif", "nonaktif"])) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Status tidak valid"
        ]);

        exit;
    }

    // Cek apakah user benar-benar ada
    $cekUser = $koneksi->prepare(
        "SELECT id_user, role
         FROM users
         WHERE id_user = ?
         LIMIT 1"
    );

    $cekUser->bind_param("i", $id_user);
    $cekUser->execute();

    $hasilUser = $cekUser->get_result();

    if ($hasilUser->num_rows === 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Akun karyawan tidak ditemukan"
        ]);

        exit;
    }

    $user = $hasilUser->fetch_assoc();

    // Pastikan akun adalah karyawan
    if ($user["role"] !== "karyawan") {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Akun yang dipilih bukan akun karyawan"
        ]);

        exit;
    }

    // Cek apakah id_user sudah mempunyai data karyawan
    $cekIdUser = $koneksi->prepare(
        "SELECT id_karyawan
         FROM karyawan
         WHERE id_user = ?
         LIMIT 1"
    );

    $cekIdUser->bind_param("i", $id_user);
    $cekIdUser->execute();

    $hasilIdUser = $cekIdUser->get_result();

    if ($hasilIdUser->num_rows > 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Akun ini sudah memiliki data karyawan"
        ]);

        exit;
    }

    // Cek NIK
    $cekNik = $koneksi->prepare(
        "SELECT id_karyawan
         FROM karyawan
         WHERE nik = ?
         LIMIT 1"
    );

    $cekNik->bind_param("s", $nik);
    $cekNik->execute();

    $hasilNik = $cekNik->get_result();

    if ($hasilNik->num_rows > 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "NIK sudah digunakan"
        ]);

        exit;
    }

    // Cek cabang
    $cekCabang = $koneksi->prepare(
        "SELECT id_cabang
         FROM cabang
         WHERE id_cabang = ?
         AND status = 'aktif'
         LIMIT 1"
    );

    $cekCabang->bind_param("i", $id_cabang);
    $cekCabang->execute();

    $hasilCabang = $cekCabang->get_result();

    if ($hasilCabang->num_rows === 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Cabang tidak ditemukan atau tidak aktif"
        ]);

        exit;
    }

    // Simpan data karyawan
    $query = "
        INSERT INTO karyawan
        (
            id_user,
            id_cabang,
            nik,
            nama_karyawan,
            jabatan,
            no_hp,
            alamat,
            tanggal_masuk,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $koneksi->prepare($query);

    $stmt->bind_param(
        "iisssssss",
        $id_user,
        $id_cabang,
        $nik,
        $nama_karyawan,
        $jabatan,
        $no_hp,
        $alamat,
        $tanggal_masuk,
        $status
    );

    if (!$stmt->execute()) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Gagal menyimpan data karyawan",
            "error" => $stmt->error
        ]);

        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Data karyawan berhasil ditambahkan",
        "data" => [
            "id_karyawan" => $stmt->insert_id,
            "id_user" => $id_user,
            "id_cabang" => $id_cabang,
            "nik" => $nik,
            "nama_karyawan" => $nama_karyawan
        ]
    ]);

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan server",
        "error" => $e->getMessage()
    ]);
}