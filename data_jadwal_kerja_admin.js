// =====================================================
// DATA JADWAL KERJA ADMIN - DIMSUM HOKYA
// =====================================================

const API_URL =
    "http://localhost/absensi_backand/api/auth/admin";


// =====================================================
// ELEMENT
// =====================================================

const tableBody =
    document.getElementById("tableJadwalBody");

const filterBulan =
    document.getElementById("filterBulan");

const filterCabang =
    document.getElementById("filterCabang");

const btnFilter =
    document.getElementById("btnFilter");

const btnSemua =
    document.getElementById("btnSemua");

// Menyimpan seluruh data jadwal
let seluruhDataJadwal = [];

const alertJadwal =
    document.getElementById("alertJadwal");


// =====================================================
// MODAL
// =====================================================

const modalEditElement =
    document.getElementById("modalEditJadwal");

const modalEdit =
    new bootstrap.Modal(modalEditElement);


// =====================================================
// ALERT
// =====================================================

function showAlert(message, type = "danger") {

    alertJadwal.className =
        `alert alert-${type}`;

    alertJadwal.textContent =
        message;
}


// =====================================================
// HIDE ALERT
// =====================================================

function hideAlert() {

    alertJadwal.className =
        "alert d-none";

    alertJadwal.textContent =
        "";

}


// =====================================================
// LOAD DATA JADWAL
// =====================================================

async function loadJadwal() {

    try {

        hideAlert();


        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    Memuat data jadwal...
                </td>
            </tr>
        `;


        const url =
            `${API_URL}/get_jadwal.php`;


        console.log(
            "Mengambil seluruh data jadwal:",
            url
        );


        const response =
            await fetch(url);


        console.log(
            "HTTP Status:",
            response.status
        );


        const text =
            await response.text();


        console.log(
            "Response:",
            text
        );


        let result;


        try {

            result =
                JSON.parse(text);

        } catch (error) {

            throw new Error(
                "Response server bukan JSON."
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                `HTTP Error ${response.status}`
            );

        }


        seluruhDataJadwal =
            Array.isArray(result.data)
                ? result.data
                : [];


        // Membuat daftar cabang
        isiFilterCabang(
            seluruhDataJadwal
        );


        // Tampilkan berdasarkan filter
        tampilkanJadwalSesuaiFilter();


    } catch (error) {

        console.error(
            "❌ Error Load Jadwal:",
            error
        );


        seluruhDataJadwal = [];


        tableBody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="text-center text-danger">

                    ❌ Gagal mengambil data jadwal

                </td>
            </tr>
        `;


        showAlert(
            error.message,
            "danger"
        );

    }

}


// =====================================================
// ISI FILTER CABANG
// =====================================================

function isiFilterCabang(data) {

    if (!filterCabang) {
        return;
    }


    // Simpan pilihan sebelumnya
    const cabangSebelumnya =
        filterCabang.value;


    // Ambil nama cabang
    const daftarCabang =
        [
            ...new Set(
                data
                    .map(
                        item =>
                            item.nama_cabang
                    )
                    .filter(
                        cabang =>
                            cabang &&
                            String(cabang).trim() !== ""
                    )
                    .map(
                        cabang =>
                            String(cabang).trim()
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "id"
                )
        );


    // Reset dropdown
    filterCabang.innerHTML = `
        <option value="">
            Semua Cabang
        </option>
    `;


    // Masukkan cabang
    daftarCabang.forEach(
        cabang => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                cabang;


            option.textContent =
                cabang;


            filterCabang.appendChild(
                option
            );

        }
    );


    // Pertahankan pilihan sebelumnya
    if (
        cabangSebelumnya &&
        daftarCabang.includes(
            cabangSebelumnya
        )
    ) {

        filterCabang.value =
            cabangSebelumnya;

    } else {

        filterCabang.value =
            "";

    }

}


// =====================================================
// TAMPILKAN DATA SESUAI FILTER
// =====================================================

function tampilkanJadwalSesuaiFilter() {

    const bulan =
        filterBulan
            ? filterBulan.value
            : "";


    const cabang =
        filterCabang
            ? filterCabang.value
            : "";


    // Salin data asli
    let dataHasil =
        [...seluruhDataJadwal];


    // =================================================
    // FILTER BULAN
    // =================================================

    if (bulan) {

        dataHasil =
            dataHasil.filter(
                item => {

                    if (!item.tanggal) {
                        return false;
                    }


                    /*
                     * Contoh:
                     * tanggal = 2026-10-07
                     *
                     * substring(0, 7)
                     * menjadi:
                     * 2026-10
                     */

                    return String(
                        item.tanggal
                    ).substring(
                        0,
                        7
                    ) === bulan;

                }
            );

    }


    // =================================================
    // FILTER CABANG
    // =================================================

    if (cabang) {

        dataHasil =
            dataHasil.filter(
                item => {

                    return String(
                        item.nama_cabang || ""
                    ).trim() === cabang;

                }
            );

    }


    // =================================================
    // URUTKAN BERDASARKAN TANGGAL
    // =================================================

    dataHasil.sort(
        (a, b) => {

            const tanggalA =
                String(
                    a.tanggal || ""
                );


            const tanggalB =
                String(
                    b.tanggal || ""
                );


            return tanggalA.localeCompare(
                tanggalB
            );

        }
    );


    // Tampilkan
    tampilkanJadwal(
        dataHasil
    );

}


