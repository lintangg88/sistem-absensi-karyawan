
/* =========================================================
   DATA CABANG ADMIN - HOKYAATTEND
   Menggunakan satu endpoint cabang.php
   ========================================================= */

const API_CABANG =
    "http://localhost/absensi_backand/api/auth/admin/cabang.php";

document.addEventListener("DOMContentLoaded", function () {
    initDataCabang();
});

function initDataCabang() {
    const body =
        document.getElementById("tableKaryawanBody") ||
        document.getElementById("tableCabangBody");

    if (!body) {
        console.error(
            "Tabel cabang tidak ditemukan. Periksa ID tbody HTML."
        );
        return;
    }

    const formEdit =
        document.getElementById("formEditKaryawan") ||
        document.getElementById("formEditCabang");

    if (formEdit) {
        formEdit.addEventListener("submit", simpanCabang);
    }

    const formTambah = document.getElementById("formTambahCabang");

    if (formTambah) {
        formTambah.addEventListener("submit", tambahCabang);
    }

    muatDataCabang();
}

/* =========================================================
   HELPER
   ========================================================= */

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

function tampilkanAlert(pesan, tipe = "success") {
    const alertBox =
        document.getElementById("alertKaryawan") ||
        document.getElementById("alertCabang");

    if (!alertBox) {
        alert(pesan);
        return;
    }

    alertBox.className =
        `alert alert-${tipe} alert-dismissible fade show`;

    alertBox.innerHTML = `
        ${escapeHTML(pesan)}
        <button type="button"
            class="btn-close"
            data-bs-dismiss="alert"
            aria-label="Tutup"></button>
    `;

    alertBox.classList.remove("d-none");
}

function ambilDataArray(result) {
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.cabang)) return result.cabang;
    if (Array.isArray(result)) return result;

    return [];
}

async function requestAPI(action = "", payload = null) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const options = {
            method: payload ? "POST" : "GET",
            signal: controller.signal,
            headers: {
                "Accept": "application/json"
            }
        };

        if (payload) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify({
                ...payload,
                action: action
            });
        }

        const response = await fetch(API_CABANG, options);
        const responseText = await response.text();

        let result;

        try {
            result = JSON.parse(responseText);
        } catch (error) {
            console.error(
                "Respons API bukan JSON:",
                responseText
            );

            throw new Error(
                `Respons server bukan JSON (HTTP ${response.status}). ` +
                "Periksa error PHP dan alamat endpoint."
            );
        }

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message ||
                result.pesan ||
                `Permintaan gagal (HTTP ${response.status}).`
            );
        }

        return result;

    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(
                "API tidak merespons dalam 10 detik. " +
                "Periksa Laragon, PHP, dan alamat endpoint."
            );
        }

        throw error;

    } finally {
        clearTimeout(timeout);
    }
}

/* =========================================================
   1. MEMUAT DATA CABANG
   ========================================================= */

