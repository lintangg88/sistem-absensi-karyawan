document.addEventListener("DOMContentLoaded", function () {

    const selectKaryawan = document.getElementById("karyawan_id");
    const form = document.getElementById("formTambahTargetKerja");

    // =========================================================
    // KONFIGURASI API
    // =========================================================

    const API_BASE = "http://localhost/absensi_backand/api/auth/admin";

    const API_GET_KARYAWAN =
        `${API_BASE}/get_karyawan.php`;

    const API_SAVE_TARGET =
        `${API_BASE}/tambah_target_kerja.php`;


    // =========================================================
    // LOAD DATA KARYAWAN
    // =========================================================

    async function loadKaryawan() {

        if (!selectKaryawan) {
            console.error("Element #karyawan_id tidak ditemukan.");
            return;
        }

        try {

            selectKaryawan.innerHTML =
                '<option value="" disabled selected>-- Memuat Daftar Karyawan... --</option>';

            const response = await fetch(API_GET_KARYAWAN, {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP Error ${response.status}`
                );
            }

            const result = await response.json();

            console.log("Response data karyawan:", result);


            // =====================================================
            // AMBIL DATA DARI RESPONSE
            // =====================================================

            let dataKaryawan = [];

            if (Array.isArray(result)) {

                dataKaryawan = result;

            } else if (Array.isArray(result.data)) {

                dataKaryawan = result.data;

            } else if (Array.isArray(result.karyawan)) {

                dataKaryawan = result.karyawan;

            }


            // =====================================================
            // CEK DATA
            // =====================================================

            if (dataKaryawan.length === 0) {

                selectKaryawan.innerHTML =
                    '<option value="" disabled selected>-- Tidak ada data karyawan --</option>';

                return;
            }


            // =====================================================
            // RESET DROPDOWN
            // =====================================================

            selectKaryawan.innerHTML =
                '<option value="" disabled selected>-- Pilih Karyawan --</option>';


            // =====================================================
            // MASUKKAN DATA KARYAWAN
            // =====================================================

            dataKaryawan.forEach(function (karyawan) {

                /*
                 * Mendukung beberapa kemungkinan nama field
                 * dari API.
                 */

                const idKaryawan =
                    karyawan.id_karyawan ??
                    karyawan.id ??
                    karyawan.karyawan_id;

                const namaKaryawan =
                    karyawan.nama_karyawan ??
                    karyawan.nama ??
                    karyawan.nama_lengkap ??
                    karyawan.username;


                if (!idKaryawan) {
                    console.warn(
                        "Data karyawan tidak memiliki ID:",
                        karyawan
                    );
                    return;
                }


                const option = document.createElement("option");

                option.value = idKaryawan;

                option.textContent =
                    namaKaryawan
                        ? namaKaryawan
                        : `Karyawan ID ${idKaryawan}`;

                selectKaryawan.appendChild(option);

            });


        } catch (error) {

            console.error(
                "Gagal memuat data karyawan:",
                error
            );

            selectKaryawan.innerHTML =
                '<option value="" disabled selected>Gagal memuat daftar karyawan</option>';

        }

    }


    // =========================================================
    // LOAD KARYAWAN SAAT HALAMAN DIBUKA
    // =========================================================

    loadKaryawan();


    // =========================================================
    // SUBMIT FORM TAMBAH TARGET KERJA
    // =========================================================

    if (form) {

        form.addEventListener("submit", async function (e) {

            e.preventDefault();


            // =====================================================
            // AMBIL NILAI FORM
            // =====================================================

            const karyawanId =
                document.getElementById("karyawan_id").value;

            const bulan =
                document.getElementById("bulan").value;

            const tahun =
                document.getElementById("tahun").value;

            const hariEfektif =
                document.getElementById("hari_efektif").value;

            const minJamKerja =
                document.getElementById("min_jam_kerja").value;


            // =====================================================
            // VALIDASI
            // =====================================================

            if (!karyawanId) {

                alert("Silakan pilih karyawan.");

                return;
            }

            if (!bulan) {

                alert("Silakan pilih bulan.");

                return;
            }

            if (!tahun) {

                alert("Silakan masukkan tahun.");

                return;
            }

            if (!hariEfektif || parseInt(hariEfektif) <= 0) {

                alert("Hari efektif harus lebih dari 0.");

                return;
            }

            if (!minJamKerja || parseFloat(minJamKerja) <= 0) {

                alert("Minimal jam kerja harus lebih dari 0.");

                return;
            }


            // =====================================================
            // PAYLOAD
            // =====================================================

            const payload = {

                karyawan_id: parseInt(karyawanId),

                bulan: parseInt(bulan),

                tahun: parseInt(tahun),

                hari_efektif: parseInt(hariEfektif),

                min_jam_kerja: parseFloat(minJamKerja)

            };


            console.log(
                "Data yang dikirim:",
                payload
            );


            // =====================================================
            // DISABLE TOMBOL SAAT PROSES
            // =====================================================

            const submitButton =
                form.querySelector('button[type="submit"]');

            const originalButtonHTML =
                submitButton
                    ? submitButton.innerHTML
                    : "";


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML =
                    '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            }


            // =====================================================
            // KIRIM DATA KE PHP
            // =====================================================

            try {

                const response = await fetch(
                    API_SAVE_TARGET,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify(payload)
                    }
                );


                // =================================================
                // AMBIL RESPONSE
                // =================================================

                const result =
                    await response.json();


                console.log(
                    "Response simpan target:",
                    result
                );


                // =================================================
                // BERHASIL
                // =================================================

                if (
                    response.ok &&
                    result.success
                ) {

                    alert(
                        result.message ||
                        "Target kerja berhasil ditambahkan."
                    );


                    // Reset form
                    form.reset();


                    // Load ulang daftar karyawan
                    await loadKaryawan();

                }


                // =================================================
                // GAGAL
                // =================================================

                else {

                    alert(
                        result.message ||
                        "Gagal menyimpan target kerja."
                    );

                }


            } catch (error) {

                console.error(
                    "Error saat menyimpan target kerja:",
                    error
                );

                alert(
                    "Tidak dapat terhubung ke server API."
                );

            }


            // =====================================================
            // AKTIFKAN KEMBALI TOMBOL
            // =====================================================

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.innerHTML =
                    originalButtonHTML;

            }

        });

    }

});