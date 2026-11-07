const API_URL =
    "http://localhost/absensi_backand/api";


/* =========================================================
   TAMPILKAN RIWAYAT ABSENSI
========================================================= */

async function tampilkanRiwayat() {

    const idUser =
        localStorage.getItem("id_user");


    if (!idUser) {

        alert(
            "ID user tidak ditemukan. Silakan login kembali."
        );

        return;

    }


    const tanggalMulaiElement =
        document.getElementById(
            "tanggalMulai"
        );


    const tanggalAkhirElement =
        document.getElementById(
            "tanggalAkhir"
        );


    const tbody =
        document.getElementById(
            "tabelAbsensiBody"
        );


    const status =
        document.getElementById(
            "statusRiwayat"
        );


    if (
        !tanggalMulaiElement ||
        !tanggalAkhirElement ||
        !tbody
    ) {

        console.error(
            "Element riwayat absensi tidak ditemukan."
        );

        return;

    }


    const tanggalMulai =
        tanggalMulaiElement.value;


    const tanggalAkhir =
        tanggalAkhirElement.value;


    /* =====================================================
       VALIDASI TANGGAL
    ===================================================== */

    if (
        !tanggalMulai ||
        !tanggalAkhir
    ) {

        alert(
            "Silakan pilih tanggal mulai dan tanggal akhir."
        );

        return;

    }


    if (
        tanggalMulai >
        tanggalAkhir
    ) {

        alert(
            "Tanggal mulai tidak boleh lebih besar dari tanggal akhir."
        );

        return;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    tbody.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="loading-data"
            >

                <i class="fas fa-spinner fa-spin"></i>

                Memuat data absensi...

            </td>

        </tr>

    `;


    if (status) {

        status.innerHTML = "";

    }


    try {

        /* =================================================
           REQUEST API
        ================================================= */

        const response =
            await fetch(
                `${API_URL}/auth/absensi/riwayat.php`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        id_user:
                            idUser,

                        tanggal_mulai:
                            tanggalMulai,

                        tanggal_akhir:
                            tanggalAkhir

                    })

                }
            );


        /* =================================================
           AMBIL RESPONSE
        ================================================= */

        const responseText =
            await response.text();


        console.log(
            "HTTP STATUS:",
            response.status
        );


        console.log(
            "RESPONSE RIWAYAT:",
            responseText
        );


        /* =================================================
           PARSE JSON
        ================================================= */

        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        }

        catch (error) {

            console.error(
                "Response bukan JSON:",
                responseText
            );

            throw new Error(
                "Response server bukan JSON."
            );

        }


        console.log(
            "HASIL RIWAYAT:",
            result
        );


        /* =================================================
           CEK SUCCESS
        ================================================= */

        if (
            result.success === false ||
            result.status === false
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="error-data"
                    >

                        ❌

                        ${
                            escapeHTML(
                                result.message ||
                                "Gagal mengambil data absensi."
                            )
                        }

                    </td>

                </tr>

            `;

            return;

        }


        /* =================================================
           AMBIL DATA
        ================================================= */

        const data =
            result.data?.absensi ||
            result.absensi ||
            [];


        console.log(
            "DATA ABSENSI:",
            data
        );


        /* =================================================
           DATA KOSONG
        ================================================= */

        if (
            data.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        class="empty-data"
                    >

                        <i class="fas fa-calendar-xmark"></i>

                        Belum ada data absensi
                        pada periode ini.

                    </td>

                </tr>

            `;


            if (status) {

                status.innerHTML =
                    "Belum ada data absensi pada periode yang dipilih.";

            }


            return;

        }


        /* =================================================
           KOSONGKAN TABLE
        ================================================= */

        tbody.innerHTML = "";


        /* =================================================
           TAMPILKAN DATA
        ================================================= */

        data.forEach(
            function(item, index) {


                /* =========================================
                   TANGGAL
                ========================================= */

                const tanggal =
                    formatTanggal(
                        item.tanggal
                    );


                /* =========================================
                   JAM MASUK
                ========================================= */

                const jamMasuk =
                    formatJam(
                        item.jam_masuk
                    );


                /* =========================================
                   JAM PULANG
                ========================================= */

                const jamPulang =
                    formatJam(
                        item.jam_keluar
                    );


                /* =========================================
                   KETERANGAN
                ========================================= */

                const keteranganHTML =
                    buatKeterangan(
                        item
                    );


                /* =========================================
                   CABANG
                ========================================= */

                const cabang =
                    item.nama_cabang ||
                    "-";


                /* =========================================
                   BUAT BARIS
                ========================================= */

                const tr =
                    document.createElement(
                        "tr"
                    );


                tr.innerHTML = `

                    <td class="kolom-no">

                        ${index + 1}

                    </td>


                    <td class="kolom-tanggal">

                        ${tanggal}

                    </td>


                    <td class="kolom-jam">

                        ${jamMasuk}

                    </td>


                    <td class="kolom-jam">

                        ${jamPulang}

                    </td>


                    <td class="kolom-keterangan">

                        ${keteranganHTML}

                    </td>


                    <td class="kolom-cabang">

                        <i class="fas fa-location-dot"></i>

                        ${escapeHTML(cabang)}

                    </td>

                `;


                tbody.appendChild(
                    tr
                );

            }
        );


        /* =================================================
           STATUS JUMLAH DATA
        ================================================= */

        if (status) {

            status.innerHTML = `

                Menampilkan

                <strong>
                    ${data.length}
                </strong>

                data absensi

                dari

                ${formatTanggal(tanggalMulai)}

                sampai

                ${formatTanggal(tanggalAkhir)}.

            `;

        }


    }

    catch (error) {

        console.error(
            "ERROR RIWAYAT:",
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="error-data"
                >

                    ❌ Tidak dapat terhubung ke server.

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


/* =========================================================
   BUAT KETERANGAN ABSENSI
========================================================= */

function buatKeterangan(item) {

    const status =
        String(
            item.status || ""
        )
        .trim()
        .toLowerCase();


    const keterangan =
        String(
            item.keterangan || ""
        )
        .trim()
        .toLowerCase();


    const jenisIzin =
        String(
            item.jenis_izin || ""
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       LIBUR
    ===================================================== */

    if (
        jenisIzin === "libur" ||
        keterangan === "libur" ||
        status === "libur"
    ) {

        return `

            <span class="badge-izin">

                <i class="fas fa-umbrella-beach"></i>

                Libur

            </span>

        `;

    }


    /* =====================================================
       CUTI
    ===================================================== */

    if (
        jenisIzin === "cuti" ||
        keterangan === "cuti" ||
        status === "cuti"
    ) {

        return `

            <span class="badge-izin">

                <i class="fas fa-calendar-days"></i>

                Cuti

            </span>

        `;

    }


    /* =====================================================
       IZIN
    ===================================================== */

    if (
        jenisIzin === "izin" ||
        keterangan === "izin" ||
        status === "izin"
    ) {

        return `

            <span class="badge-izin">

                <i class="fas fa-file-circle-check"></i>

                Izin

            </span>

        `;

    }


    /* =====================================================
       SAKIT
    ===================================================== */

    if (
        jenisIzin === "sakit" ||
        keterangan === "sakit" ||
        status === "sakit"
    ) {

        return `

            <span class="badge-sakit">

                <i class="fas fa-notes-medical"></i>

                Sakit

            </span>

        `;

    }


    /* =====================================================
       HADIR
    ===================================================== */

    if (
        status === "hadir" ||
        keterangan === "hadir"
    ) {

        return `

            <span class="badge-hadir">

                <i class="fas fa-circle-check"></i>

                Hadir

            </span>

        `;

    }


    /* =====================================================
       TERLAMBAT
    ===================================================== */

    if (
        status === "terlambat" ||
        status === "telat" ||
        keterangan === "terlambat" ||
        keterangan === "telat"
    ) {

        return `

            <span class="badge-terlambat">

                <i class="fas fa-clock"></i>

                Terlambat

            </span>

        `;

    }


    /* =====================================================
       TIDAK HADIR
    ===================================================== */

    if (
        status === "tidak hadir" ||
        status === "alpha" ||
        status === "tidak_hadir" ||

        keterangan === "tidak hadir" ||
        keterangan === "alpha" ||

        keterangan ===
            "tidak melakukan absensi masuk"
    ) {

        return `

            <span class="badge-tidak">

                <i class="fas fa-circle-xmark"></i>

                Tidak Hadir

            </span>

        `;

    }


    /* =====================================================
       DEFAULT
    ===================================================== */

    return `

        <span class="keterangan-text">

            -

        </span>

    `;

}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(tanggal) {

    if (!tanggal) {

        return "-";

    }


    const date =
        new Date(
            tanggal + "T00:00:00"
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

            day: "2-digit",

            month: "long",

            year: "numeric"

        }
    );

}


/* =========================================================
   FORMAT JAM
========================================================= */

function formatJam(jam) {

    if (
        !jam ||
        jam === "null" ||
        jam === "NULL" ||
        jam === "0000-00-00 00:00:00"
    ) {

        return "-";

    }


    return String(
        jam
    ).substring(
        0,
        5
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

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


/* =========================================================
   EXPORT EXCEL
========================================================= */

function exportExcel() {

    const table =
        document.getElementById(
            "tabelAbsensi"
        );


    if (!table) {

        alert(
            "Tabel absensi tidak ditemukan."
        );

        return;

    }


    const tbody =
        document.getElementById(
            "tabelAbsensiBody"
        );


    if (!tbody) {

        alert(
            "Data tabel tidak ditemukan."
        );

        return;

    }


    const rows =
        tbody.querySelectorAll(
            "tr"
        );


    if (
        rows.length === 0
    ) {

        alert(
            "Tidak ada data absensi untuk diexport."
        );

        return;

    }


    if (
        rows.length === 1 &&
        rows[0]
            .querySelectorAll("td")
            .length === 1
    ) {

        alert(
            "Tidak ada data absensi untuk diexport."
        );

        return;

    }


    const excel = `

        <html>

        <head>

            <meta charset="UTF-8">

        </head>

        <body>

            ${table.outerHTML}

        </body>

        </html>

    `;


    const blob =
        new Blob(
            [excel],
            {
                type:
                    "application/vnd.ms-excel"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "riwayat_absensi_" +
        new Date()
            .toISOString()
            .slice(0, 10) +
        ".xls";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   SAAT HALAMAN DIBUKA
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

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


        const tanggalMulai =
            `${tahun}-${bulan}-01`;


        const tanggalAkhir =
            `${tahun}-${bulan}-${tanggal}`;


        const inputMulai =
            document.getElementById(
                "tanggalMulai"
            );


        const inputAkhir =
            document.getElementById(
                "tanggalAkhir"
            );


        if (inputMulai) {

            inputMulai.value =
                tanggalMulai;

        }


        if (inputAkhir) {

            inputAkhir.value =
                tanggalAkhir;

        }


        tampilkanRiwayat();

    }
);