async function muatDataCabang() {
    const body =
        document.getElementById("tableKaryawanBody") ||
        document.getElementById("tableCabangBody");

    if (!body) return;

    body.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <span class="spinner-border spinner-border-sm text-danger"
                    role="status"></span>
                Memuat data cabang...
            </td>
        </tr>
    `;

    try {
        const result = await requestAPI();
        const data = ambilDataArray(result);

        if (data.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        Belum ada data cabang.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = data.map((cabang, index) => {
            const status = String(cabang.status || "").toLowerCase();
            const badge = status === "aktif"
                ? "bg-success"
                : "bg-secondary";

            const id = Number(cabang.id_cabang);

            return `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${escapeHTML(cabang.nama_cabang)}</td>
                    <td>${escapeHTML(cabang.alamat)}</td>
                    <td>${escapeHTML(cabang.latitude)}</td>
                    <td>${escapeHTML(cabang.longitude)}</td>
                    <td>${escapeHTML(cabang.radius_meter)} m</td>
                    <td class="text-center">
                        <span class="badge ${badge}">
                            ${escapeHTML(cabang.status)}
                        </span>
                    </td>
                    <td class="text-nowrap">
                        <button type="button"
                            class="btn btn-warning btn-sm me-1"
                            onclick="bukaEditCabang(${id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button type="button"
                            class="btn btn-danger btn-sm"
                            onclick="hapusCabang(${id})">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error("Gagal memuat data cabang:", error);

        body.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-circle"></i>
                    ${escapeHTML(error.message)}
                    <br>
                    <button type="button"
                        class="btn btn-outline-danger btn-sm mt-2"
                        onclick="muatDataCabang()">
                        Coba Lagi
                    </button>
                </td>
            </tr>
        `;

        tampilkanAlert(error.message, "danger");
    }
}

/* =========================================================
   2. EDIT CABANG
   ========================================================= */

async function bukaEditCabang(idCabang) {
    try {
        const result = await requestAPI();
        const data = ambilDataArray(result);

        const cabang = data.find(item =>
            Number(item.id_cabang) === Number(idCabang)
        );

        if (!cabang) {
            throw new Error("Data cabang tidak ditemukan.");
        }

        isiFormCabang(cabang);

        const modalElement =
            document.getElementById("modalEditKaryawan") ||
            document.getElementById("modalEditCabang");

        if (!modalElement || typeof bootstrap === "undefined") {
            throw new Error("Modal edit cabang tidak ditemukan.");
        }

        bootstrap.Modal.getOrCreateInstance(modalElement).show();

    } catch (error) {
        console.error("Gagal membuka edit cabang:", error);
        tampilkanAlert(error.message, "danger");
    }
}

function isiFormCabang(cabang) {
    /*
     * Mendukung ID input yang benar maupun ID lama
     * yang masih tertulis pada HTML kamu.
     */

    const pemetaan = {
        id: ["edit_id_cabang"],
        nama: ["edit_nama_cabang", "edit_nik"],
        alamat: ["edit_alamat", "edit_nama_karyawan"],
        latitude: ["edit_latitude", "edit_jabatan"],
        longitude: ["edit_longitude", "edit_no_hp"],
        radius: ["edit_radius_meter", "edit_tanggal_masuk"],
        status: ["edit_status"]
    };

    const nilai = {
        id: cabang.id_cabang,
        nama: cabang.nama_cabang,
        alamat: cabang.alamat,
        latitude: cabang.latitude,
        longitude: cabang.longitude,
        radius: cabang.radius_meter,
        status: cabang.status
    };

    Object.entries(pemetaan).forEach(([key, ids]) => {
        for (const id of ids) {
            const element = document.getElementById(id);

            if (element) {
                element.value = nilai[key] ?? "";
                break;
            }
        }
    });
}

/* =========================================================
   3. AMBIL DATA FORM CABANG
   ========================================================= */

function ambilPayloadCabang(prefix = "edit_") {
    function baca(nama, idLama) {
        const element =
            document.getElementById(prefix + nama) ||
            document.getElementById(idLama);

        return element ? element.value.trim() : "";
    }

    return {
        nama_cabang: baca("nama_cabang", "edit_nik"),
        alamat: baca("alamat", "edit_nama_karyawan"),
        latitude: baca("latitude", "edit_jabatan"),
        longitude: baca("longitude", "edit_no_hp"),
        radius_meter: baca("radius_meter", "edit_tanggal_masuk") || "50",
        status: baca("status", "edit_status") || "aktif"
    };
}

/* =========================================================
   4. SIMPAN EDIT
   ========================================================= */

async function simpanCabang(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const idElement = document.getElementById("edit_id_cabang");
    const id = Number(idElement?.value);

    if (!Number.isInteger(id) || id <= 0) {
        tampilkanAlert("ID cabang tidak valid.", "danger");
        return;
    }

    const payload = ambilPayloadCabang("edit_");
    payload.id_cabang = id;

    await simpanDataCabang(
        "edit",
        payload,
        form,
        "Data cabang berhasil diperbarui."
    );
}

/* =========================================================
   5. TAMBAH CABANG
   ========================================================= */

async function tambahCabang(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const payload = ambilPayloadCabang("tambah_");

    await simpanDataCabang(
        "tambah",
        payload,
        form,
        "Cabang berhasil ditambahkan."
    );
}

/* =========================================================
   6. VALIDASI DAN KIRIM DATA
   ========================================================= */

async function simpanDataCabang(action, payload, form, pesanSukses) {
    const tombol = form.querySelector('[type="submit"]');
    const teksAwal = tombol?.innerHTML;

    try {
        if (
            !payload.nama_cabang ||
            !payload.alamat ||
            payload.latitude === "" ||
            payload.longitude === ""
        ) {
            throw new Error(
                "Nama cabang, alamat, latitude, dan longitude wajib diisi."
            );
        }

        const lat = Number(payload.latitude);
        const lng = Number(payload.longitude);
        const radius = Number(payload.radius_meter);

        if (
            !Number.isFinite(lat) ||
            lat < -90 || lat > 90 ||
            !Number.isFinite(lng) ||
            lng < -180 || lng > 180
        ) {
            throw new Error("Latitude atau longitude tidak valid.");
        }

        if (
            !Number.isInteger(radius) ||
            radius < 1 || radius > 100000
        ) {
            throw new Error("Radius harus berupa bilangan bulat 1–100000.");
        }

        if (!["aktif", "nonaktif"].includes(payload.status)) {
            throw new Error("Status cabang tidak valid.");
        }

        if (tombol) {
            tombol.disabled = true;
            tombol.innerHTML =
                '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';
        }

        const result = await requestAPI(action, payload);

        tampilkanAlert(
            result.message || result.pesan || pesanSukses,
            "success"
        );

        const modalElement =
            document.getElementById("modalEditKaryawan") ||
            document.getElementById("modalEditCabang");

        if (modalElement && typeof bootstrap !== "undefined") {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        form.reset();
        await muatDataCabang();

    } catch (error) {
        console.error("Gagal menyimpan cabang:", error);
        tampilkanAlert(error.message, "danger");

    } finally {
        if (tombol) {
            tombol.disabled = false;
            tombol.innerHTML = teksAwal || "Simpan";
        }
    }
}

/* =========================================================
   7. HAPUS CABANG
   ========================================================= */

async function hapusCabang(idCabang) {
    const id = Number(idCabang);

    if (!Number.isInteger(id) || id <= 0) {
        tampilkanAlert("ID cabang tidak valid.", "danger");
        return;
    }

    if (!confirm(
        "Yakin ingin menghapus cabang ini?\n\n" +
        "Cabang yang masih digunakan karyawan atau jadwal kerja " +
        "akan ditolak oleh backend."
    )) {
        return;
    }

    try {
        const result = await requestAPI("hapus", {
            id_cabang: id
        });

        tampilkanAlert(
            result.message || result.pesan || "Cabang berhasil dihapus.",
            "success"
        );

        await muatDataCabang();

    } catch (error) {
        console.error("Gagal menghapus cabang:", error);
        tampilkanAlert(error.message, "danger");
    }
}
