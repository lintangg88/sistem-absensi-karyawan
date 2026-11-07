// =====================================================
// DATA ABSENSI ADMIN - DIMSUM HOKYA
// =====================================================

const API_URL =
    "http://localhost/absensi_backand/api/auth/admin";

let modalEdit = null;


// =====================================================
// ELEMENT
// =====================================================

let tableBody = null;
let filterTanggal = null;
let filterCabang = null;

let btnFilter = null;
let btnSemua = null;
let btnExportExcel = null;

let formEditAbsensi = null;


// =====================================================
// DATA TERAKHIR
// =====================================================

let dataAbsensiSekarang = [];


// =====================================================
// FILTER TERAKHIR
// =====================================================

let filterAktifTanggal = "";
let filterAktifCabang = "";


// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("====================================");
    console.log("✅ DATA ABSENSI ADMIN JS AKTIF");
    console.log("====================================");


    // =================================================
    // AMBIL ELEMENT
    // =================================================

    tableBody =
        document.getElementById("tableAbsensi");

    filterTanggal =
        document.getElementById("filterTanggal");

    filterCabang =
        document.getElementById("filterCabang");

    btnFilter =
        document.getElementById("btnFilter");

    btnSemua =
        document.getElementById("btnSemua");

    btnExportExcel =
        document.getElementById("btnExportExcel");

    formEditAbsensi =
        document.getElementById("formEditAbsensi");


    // =================================================
    // CEK ELEMENT
    // =================================================

    console.log("🔎 Cek element halaman:");
    console.log("tableAbsensi:", tableBody);
    console.log("filterTanggal:", filterTanggal);
    console.log("filterCabang:", filterCabang);
    console.log("btnFilter:", btnFilter);
    console.log("btnSemua:", btnSemua);
    console.log("btnExportExcel:", btnExportExcel);


    if (!tableBody) {

        console.error(
            "❌ ERROR: #tableAbsensi tidak ditemukan."
        );

        return;
    }


    if (!filterTanggal) {

        console.warn(
            "⚠️ #filterTanggal tidak ditemukan."
        );

    }


    if (!filterCabang) {

        console.warn(
            "⚠️ #filterCabang tidak ditemukan."
        );

    }


    // =================================================
    // MODAL EDIT
    // =================================================

    const modalElement =
        document.getElementById(
            "modalEditAbsensi"
        );


    if (modalElement) {

        if (
            typeof bootstrap !== "undefined" &&
            bootstrap.Modal
        ) {

            modalEdit =
                new bootstrap.Modal(
                    modalElement
                );

            console.log(
                "✅ Modal Edit berhasil dibuat."
            );

        } else {

            console.error(
                "❌ Bootstrap JS tidak ditemukan."
            );

        }

    } else {

        console.warn(
            "⚠️ #modalEditAbsensi tidak ditemukan."
        );

    }


    // =================================================
    // LOAD CABANG
    // =================================================

    loadCabang();


    // =================================================
    // TOMBOL FILTER
    // =================================================

    if (btnFilter) {

        btnFilter.addEventListener(
            "click",
            function () {

                console.log(
                    "🔘 Tombol FILTER ditekan."
                );


                let tanggal =
                    filterTanggal
                        ? filterTanggal.value
                        : "";

                const idCabang =
                    filterCabang
                        ? filterCabang.value
                        : "";


                if (
                    idCabang &&
                    !tanggal
                ) {

                    tanggal =
                        getTanggalHariIni();

                    console.log(
                        "📅 Cabang dipilih tanpa tanggal."
                    );

                    console.log(
                        "📅 Otomatis menggunakan tanggal:",
                        tanggal
                    );

                }


                if (
                    !tanggal &&
                    !idCabang
                ) {

                    alert(
                        "Silakan pilih tanggal atau cabang terlebih dahulu."
                    );

                    return;

                }


                console.log(
                    "===================================="
                );

                console.log(
                    "🔎 FILTER"
                );

                console.log(
                    "Tanggal:",
                    tanggal
                );

                console.log(
                    "ID Cabang:",
                    idCabang
                );

                console.log(
                    "===================================="
                );


                filterAktifTanggal =
                    tanggal;

                filterAktifCabang =
                    idCabang;


                if (
                    filterTanggal &&
                    tanggal
                ) {

                    filterTanggal.value =
                        tanggal;

                }


                loadAbsensi(
                    tanggal,
                    idCabang
                );

            }
        );

    } else {

        console.warn(
            "⚠️ Tombol #btnFilter tidak ditemukan."
        );

    }


    // =================================================
    // TOMBOL SEMUA DATA
    // =================================================

    if (btnSemua) {

        btnSemua.addEventListener(
            "click",
            function () {

                console.log(
                    "🔘 Tombol SEMUA DATA ditekan."
                );


                if (filterTanggal) {

                    filterTanggal.value = "";

                }


                if (filterCabang) {

                    filterCabang.value = "";

                }


                filterAktifTanggal = "";
                filterAktifCabang = "";


                loadAbsensi(
                    "",
                    ""
                );

            }
        );

    }


    // =================================================
    // EXPORT EXCEL
    // =================================================

    if (btnExportExcel) {

        btnExportExcel.addEventListener(
            "click",
            function () {

                console.log(
                    "🔘 Tombol EXPORT EXCEL ditekan."
                );

                // Dipanggil fungsi yang benar:
                exportExcel();

            }
        );

    }


    // =================================================
    // FORM EDIT
    // =================================================

    if (formEditAbsensi) {

        formEditAbsensi.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                simpanEditAbsensi();

            }
        );

    }


    loadAbsensi(
        "",
        ""
    );

});


