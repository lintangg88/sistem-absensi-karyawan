
document.addEventListener("DOMContentLoaded", function () {
    const API_CABANG =
        "http://localhost/absensi_backand/api/auth/admin/cabang.php";

    const form = document.getElementById("formTambahCabang");
    const tombolSimpan = form
        ? form.querySelector('button[type="submit"]')
        : null;

    if (!form) {
        console.error(
            "Form tambah cabang tidak ditemukan. Pastikan ID form adalah formTambahCabang."
        );
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const namaCabang = document
            .getElementById("nama_cabang")
            ?.value.trim();

        const alamat = document
            .getElementById("alamat")
            ?.value.trim();

        const latitude = document
            .getElementById("latitude")
            ?.value.trim();

        const longitude = document
            .getElementById("longitude")
            ?.value.trim();

        const radiusMeter = document
            .getElementById("radius_meter")
            ?.value.trim();

        const status = document
            .getElementById("status")
            ?.value;

        // Validasi input
        if (
            !namaCabang ||
            !alamat ||
            !latitude ||
            !longitude ||
            !radiusMeter ||
            !status
        ) {
            alert("Mohon lengkapi semua data cabang terlebih dahulu.");
            return;
        }

        if (
            !Number.isFinite(Number(latitude)) ||
            !Number.isFinite(Number(longitude))
        ) {
            alert("Latitude dan longitude harus berupa angka yang valid.");
            return;
        }

        if (
            Number(latitude) < -90 ||
            Number(latitude) > 90
        ) {
            alert("Latitude harus berada antara -90 sampai 90.");
            return;
        }

        if (
            Number(longitude) < -180 ||
            Number(longitude) > 180
        ) {
            alert("Longitude harus berada antara -180 sampai 180.");
            return;
        }

        if (
            !Number.isFinite(Number(radiusMeter)) ||
            Number(radiusMeter) <= 0
        ) {
            alert("Radius cabang harus berupa angka lebih dari 0.");
            return;
        }

        const dataCabang = {
            action: "tambah",
            nama_cabang: namaCabang,
            alamat: alamat,
            latitude: Number(latitude),
            longitude: Number(longitude),
            radius_meter: Number(radiusMeter),
            status: status
        };

        // Mencegah pengiriman berulang
        if (tombolSimpan) {
            tombolSimpan.disabled = true;
            tombolSimpan.dataset.teksAwal =
                tombolSimpan.innerHTML;
            tombolSimpan.innerHTML = "Menyimpan...";
        }

        try {
            const response = await fetch(API_CABANG, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(dataCabang)
            });

            const teksRespons = await response.text();

            let hasil;

            try {
                hasil = JSON.parse(teksRespons);
            } catch (error) {
                console.error(
                    "Respons API bukan JSON yang valid:",
                    teksRespons
                );

                throw new Error(
                    "Respons server tidak valid. Periksa kode PHP cabang.php."
                );
            }

            if (!response.ok) {
                throw new Error(
                    hasil.message ||
                    "Server mengalami kesalahan HTTP " + response.status
                );
            }

            if (hasil.success === true) {
                // Popup berhasil
                alert(
                    hasil.message ||
                    "Berhasil! Data cabang berhasil ditambahkan."
                );

                // Kosongkan form setelah berhasil
                form.reset();

                // Jika tersedia, fokus kembali ke nama cabang
                document.getElementById("nama_cabang")?.focus();

            } else {
                // Popup jika PHP menyatakan gagal
                alert(
                    "Gagal menambahkan data cabang: " +
                    (hasil.message || "Terjadi kesalahan.")
                );

                console.error("Gagal menambahkan cabang:", hasil);
            }

        } catch (error) {
            console.error("Kesalahan tambah cabang:", error);

            alert(
                "Data cabang gagal diproses.\n\n" +
                (error.message ||
                    "Periksa koneksi dan alamat API.")
            );

        } finally {
            // Aktifkan kembali tombol simpan
            if (tombolSimpan) {
                tombolSimpan.disabled = false;
                tombolSimpan.innerHTML =
                    tombolSimpan.dataset.teksAwal ||
                    "Simpan";
            }
        }
    });
});