// =====================================================
// TAMPILKAN DATA KE TABLE
// =====================================================

function tampilkanJadwal(data) {

    tableBody.innerHTML = "";


    // Tidak ada data
    if (
        !data ||
        data.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    class="text-center">

                    Tidak ada data jadwal.

                </td>
            </tr>
        `;

        return;
    }


    // =================================================
    // LOOP DATA
    // =================================================

    data.forEach(
        (item, index) => {


            const tanggal =
                formatTanggal(
                    item.tanggal
                );


            const namaKaryawan =
                item.nama_karyawan ||
                "-";


            const namaCabang =
                item.nama_cabang ||
                "-";


            const namaShift =
                item.nama_shift ||
                "-";


            const pagi =
                item.pagi ||
                "-";


            const malam =
                item.malam ||
                "-";


            const keterangan =
                item.keterangan ||
                "-";


            const status =
                item.status ||
                "-";


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td class="text-center">
                    ${index + 1}
                </td>

                <td>
                    ${escapeHTML(
                        namaKaryawan
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        namaCabang
                    )}
                </td>

                <td>
                    ${tanggal}
                </td>

                <td>
                    ${escapeHTML(
                        namaShift
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        pagi
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        malam
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        keterangan
                    )}
                </td>

                <td>

                    <span
                        class="badge ${getStatusClass(
                            status
                        )}">

                        ${escapeHTML(
                            status
                        )}

                    </span>

                </td>

                <td>

                    <div class="aksi-wrapper">

                        <button
                            type="button"
                            class="btn btn-sm btn-edit"
                            title="Edit Jadwal"
                            data-action="edit"
                            data-id="${item.id_jadwal}">

                            <i class="ti ti-edit"></i>

                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-hapus"
                            title="Hapus Jadwal"
                            data-action="hapus"
                            data-id="${item.id_jadwal}">

                            <i class="ti ti-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tableBody.appendChild(
                tr
            );


            // Simpan data asli
            tr.dataset.jadwal =
                JSON.stringify(
                    item
                );

        }
    );

}


// =====================================================
// EVENT AKSI TABEL
// =====================================================

tableBody.addEventListener(
    "click",
    function(event) {


        const button =
            event.target.closest(
                "button"
            );


        if (!button) {
            return;
        }


        const action =
            button.dataset.action;


        const id =
            button.dataset.id;


        const row =
            button.closest("tr");


        // EDIT
        if (
            action === "edit"
        ) {

            const data =
                JSON.parse(
                    row.dataset.jadwal
                );


            editJadwal(
                data
            );

        }


        // HAPUS
        if (
            action === "hapus"
        ) {

            hapusJadwal(
                id
            );

        }

    }
);


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(
    tanggal
) {

    if (!tanggal) {
        return "-";
    }


    const date =
        new Date(
            tanggal +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        "id-ID",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// =====================================================
// STATUS
// =====================================================

function getStatusClass(
    status
) {

    const value =
        String(status)
            .toLowerCase();


    if (
        value === "terjadwal"
    ) {

        return "bg-success";

    }


    if (
        value === "selesai"
    ) {

        return "bg-primary";

    }


    if (
        value === "dibatalkan"
    ) {

        return "bg-danger";

    }


    return "bg-secondary";

}


// =====================================================
// EDIT JADWAL
// =====================================================

function editJadwal(
    data
) {

    console.log(
        "Edit jadwal:",
        data
    );


    document.getElementById(
        "edit_id_jadwal"
    ).value =
        data.id_jadwal;


    document.getElementById(
        "edit_nama_karyawan"
    ).value =
        data.nama_karyawan ||
        "";


    document.getElementById(
        "edit_nama_cabang"
    ).value =
        data.nama_cabang ||
        "";


    document.getElementById(
        "edit_tanggal"
    ).value =
        data.tanggal ||
        "";


    document.getElementById(
        "edit_nama_shift"
    ).value =
        data.nama_shift ||
        "";


    document.getElementById(
        "edit_pagi"
    ).value =
        data.pagi ||
        "";


    document.getElementById(
        "edit_malam"
    ).value =
        data.malam ||
        "";


    document.getElementById(
        "edit_status"
    ).value =
        data.status ||
        "terjadwal";


    document.getElementById(
        "edit_keterangan"
    ).value =
        data.keterangan ||
        "";


    document.getElementById(
        "editJadwalAlert"
    ).className =
        "alert d-none";


    modalEdit.show();

}


// =====================================================
// SIMPAN EDIT
// =====================================================

document.getElementById(
    "formEditJadwal"
).addEventListener(
    "submit",
    async function(event) {


        event.preventDefault();


        try {


            const data = {

                id_jadwal:
                    parseInt(
                        document.getElementById(
                            "edit_id_jadwal"
                        ).value
                    ),


                tanggal:
                    document.getElementById(
                        "edit_tanggal"
                    ).value,


                nama_shift:
                    document.getElementById(
                        "edit_nama_shift"
                    ).value.trim(),


                pagi:
                    document.getElementById(
                        "edit_pagi"
                    ).value.trim(),


                malam:
                    document.getElementById(
                        "edit_malam"
                    ).value.trim(),


                status:
                    document.getElementById(
                        "edit_status"
                    ).value,


                keterangan:
                    document.getElementById(
                        "edit_keterangan"
                    ).value.trim()

            };


            console.log(
                "Data edit jadwal:",
                data
            );


            // Validasi ID
            if (
                !data.id_jadwal
            ) {

                alert(
                    "ID jadwal tidak ditemukan."
                );

                return;

            }


            // Validasi tanggal
            if (
                !data.tanggal
            ) {

                alert(
                    "Tanggal wajib diisi."
                );

                return;

            }


            // Validasi shift
            if (
                !data.nama_shift
            ) {

                alert(
                    "Nama shift wajib diisi."
                );

                return;

            }


            const response =
                await fetch(
                    `${API_URL}/edit_jadwal.php`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                data
                            )

                    }
                );


            const text =
                await response.text();


            console.log(
                "Response edit:",
                text
            );


            let result;


            try {

                result =
                    JSON.parse(
                        text
                    );

            } catch (error) {

                throw new Error(
                    "Response server bukan JSON."
                );

            }


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    `HTTP Error ${response.status}`
                );

            }


            alert(
                "✅ Jadwal berhasil diperbarui."
            );


            modalEdit.hide();


            // Load ulang
            // filter bulan & cabang
            // tetap dipertahankan
            loadJadwal();


        } catch (error) {

            console.error(
                "❌ Error Edit Jadwal:",
                error
            );


            alert(
                "❌ Gagal mengedit jadwal: " +
                error.message
            );

        }

    }
);


// =====================================================
// HAPUS JADWAL
// =====================================================

async function hapusJadwal(
    id_jadwal
) {


    const yakin =
        confirm(
            "Apakah kamu yakin ingin menghapus jadwal ini?"
        );


    if (!yakin) {
        return;
    }


    try {


        const response =
            await fetch(
                `${API_URL}/hapus_jadwal.php`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id_jadwal:
                                parseInt(
                                    id_jadwal
                                )
                        })

                }
            );


        const text =
            await response.text();


        console.log(
            "Response hapus:",
            text
        );


        let result;


        try {

            result =
                JSON.parse(
                    text
                );

        } catch (error) {

            throw new Error(
                "Response server bukan JSON."
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                `HTTP Error ${response.status}`
            );

        }


        alert(
            "✅ Jadwal berhasil dihapus."
        );


        // Load ulang
        // filter tetap dipertahankan
        loadJadwal();


    } catch (error) {

        console.error(
            "❌ Error Hapus Jadwal:",
            error
        );


        alert(
            "❌ Gagal menghapus jadwal: " +
            error.message
        );

    }

}


// =====================================================
// TOMBOL TAMPILKAN
// =====================================================

btnFilter.addEventListener(
    "click",
    function() {

        tampilkanJadwalSesuaiFilter();

    }
);


// =====================================================
// FILTER BULAN
// =====================================================

if (filterBulan) {

    filterBulan.addEventListener(
        "change",
        function() {

            tampilkanJadwalSesuaiFilter();

        }
    );

}


// =====================================================
// FILTER CABANG
// =====================================================

if (filterCabang) {

    filterCabang.addEventListener(
        "change",
        function() {

            tampilkanJadwalSesuaiFilter();

        }
    );

}


// =====================================================
// TOMBOL SEMUA DATA
// =====================================================

btnSemua.addEventListener(
    "click",
    function() {


        // Kosongkan bulan
        if (filterBulan) {

            filterBulan.value = "";

        }


        // Kembali ke semua cabang
        if (filterCabang) {

            filterCabang.value = "";

        }


        // Tampilkan semua
        tampilkanJadwalSesuaiFilter();

    }
);


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// LOAD AWAL
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {


        /*
         * Saat halaman pertama kali dibuka,
         * otomatis memilih bulan berjalan.
         *
         * Contoh:
         * Oktober 2026
         * akan menjadi 2026-10
         */

        if (filterBulan) {

            const sekarang =
                new Date();


            const tahun =
                sekarang.getFullYear();


            const bulan =
                String(
                    sekarang.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            filterBulan.value =
                `${tahun}-${bulan}`;

        }


        loadJadwal();

    }
);