// =====================================================
// GET TANGGAL HARI INI
// =====================================================

function getTanggalHariIni() {

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


    const tanggal =
        String(
            sekarang.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${tahun}-${bulan}-${tanggal}`;

}


// =====================================================
// LOAD CABANG
// =====================================================

async function loadCabang() {

    if (!filterCabang) {

        console.error(
            "❌ #filterCabang tidak ditemukan."
        );

        return;
    }


    try {

        console.log(
            "📡 Mengambil data cabang..."
        );


        const url =
            `${API_URL}/get_cabang.php?_=${Date.now()}`;


        console.log(
            "🌐 URL Cabang:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        console.log(
            "📡 HTTP Status Cabang:",
            response.status
        );


        const responseText =
            await response.text();


        console.log(
            "📦 Response Cabang:",
            responseText
        );


        if (!response.ok) {

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (error) {

            throw new Error(
                "Response get_cabang.php bukan JSON."
            );

        }


        console.log(
            "📦 JSON Cabang:",
            result
        );


        if (!result.success) {

            throw new Error(
                result.message ||
                "Gagal mengambil data cabang."
            );

        }


        filterCabang.innerHTML = "";


        const optionSemua =
            document.createElement(
                "option"
            );


        optionSemua.value = "";


        optionSemua.textContent =
            "Semua Cabang";


        filterCabang.appendChild(
            optionSemua
        );


        if (
            !Array.isArray(result.data) ||
            result.data.length === 0
        ) {

            console.warn(
                "⚠️ Tidak ada data cabang aktif."
            );

            return;

        }


        result.data.forEach(
            function (cabang) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(
                        cabang.id_cabang
                    );


                option.textContent =
                    cabang.nama_cabang ||
                    "Cabang " +
                    cabang.id_cabang;


                filterCabang.appendChild(
                    option
                );

            }
        );


        console.log(
            "✅ Jumlah cabang berhasil dimuat:",
            result.data.length
        );


        console.log(
            "📋 Isi dropdown cabang:",
            Array.from(
                filterCabang.options
            ).map(
                option => ({
                    value: option.value,
                    text: option.text
                })
            )
        );


    } catch (error) {

        console.error(
            "❌ ERROR LOAD CABANG:",
            error
        );


        filterCabang.innerHTML = `
            <option value="">
                Semua Cabang
            </option>
        `;

    }

}


// =====================================================
// LOAD DATA ABSENSI
// =====================================================

async function loadAbsensi(
    tanggal = "",
    idCabang = ""
) {

    if (!tableBody) {

        console.error(
            "❌ #tableAbsensi tidak ditemukan."
        );

        return;
    }


    try {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center">

                    <div class="py-4">

                        <div
                            class="spinner-border spinner-border-sm text-primary me-2">
                        </div>

                        Memuat data absensi...

                    </div>

                </td>
            </tr>
        `;


        filterAktifTanggal =
            tanggal;

        filterAktifCabang =
            idCabang;


        let url =
            `${API_URL}/get_absensi.php`;


        const params = [];


        if (tanggal) {

            params.push(
                `tanggal=${encodeURIComponent(tanggal)}`
            );

        }


        if (idCabang) {

            params.push(
                `id_cabang=${encodeURIComponent(idCabang)}`
            );

        }


        params.push(
            `_=${Date.now()}`
        );


        url +=
            "?" +
            params.join("&");


        console.log(
            "===================================="
        );

        console.log(
            "📡 REQUEST ABSENSI"
        );

        console.log(
            "URL:",
            url
        );

        console.log(
            "Tanggal:",
            tanggal
        );

        console.log(
            "ID Cabang:",
            idCabang
        );

        console.log(
            "===================================="
        );


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        console.log(
            "📡 HTTP Status Absensi:",
            response.status
        );


        const responseText =
            await response.text();


        console.log(
            "📦 Response Server Absensi:",
            responseText
        );


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (error) {

            throw new Error(
                "Server tidak mengirim JSON. Response: " +
                responseText.substring(
                    0,
                    500
                )
            );

        }


        console.log(
            "📦 JSON Absensi:",
            result
        );


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                `HTTP Error ${response.status}`
            );

        }


        dataAbsensiSekarang =
            Array.isArray(
                result.data
            )
                ? result.data
                : [];


        console.log(
            "✅ Data absensi diterima:",
            dataAbsensiSekarang.length,
            "baris"
        );


        tampilkanDataAbsensi(
            dataAbsensiSekarang
        );


        hitungRekap(
            dataAbsensiSekarang
        );


        console.log(
            "===================================="
        );

        console.log(
            "✅ LOAD ABSENSI SELESAI"
        );

        console.log(
            "===================================="
        );


    } catch (error) {

        console.error(
            "❌ ERROR LOAD ABSENSI:",
            error
        );


        dataAbsensiSekarang = [];


        resetRekap();


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center text-danger">

                    <strong>
                        ❌ Gagal mengambil data absensi
                    </strong>

                    <br>

                    <small>
                        ${escapeHTML(
                            error.message
                        )}
                    </small>

                </td>
            </tr>
        `;

    }

}


// =====================================================
// TAMPILKAN DATA ABSENSI
// =====================================================

function tampilkanDataAbsensi(data) {

    if (!tableBody) {

        return;
    }


    tableBody.innerHTML = "";


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center py-4">

                    <div class="text-muted">
                        Tidak ada data absensi.
                    </div>

                </td>
            </tr>
        `;

        return;
    }


    data.forEach(
        function (item, index) {

            const tanggal =
                formatTanggal(
                    item.tanggal
                );


            const jamMasuk =
                item.jam_masuk
                    ? String(
                        item.jam_masuk
                    ).substring(
                        0,
                        5
                    )
                    : "-";


            const jamKeluar =
                item.jam_keluar
                    ? String(
                        item.jam_keluar
                    ).substring(
                        0,
                        5
                    )
                    : "-";


            const namaKaryawan =
                item.nama_karyawan ||
                "-";


            const namaCabang =
                item.nama_cabang ||
                "-";


            const status =
                String(
                    item.status || "alpha"
                )
                .toLowerCase()
                .trim();


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
                    ${escapeHTML(
                        tanggal
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        jamMasuk
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        jamKeluar
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

                    <div
                        class="d-flex justify-content-center gap-2">

                        <button
                            type="button"
                            class="btn btn-sm btn-edit-absensi"
                            style="
                                background-color:#FFB200;
                                color:white;
                                border:none;
                            "
                            title="Edit">

                            <i class="ti ti-edit"></i>

                        </button>


                        <button
                            type="button"
                            class="btn btn-sm btn-hapus-absensi"
                            style="
                                background-color:#CB0404;
                                color:white;
                                border:none;
                            "
                            title="Hapus">

                            <i class="ti ti-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            const btnEdit =
                tr.querySelector(
                    ".btn-edit-absensi"
                );


            if (btnEdit) {

                btnEdit.addEventListener(
                    "click",
                    function () {

                        editAbsensi(
                            item
                        );

                    }
                );

            }


            const btnHapus =
                tr.querySelector(
                    ".btn-hapus-absensi"
                );


            if (btnHapus) {

                btnHapus.addEventListener(
                    "click",
                    function () {

                        hapusAbsensi(
                            item.id_absensi
                        );

                    }
                );

            }


            tableBody.appendChild(
                tr
            );

        }
    );

}


// =====================================================
// HITUNG REKAP
// =====================================================

function hitungRekap(data) {

    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let sakit = 0;
    let alpha = 0;


    const karyawanUnik =
        new Set();


    if (Array.isArray(data)) {

        data.forEach(
            function (item) {

                if (
                    item.id_karyawan !== null &&
                    item.id_karyawan !== undefined &&
                    item.id_karyawan !== ""
                ) {

                    karyawanUnik.add(
                        String(
                            item.id_karyawan
                        )
                    );

                }


                const status =
                    String(
                        item.status || "alpha"
                    )
                    .toLowerCase()
                    .trim();


                switch (status) {

                    case "hadir":

                        hadir++;

                        break;


                    case "terlambat":

                        terlambat++;

                        break;


                    case "izin":

                        izin++;

                        break;


                    case "sakit":

                        sakit++;

                        break;


                    case "alpha":

                        alpha++;

                        break;

                }

            }
        );

    }


    const totalKaryawan =
        karyawanUnik.size;


    setText(
        "totalKaryawan",
        totalKaryawan
    );


    setText(
        "totalHadir",
        hadir
    );


    setText(
        "totalTerlambat",
        terlambat
    );


    setText(
        "totalIzin",
        izin
    );


    setText(
        "totalSakit",
        sakit
    );


    setText(
        "totalAlpha",
        alpha
    );


    console.log(
        "===================================="
    );

    console.log(
        "📊 REKAP ABSENSI"
    );

    console.log(
        "Total Karyawan:",
        totalKaryawan
    );

    console.log(
        "Hadir:",
        hadir
    );

    console.log(
        "Terlambat:",
        terlambat
    );

    console.log(
        "Izin:",
        izin
    );

    console.log(
        "Sakit:",
        sakit
    );

    console.log(
        "Alpha:",
        alpha
    );

    console.log(
        "===================================="
    );

}


// =====================================================
// RESET REKAP
// =====================================================

function resetRekap() {

    setText(
        "totalKaryawan",
        0
    );

    setText(
        "totalHadir",
        0
    );

    setText(
        "totalTerlambat",
        0
    );

    setText(
        "totalIzin",
        0
    );

    setText(
        "totalSakit",
        0
    );

    setText(
        "totalAlpha",
        0
    );

}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    } else {

        console.warn(
            `⚠️ Element #${id} tidak ditemukan.`
        );

    }

}


