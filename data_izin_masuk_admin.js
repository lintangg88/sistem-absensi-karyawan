
document.addEventListener("DOMContentLoaded", () => {
    const API_URL =
        "http://localhost/absensi_backand/api/auth/admin/data_izin.php";

    const KARYAWAN_URL =
        "http://localhost/absensi_backand/api/auth/admin/karyawan.php";

    const UPDATE_URL =
        "http://localhost/absensi_backand/api/auth/admin/update_izin.php";

    const DELETE_URL =
        "http://localhost/absensi_backand/api/auth/admin/hapus_izin.php";

    const filterBulan = document.getElementById("filterBulan");
    const btnFilter = document.getElementById("btnFilter");
    const btnSemua = document.getElementById("btnSemua");
    const tableBody = document.getElementById("tableJadwalBody");
    const alertBox = document.getElementById("alertJadwal");

    const formEdit = document.getElementById("formEditIzin");
    const modalElement = document.getElementById("modalEditIzin");

    const modalEdit =
        modalElement && window.bootstrap
            ? bootstrap.Modal.getOrCreateInstance(modalElement)
            : null;

    const fieldId = document.getElementById("edit_id_izin");
    const fieldKaryawan = document.getElementById("edit_id_karyawan");
    const fieldMulai = document.getElementById("edit_tanggal_mulai");
    const fieldSelesai = document.getElementById("edit_tanggal_selesai");
    const fieldJenis = document.getElementById("edit_jenis_izin");
    const fieldAlasan = document.getElementById("edit_alasan");
    const fieldStatus = document.getElementById("edit_status");
    const fieldCatatan = document.getElementById("edit_catatan_admin");

    let dataIzin = [];
    let dataKaryawan = [];
    let karyawanSudahDimuat = false;

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function formatTanggal(value) {
        if (!value) return "-";

        const bagian = String(value).substring(0, 10).split("-");

        if (bagian.length !== 3) {
            return escapeHTML(value);
        }

        return `${bagian[2]}-${bagian[1]}-${bagian[0]}`;
    }

    function badgeStatus(status) {
        const nilai = String(status || "").toLowerCase();

        if (nilai === "disetujui") {
            return '<span class="badge bg-success">Disetujui</span>';
        }

        if (nilai === "ditolak") {
            return '<span class="badge bg-danger">Ditolak</span>';
        }

        return '<span class="badge bg-secondary">Menunggu</span>';
    }

    function tampilkanPesan(pesan, jenis = "success") {
        if (!alertBox) {
            alert(pesan);
            return;
        }

        alertBox.className = `alert alert-${jenis}`;
        alertBox.textContent = pesan;
        alertBox.classList.remove("d-none");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        window.setTimeout(() => {
            alertBox.classList.add("d-none");
        }, 5000);
    }

    async function bacaJSON(response) {
        const teks = await response.text();

        let hasil;

        try {
            hasil = JSON.parse(teks);
        } catch {
            console.error("Respons API bukan JSON:", teks);
            throw new Error(
                "Respons server tidak valid. Periksa URL API dan error PHP."
            );
        }

        return hasil;
    }

    function buatLinkBukti(path) {
        if (!path) return "-";

        const nilai = String(path).trim();

        // Terima path relatif yang aman untuk bukti izin.
        if (
            nilai.startsWith("/") ||
            nilai.includes("..") ||
            /^https?:\/\//i.test(nilai) ||
            !/^uploads\/izin\/[a-zA-Z0-9_.-]+$/i.test(nilai)
        ) {
            return escapeHTML(nilai);
        }

        const url = `http://localhost/absensi_backand/${nilai}`;

        return `
            <a href="${escapeHTML(url)}"
               target="_blank"
               rel="noopener noreferrer">
                Lihat Bukti
            </a>
        `;
    }

    function buatBaris(item, nomor) {
        const id = Number(item.id_izin);

        return `
            <tr>
                <td>${nomor}</td>
                <td>${escapeHTML(item.nama_karyawan || "-")}</td>
                <td>${formatTanggal(item.tanggal_mulai)}</td>
                <td>${formatTanggal(item.tanggal_selesai)}</td>
                <td>${escapeHTML(item.jenis_izin || "-")}</td>
                <td class="kolom-alasan">
                    ${escapeHTML(item.alasan || "-")}
                </td>
                <td>${buatLinkBukti(item.foto_bukti)}</td>
                <td>${formatTanggal(item.tanggal_pengajuan)}</td>
                <td>${badgeStatus(item.status)}</td>
                <td>
                    <div class="aksi-wrapper">
                        <button
                            type="button"
                            class="btn btn-sm btn-warning btn-edit"
                            data-id="${id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger btn-hapus"
                            data-id="${id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async function muatDaftarKaryawan() {
        if (!fieldKaryawan) return;

        try {
            const response = await fetch(KARYAWAN_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });

            const hasil = await bacaJSON(response);

            if (!response.ok || hasil.success === false) {
                throw new Error(
                    hasil.message || "Gagal mengambil daftar karyawan."
                );
            }

            // Mendukung beberapa bentuk respons API.
            const daftar = Array.isArray(hasil)
                ? hasil
                : Array.isArray(hasil.data)
                    ? hasil.data
                    : Array.isArray(hasil.karyawan)
                        ? hasil.karyawan
                        : [];

            dataKaryawan = daftar.filter(item =>
                item.id_karyawan !== undefined &&
                item.id_karyawan !== null
            );

            fieldKaryawan.innerHTML =
                '<option value="">Pilih Karyawan</option>';

            dataKaryawan.forEach(item => {
                const option = document.createElement("option");

                option.value = String(item.id_karyawan);
                option.textContent =
                    item.nama_karyawan ||
                    `Karyawan ${item.id_karyawan}`;

                fieldKaryawan.appendChild(option);
            });

            karyawanSudahDimuat = true;
        } catch (error) {
            console.error("Gagal memuat daftar karyawan:", error);

            fieldKaryawan.innerHTML =
                '<option value="">Daftar karyawan gagal dimuat</option>';

            karyawanSudahDimuat = false;
        }
    }

    async function muatData(parameter = {}) {
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    Memuat data pengajuan izin...
                </td>
            </tr>
        `;

        try {
            const url = new URL(API_URL);

            if (parameter.bulan) {
                url.searchParams.set("bulan", parameter.bulan);
            }

            if (parameter.semua) {
                url.searchParams.set("semua", "1");
            }

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });

            const hasil = await bacaJSON(response);

            if (!response.ok || !hasil.success) {
                throw new Error(
                    hasil.message || "Gagal mengambil data izin."
                );
            }

            dataIzin = Array.isArray(hasil.data) ? hasil.data : [];

            if (dataIzin.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" class="text-center">
                            Tidak ada data pengajuan izin.
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = dataIzin
                .map((item, index) => buatBaris(item, index + 1))
                .join("");
        } catch (error) {
            console.error("Gagal memuat data izin:", error);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-danger">
                        Gagal memuat data. Periksa koneksi API dan database.
                    </td>
                </tr>
            `;

            tampilkanPesan(error.message, "danger");
        }
    }

    function tambahPilihanKaryawanSaatEdit(item) {
        if (!fieldKaryawan || !item.id_karyawan) return;

        const idKaryawan = String(item.id_karyawan);

        const sudahAda = Array.from(fieldKaryawan.options).some(
            option => option.value === idKaryawan
        );

        // Jika API daftar karyawan tidak menyertakan karyawan lama,
        // tetap tampilkan pilihan karyawan pada pengajuan tersebut.
        if (!sudahAda) {
            const option = document.createElement("option");

            option.value = idKaryawan;
            option.textContent =
                item.nama_karyawan || `Karyawan ${idKaryawan}`;

            fieldKaryawan.appendChild(option);
        }
    }

    async function bukaModalEdit(item) {
        if (!modalEdit) {
            tampilkanPesan(
                "Modal tidak dapat dibuka. Periksa Bootstrap 5 pada HTML.",
                "danger"
            );
            return;
        }

        if (!fieldId || !fieldKaryawan || !fieldMulai ||
            !fieldSelesai || !fieldJenis || !fieldAlasan ||
            !fieldStatus || !fieldCatatan) {
            tampilkanPesan(
                "Ada ID elemen modal Edit yang tidak cocok dengan HTML.",
                "danger"
            );
            return;
        }

        // Pastikan daftar karyawan sudah dicoba dimuat.
        if (!karyawanSudahDimuat) {
            await muatDaftarKaryawan();
        }

        tambahPilihanKaryawanSaatEdit(item);

        fieldId.value = item.id_izin ?? "";
        fieldKaryawan.value = String(item.id_karyawan ?? "");
        fieldMulai.value = String(item.tanggal_mulai ?? "").substring(0, 10);
        fieldSelesai.value = String(item.tanggal_selesai ?? "").substring(0, 10);
        fieldJenis.value = item.jenis_izin || "izin";
        fieldAlasan.value = item.alasan || "";

        // Status menunggu tetap ditampilkan sebagai menunggu jika
        // opsi tersebut tersedia di HTML. Jika tidak, gunakan opsi
        // pertama yang tersedia agar elemen tidak kosong.
        const opsiStatus = Array.from(fieldStatus.options).some(
            option => option.value === String(item.status)
        );

        if (opsiStatus) {
            fieldStatus.value = String(item.status);
        } else if (item.status === "ditolak") {
            fieldStatus.value = "ditolak";
        } else {
            fieldStatus.value = "disetujui";
        }

        fieldCatatan.value = item.catatan_admin || "";

        modalEdit.show();
    }

    if (btnFilter) {
        btnFilter.addEventListener("click", () => {
            const bulan = filterBulan?.value || "";

            if (!bulan) {
                tampilkanPesan(
                    "Silakan pilih bulan terlebih dahulu.",
                    "warning"
                );
                return;
            }

            muatData({ bulan });
        });
    }

    if (btnSemua) {
        btnSemua.addEventListener("click", () => {
            if (filterBulan) {
                filterBulan.value = "";
            }

            muatData({ semua: "1" });
        });
    }

    // Event delegation: tombol tetap berfungsi meskipun baris tabel
    // dibuat ulang setelah filter atau pemuatan data.
    if (tableBody) {
        tableBody.addEventListener("click", async event => {
            const tombolEdit = event.target.closest(".btn-edit");
            const tombolHapus = event.target.closest(".btn-hapus");

            if (tombolEdit) {
                const id = Number(tombolEdit.dataset.id);

                const item = dataIzin.find(
                    row => Number(row.id_izin) === id
                );

                if (!item) {
                    tampilkanPesan(
                        "Data pengajuan tidak ditemukan.",
                        "danger"
                    );
                    return;
                }

                try {
                    tombolEdit.disabled = true;
                    await bukaModalEdit(item);
                } catch (error) {
                    console.error("Gagal membuka modal Edit:", error);
                    tampilkanPesan(error.message, "danger");
                } finally {
                    tombolEdit.disabled = false;
                }

                return;
            }

            if (tombolHapus) {
                const id = Number(tombolHapus.dataset.id);

                const item = dataIzin.find(
                    row => Number(row.id_izin) === id
                );

                if (!item) {
                    tampilkanPesan(
                        "Data pengajuan tidak ditemukan.",
                        "danger"
                    );
                    return;
                }

                const yakin = confirm(
                    `Hapus pengajuan izin dari ${
                        item.nama_karyawan || "karyawan ini"
                    }?\n\nData yang dihapus tidak dapat dikembalikan.`
                );

                if (!yakin) return;

                tombolHapus.disabled = true;

                try {
                    const response = await fetch(DELETE_URL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json"
                        },
                        body: JSON.stringify({
                            id_izin: id
                        })
                    });

                    const hasil = await bacaJSON(response);

                    if (!response.ok || !hasil.success) {
                        throw new Error(
                            hasil.message || "Gagal menghapus pengajuan."
                        );
                    }

                    tampilkanPesan(
                        hasil.message || "Pengajuan berhasil dihapus."
                    );

                    await muatData(
                        filterBulan?.value
                            ? { bulan: filterBulan.value }
                            : { semua: "1" }
                    );
                } catch (error) {
                    console.error("Hapus izin:", error);
                    tampilkanPesan(error.message, "danger");
                } finally {
                    tombolHapus.disabled = false;
                }
            }
        });
    }

    // Menyimpan semua kolom yang dapat diedit.
    if (formEdit) {
        formEdit.addEventListener("submit", async event => {
            event.preventDefault();

            const tombolSimpan = formEdit.querySelector(
                'button[type="submit"]'
            );

            const payload = {
                id_izin: Number(fieldId?.value),
                id_karyawan: Number(fieldKaryawan?.value),
                tanggal_mulai: fieldMulai?.value || "",
                tanggal_selesai: fieldSelesai?.value || "",
                jenis_izin: fieldJenis?.value || "",
                alasan: fieldAlasan?.value.trim() || "",
                status: fieldStatus?.value || "",
                catatan_admin: fieldCatatan?.value.trim() || ""
            };

            if (
                !payload.id_izin ||
                !payload.id_karyawan ||
                !payload.tanggal_mulai ||
                !payload.tanggal_selesai ||
                !payload.jenis_izin ||
                !payload.alasan
            ) {
                tampilkanPesan(
                    "Lengkapi semua kolom wajib sebelum menyimpan.",
                    "warning"
                );
                return;
            }

            if (payload.tanggal_selesai < payload.tanggal_mulai) {
                tampilkanPesan(
                    "Tanggal selesai tidak boleh sebelum tanggal mulai.",
                    "warning"
                );
                return;
            }

            if (!["disetujui", "ditolak"].includes(payload.status)) {
                tampilkanPesan(
                    "Status pengajuan tidak valid.",
                    "warning"
                );
                return;
            }

            if (tombolSimpan) {
                tombolSimpan.disabled = true;
                tombolSimpan.textContent = "Menyimpan...";
            }

            try {
                const response = await fetch(UPDATE_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const hasil = await bacaJSON(response);

                if (!response.ok || !hasil.success) {
                    throw new Error(
                        hasil.message || "Gagal menyimpan perubahan."
                    );
                }

                modalEdit?.hide();

                tampilkanPesan(
                    hasil.message || "Pengajuan berhasil diperbarui."
                );

                await muatData(
                    filterBulan?.value
                        ? { bulan: filterBulan.value }
                        : { semua: "1" }
                );
            } catch (error) {
                console.error("Edit izin:", error);
                tampilkanPesan(error.message, "danger");
            } finally {
                if (tombolSimpan) {
                    tombolSimpan.disabled = false;
                    tombolSimpan.textContent = "Simpan Perubahan";
                }
            }
        });
    }

    // Muat daftar karyawan dan data tabel saat halaman dibuka.
    muatDaftarKaryawan();
    muatData();
});
