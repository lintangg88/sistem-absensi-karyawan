document.addEventListener("DOMContentLoaded", function () {

    const API_BASE =
        "http://localhost/absensi_backand/api/auth/admin";

    const API_GET =
        API_BASE + "/get_target_kerja.php";

    const API_EDIT =
        API_BASE + "/edit_target_kerja.php";

    const API_DELETE =
        API_BASE + "/hapus_target_kerja.php";

    const API_KARYAWAN =
        API_BASE + "/get_karyawan.php";


    const tableBody =
        document.getElementById("tableTargetKerjaBody");

    const filterBulan =
        document.getElementById("filterBulan");

    const filterTahun =
        document.getElementById("filterTahun");

    const btnFilter =
        document.getElementById("btnFilter");

    const btnSemua =
        document.getElementById("btnSemua");

    const alertTarget =
        document.getElementById("alertJadwal");


    const modalElement =
        document.getElementById("modalEditTarget");

    const modalEdit =
        modalElement
            ? new bootstrap.Modal(modalElement)
            : null;


    const formEdit =
        document.getElementById("formEditTarget");


    const namaBulan = [
        "",
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];


    let semuaDataTarget = [];

    let daftarKaryawan = [];


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value ?? "";

        return div.innerHTML;
    }


    /* =====================================================
       ALERT
    ===================================================== */

    function tampilkanAlert(
        pesan,
        tipe = "success"
    ) {

        if (!alertTarget) return;

        alertTarget.className =
            "alert alert-" + tipe;

        alertTarget.textContent =
            pesan;
    }


    function sembunyikanAlert() {

        if (!alertTarget) return;

        alertTarget.className =
            "alert d-none";

        alertTarget.textContent = "";
    }


    /* =====================================================
       LOAD DATA TARGET KERJA
    ===================================================== */

    async function loadTargetKerja() {

        try {

            sembunyikanAlert();


            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="text-center">

                        Memuat data target kerja...

                    </td>
                </tr>
            `;


            let url = API_GET;

            const params = [];


            if (
                filterBulan &&
                filterBulan.value
            ) {

                params.push(
                    "bulan=" +
                    encodeURIComponent(
                        filterBulan.value
                    )
                );

            }


            if (
                filterTahun &&
                filterTahun.value
            ) {

                params.push(
                    "tahun=" +
                    encodeURIComponent(
                        filterTahun.value
                    )
                );

            }


            if (params.length > 0) {

                url += "?" + params.join("&");

            }


            console.log(
                "Request target kerja:",
                url
            );


            const response =
                await fetch(url);


            const result =
                await response.json();


            console.log(
                "Response target kerja:",
                result
            );


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Gagal mengambil data target kerja."
                );

            }


            semuaDataTarget =
                result.data || [];


            tampilkanData(
                semuaDataTarget
            );


        } catch (error) {

            console.error(error);


            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="text-center text-danger">

                        Gagal memuat data target kerja.

                    </td>
                </tr>
            `;


            tampilkanAlert(
                error.message,
                "danger"
            );

        }

    }


    /* =====================================================
       TAMPILKAN DATA
    ===================================================== */

    function tampilkanData(data) {

        tableBody.innerHTML = "";


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="text-center">

                        Belum ada data target kerja.

                    </td>
                </tr>
            `;

            return;
        }


        data.forEach(
            function (item, index) {

                const bulan =
                    parseInt(
                        item.bulan,
                        10
                    );


                const namaKaryawan =
                    item.nama_karyawan ||
                    "-";


                const tr =
                    document.createElement("tr");


                tr.innerHTML = `

                    <td class="text-center">
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            namaKaryawan
                        )}
                    </td>

                    <td class="text-center">
                        ${
                            namaBulan[bulan] || "-"
                        }
                    </td>

                    <td class="text-center">
                        ${escapeHTML(
                            item.tahun
                        )}
                    </td>

                    <td class="text-center">
                        ${escapeHTML(
                            item.hari_efektif
                        )}
                        hari
                    </td>

                    <td class="text-center">
                        ${escapeHTML(
                            item.min_jam_kerja
                        )}
                        jam
                    </td>

                    <td class="text-center">

                        <div class="aksi-target">

                            <button
                                type="button"
                                class="btn-aksi-target btn-edit-target"
                                data-id="${item.id}">

                                <i class="fas fa-edit"></i>
                                Edit

                            </button>


                            <button
                                type="button"
                                class="btn-aksi-target btn-hapus-target"
                                data-id="${item.id}"
                                data-nama="${escapeHTML(
                                    namaKaryawan
                                )}">

                                <i class="fas fa-trash"></i>
                                Hapus

                            </button>

                        </div>

                    </td>

                `;


                tableBody.appendChild(tr);

            }
        );


        pasangTombolAksi();

    }


    /* =====================================================
       EVENT TOMBOL EDIT & HAPUS
    ===================================================== */

    function pasangTombolAksi() {

        document
            .querySelectorAll(
                ".btn-edit-target"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const id =
                                parseInt(
                                    button.dataset.id,
                                    10
                                );

                            bukaEdit(id);

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".btn-hapus-target"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const id =
                                parseInt(
                                    button.dataset.id,
                                    10
                                );

                            const nama =
                                button.dataset.nama ||
                                "data ini";


                            hapusTarget(
                                id,
                                nama
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       LOAD KARYAWAN
    ===================================================== */

    async function loadKaryawan() {

        try {

            const response =
                await fetch(
                    API_KARYAWAN
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Gagal mengambil data karyawan."
                );

            }


            daftarKaryawan =
                result.data || [];


            const select =
                document.getElementById(
                    "edit_karyawan_id"
                );


            if (!select) return;


            select.innerHTML = `
                <option value="">
                    Pilih Karyawan
                </option>
            `;


            daftarKaryawan.forEach(
                function (karyawan) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        karyawan.id_karyawan;


                    option.textContent =
                        karyawan.nama_karyawan;


                    select.appendChild(
                        option
                    );

                }
            );


        } catch (error) {

            console.error(
                "Gagal load karyawan:",
                error
            );

        }

    }


    /* =====================================================
       BUKA MODAL EDIT
    ===================================================== */

    function bukaEdit(id) {

        const data =
            semuaDataTarget.find(
                function (item) {

                    return parseInt(
                        item.id,
                        10
                    ) === id;

                }
            );


        if (!data) {

            alert(
                "Data target kerja tidak ditemukan."
            );

            return;
        }


        document.getElementById(
            "edit_id"
        ).value =
            data.id;


        document.getElementById(
            "edit_karyawan_id"
        ).value =
            data.karyawan_id;


        document.getElementById(
            "edit_bulan"
        ).value =
            data.bulan;


        document.getElementById(
            "edit_tahun"
        ).value =
            data.tahun;


        document.getElementById(
            "edit_hari_efektif"
        ).value =
            data.hari_efektif;


        document.getElementById(
            "edit_min_jam_kerja"
        ).value =
            data.min_jam_kerja;


        const alertEdit =
            document.getElementById(
                "alertEditTarget"
            );


        if (alertEdit) {

            alertEdit.className =
                "alert d-none";

            alertEdit.textContent =
                "";

        }


        if (modalEdit) {

            modalEdit.show();

        }

    }


    /* =====================================================
       SIMPAN EDIT
    ===================================================== */

    if (formEdit) {

        formEdit.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    document.getElementById(
                        "edit_id"
                    ).value;


                const karyawan_id =
                    document.getElementById(
                        "edit_karyawan_id"
                    ).value;


                const bulan =
                    document.getElementById(
                        "edit_bulan"
                    ).value;


                const tahun =
                    document.getElementById(
                        "edit_tahun"
                    ).value;


                const hari_efektif =
                    document.getElementById(
                        "edit_hari_efektif"
                    ).value;


                const min_jam_kerja =
                    document.getElementById(
                        "edit_min_jam_kerja"
                    ).value;


                try {

                    const response =
                        await fetch(
                            API_EDIT,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        id:
                                            parseInt(
                                                id
                                            ),

                                        karyawan_id:
                                            parseInt(
                                                karyawan_id
                                            ),

                                        bulan:
                                            parseInt(
                                                bulan
                                            ),

                                        tahun:
                                            parseInt(
                                                tahun
                                            ),

                                        hari_efektif:
                                            parseInt(
                                                hari_efektif
                                            ),

                                        min_jam_kerja:
                                            parseFloat(
                                                min_jam_kerja
                                            )

                                    })

                            }
                        );


                    const result =
                        await response.json();


                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        throw new Error(
                            result.message ||
                            "Gagal mengedit target kerja."
                        );

                    }


                    if (modalEdit) {

                        modalEdit.hide();

                    }


                    tampilkanAlert(
                        "Target kerja berhasil diperbarui.",
                        "success"
                    );


                    await loadTargetKerja();


                } catch (error) {

                    console.error(
                        error
                    );


                    const alertEdit =
                        document.getElementById(
                            "alertEditTarget"
                        );


                    if (alertEdit) {

                        alertEdit.className =
                            "alert alert-danger";

                        alertEdit.textContent =
                            error.message;

                    }

                }

            }
        );

    }


    /* =====================================================
       HAPUS TARGET
    ===================================================== */

    async function hapusTarget(
        id,
        nama
    ) {

        const yakin =
            confirm(
                "Apakah Anda yakin ingin menghapus target kerja " +
                "milik " +
                nama +
                "?"
            );


        if (!yakin) {

            return;

        }


        try {

            const response =
                await fetch(
                    API_DELETE,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                id: parseInt(id)
                            })

                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Gagal menghapus target kerja."
                );

            }


            tampilkanAlert(
                "Target kerja berhasil dihapus.",
                "success"
            );


            await loadTargetKerja();


        } catch (error) {

            console.error(
                error
            );


            tampilkanAlert(
                error.message,
                "danger"
            );

        }

    }


    /* =====================================================
       FILTER
    ===================================================== */

    if (btnFilter) {

        btnFilter.addEventListener(
            "click",
            function () {

                loadTargetKerja();

            }
        );

    }


    if (btnSemua) {

        btnSemua.addEventListener(
            "click",
            function () {

                if (filterBulan) {

                    filterBulan.value = "";

                }


                if (filterTahun) {

                    filterTahun.value = "";

                }


                loadTargetKerja();

            }
        );

    }


    /* =====================================================
       JALANKAN
    ===================================================== */

    loadKaryawan();

    loadTargetKerja();

});