// =====================================================
// EXPORT EXCEL (DENGAN REKAP DI BAGIAN ATAS)
// =====================================================

function exportExcel() {

    // 1. CEK LIBRARY XLSX
    if (typeof XLSX === "undefined") {
        alert("Library Excel (XLSX) belum dimuat.");
        console.error("❌ XLSX tidak ditemukan.");
        return;
    }

    // 2. CEK DATA
    if (!Array.isArray(dataAbsensiSekarang) || dataAbsensiSekarang.length === 0) {
        alert("Tidak ada data absensi yang dapat diexport.");
        return;
    }

    // 3. HITUNG REKAP/STATISTIK
    let totalHadir = 0;
    let totalTerlambat = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlpha = 0;

    dataAbsensiSekarang.forEach(item => {
        const status = String(item.status || "alpha").toLowerCase().trim();
        switch (status) {
            case "hadir": totalHadir++; break;
            case "terlambat": totalTerlambat++; break;
            case "izin": totalIzin++; break;
            case "sakit": totalSakit++; break;
            case "alpha": totalAlpha++; break;
        }
    });

    const totalKaryawan = dataAbsensiSekarang.length;

    // 4. SUSUN ARRAY DATA EXCEL (HEADER REKAP + DETAIL)
    const aoaData = [
        // --- BAGIAN JUDUL & REKAP ---
        ["REKAPITULASI ABSENSI KARYAWAN"],
        [""],
        ["STATUS ABSENSI", "JUMLAH"],
        ["Hadir", totalHadir],
        ["Terlambat", totalTerlambat],
        ["Izin", totalIzin],
        ["Sakit", totalSakit],
        ["Alpha", totalAlpha],
        ["Total Data", totalKaryawan],
        [""], // Baris Kosong Pemisah
        [""], // Baris Kosong Pemisah

        // --- BAGIAN HEADER TABEL DETAIL ---
        ["No", "Nama Karyawan", "Nama Cabang", "Tanggal", "Jam Masuk", "Jam Pulang", "Status", "Keterangan"]
    ];

    // --- BAGIAN ISI TABEL DETAIL ---
    dataAbsensiSekarang.forEach((item, index) => {
        aoaData.push([
            index + 1,
            item.nama_karyawan || "-",
            item.nama_cabang || "-",
            item.tanggal || "-",
            item.jam_masuk ? String(item.jam_masuk).substring(0, 5) : "-",
            item.jam_keluar ? String(item.jam_keluar).substring(0, 5) : "-",
            item.status || "-",
            item.keterangan || "-"
        ]);
    });

    // 5. BUAT WORKSHEET DARI ARRAY OF ARRAYS (AOA)
    const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

    // 6. SETTING LEBAR KOLOM UNTUK KERAPIAN
    worksheet["!cols"] = [
        { wch: 6 },  // No
        { wch: 25 }, // Nama Karyawan
        { wch: 30 }, // Nama Cabang
        { wch: 18 }, // Tanggal
        { wch: 15 }, // Jam Masuk
        { wch: 15 }, // Jam Pulang
        { wch: 15 }, // Status
        { wch: 30 }  // Keterangan
    ];

    // 7. BUAT WORKBOOK & SIMPAN FILE
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Absensi");

    // Penentuan Nama Cabang
    let namaCabang = "Semua-Cabang";
    if (filterCabang && filterCabang.value) {
        const selectedOption = filterCabang.options[filterCabang.selectedIndex];
        if (selectedOption) {
            namaCabang = selectedOption.textContent;
        }
    }
    namaCabang = namaCabang.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-");

    // Penentuan Nama Tanggal
    const tanggal = filterAktifTanggal || (filterTanggal ? filterTanggal.value : "");
    const namaTanggal = tanggal || "Semua-Tanggal";

    const namaFile = `Rekap-Absensi-${namaCabang}-${namaTanggal}.xlsx`;

    // Download File
    XLSX.writeFile(workbook, namaFile);
    console.log("✅ Excel dengan rekapan berhasil dibuat:", namaFile);
}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(tanggal) {

    if (!tanggal) {

        return "-";

    }


    const date =
        new Date(
            String(
                tanggal
            ) +
            "T00:00:00"
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return tanggal;

    }


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
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    const value =
        String(
            status || ""
        )
        .toLowerCase()
        .trim();


    if (
        value === "hadir"
    ) {

        return "bg-success";

    }


    if (
        value === "terlambat"
    ) {

        return "bg-warning text-dark";

    }


    if (
        value === "izin"
    ) {

        return "bg-info";

    }


    if (
        value === "sakit"
    ) {

        return "bg-secondary";

    }


    if (
        value === "alpha"
    ) {

        return "bg-danger";

    }


    return "bg-primary";

}


