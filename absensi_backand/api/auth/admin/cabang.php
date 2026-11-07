<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../../config/database.php";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function response($success, $message, $data = null) {
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function getInput() {
    $json = json_decode(file_get_contents("php://input"), true);
    return is_array($json) ? $json : $_POST;
}

function columnExists($koneksi, $table, $column) {
    // Nama tabel dan kolom berasal dari konstanta internal,
    // bukan dari input pengguna.
    $result = $koneksi->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $result && $result->num_rows > 0;
}

try {
    $method = $_SERVER["REQUEST_METHOD"];
    $input = getInput();

    if ($method === "GET") {
        $result = $koneksi->query(
            "SELECT id_cabang, nama_cabang, alamat, latitude,
                    longitude, radius_meter, status, created_at
             FROM cabang
             ORDER BY id_cabang ASC"
        );

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        response(true, "Data cabang berhasil diambil.", $data);
    }

    if ($method !== "POST") {
        http_response_code(405);
        response(false, "Metode permintaan tidak diizinkan.");
    }

    $action = trim($input["action"] ?? "");

    if ($action === "tambah" || $action === "edit") {
        $id = (int)($input["id_cabang"] ?? 0);
        $nama = trim($input["nama_cabang"] ?? "");
        $alamat = trim($input["alamat"] ?? "");
        $latitude = trim((string)($input["latitude"] ?? ""));
        $longitude = trim((string)($input["longitude"] ?? ""));
        $radius = filter_var(
            $input["radius_meter"] ?? null,
            FILTER_VALIDATE_INT
        );
        $status = trim($input["status"] ?? "aktif");

        if (
            $nama === "" ||
            $alamat === "" ||
            $latitude === "" ||
            $longitude === "" ||
            $radius === false ||
            $radius === null
        ) {
            response(false, "Semua kolom wajib diisi dengan benar.");
        }

        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            response(false, "Latitude dan longitude harus berupa angka.");
        }

        $latitude = (float)$latitude;
        $longitude = (float)$longitude;

        if ($latitude < -90 || $latitude > 90) {
            response(false, "Latitude harus berada antara -90 sampai 90.");
        }

        if ($longitude < -180 || $longitude > 180) {
            response(false, "Longitude harus berada antara -180 sampai 180.");
        }

        if ($radius < 1 || $radius > 100000) {
            response(false, "Radius harus lebih dari 0 dan maksimal 100000 meter.");
        }

        if (!in_array($status, ["aktif", "nonaktif"], true)) {
            response(false, "Status cabang tidak valid.");
        }

        if ($action === "tambah") {
            $stmt = $koneksi->prepare(
                "INSERT INTO cabang
                    (nama_cabang, alamat, latitude, longitude, radius_meter, status)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );

            $stmt->bind_param(
                "ssddis",
                $nama,
                $alamat,
                $latitude,
                $longitude,
                $radius,
                $status
            );

            $stmt->execute();

            response(true, "Cabang berhasil ditambahkan.", [
                "id_cabang" => $koneksi->insert_id
            ]);
        }

        if ($id <= 0) {
            response(false, "ID cabang tidak valid.");
        }

        $stmt = $koneksi->prepare(
            "UPDATE cabang
             SET nama_cabang = ?, alamat = ?, latitude = ?,
                 longitude = ?, radius_meter = ?, status = ?
             WHERE id_cabang = ?"
        );

        $stmt->bind_param(
            "ssddisi",
            $nama,
            $alamat,
            $latitude,
            $longitude,
            $radius,
            $status,
            $id
        );

        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            $check = $koneksi->prepare(
                "SELECT id_cabang FROM cabang WHERE id_cabang = ?"
            );
            $check->bind_param("i", $id);
            $check->execute();

            if ($check->get_result()->num_rows === 0) {
                response(false, "Cabang tidak ditemukan.");
            }
        }

        response(true, "Data cabang berhasil diperbarui.");
    }

    if ($action === "hapus") {
        $id = (int)($input["id_cabang"] ?? 0);

        if ($id <= 0) {
            response(false, "ID cabang tidak valid.");
        }

        $check = $koneksi->prepare(
            "SELECT id_cabang FROM cabang WHERE id_cabang = ?"
        );
        $check->bind_param("i", $id);
        $check->execute();

        if ($check->get_result()->num_rows === 0) {
            response(false, "Cabang tidak ditemukan.");
        }

        // Jangan hapus cabang yang masih digunakan karyawan
        // atau jadwal kerja.
        $references = [
            ["karyawan", "id_cabang", "data karyawan"],
            ["jadwal_kerja", "id_cabang", "jadwal kerja"]
        ];

        foreach ($references as [$table, $column, $label]) {
            $tableResult = $koneksi->query(
                "SHOW TABLES LIKE '$table'"
            );

            if (
                $tableResult &&
                $tableResult->num_rows > 0 &&
                columnExists($koneksi, $table, $column)
            ) {
                $stmt = $koneksi->prepare(
                    "SELECT COUNT(*) AS jumlah FROM `$table` WHERE `$column` = ?"
                );
                $stmt->bind_param("i", $id);
                $stmt->execute();

                $jumlah = (int)$stmt->get_result()
                    ->fetch_assoc()["jumlah"];

                if ($jumlah > 0) {
                    response(
                        false,
                        "Cabang tidak dapat dihapus karena masih digunakan pada $label. Ubah status menjadi nonaktif jika cabang tidak lagi digunakan."
                    );
                }
            }
        }

        $stmt = $koneksi->prepare(
            "DELETE FROM cabang WHERE id_cabang = ?"
        );
        $stmt->bind_param("i", $id);
        $stmt->execute();

        response(true, "Cabang berhasil dihapus.");
    }

    response(false, "Aksi tidak dikenal.");

} catch (mysqli_sql_exception $e) {
    http_response_code(500);

    if ((int)$e->getCode() === 1451) {
        response(
            false,
            "Cabang tidak dapat dihapus karena masih terhubung dengan data lain."
        );
    }

    error_log("API cabang.php: " . $e->getMessage());
    response(false, "Terjadi kesalahan database. Periksa log backend.");
} catch (Throwable $e) {
    http_response_code(500);
    error_log("API cabang.php: " . $e->getMessage());
    response(false, "Terjadi kesalahan pada server.");
}
