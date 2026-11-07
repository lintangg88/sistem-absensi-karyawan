
const API_URL = "http://localhost/absensi_backand/api/auth";

// =====================================================
// ELEMENT HALAMAN
// =====================================================

const jadwalBody = document.getElementById("jadwalBody");
const judulCabang = document.getElementById("judulCabang");

// =====================================================
// AMBIL ID AKUN YANG SEDANG LOGIN
// =====================================================

function getAkunLogin() {
    let idUser = localStorage.getItem("id_user");

    if (idUser) {
        idUser = Number(idUser);

        if (Number.isInteger(idUser) && idUser > 0) {
            return { id_user: idUser };
        }
    }

    const userTersimpan = localStorage.getItem("user");

    if (userTersimpan) {
        try {
            const user = JSON.parse(userTersimpan);

            const id = Number(
                user?.id_user ??
                user?.data?.id_user ??
                user?.user?.id_user
            );

            if (Number.isInteger(id) && id > 0) {
                return { id_user: id };
            }
        } catch (error) {
            console.error("Gagal membaca data akun:", error);
        }
    }

    return null;
}

// =====================================================
// AMBIL ID CABANG DARI URL
// Contoh: jadwal_kerja_perjadwal.html?id_cabang=1
// =====================================================

function getCabangDipilih() {
    const params = new URLSearchParams(window.location.search);
    const idCabang = Number(params.get("id_cabang"));

    if (!Number.isInteger(idCabang) || idCabang <= 0) {
        return null;
    }

    return idCabang;
}

// =====================================================
// FILTER BULAN DAN TAHUN
// =====================================================

function siapkanFilter() {
    const header = document.querySelector(".header-jadwal");

    if (!header) return;

    let filter = document.getElementById("filterJadwal");

    if (!filter) {
        filter = document.createElement("div");
        filter.id = "filterJadwal";
        filter.className = "w-100 mt-3 mb-2";

        filter.innerHTML = `
            <div class="d-flex flex-wrap align-items-end gap-3">
                <div style="min-width:220px; max-width:300px; width:100%">
                    <label for="filterBulan" class="form-label text-white">
                        Pilih Bulan dan Tahun
                    </label>

                    <input
                        type="month"
                        id="filterBulan"
                        class="form-control"
                    >
                </div>

                <button
                    type="button"
                    id="btnTerapkanFilter"
                    class="btn btn-warning fw-semibold"
                >
                    <i class="fas fa-filter"></i> Tampilkan
                </button>
            </div>
        `;

        header.insertAdjacentElement("afterend", filter);
    }

    const inputBulan = document.getElementById("filterBulan");

    if (inputBulan && !inputBulan.value) {
        const sekarang = new Date();

        inputBulan.value =
            `${sekarang.getFullYear()}-${String(
                sekarang.getMonth() + 1
            ).padStart(2, "0")}`;
    }

    const tombolFilter = document.getElementById("btnTerapkanFilter");

    // Hindari pemasangan event listener berulang.
    if (tombolFilter && tombolFilter.dataset.listener !== "true") {
        tombolFilter.dataset.listener = "true";
        tombolFilter.addEventListener("click", loadJadwal);
    }
}

// =====================================================
// AMANKAN TEKS
// =====================================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

// =====================================================
// TAMPILKAN PESAN DI TABEL
// =====================================================

function tampilkanPesan(pesan) {
    if (!jadwalBody) return;

    jadwalBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                ${escapeHTML(pesan)}
            </td>
        </tr>
    `;
}

// =====================================================
// AMBIL JADWAL BERDASARKAN AKUN + CABANG + BULAN
// =====================================================

async function loadJadwal() {
    const akunLogin = getAkunLogin();
    const idCabang = getCabangDipilih();

    if (!jadwalBody) {
        console.error("Elemen jadwalBody tidak ditemukan.");
        return;
    }

    if (!akunLogin) {
        tampilkanPesan(
            "ID akun login tidak ditemukan. Silakan login kembali."
        );

        console.error(
            "localStorage id_user:",
            localStorage.getItem("id_user"),
            "localStorage user:",
            localStorage.getItem("user")
        );

        return;
    }

    if (!idCabang) {
        tampilkanPesan(
            "Cabang belum dipilih. Silakan kembali dan pilih cabang."
        );

        console.error(
            "Parameter id_cabang tidak ditemukan pada URL."
        );

        return;
    }

    const inputBulan = document.getElementById("filterBulan");
    const bulan = inputBulan?.value || "";

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(bulan)) {
        tampilkanPesan("Silakan pilih bulan dan tahun yang valid.");
        return;
    }

    tampilkanPesan("Memuat jadwal kerja...");

    try {
        // Kirim ketiga parameter ke backend.
        const params = new URLSearchParams({
            id_user: String(akunLogin.id_user),
            id_cabang: String(idCabang),
            bulan: bulan
        });

        const response = await fetch(
            `${API_URL}/jadwal/tampil.php?${params.toString()}`
        );

        const responseText = await response.text();

        let result;

        try {
            result = JSON.parse(responseText);
        } catch (error) {
            console.error("Respons API bukan JSON:", responseText);

            throw new Error(
                "Respons server bukan JSON. Periksa file PHP tampil.php."
            );
        }

        if (!response.ok || result.status === false) {
            throw new Error(
                result.message || `HTTP Error ${response.status}`
            );
        }

        // Judul mengikuti cabang yang dipilih.
        if (judulCabang) {
            judulCabang.textContent =
                `Jadwal Kerja - ${result.nama_cabang || "Cabang"} - ${result.nama_karyawan || "Karyawan"}`;
        }

        const data = Array.isArray(result.data) ? result.data : [];

        if (data.length === 0) {
            tampilkanPesan(
                "Belum ada jadwal kerja untuk akun, cabang, dan bulan yang dipilih."
            );
            return;
        }

        jadwalBody.innerHTML = "";

        data.forEach(function (item, index) {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHTML(item.tanggal || "-")}</td>
                <td>${escapeHTML(item.pagi || "-")}</td>
                <td>${escapeHTML(item.malam || "-")}</td>
            `;

            jadwalBody.appendChild(row);
        });

        console.log("Jadwal berhasil dimuat:", {
            id_user: result.id_user,
            id_cabang: result.id_cabang,
            nama_cabang: result.nama_cabang,
            bulan: result.bulan,
            total_data: result.total_data
        });

    } catch (error) {
        console.error("ERROR JADWAL:", error);
        tampilkanPesan(error.message || "Gagal mengambil jadwal kerja.");
    }
}

// =====================================================
// INISIALISASI HALAMAN
// =====================================================

document.addEventListener("DOMContentLoaded", function () {
    siapkanFilter();
    loadJadwal();
});