// =====================================================
// EDIT ABSENSI
// =====================================================

function editAbsensi(data) {

    console.log(
        "📝 Membuka modal edit:",
        data
    );


    if (!modalEdit) {

        alert(
            "Modal edit tidak ditemukan."
        );

        return;

    }


    const idAbsensi =
        document.getElementById(
            "edit_id_absensi"
        );


    if (idAbsensi) {

        idAbsensi.value =
            data.id_absensi || "";

    }


    const namaKaryawan =
        document.getElementById(
            "edit_nama_karyawan"
        );


    if (namaKaryawan) {

        namaKaryawan.value =
            data.nama_karyawan || "";

    }


    const namaCabang =
        document.getElementById(
            "edit_nama_cabang"
        );


    if (namaCabang) {

        namaCabang.value =
            data.nama_cabang || "";

    }


    const tanggal =
        document.getElementById(
            "edit_tanggal"
        );


    if (tanggal) {

        tanggal.value =
            data.tanggal || "";

    }


    const jamMasuk =
        document.getElementById(
            "edit_jam_masuk"
        );


    if (jamMasuk) {

        jamMasuk.value =
            data.jam_masuk
                ? String(
                    data.jam_masuk
                ).substring(
                    0,
                    5
                )
                : "";

    }


    const jamKeluar =
        document.getElementById(
            "edit_jam_keluar"
        );


    if (jamKeluar) {

        jamKeluar.value =
            data.jam_keluar
                ? String(
                    data.jam_keluar
                ).substring(
                    0,
                    5
                )
                : "";

    }


    const status =
        document.getElementById(
            "edit_status"
        );


    if (status) {

        status.value =
            data.status || "hadir";

    }


    const keterangan =
        document.getElementById(
            "edit_keterangan"
        );


    if (keterangan) {

        keterangan.value =
            data.keterangan || "";

    }


    modalEdit.show();

}


