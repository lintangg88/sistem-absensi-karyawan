// =====================================================
// REKAP ABSENSI ADMIN - DIMSUM HOKYA
// =====================================================
// File khusus untuk:
// 1. Rekap Per Karyawan
// 2. Rekap Per Bulan
// 3. Rekap Seluruhnya
// 4. Dropdown Karyawan
// 5. Tampilkan Rekap
// 6. Download Rekap Excel
// 7. Perhitungan Jumlah Kehadiran
// 8. Perhitungan Jumlah Jam Kehadiran
// 9. Target Jam Kerja
//
// PENTING:
// File ini TIDAK mengubah fungsi data_absensi_admin.js
// =====================================================

(function () {

    "use strict";


    // =====================================================
    // API
    // =====================================================

    const API_REKAP =
        "http://localhost/absensi_backand/api/auth/admin";


    // =====================================================
    // DATA
    // =====================================================

    let dataRekapSekarang = [];

    let daftarKaryawanRekap = [];


    // =====================================================
    // ELEMENT
    // =====================================================

    let jenisRekap = null;

    let rekapKaryawan = null;

    let rekapBulan = null;

    let wrapperKaryawan = null;

    let wrapperBulan = null;

    let btnTampilkanRekap = null;

    let btnDownloadRekap = null;

    let tableRekapBody = null;

    let infoRekap = null;


    // =====================================================
    // INITIALIZATION
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            console.log(
                "===================================="
            );

            console.log(
                "✅ REKAP ABSENSI ADMIN AKTIF"
            );

            console.log(
                "===================================="
            );


            // =================================================
            // AMBIL ELEMENT
            // =================================================

            jenisRekap =
                document.getElementById(
                    "jenisRekap"
                );

            rekapKaryawan =
                document.getElementById(
                    "rekapKaryawan"
                );

            rekapBulan =
                document.getElementById(
                    "rekapBulan"
                );

            wrapperKaryawan =
                document.getElementById(
                    "wrapperKaryawan"
                );

            wrapperBulan =
                document.getElementById(
                    "wrapperBulan"
                );

            btnTampilkanRekap =
                document.getElementById(
                    "btnTampilkanRekap"
                );

            btnDownloadRekap =
                document.getElementById(
                    "btnDownloadRekap"
                );

            tableRekapBody =
                document.getElementById(
                    "tableRekapBody"
                );

            infoRekap =
                document.getElementById(
                    "infoRekap"
                );


            // =================================================
            // CEK ELEMENT
            // =================================================

            console.log(
                "jenisRekap:",
                jenisRekap
            );

            console.log(
                "rekapKaryawan:",
                rekapKaryawan
            );

            console.log(
                "rekapBulan:",
                rekapBulan
            );

            console.log(
                "btnTampilkanRekap:",
                btnTampilkanRekap
            );

            console.log(
                "btnDownloadRekap:",
                btnDownloadRekap
            );

            console.log(
                "tableRekapBody:",
                tableRekapBody
            );


            if (!jenisRekap) {

                console.error(
                    "❌ Element #jenisRekap tidak ditemukan."
                );

                return;

            }


            if (!tableRekapBody) {

                console.error(
                    "❌ Element #tableRekapBody tidak ditemukan."
                );

                return;

            }


            // =================================================
            // DEFAULT BULAN
            // =================================================

            if (
                rekapBulan &&
                !rekapBulan.value
            ) {

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

                rekapBulan.value =
                    `${tahun}-${bulan}`;

            }


            // =================================================
            // EVENT JENIS REKAP
            // =================================================

            jenisRekap.addEventListener(
                "change",
                function () {

                    ubahTampilanRekap();

                }
            );


            // =================================================
            // EVENT TAMPILKAN
            // =================================================

            if (btnTampilkanRekap) {

                btnTampilkanRekap.addEventListener(
                    "click",
                    function () {

                        tampilkanRekap();

                    }
                );

            }


            // =================================================
            // EVENT DOWNLOAD
            // =================================================

            if (btnDownloadRekap) {

                btnDownloadRekap.addEventListener(
                    "click",
                    function () {

                        downloadRekap();

                    }
                );

            }


            // =================================================
            // TAMPILAN AWAL
            // =================================================

            ubahTampilanRekap();


            // =================================================
            // LOAD KARYAWAN
            // =================================================

            loadDaftarKaryawan();

        }
    );


    // =====================================================
    // UBAH TAMPILAN REKAP
    // =====================================================

    function ubahTampilanRekap() {

        if (!jenisRekap) {

            return;

        }


        const jenis =
            jenisRekap.value;


        // =================================================
        // PER KARYAWAN
        // =================================================

        if (jenis === "karyawan") {

            if (wrapperKaryawan) {

                wrapperKaryawan.style.display =
                    "block";

            }

            if (wrapperBulan) {

                wrapperBulan.style.display =
                    "block";

            }

            if (infoRekap) {

                infoRekap.className =
                    "alert alert-info";

                infoRekap.innerHTML =
                    "Pilih karyawan dan bulan untuk melihat " +
                    "<strong>rekap absensi per karyawan</strong>.";

            }

            return;

        }


        // =================================================
        // PER BULAN
        // =================================================

        if (jenis === "bulan") {

            if (wrapperKaryawan) {

                wrapperKaryawan.style.display =
                    "block";

            }

            if (wrapperBulan) {

                wrapperBulan.style.display =
                    "block";

            }

            if (rekapKaryawan) {

                rekapKaryawan.value = "";

            }

            if (infoRekap) {

                infoRekap.className =
                    "alert alert-info";

                infoRekap.innerHTML =
                    "Pilih bulan untuk melihat " +
                    "<strong>rekap seluruh karyawan dalam satu bulan</strong>.";

            }

            return;

        }


        // =================================================
        // SELURUHNYA
        // =================================================

        if (
            jenis === "semua" ||
            jenis === "seluruhnya"
        ) {

            if (wrapperKaryawan) {

                wrapperKaryawan.style.display =
                    "block";

            }

            /*
             * Bulan tetap ditampilkan.
             *
             * Ini sengaja dipertahankan supaya
             * bulan yang dipilih dapat digunakan
             * sebagai periode target kerja ketika
             * melakukan export Excel.
             */
            if (wrapperBulan) {

                wrapperBulan.style.display =
                    "block";

            }

            if (rekapKaryawan) {

                rekapKaryawan.value = "";

            }

            if (infoRekap) {

                infoRekap.className =
                    "alert alert-info";

                infoRekap.innerHTML =
                    "Menampilkan " +
                    "<strong>seluruh data absensi</strong> " +
                    "yang tersedia.";

            }

        }

    }


    // =====================================================
    // LOAD DAFTAR KARYAWAN
    // =====================================================

    async function loadDaftarKaryawan() {

        if (!rekapKaryawan) {

            return;

        }


        try {

            const url =
                `${API_REKAP}/get_karyawan.php?_=${Date.now()}`;


            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            const text =
                await response.text();


            if (!response.ok) {

                throw new Error(
                    `HTTP Error ${response.status}`
                );

            }


            let result;

            try {

                result =
                    JSON.parse(text);

            } catch (error) {

                console.error(
                    "Response get_karyawan.php:",
                    text
                );

                throw new Error(
                    "Response get_karyawan.php bukan JSON."
                );

            }


            if (!result.success) {

                throw new Error(
                    result.message ||
                    "Gagal mengambil data karyawan."
                );

            }


            const data =
                Array.isArray(result.data)
                    ? result.data
                    : [];


            const mapKaryawan =
                new Map();


            data.forEach(
                function (item) {

                    const id =
                        item.id_karyawan;

                    const nama =
                        item.nama_karyawan;


                    if (
                        id !== null &&
                        id !== undefined &&
                        id !== "" &&
                        nama !== null &&
                        nama !== undefined &&
                        String(nama).trim() !== ""
                    ) {

                        mapKaryawan.set(
                            String(id),
                            {
                                id:
                                    String(id),

                                nama:
                                    String(nama).trim(),

                                id_cabang:
                                    item.id_cabang || "",

                                cabang:
                                    item.nama_cabang || "-"
                            }
                        );

                    }

                }
            );


            daftarKaryawanRekap =
                Array.from(
                    mapKaryawan.values()
                );


            daftarKaryawanRekap.sort(
                function (a, b) {

                    return a.nama.localeCompare(
                        b.nama,
                        "id"
                    );

                }
            );


            // =================================================
            // RESET DROPDOWN
            // =================================================

            rekapKaryawan.innerHTML =
                "";


            const optionSemua =
                document.createElement(
                    "option"
                );

            optionSemua.value =
                "";

            optionSemua.textContent =
                "Semua Karyawan";

            rekapKaryawan.appendChild(
                optionSemua
            );


            // =================================================
            // MASUKKAN KARYAWAN
            // =================================================

            daftarKaryawanRekap.forEach(
                function (karyawan) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        karyawan.id;

                    option.textContent =
                        karyawan.nama;

                    option.dataset.cabang =
                        karyawan.cabang;

                    option.dataset.idCabang =
                        karyawan.id_cabang;

                    rekapKaryawan.appendChild(
                        option
                    );

                }
            );


            console.log(
                "✅ Karyawan berhasil dimuat:",
                daftarKaryawanRekap.length
            );


        } catch (error) {

            console.error(
                "❌ Gagal memuat karyawan:",
                error
            );


            rekapKaryawan.innerHTML = `
                <option value="">
                    Gagal memuat karyawan
                </option>
            `;

        }

    }


    // =====================================================
    // TAMPILKAN REKAP
    // =====================================================

    async function tampilkanRekap() {

        const jenis =
            jenisRekap
                ? jenisRekap.value
                : "semua";


        const idKaryawan =
            rekapKaryawan
                ? rekapKaryawan.value
                : "";


        const bulan =
            rekapBulan
                ? rekapBulan.value
                : "";


        console.log(
            "===================================="
        );

        console.log(
            "📊 MEMBUAT REKAP"
        );

        console.log(
            "Jenis:",
            jenis
        );

        console.log(
            "Karyawan:",
            idKaryawan
        );

        console.log(
            "Bulan:",
            bulan
        );

        console.log(
            "===================================="
        );


        // =================================================
        // VALIDASI KARYAWAN
        // =================================================

        if (
            jenis === "karyawan" &&
            !idKaryawan
        ) {

            alert(
                "Silakan pilih karyawan terlebih dahulu."
            );

            return;

        }


        // =================================================
        // VALIDASI BULAN
        // =================================================

        if (
            (
                jenis === "karyawan" ||
                jenis === "bulan"
            ) &&
            !bulan
        ) {

            alert(
                "Silakan pilih bulan terlebih dahulu."
            );

            return;

        }


        // =================================================
        // LOADING
        // =================================================

        tampilkanLoadingRekap();


        try {

            let data = [];


            // =================================================
            // SELURUH DATA
            // =================================================

            if (
                jenis === "semua" ||
                jenis === "seluruhnya"
            ) {

                data =
                    await ambilSemuaAbsensi();

            }


            // =================================================
            // PER KARYAWAN
            // =================================================

            else if (
                jenis === "karyawan"
            ) {

                data =
                    await ambilAbsensiBulanan(
                        bulan
                    );


                data =
                    data.filter(
                        function (item) {

                            return String(
                                item.id_karyawan
                            ) === String(
                                idKaryawan
                            );

                        }
                    );

            }


            // =================================================
            // PER BULAN
            // =================================================

            else if (
                jenis === "bulan"
            ) {

                data =
                    await ambilAbsensiBulanan(
                        bulan
                    );


                if (idKaryawan) {

                    data =
                        data.filter(
                            function (item) {

                                return String(
                                    item.id_karyawan
                                ) === String(
                                    idKaryawan
                                );

                            }
                        );

                }

            }


            // =================================================
            // SIMPAN DATA
            // =================================================

            dataRekapSekarang =
                Array.isArray(data)
                    ? data
                    : [];


            console.log(
                "Jumlah data:",
                dataRekapSekarang.length
            );


            // =================================================
            // BUAT REKAP
            // =================================================

            const hasil =
                buatDataRekap(
                    dataRekapSekarang
                );
            
            
            // =================================================
            // TAMPILKAN HASIL REKAP DAN GRAFIK
            // =================================================

            tampilkanHasilRekap(hasil);

            // Tampilkan grafik berdasarkan hasil rekap
            tampilkanGrafikRekap(hasil);

            // =================================================
            // INFO
            // =================================================

            updateInfoRekap(
                jenis,
                bulan,
                idKaryawan,
                hasil.length
            );


        } catch (error) {

            console.error(
                "❌ ERROR REKAP:",
                error
            );


            dataRekapSekarang =
                [];


            resetTabelRekap();


            if (infoRekap) {

                infoRekap.className =
                    "alert alert-danger";

                infoRekap.innerHTML =
                    "<strong>Gagal membuat rekap.</strong><br>" +
                    escapeHTML(
                        error.message
                    );

            }

        }

    }


    // =====================================================
    // AMBIL SEMUA ABSENSI
    // =====================================================

    async function ambilSemuaAbsensi() {

        const url =
            `${API_REKAP}/get_absensi.php?_=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        const text =
            await response.text();


        if (!response.ok) {

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        let result;

        try {

            result =
                JSON.parse(text);

        } catch (error) {

            console.error(
                "Response get_absensi.php:",
                text
            );

            throw new Error(
                "Server tidak mengirim JSON."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Gagal mengambil data absensi."
            );

        }


        return Array.isArray(
            result.data
        )
            ? result.data
            : [];

    }


    // =====================================================
    // AMBIL ABSENSI BULANAN
    // =====================================================

    async function ambilAbsensiBulanan(
        bulan
    ) {

        if (!bulan) {

            return [];

        }


        const bagian =
            bulan.split("-");


        const tahun =
            parseInt(
                bagian[0],
                10
            );


        const nomorBulan =
            parseInt(
                bagian[1],
                10
            );


        const jumlahHari =
            new Date(
                tahun,
                nomorBulan,
                0
            ).getDate();


        let semuaData =
            [];


        for (
            let hari = 1;
            hari <= jumlahHari;
            hari++
        ) {

            const tanggal =
                `${tahun}-${String(
                    nomorBulan
                ).padStart(
                    2,
                    "0"
                )}-${String(
                    hari
                ).padStart(
                    2,
                    "0"
                )}`;


            try {

                const dataHari =
                    await ambilAbsensiTanggal(
                        tanggal
                    );


                if (
                    Array.isArray(
                        dataHari
                    )
                ) {

                    semuaData =
                        semuaData.concat(
                            dataHari
                        );

                }


                if (infoRekap) {

                    infoRekap.className =
                        "alert alert-info";

                    infoRekap.innerHTML =
                        `<i class="ti ti-loader"></i>
                         Mengambil data tanggal
                         <strong>${hari}</strong>
                         dari
                         <strong>${jumlahHari}</strong>...`;

                }

            } catch (error) {

                console.warn(
                    "⚠️ Gagal mengambil:",
                    tanggal,
                    error
                );

            }

        }


        return semuaData;

    }


    // =====================================================
    // AMBIL ABSENSI SATU TANGGAL
    // =====================================================

    async function ambilAbsensiTanggal(
        tanggal
    ) {

        const url =
            `${API_REKAP}/get_absensi.php` +
            `?tanggal=${encodeURIComponent(
                tanggal
            )}` +
            `&_=${Date.now()}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        const text =
            await response.text();


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        let result;

        try {

            result =
                JSON.parse(text);

        } catch (error) {

            throw new Error(
                "Response bukan JSON."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Gagal mengambil data tanggal."
            );

        }


        return Array.isArray(
            result.data
        )
            ? result.data
            : [];

    }


    // =====================================================
    // BUAT DATA REKAP
    // =====================================================

    function buatDataRekap(
        data
    ) {

        const map =
            new Map();


        if (
            !Array.isArray(data)
        ) {

            return [];

        }


        data.forEach(
            function (item) {

                const id =
                    item.id_karyawan !== null &&
                    item.id_karyawan !== undefined &&
                    item.id_karyawan !== ""
                        ? String(
                            item.id_karyawan
                        )
                        : "tanpa-id-" +
                          String(
                              item.nama_karyawan ||
                              "Tidak diketahui"
                          );


                if (
                    !map.has(id)
                ) {

                    map.set(
                        id,
                        {
                            id_karyawan:
                                item.id_karyawan,

                            nama_karyawan:
                                item.nama_karyawan ||
                                "-",

                            nama_cabang:
                                item.nama_cabang ||
                                "-",

                            hadir:
                                0,

                            terlambat:
                                0,

                            izin:
                                0,

                            sakit:
                                0,

                            alpha:
                                0
                        }
                    );

                }


                const rekap =
                    map.get(id);


                const status =
                    String(
                        item.status ||
                        "alpha"
                    )
                    .toLowerCase()
                    .trim();


                // =========================================
                // HADIR
                // =========================================

                if (
                    status === "hadir"
                ) {

                    rekap.hadir++;

                }


                // =========================================
                // TERLAMBAT
                // =========================================

                else if (
                    status === "terlambat"
                ) {

                    rekap.terlambat++;

                }


                // =========================================
                // IZIN
                // =========================================

                else if (
                    status === "izin"
                ) {

                    rekap.izin++;

                }


                // =========================================
                // SAKIT
                // =========================================

                else if (
                    status === "sakit"
                ) {

                    rekap.sakit++;

                }


                // =========================================
                // ALPHA
                // =========================================

                else if (
                    status === "alpha"
                ) {

                    rekap.alpha++;

                }

            }
        );


        const hasil =
            Array.from(
                map.values()
            );


        hasil.forEach(
            function (item) {

                item.total =
                    Number(
                        item.hadir || 0
                    ) +
                    Number(
                        item.terlambat || 0
                    ) +
                    Number(
                        item.izin || 0
                    ) +
                    Number(
                        item.sakit || 0
                    ) +
                    Number(
                        item.alpha || 0
                    );

            }
        );


        hasil.sort(
            function (a, b) {

                return String(
                    a.nama_karyawan
                ).localeCompare(
                    String(
                        b.nama_karyawan
                    ),
                    "id"
                );

            }
        );


        return hasil;

    }


    // =====================================================
    // TAMPILKAN HASIL REKAP
    // =====================================================

    function tampilkanHasilRekap(
        hasil
    ) {

        if (!tableRekapBody) {

            return;

        }


        tableRekapBody.innerHTML =
            "";


        if (
            !Array.isArray(hasil) ||
            hasil.length === 0
        ) {

            tableRekapBody.innerHTML = `
                <tr>
                    <td
                        colspan="9"
                        class="text-center text-muted py-4">

                        Tidak ada data rekap.

                    </td>
                </tr>
            `;


            resetTotalRekap();

            return;

        }


        let totalHadir =
            0;

        let totalTerlambat =
            0;

        let totalIzin =
            0;

        let totalSakit =
            0;

        let totalAlpha =
            0;

        let totalSemua =
            0;


        hasil.forEach(
            function (item, index) {

                totalHadir +=
                    Number(
                        item.hadir || 0
                    );

                totalTerlambat +=
                    Number(
                        item.terlambat || 0
                    );

                totalIzin +=
                    Number(
                        item.izin || 0
                    );

                totalSakit +=
                    Number(
                        item.sakit || 0
                    );

                totalAlpha +=
                    Number(
                        item.alpha || 0
                    );

                totalSemua +=
                    Number(
                        item.total || 0
                    );


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
                            item.nama_karyawan
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.nama_cabang
                        )}
                    </td>

                    <td class="text-center">
                        <span class="badge bg-success">
                            ${item.hadir}
                        </span>
                    </td>

                    <td class="text-center">
                        <span class="badge bg-warning text-dark">
                            ${item.terlambat}
                        </span>
                    </td>

                    <td class="text-center">
                        <span class="badge bg-info">
                            ${item.izin}
                        </span>
                    </td>

                    <td class="text-center">
                        <span class="badge bg-secondary">
                            ${item.sakit}
                        </span>
                    </td>

                    <td class="text-center">
                        <span class="badge bg-danger">
                            ${item.alpha}
                        </span>
                    </td>

                    <td class="text-center fw-bold">
                        ${item.total}
                    </td>

                `;


                tableRekapBody.appendChild(
                    tr
                );

            }
        );


        setText(
            "rekapTotalHadir",
            totalHadir
        );

        setText(
            "rekapTotalTerlambat",
            totalTerlambat
        );

        setText(
            "rekapTotalIzin",
            totalIzin
        );

        setText(
            "rekapTotalSakit",
            totalSakit
        );

        setText(
            "rekapTotalAlpha",
            totalAlpha
        );

        setText(
            "rekapTotalSemua",
            totalSemua
        );

    }


    // =====================================================
    // LOADING
    // =====================================================

    function tampilkanLoadingRekap() {

        if (!tableRekapBody) {

            return;

        }


        tableRekapBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="text-center py-4">

                    <div
                        class="spinner-border spinner-border-sm text-primary me-2">
                    </div>

                    Menyiapkan data rekap...

                </td>
            </tr>
        `;

    }


    // =====================================================
    // RESET TABLE
    // =====================================================

    function resetTabelRekap() {

        if (!tableRekapBody) {

            return;

        }


        tableRekapBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="text-center text-muted">

                    Belum ada rekap.

                </td>
            </tr>
        `;


        resetTotalRekap();

    }


    // =====================================================
    // RESET TOTAL
    // =====================================================

    function resetTotalRekap() {

        setText(
            "rekapTotalHadir",
            0
        );

        setText(
            "rekapTotalTerlambat",
            0
        );

        setText(
            "rekapTotalIzin",
            0
        );

        setText(
            "rekapTotalSakit",
            0
        );

        setText(
            "rekapTotalAlpha",
            0
        );

        setText(
            "rekapTotalSemua",
            0
        );

    }


    // =====================================================
    // INFO REKAP
    // =====================================================

    function updateInfoRekap(
        jenis,
        bulan,
        idKaryawan,
        jumlah
    ) {

        if (!infoRekap) {

            return;

        }


        infoRekap.className =
            "alert alert-success";


        let teks =
            "<strong>Rekap berhasil dibuat.</strong><br>";


        if (bulan) {

            const parts =
                bulan.split("-");


            const tahun =
                parseInt(
                    parts[0],
                    10
                );


            const nomorBulan =
                parseInt(
                    parts[1],
                    10
                );


            const namaBulan =
                new Date(
                    tahun,
                    nomorBulan - 1,
                    1
                ).toLocaleDateString(
                    "id-ID",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );


            teks +=
                "Periode: <strong>" +
                escapeHTML(
                    namaBulan
                ) +
                "</strong><br>";

        }


        if (idKaryawan) {

            const selected =
                rekapKaryawan
                    ? rekapKaryawan.options[
                        rekapKaryawan.selectedIndex
                    ]
                    : null;


            if (selected) {

                teks +=
                    "Karyawan: <strong>" +
                    escapeHTML(
                        selected.textContent
                    ) +
                    "</strong><br>";

            }

        }


        teks +=
            "Jumlah karyawan dalam rekap: " +
            "<strong>" +
            jumlah +
            "</strong>";


        infoRekap.innerHTML =
            teks;

    }


    // =====================================================
    // DOWNLOAD REKAP EXCEL
    // =====================================================

    async function downloadRekap() {

        console.log(
            "===================================="
        );

        console.log(
            "📥 DOWNLOAD REKAP EXCEL"
        );

        console.log(
            "===================================="
        );


        // =================================================
        // CEK XLSX
        // =================================================

        if (
            typeof XLSX === "undefined"
        ) {

            alert(
                "Library Excel (XLSX) belum tersedia."
            );

            return;

        }


        // =================================================
        // CEK DATA
        // =================================================

        if (
            !Array.isArray(
                dataRekapSekarang
            ) ||
            dataRekapSekarang.length === 0
        ) {

            alert(
                "Silakan tampilkan rekap terlebih dahulu."
            );

            return;

        }


        try {

            // =============================================
            // BUAT HASIL REKAP
            // =============================================

            const hasil =
                buatDataRekap(
                    dataRekapSekarang
                );


            if (
                !hasil.length
            ) {

                alert(
                    "Tidak ada data rekap yang dapat didownload."
                );

                return;

            }


            // =============================================
            // TARGET KERJA
            // =============================================

            const targetKerja =
                await ambilTargetKerjaUntukExport();


            // =============================================
            // PERIODE
            // =============================================

            const periode =
                ambilPeriodeExport();


            // =============================================
            // LAPORAN UTAMA
            // =============================================

            const laporan =
                hasil.map(
                    function (item, index) {

                        const target =
                            cariTargetKerja(
                                targetKerja,
                                item.id_karyawan,
                                periode
                            );


                        const statistik =
                            hitungStatistikExport(
                                item,
                                target
                            );


                        return {

                            "No":
                                index + 1,

                            "Nama Karyawan":
                                item.nama_karyawan ||
                                "-",

                            "Cabang":
                                item.nama_cabang ||
                                "-",

                            "Hari Efektif":
                                statistik.hariEfektif,

                            "Tepat Waktu":
                                statistik.tepatWaktu,

                            "Terlambat":
                                statistik.terlambat,

                            "Sesuai Jadwal":
                                statistik.sesuaiJadwal,

                            "Sakit":
                                statistik.sakit,

                            "Ijin":
                                statistik.izin,

                            "Alpha":
                                statistik.alpha,

                            "Tugas":
                                statistik.tugas,

                            "Jumlah Kehadiran":
                                statistik.jumlahKehadiran,

                            "Jumlah Jam Kehadiran":
                                statistik.jumlahJamKehadiran,

                            "Jumlah Minimum Jam Kehadiran":
                                statistik.jumlahMinimumJamKehadiran,

                            "% Kehadiran":
                                statistik.persentaseKehadiran,

                            "% Jumlah Jam Kehadiran":
                                statistik.persentaseJamKehadiran

                        };

                    }
                );


            // =============================================
            // TOTAL
            // =============================================

            const total = {

                "No":
                    "",

                "Nama Karyawan":
                    "TOTAL",

                "Cabang":
                    "",

                "Hari Efektif":
                    jumlahkanLaporan(
                        laporan,
                        "Hari Efektif"
                    ),

                "Tepat Waktu":
                    jumlahkanLaporan(
                        laporan,
                        "Tepat Waktu"
                    ),

                "Terlambat":
                    jumlahkanLaporan(
                        laporan,
                        "Terlambat"
                    ),

                "Sesuai Jadwal":
                    jumlahkanLaporan(
                        laporan,
                        "Sesuai Jadwal"
                    ),

                "Sakit":
                    jumlahkanLaporan(
                        laporan,
                        "Sakit"
                    ),

                "Ijin":
                    jumlahkanLaporan(
                        laporan,
                        "Ijin"
                    ),

                "Alpha":
                    jumlahkanLaporan(
                        laporan,
                        "Alpha"
                    ),

                "Tugas":
                    jumlahkanLaporan(
                        laporan,
                        "Tugas"
                    ),

                "Jumlah Kehadiran":
                    jumlahkanLaporan(
                        laporan,
                        "Jumlah Kehadiran"
                    ),

                "Jumlah Jam Kehadiran":
                    bulatkan2(
                        jumlahkanLaporan(
                            laporan,
                            "Jumlah Jam Kehadiran"
                        )
                    ),

                "Jumlah Minimum Jam Kehadiran":
                    bulatkan2(
                        jumlahkanLaporan(
                            laporan,
                            "Jumlah Minimum Jam Kehadiran"
                        )
                    ),

                "% Kehadiran":
                    hitungPersentaseTotalKehadiran(
                        laporan
                    ),

                "% Jumlah Jam Kehadiran":
                    hitungPersentaseTotalJam(
                        laporan
                    )

            };


            // =============================================
            // SHEET 1 - REKAP ABSENSI
            // =============================================

            const dataUtama = [

                [
                    "REKAP ABSENSI KARYAWAN"
                ],

                [
                    periode.label
                ],

                [],

                Object.keys(
                    laporan[0]
                ),

                ...laporan.map(
                    function (row) {

                        return Object.keys(
                            laporan[0]
                        ).map(
                            function (key) {

                                return row[key];

                            }
                        );

                    }
                ),

                Object.keys(
                    total
                ).map(
                    function (key) {

                        return total[key];

                    }
                )

            ];


            const worksheetRekap =
                XLSX.utils.aoa_to_sheet(
                    dataUtama
                );


            worksheetRekap["!merges"] = [

                {
                    s: {
                        r: 0,
                        c: 0
                    },
                    e: {
                        r: 0,
                        c: 15
                    }
                },

                {
                    s: {
                        r: 1,
                        c: 0
                    },
                    e: {
                        r: 1,
                        c: 15
                    }
                }

            ];


            worksheetRekap["!cols"] = [

                {
                    wch: 6
                },

                {
                    wch: 25
                },

                {
                    wch: 24
                },

                {
                    wch: 14
                },

                {
                    wch: 13
                },

                {
                    wch: 13
                },

                {
                    wch: 15
                },

                {
                    wch: 10
                },

                {
                    wch: 10
                },

                {
                    wch: 10
                },

                {
                    wch: 10
                },

                {
                    wch: 18
                },

                {
                    wch: 23
                },

                {
                    wch: 29
                },

                {
                    wch: 15
                },

                {
                    wch: 23
                }

            ];


            // =============================================
            // FORMAT PERSENTASE
            // =============================================

            formatSheetExcel(
                worksheetRekap,
                4,
                laporan.length + 4,
                14,
                "0.00%"
            );


            formatSheetExcel(
                worksheetRekap,
                4,
                laporan.length + 4,
                15,
                "0.00%"
            );


            formatSheetExcel(
                worksheetRekap,
                4,
                laporan.length + 4,
                12,
                "0.00"
            );


            formatSheetExcel(
                worksheetRekap,
                4,
                laporan.length + 4,
                13,
                "0.00"
            );


            // =============================================
            // SHEET 2 - RINGKASAN
            // =============================================

            const tingkatAbsensi =
                hitungTingkatAbsensi(
                    laporan
                );


            const rataKehadiran =
                hitungRataRataPersentase(
                    laporan,
                    "% Kehadiran"
                );


            const rataJam =
                hitungRataRataPersentase(
                    laporan,
                    "% Jumlah Jam Kehadiran"
                );


            const dataRingkasan = [

                [
                    "RINGKASAN ABSENSI"
                ],

                [
                    periode.label
                ],

                [],

                [
                    "Keterangan",
                    "Nilai"
                ],

                [
                    "Tingkat Absensi",
                    tingkatAbsensi
                ],

                [
                    "Rata-rata % Kehadiran",
                    rataKehadiran
                ],

                [
                    "Rata-rata % Jumlah Jam Kehadiran",
                    rataJam
                ],

                [
                    "Jumlah Karyawan",
                    laporan.length
                ],

                [
                    "Total Kehadiran",
                    total["Jumlah Kehadiran"]
                ],

                [
                    "Total Jam Kehadiran",
                    total["Jumlah Jam Kehadiran"]
                ],

                [
                    "Total Minimum Jam Kehadiran",
                    total["Jumlah Minimum Jam Kehadiran"]
                ]

            ];


            const worksheetRingkasan =
                XLSX.utils.aoa_to_sheet(
                    dataRingkasan
                );


            worksheetRingkasan["!merges"] = [

                {
                    s: {
                        r: 0,
                        c: 0
                    },
                    e: {
                        r: 0,
                        c: 1
                    }
                },

                {
                    s: {
                        r: 1,
                        c: 0
                    },
                    e: {
                        r: 1,
                        c: 1
                    }
                }

            ];


            worksheetRingkasan["!cols"] = [

                {
                    wch: 38
                },

                {
                    wch: 22
                }

            ];


            formatSheetExcel(
                worksheetRingkasan,
                4,
                6,
                1,
                "0.00%"
            );


            // =============================================
            // SHEET 3 - DATA GRAFIK
            // =============================================

            const dataGrafik = [

                [
                    "Nama Karyawan",
                    "Jumlah Jam Kehadiran",
                    "Jumlah Minimum Jam Kehadiran"
                ]

            ];


            laporan.forEach(
                function (item) {

                    dataGrafik.push(

                        [

                            item[
                                "Nama Karyawan"
                            ],

                            Number(
                                item[
                                    "Jumlah Jam Kehadiran"
                                ] || 0
                            ),

                            Number(
                                item[
                                    "Jumlah Minimum Jam Kehadiran"
                                ] || 0
                            )

                        ]

                    );

                }
            );


            const worksheetGrafik =
                XLSX.utils.aoa_to_sheet(
                    dataGrafik
                );


            worksheetGrafik["!cols"] = [

                {
                    wch: 28
                },

                {
                    wch: 25
                },

                {
                    wch: 31
                }

            ];


            // =============================================
            // SHEET 4 - DETAIL ABSENSI
            // =============================================

            const dataDetailExcel =
                dataRekapSekarang.map(
                    function (item, index) {

                        return {

                            "No":
                                index + 1,

                            "Nama Karyawan":
                                item.nama_karyawan ||
                                "-",

                            "NIK":
                                item.nik ||
                                "-",

                            "Cabang":
                                item.nama_cabang ||
                                "-",

                            "Tanggal":
                                item.tanggal ||
                                "-",

                            "Jam Masuk":
                                item.jam_masuk
                                    ? String(
                                        item.jam_masuk
                                    ).substring(
                                        0,
                                        5
                                    )
                                    : "-",

                            "Jam Pulang":
                                item.jam_keluar
                                    ? String(
                                        item.jam_keluar
                                    ).substring(
                                        0,
                                        5
                                    )
                                    : "-",

                            "Status":
                                item.status ||
                                "-",

                            "Keterangan":
                                item.keterangan ||
                                "-"

                        };

                    }
                );


            const worksheetDetail =
                XLSX.utils.json_to_sheet(
                    dataDetailExcel
                );


            worksheetDetail["!cols"] = [

                {
                    wch: 6
                },

                {
                    wch: 25
                },

                {
                    wch: 15
                },

                {
                    wch: 24
                },

                {
                    wch: 18
                },

                {
                    wch: 15
                },

                {
                    wch: 15
                },

                {
                    wch: 15
                },

                {
                    wch: 35
                }

            ];


            // =============================================
            // BUAT WORKBOOK
            // =============================================

            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheetRekap,
                "Rekap Absensi"
            );


            XLSX.utils.book_append_sheet(
                workbook,
                worksheetRingkasan,
                "Ringkasan"
            );


            XLSX.utils.book_append_sheet(
                workbook,
                worksheetGrafik,
                "Data Grafik"
            );


            XLSX.utils.book_append_sheet(
                workbook,
                worksheetDetail,
                "Detail Absensi"
            );


            // =============================================
            // NAMA FILE
            // =============================================

            const jenis =
                jenisRekap
                    ? jenisRekap.value
                    : "semua";


            const bulan =
                rekapBulan
                    ? rekapBulan.value
                    : "";


            const idKaryawan =
                rekapKaryawan
                    ? rekapKaryawan.value
                    : "";


            let namaFile =
                "Rekap-Absensi";


            if (
                jenis === "karyawan"
            ) {

                const selected =
                    rekapKaryawan
                        ? rekapKaryawan.options[
                            rekapKaryawan.selectedIndex
                        ]
                        : null;


                const nama =
                    selected
                        ? selected.textContent
                        : "Karyawan";


                namaFile +=
                    "-Per-Karyawan-" +
                    bersihkanNamaFile(
                        nama
                    );

            }


            else if (
                jenis === "bulan"
            ) {

                namaFile +=
                    "-Per-Bulan-" +
                    (
                        bulan ||
                        "Semua-Bulan"
                    );


                if (idKaryawan) {

                    const selected =
                        rekapKaryawan
                            ? rekapKaryawan.options[
                                rekapKaryawan.selectedIndex
                            ]
                            : null;


                    if (selected) {

                        namaFile +=
                            "-" +
                            bersihkanNamaFile(
                                selected.textContent
                            );

                    }

                }

            }


            else {

                namaFile +=
                    "-Seluruhnya";

            }


            namaFile +=
                ".xlsx";


            // =============================================
            // DOWNLOAD
            // =============================================

            XLSX.writeFile(
                workbook,
                namaFile
            );


            console.log(
                "✅ Excel berhasil dibuat:",
                namaFile
            );


            alert(
                "Rekap Excel berhasil didownload."
            );


        } catch (error) {

            console.error(
                "❌ ERROR DOWNLOAD EXCEL:",
                error
            );


            alert(
                "Gagal membuat file Excel:\n" +
                (
                    error.message ||
                    error
                )
            );

        }

    }


    // =====================================================
    // AMBIL TARGET KERJA
    // =====================================================

    async function ambilTargetKerjaUntukExport() {

        const url =
            `${API_REKAP}/get_target_kerja.php?_=${Date.now()}`;


        try {

            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const text =
                await response.text();


            let result;


            try {

                result =
                    JSON.parse(text);

            } catch (error) {

                console.warn(
                    "⚠️ Target kerja bukan JSON."
                );

                return [];

            }


            if (
                !response.ok ||
                !result.success
            ) {

                console.warn(
                    "⚠️ Target kerja tidak tersedia:",
                    result.message ||
                    response.status
                );

                return [];

            }


            return Array.isArray(
                result.data
            )
                ? result.data
                : [];


        } catch (error) {

            console.warn(
                "⚠️ Tidak dapat mengambil target kerja:",
                error
            );

            return [];

        }

    }


    // =====================================================
    // PERIODE EXPORT
    // =====================================================

    function ambilPeriodeExport() {

        const bulanInput =
            rekapBulan
                ? rekapBulan.value
                : "";


        if (bulanInput) {

            const bagian =
                bulanInput.split("-");


            const tahun =
                parseInt(
                    bagian[0],
                    10
                );


            const bulan =
                parseInt(
                    bagian[1],
                    10
                );


            const namaBulan =
                new Date(
                    tahun,
                    bulan - 1,
                    1
                ).toLocaleDateString(
                    "id-ID",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );


            return {

                tahun:
                    tahun,

                bulan:
                    bulan,

                value:
                    bulanInput,

                label:
                    "Periode: " +
                    namaBulan

            };

        }


        // =============================================
        // JIKA BULAN KOSONG
        // =============================================

        const item =
            Array.isArray(
                dataRekapSekarang
            ) &&
            dataRekapSekarang.length > 0
                ? dataRekapSekarang[0]
                : null;


        if (
            item &&
            item.tanggal
        ) {

            const tanggal =
                String(
                    item.tanggal
                ).substring(
                    0,
                    7
                );


            const bagian =
                tanggal.split("-");


            const tahun =
                parseInt(
                    bagian[0],
                    10
                );


            const bulan =
                parseInt(
                    bagian[1],
                    10
                );


            if (
                !isNaN(tahun) &&
                !isNaN(bulan)
            ) {

                return {

                    tahun:
                        tahun,

                    bulan:
                        bulan,

                    value:
                        tanggal,

                    label:
                        "Periode: " +
                        new Date(
                            tahun,
                            bulan - 1,
                            1
                        ).toLocaleDateString(
                            "id-ID",
                            {
                                month: "long",
                                year: "numeric"
                            }
                        )

                };

            }

        }


        return {

            tahun:
                null,

            bulan:
                null,

            value:
                "",

            label:
                "Periode: seluruh data"

        };

    }


    // =====================================================
    // CARI TARGET KERJA
    // =====================================================

    function cariTargetKerja(
        daftarTarget,
        idKaryawan,
        periode
    ) {

        if (
            !Array.isArray(
                daftarTarget
            )
        ) {

            return null;

        }


        const id =
            String(
                idKaryawan ?? ""
            );


        // =============================================
        // CARI SESUAI:
        // KARYAWAN + BULAN + TAHUN
        // =============================================

        let target =
            daftarTarget.find(
                function (item) {

                    return (
                        String(
                            item.karyawan_id ??
                            ""
                        ) === id
                    ) &&
                    Number(
                        item.bulan
                    ) === Number(
                        periode.bulan
                    ) &&
                    Number(
                        item.tahun
                    ) === Number(
                        periode.tahun
                    );

                }
            );


        // =============================================
        // JIKA PERIODE TIDAK ADA
        // =============================================

        if (
            !target &&
            (
                !periode.bulan ||
                !periode.tahun
            )
        ) {

            target =
                daftarTarget.find(
                    function (item) {

                        return String(
                            item.karyawan_id ??
                            ""
                        ) === id;

                    }
                );

        }


        return target || null;

    }


    // =====================================================
    // HITUNG STATISTIK EXPORT
    // =====================================================

    function hitungStatistikExport(
        item,
        target
    ) {

        const hadir =
            Number(
                item.hadir || 0
            );


        const terlambat =
            Number(
                item.terlambat || 0
            );


        const izin =
            Number(
                item.izin || 0
            );


        const sakit =
            Number(
                item.sakit || 0
            );


        const alpha =
            Number(
                item.alpha || 0
            );


        // =============================================
        // SESUAI SCREENSHOT / FORMAT REKAP
        // =============================================

        const tepatWaktu =
            hadir;


        const sesuaiJadwal =
            hadir;


        /*
         * Belum ada status "tugas"
         * pada data absensi yang digunakan.
         * Jadi tidak dibuat-buat.
         */
        const tugas =
            0;


        // =============================================
        // TARGET KERJA
        // =============================================

        const hariEfektif =
            target
                ? Number(
                    target.hari_efektif || 0
                )
                : 0;


        const minimumJam =
            target
                ? Number(
                    target.min_jam_kerja || 0
                )
                : 0;


        // =============================================
        // JUMLAH KEHADIRAN
        // =============================================

        const jumlahKehadiran =
            tepatWaktu +
            terlambat;


        // =============================================
        // JUMLAH JAM KEHADIRAN
        // =============================================

        let jumlahJamKehadiran =
            0;


        dataRekapSekarang.forEach(
            function (row) {

                if (
                    String(
                        row.id_karyawan ?? ""
                    ) !==
                    String(
                        item.id_karyawan ?? ""
                    )
                ) {

                    return;

                }


                // -----------------------------------------
                // Jika bulan dipilih,
                // hanya hitung bulan tersebut.
                // -----------------------------------------

                if (
                    rekapBulan &&
                    rekapBulan.value &&
                    row.tanggal
                ) {

                    const bulanRow =
                        String(
                            row.tanggal
                        ).substring(
                            0,
                            7
                        );


                    if (
                        bulanRow !==
                        rekapBulan.value
                    ) {

                        return;

                    }

                }


                jumlahJamKehadiran +=
                    hitungDurasiJam(
                        row.jam_masuk,
                        row.jam_keluar
                    );

            }
        );


        // =============================================
        // PERSENTASE KEHADIRAN
        // =============================================

        let persentaseKehadiran =
            0;


        if (
            hariEfektif > 0
        ) {

            persentaseKehadiran =
                jumlahKehadiran /
                hariEfektif;


            if (
                persentaseKehadiran > 1
            ) {

                persentaseKehadiran =
                    1;

            }

        }


        // =============================================
        // PERSENTASE JAM
        // =============================================

        let persentaseJamKehadiran =
            0;


        if (
            minimumJam > 0
        ) {

            persentaseJamKehadiran =
                jumlahJamKehadiran /
                minimumJam;


            if (
                persentaseJamKehadiran > 1
            ) {

                persentaseJamKehadiran =
                    1;

            }

        }


        return {

            hariEfektif:
                hariEfektif,

            tepatWaktu:
                tepatWaktu,

            terlambat:
                terlambat,

            sesuaiJadwal:
                sesuaiJadwal,

            sakit:
                sakit,

            izin:
                izin,

            alpha:
                alpha,

            tugas:
                tugas,

            jumlahKehadiran:
                jumlahKehadiran,

            jumlahJamKehadiran:
                bulatkan2(
                    jumlahJamKehadiran
                ),

            jumlahMinimumJamKehadiran:
                bulatkan2(
                    minimumJam
                ),

            persentaseKehadiran:
                persentaseKehadiran,

            persentaseJamKehadiran:
                persentaseJamKehadiran

        };

    }


    // =====================================================
    // HITUNG DURASI JAM
    // =====================================================

    function hitungDurasiJam(
        jamMasuk,
        jamKeluar
    ) {

        if (
            !jamMasuk ||
            !jamKeluar
        ) {

            return 0;

        }


        const masuk =
            parseWaktuKeMenit(
                jamMasuk
            );


        const keluar =
            parseWaktuKeMenit(
                jamKeluar
            );


        if (
            masuk === null ||
            keluar === null
        ) {

            return 0;

        }


        let selisih =
            keluar -
            masuk;


        // Shift melewati tengah malam
        if (
            selisih < 0
        ) {

            selisih +=
                24 * 60;

        }


        return (
            selisih / 60
        );

    }


    // =====================================================
    // PARSE WAKTU
    // =====================================================

    function parseWaktuKeMenit(
        value
    ) {

        const text =
            String(
                value || ""
            ).trim();


        const bagian =
            text.split(":");


        if (
            bagian.length < 2
        ) {

            return null;

        }


        const jam =
            parseInt(
                bagian[0],
                10
            );


        const menit =
            parseInt(
                bagian[1],
                10
            );


        if (
            isNaN(jam) ||
            isNaN(menit) ||
            jam < 0 ||
            jam > 23 ||
            menit < 0 ||
            menit > 59
        ) {

            return null;

        }


        return (
            jam * 60
        ) + menit;

    }


    // =====================================================
    // JUMLAHKAN LAPORAN
    // =====================================================

    function jumlahkanLaporan(
        laporan,
        key
    ) {

        return laporan.reduce(
            function (
                total,
                item
            ) {

                return (
                    total +
                    Number(
                        item[key] || 0
                    )
                );

            },
            0
        );

    }


    // =====================================================
    // BULATKAN 2 ANGKA
    // =====================================================

    function bulatkan2(
        value
    ) {

        return Math.round(
            (
                Number(
                    value
                ) || 0
            ) * 100
        ) / 100;

    }


    // =====================================================
    // PERSENTASE TOTAL KEHADIRAN
    // =====================================================

    function hitungPersentaseTotalKehadiran(
        laporan
    ) {

        const totalEfektif =
            jumlahkanLaporan(
                laporan,
                "Hari Efektif"
            );


        const totalHadir =
            jumlahkanLaporan(
                laporan,
                "Jumlah Kehadiran"
            );


        if (
            totalEfektif <= 0
        ) {

            return 0;

        }


        return Math.min(
            totalHadir /
            totalEfektif,
            1
        );

    }


    // =====================================================
    // PERSENTASE TOTAL JAM
    // =====================================================

    function hitungPersentaseTotalJam(
        laporan
    ) {

        const totalJam =
            jumlahkanLaporan(
                laporan,
                "Jumlah Jam Kehadiran"
            );


        const totalMinimum =
            jumlahkanLaporan(
                laporan,
                "Jumlah Minimum Jam Kehadiran"
            );


        if (
            totalMinimum <= 0
        ) {

            return 0;

        }


        return Math.min(
            totalJam /
            totalMinimum,
            1
        );

    }


    // =====================================================
    // RATA-RATA PERSENTASE
    // =====================================================

    function hitungRataRataPersentase(
        laporan,
        key
    ) {

        if (
            !laporan.length
        ) {

            return 0;

        }


        const total =
            laporan.reduce(
                function (
                    sum,
                    item
                ) {

                    return (
                        sum +
                        Number(
                            item[key] || 0
                        )
                    );

                },
                0
            );


        return (
            total /
            laporan.length
        );

    }


    // =====================================================
    // TINGKAT ABSENSI
    // =====================================================

    function hitungTingkatAbsensi(
        laporan
    ) {

        const efektif =
            jumlahkanLaporan(
                laporan,
                "Hari Efektif"
            );


        const hadir =
            jumlahkanLaporan(
                laporan,
                "Jumlah Kehadiran"
            );


        if (
            efektif <= 0
        ) {

            return 0;

        }


        return Math.min(
            hadir /
            efektif,
            1
        );

    }


    // =====================================================
    // FORMAT EXCEL
    // =====================================================

    function formatSheetExcel(
        worksheet,
        startRow,
        endRow,
        col,
        format
    ) {

        for (
            let row = startRow;
            row <= endRow;
            row++
        ) {

            const cell =
                worksheet[
                    XLSX.utils.encode_cell(
                        {
                            r: row,
                            c: col
                        }
                    )
                ];


            if (cell) {

                cell.z =
                    format;

            }

        }

    }


    // =====================================================
    // BERSIHKAN NAMA FILE
    // =====================================================

    function bersihkanNamaFile(
        value
    ) {

        return String(
            value || ""
        )
        .replace(
            /[^a-zA-Z0-9-_ ]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
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

        }

    }


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


        return String(
            value
        )

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
    // GRAFIK REKAP PRESENSI
    // =====================================================

    let chartRekapAbsensi = null;

    function tampilkanGrafikRekap(hasil) {
        const canvas = document.getElementById("chartRekapAbsensi");

        if (!canvas) {
            console.warn(
                "Canvas grafik tidak ditemukan. Pastikan HTML memiliki id='chartRekapAbsensi'."
            );
            return;
        }

        if (typeof Chart === "undefined") {
            console.error(
                "Chart.js belum dimuat. Periksa script Chart.js pada file HTML."
            );
            return;
        }

        // Hapus grafik sebelumnya agar tidak bertumpuk
        if (chartRekapAbsensi) {
            chartRekapAbsensi.destroy();
            chartRekapAbsensi = null;
        }

        // Nilai awal seluruh status presensi
        const total = {
            hadir: 0,
            terlambat: 0,
            izin: 0,
            sakit: 0,
            alpha: 0
        };

        // Hitung data dari hasil rekap yang sedang ditampilkan
        if (Array.isArray(hasil)) {
            hasil.forEach(function (item) {
                total.hadir += Number(item.hadir || 0);
                total.terlambat += Number(item.terlambat || 0);
                total.izin += Number(item.izin || 0);
                total.sakit += Number(item.sakit || 0);
                total.alpha += Number(item.alpha || 0);
            });
        }

        // Buat grafik berdasarkan data hasil rekap
        chartRekapAbsensi = new Chart(canvas, {
            type: "bar",

            data: {
                labels: [
                    "Hadir",
                    "Terlambat",
                    "Izin",
                    "Sakit",
                    "Alpha"
                ],

                datasets: [
                    {
                        label: "Jumlah Presensi",

                        data: [
                            total.hadir,
                            total.terlambat,
                            total.izin,
                            total.sakit,
                            total.alpha
                        ],

                        backgroundColor: [
                            "#198754",
                            "#ffc107",
                            "#0dcaf0",
                            "#6c757d",
                            "#dc3545"
                        ],

                        borderColor: [
                            "#146c43",
                            "#d39e00",
                            "#0aa2c0",
                            "#565e64",
                            "#b02a37"
                        ],

                        borderWidth: 1,
                        borderRadius: 6,
                        maxBarThickness: 65
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return "Jumlah: " + context.parsed.y + " kali";
                            }
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            precision: 0,
                            stepSize: 1
                    },

                    title: {
                        display: true,
                        text: "Jumlah Presensi"
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: "Status Presensi"
                    }
                }
            }
        }
    });
}

})();