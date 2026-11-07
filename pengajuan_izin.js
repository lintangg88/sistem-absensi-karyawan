
// =====================================================
// PENGAJUAN IZIN - DIMSUM HOKYA
// =====================================================

const API_URL = "http://localhost/absensi_backand/api/auth";

// =====================================================
// ELEMENT FORM
// =====================================================

const formPengajuan = document.getElementById("formPengajuan");
const btnSubmit = document.getElementById("btnSubmit");

// =====================================================
// CEK FORM
// =====================================================

if (!formPengajuan) {
    console.error("❌ Form pengajuan tidak ditemukan!");
}

// =====================================================
// SUBMIT FORM
// =====================================================

if (formPengajuan) {
    formPengajuan.addEventListener("submit", async function (e) {
        e.preventDefault();

        console.log("=================================");
        console.log("FORM PENGAJUAN DIJALANKAN");
        console.log("=================================");

        // =================================================
        // AMBIL DATA LOGIN
        // =================================================

        const userData = localStorage.getItem("user");

        console.log("Data user dari localStorage:", userData);

        if (!userData) {
            alert(
                "Data login tidak ditemukan.\n\nSilakan login kembali."
            );
            return;
        }

        // =================================================
        // PARSE USER
        // =================================================

        let user;

        try {
            user = JSON.parse(userData);
        } catch (error) {
            console.error("❌ Data user tidak valid:", error);

            alert(
                "Data login tidak valid.\n\nSilakan login kembali."
            );
            return;
        }

        console.log("Object user:", user);

        // =================================================
        // AMBIL ID USER
        // =================================================

        const id_user = parseInt(user.id_user, 10);

        console.log("✅ ID User:", id_user);

        if (!id_user || isNaN(id_user)) {
            alert(
                "ID user tidak ditemukan.\n\nSilakan login kembali."
            );
            return;
        }

        // =================================================
        // AMBIL DATA FORM
        // =================================================

        const jenisIzin =
            document.getElementById("jenis_izin").value.trim();

        const tanggalMulai =
            document.getElementById("tanggal_mulai").value;

        const tanggalSelesai =
            document.getElementById("tanggal_selesai").value;

        const alasan =
            document.getElementById("alasan").value.trim();

        const fileInput =
            document.getElementById("foto_bukti");

        // =================================================
        // VALIDASI FORM
        // =================================================

        if (!jenisIzin) {
            alert("Silakan pilih jenis pengajuan.");
            return;
        }

        if (!tanggalMulai) {
            alert("Tanggal mulai wajib diisi.");
            return;
        }

        if (!tanggalSelesai) {
            alert("Tanggal selesai wajib diisi.");
            return;
        }

        if (tanggalSelesai < tanggalMulai) {
            alert(
                "Tanggal selesai tidak boleh sebelum tanggal mulai."
            );
            return;
        }

        if (!alasan) {
            alert("Alasan pengajuan wajib diisi.");
            return;
        }

        // =================================================
        // FORMDATA
        // =================================================

        const formData = new FormData();

        formData.append("id_user", id_user);
        formData.append("jenis_izin", jenisIzin);
        formData.append("tanggal_mulai", tanggalMulai);
        formData.append("tanggal_selesai", tanggalSelesai);
        formData.append("alasan", alasan);

        // =================================================
        // UPLOAD DOKUMEN
        // =================================================

        if (
            fileInput &&
            fileInput.files &&
            fileInput.files.length > 0
        ) {
            const file = fileInput.files[0];

            console.log("File:", file.name);

            formData.append("foto_bukti", file);
        }

        // =================================================
        // LOADING BUTTON
        // =================================================

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerText = "Mengirim...";
        }

        // =================================================
        // KIRIM KE API
        // =================================================

        try {
            const url =
                `${API_URL}/izin/pengajuan_izin.php`;

            console.log("=================================");
            console.log("MENGIRIM DATA KE BACKEND");
            console.log("URL:", url);
            console.log("ID USER:", id_user);
            console.log("JENIS IZIN:", jenisIzin);
            console.log("TANGGAL MULAI:", tanggalMulai);
            console.log("TANGGAL SELESAI:", tanggalSelesai);
            console.log("=================================");

            const response = await fetch(url, {
                method: "POST",
                body: formData
            });

            console.log("HTTP Status:", response.status);

            // =================================================
            // AMBIL RESPONSE SERVER
            // =================================================

            const text = await response.text();

            console.log("Response Server:", text);

            if (!text.trim()) {
                alert("Server tidak memberikan response.");
                return;
            }

            // =================================================
            // PARSE JSON
            // =================================================

            let data;

            try {
                data = JSON.parse(text);
            } catch (error) {
                console.error(
                    "❌ Response bukan JSON:",
                    text
                );

                alert(
                    "Terjadi kesalahan pada server.\n\n" +
                    "Response API tidak valid."
                );
                return;
            }

            console.log("Data API:", data);

            // =================================================
            // PERIKSA STATUS RESPONSE HTTP
            // =================================================

            if (!response.ok) {
                console.error(
                    "❌ HTTP Error:",
                    response.status,
                    data
                );

                alert(
                    "Terjadi kesalahan pada server.\n" +
                    "HTTP Status: " + response.status + "\n\n" +
                    (data.message || "Pengajuan belum dapat diproses.")
                );
                return;
            }

            // =================================================
            // RESPONSE PENGAJUAN
            // =================================================

            if (data.success) {
                const status = String(
                    data.status || ""
                ).trim().toLowerCase();

                const pesan = String(
                    data.message || ""
                ).trim();

                const catatanAdmin = String(
                    data.catatan_admin || ""
                ).trim();

                console.log("ID Pengajuan:", data.id_izin);
                console.log("Status Pengajuan:", status);

                // ---------------------------------------------
                // PENGAJUAN DITOLAK OTOMATIS
                // ---------------------------------------------

                if (status === "ditolak") {
                    alert(
                        "❌ PENGAJUAN IZIN DITOLAK\n\n" +
                        (
                            catatanAdmin ||
                            pesan ||
                            "Kuota izin pada tanggal yang kamu pilih " +
                            "sudah penuh. Maksimal 2 karyawan dapat " +
                            "disetujui pada tanggal tersebut."
                        )
                    );

                    // Data tetap tersimpan di database
                    // dengan status ditolak.
                    formPengajuan.reset();

                }

                // ---------------------------------------------
                // PENGAJUAN DISETUJUI
                // ---------------------------------------------

                else if (status === "disetujui") {
                    alert(
                        "✅ PENGAJUAN IZIN DISETUJUI\n\n" +
                        (
                            pesan ||
                            "Pengajuan izin kamu berhasil disetujui."
                        )
                    );

                    formPengajuan.reset();
                }

                // ---------------------------------------------
                // RESPONSE TIDAK MEMILIKI STATUS
                // ---------------------------------------------

                else {
                    console.warn(
                        "⚠️ Status tidak ditemukan atau tidak dikenali:",
                        data
                    );

                    alert(
                        "Pengajuan telah diproses oleh server, " +
                        "tetapi status persetujuannya belum dapat " +
                        "dipastikan.\n\n" +
                        "Silakan periksa riwayat pengajuan izin."
                    );
                }

            } else {
                console.error(
                    "❌ Pengajuan gagal:",
                    data.message
                );

                alert(
                    "❌ " +
                    (
                        data.message ||
                        "Pengajuan gagal dikirim."
                    )
                );
            }

        } catch (error) {
            console.error("❌ ERROR FETCH:", error);

            alert(
                "❌ Tidak dapat terhubung ke server.\n\n" +
                "Pastikan Apache dan MariaDB/MySQL Laragon aktif."
            );

        } finally {
            // =================================================
            // KEMBALIKAN BUTTON
            // =================================================

            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Ajukan Pengajuan";
            }
        }
    });
}