// =====================================================
// SIMPAN EDIT ABSENSI
// =====================================================

async function simpanEditAbsensi() {

    try {

        const idElement =
            document.getElementById(
                "edit_id_absensi"
            );

        const tanggalElement =
            document.getElementById(
                "edit_tanggal"
            );

        const jamMasukElement =
            document.getElementById(
                "edit_jam_masuk"
            );

        const jamKeluarElement =
            document.getElementById(
                "edit_jam_keluar"
            );

        const statusElement =
            document.getElementById(
                "edit_status"
            );

        const keteranganElement =
            document.getElementById(
                "edit_keterangan"
            );


        if (
            !idElement ||
            !tanggalElement ||
            !statusElement
        ) {

            throw new Error(
                "Form edit absensi tidak lengkap."
            );

        }


        const data = {

            id_absensi:
                parseInt(
                    idElement.value
                ),

            tanggal:
                tanggalElement.value,

            jam_masuk:
                jamMasukElement
                    ? (
                        jamMasukElement.value ||
                        null
                    )
                    : null,

            jam_keluar:
                jamKeluarElement
                    ? (
                        jamKeluarElement.value ||
                        null
                    )
                    : null,

            status:
                statusElement.value
                    .trim(),

            keterangan:
                keteranganElement
                    ? keteranganElement.value.trim()
                    : ""

        };


        if (
            !data.id_absensi
        ) {

            alert(
                "ID absensi tidak ditemukan."
            );

            return;

        }


        if (
            !data.tanggal
        ) {

            alert(
                "Tanggal wajib diisi."
            );

            return;

        }


        if (
            !data.status
        ) {

            alert(
                "Status wajib diisi."
            );

            return;

        }


        console.log(
            "📤 Data edit:",
            data
        );


        const response =
            await fetch(
                `${API_URL}/edit_absensi.php`,
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


        const responseText =
            await response.text();


        console.log(
            "📦 Response edit:",
            responseText
        );


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (error) {

            throw new Error(
                "Server edit tidak mengirim JSON."
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
            "✅ Data absensi berhasil diperbarui."
        );


        if (modalEdit) {

            modalEdit.hide();

        }


        loadAbsensi(
            filterAktifTanggal,
            filterAktifCabang
        );


    } catch (error) {

        console.error(
            "❌ ERROR EDIT ABSENSI:",
            error
        );


        alert(
            "❌ Gagal mengedit absensi: " +
            error.message
        );

    }

}


// =====================================================
// HAPUS ABSENSI
// =====================================================

async function hapusAbsensi(
    id_absensi
) {

    if (!id_absensi) {

        alert(
            "ID absensi tidak ditemukan."
        );

        return;

    }


    const yakin =
        confirm(
            "Apakah kamu yakin ingin menghapus data absensi ini?"
        );


    if (!yakin) {

        return;

    }


    try {

        console.log(
            "🗑️ Menghapus absensi:",
            id_absensi
        );


        const response =
            await fetch(
                `${API_URL}/hapus_absensi.php`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id_absensi:
                                id_absensi
                        })
                }
            );


        const responseText =
            await response.text();


        console.log(
            "📦 Response hapus:",
            responseText
        );


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (error) {

            throw new Error(
                "Server hapus tidak mengirim JSON."
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
            "✅ Data absensi berhasil dihapus."
        );


        loadAbsensi(
            filterAktifTanggal,
            filterAktifCabang
        );


    } catch (error) {

        console.error(
            "❌ ERROR HAPUS ABSENSI:",
            error
        );


        alert(
            "❌ Gagal menghapus absensi: " +
            error.message
        );

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

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