// =====================================================
// DATA KARYAWAN ADMIN
// DIMSUM HOKYA
// =====================================================


// =====================================================
// API
// =====================================================

// PERHATIKAN:
// folder backend kamu adalah absensi_backand
const API_URL =
    "http://localhost/absensi_backand/api/auth/admin/karyawan.php";

const API_HAPUS =
    "http://localhost/absensi_backand/api/auth/admin/hapus_karyawan.php";


// =====================================================
// ELEMENT
// =====================================================

const tableBody =
    document.getElementById("tableKaryawanBody");

const alertKaryawan =
    document.getElementById("alertKaryawan");

const formEdit =
    document.getElementById("formEditKaryawan");

const modalElement =
    document.getElementById("modalEditKaryawan");


// =====================================================
// MODAL
// =====================================================

let modalEdit = null;

if (modalElement && typeof bootstrap !== "undefined") {
    modalEdit = new bootstrap.Modal(modalElement);
}


// =====================================================
// LOAD DATA SAAT HALAMAN DIBUKA
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("=================================");
    console.log("DATA KARYAWAN ADMIN");
    console.log("API:", API_URL);
    console.log("=================================");

    loadDataKaryawan();

});


// =====================================================
// ALERT
// =====================================================

function showAlert(message, type = "success") {

    if (!alertKaryawan) {
        alert(message);
        return;
    }

    alertKaryawan.className =
        "alert alert-" + type;

    alertKaryawan.textContent =
        message;

    alertKaryawan.classList.remove("d-none");

    setTimeout(function () {

        alertKaryawan.classList.add("d-none");

    }, 4000);

}


// =====================================================
// BACA RESPONSE API DENGAN AMAN
// =====================================================

async function getResponseData(response) {

    const text = await response.text();

    console.log("HTTP STATUS:", response.status);
    console.log("RESPONSE RAW:", text);

    if (!text) {

        throw new Error(
            "Server tidak memberikan response."
        );

    }

    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Response bukan JSON:",
            text
        );

        throw new Error(
            "Server mengembalikan response bukan JSON. " +
            "Cek URL API atau error PHP."
        );

    }

}


// =====================================================
// LOAD DATA KARYAWAN
// =====================================================

async function loadDataKaryawan() {

    if (!tableBody) {
        console.error(
            "Element #tableKaryawanBody tidak ditemukan."
        );
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="9"
                class="text-center py-4"
            >
                <div
                    class="spinner-border spinner-border-sm me-2">
                </div>

                Memuat data karyawan...
            </td>
        </tr>
    `;


    try {

        console.log(
            "Mengambil data dari:",
            API_URL
        );


        const response = await fetch(
            API_URL,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-cache"
            }
        );


        const result =
            await getResponseData(response);


        console.log(
            "Response data karyawan:",
            result
        );


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Gagal mengambil data karyawan."
            );

        }


        let data = [];


        if (Array.isArray(result.data)) {

            data = result.data;

        } else if (
            result.data &&
            Array.isArray(result.data.data)
        ) {

            data = result.data.data;

        }


        console.log(
            "Data karyawan:",
            data
        );


        renderTable(data);


    } catch (error) {

        console.error(
            "Error load karyawan:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="text-center text-danger py-4"
                >

                    <i
                        class="fas fa-exclamation-circle me-2">
                    </i>

                    Gagal memuat data karyawan.

                    <br>

                    <small>
                        ${escapeHtml(error.message)}
                    </small>

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
// RENDER TABLE
// =====================================================

function renderTable(data) {

    tableBody.innerHTML = "";


    if (!data || data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="text-center py-4 text-muted"
                >

                    <i
                        class="fas fa-users-slash me-2">
                    </i>

                    Belum ada data karyawan.

                </td>
            </tr>
        `;

        return;

    }


    data.forEach(function (karyawan, index) {

        const tr =
            document.createElement("tr");


        const status =
            String(
                karyawan.status || ""
            ).toLowerCase();


        let statusBadge = "";


        if (status === "aktif") {

            statusBadge = `
                <span class="badge bg-success">
                    Aktif
                </span>
            `;

        } else {

            statusBadge = `
                <span class="badge bg-secondary">
                    Nonaktif
                </span>
            `;

        }


        tr.innerHTML = `

            <td class="text-center">
                ${index + 1}
            </td>

            <td>
                ${escapeHtml(karyawan.nik)}
            </td>

            <td>
                ${escapeHtml(karyawan.nama_karyawan)}
            </td>

            <td>
                ${escapeHtml(karyawan.jabatan)}
            </td>

            <td>
                ${escapeHtml(karyawan.no_hp)}
            </td>

            <td>
                ${escapeHtml(karyawan.alamat)}
            </td>

            <td>
                ${formatTanggal(karyawan.tanggal_masuk)}
            </td>

            <td class="text-center">
                ${statusBadge}
            </td>

            <td class="text-center">

                <button
                    type="button"
                    class="btn btn-sm btn-edit me-1"
                    onclick="editKaryawan(${Number(karyawan.id_karyawan)})"
                    title="Edit"
                >

                    <i class="fas fa-edit"></i>
                    Edit

                </button>


                <button
                    type="button"
                    class="btn btn-sm btn-delete"
                    onclick="hapusKaryawan(
                        ${Number(karyawan.id_karyawan)},
                        '${escapeJs(karyawan.nama_karyawan)}'
                    )"
                    title="Hapus"
                >

                    <i class="fas fa-trash"></i>
                    Hapus

                </button>

            </td>

        `;


        tableBody.appendChild(tr);

    });

}


// =====================================================
// EDIT KARYAWAN
// =====================================================

async function editKaryawan(idKaryawan) {

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    cache: "no-cache"
                }
            );


        const result =
            await getResponseData(response);


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Gagal mengambil data."
            );

        }


        let data = [];


        if (Array.isArray(result.data)) {

            data = result.data;

        } else if (
            result.data &&
            Array.isArray(result.data.data)
        ) {

            data = result.data.data;

        }


        const karyawan =
            data.find(function (item) {

                return Number(
                    item.id_karyawan
                ) === Number(
                    idKaryawan
                );

            });


        if (!karyawan) {

            alert(
                "Data karyawan tidak ditemukan."
            );

            return;

        }


        // =================================================
        // ISI FORM
        // =================================================

        setValue(
            "edit_id_karyawan",
            karyawan.id_karyawan
        );

        setValue(
            "edit_id_cabang",
            karyawan.id_cabang
        );

        setValue(
            "edit_nik",
            karyawan.nik
        );

        setValue(
            "edit_nama_karyawan",
            karyawan.nama_karyawan
        );

        setValue(
            "edit_jabatan",
            karyawan.jabatan
        );

        setValue(
            "edit_no_hp",
            karyawan.no_hp
        );

        setValue(
            "edit_tanggal_masuk",
            karyawan.tanggal_masuk
        );

        setValue(
            "edit_alamat",
            karyawan.alamat
        );

        setValue(
            "edit_foto",
            karyawan.foto
        );

        setValue(
            "edit_status",
            karyawan.status || "aktif"
        );


        const editAlert =
            document.getElementById(
                "editKaryawanAlert"
            );


        if (editAlert) {

            editAlert.className =
                "alert d-none";

            editAlert.textContent =
                "";

        }


        // =================================================
        // BUKA MODAL
        // =================================================

        if (modalEdit) {

            modalEdit.show();

        } else {

            console.error(
                "Modal edit tidak ditemukan."
            );

        }


    } catch (error) {

        console.error(
            "Error edit karyawan:",
            error
        );

        showAlert(
            error.message,
            "danger"
        );

    }

}


// =====================================================
// SUBMIT EDIT
// =====================================================

if (formEdit) {

    formEdit.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const btnSimpan =
                document.getElementById(
                    "btnSimpanKaryawan"
                );


            const data = {

                id_karyawan:
                    Number(
                        getValue(
                            "edit_id_karyawan"
                        )
                    ),

                id_cabang:
                    Number(
                        getValue(
                            "edit_id_cabang"
                        )
                    ),

                nik:
                    getValue(
                        "edit_nik"
                    ).trim(),

                nama_karyawan:
                    getValue(
                        "edit_nama_karyawan"
                    ).trim(),

                jabatan:
                    getValue(
                        "edit_jabatan"
                    ).trim(),

                no_hp:
                    getValue(
                        "edit_no_hp"
                    ).trim(),

                alamat:
                    getValue(
                        "edit_alamat"
                    ).trim(),

                tanggal_masuk:
                    getValue(
                        "edit_tanggal_masuk"
                    ),

                foto:
                    getValue(
                        "edit_foto"
                    ).trim(),

                status:
                    getValue(
                        "edit_status"
                    )

            };


            // =================================================
            // VALIDASI
            // =================================================

            if (!data.id_karyawan) {

                showEditAlert(
                    "ID karyawan tidak ditemukan.",
                    "danger"
                );

                return;

            }


            if (!data.id_cabang) {

                showEditAlert(
                    "ID cabang wajib diisi.",
                    "danger"
                );

                return;

            }


            if (!data.nik) {

                showEditAlert(
                    "NIK wajib diisi.",
                    "danger"
                );

                return;

            }


            if (!data.nama_karyawan) {

                showEditAlert(
                    "Nama karyawan wajib diisi.",
                    "danger"
                );

                return;

            }


            // =================================================
            // LOADING
            // =================================================

            let teksAwal = "";


            if (btnSimpan) {

                teksAwal =
                    btnSimpan.innerHTML;

                btnSimpan.disabled = true;

                btnSimpan.innerHTML = `
                    <span
                        class="spinner-border spinner-border-sm me-1">
                    </span>

                    Menyimpan...
                `;

            }


            try {

                const response =
                    await fetch(
                        API_URL,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(data)
                        }
                    );


                const result =
                    await getResponseData(
                        response
                    );


                console.log(
                    "Response update:",
                    result
                );


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Gagal mengubah data karyawan."
                    );

                }


                showEditAlert(
                    result.message ||
                    "Data berhasil diperbarui.",
                    "success"
                );


                setTimeout(function () {

                    if (modalEdit) {
                        modalEdit.hide();
                    }


                    loadDataKaryawan();


                    showAlert(
                        "Data karyawan berhasil diperbarui.",
                        "success"
                    );

                }, 700);


            } catch (error) {

                console.error(
                    "Error update:",
                    error
                );


                showEditAlert(
                    error.message,
                    "danger"
                );


            } finally {

                if (btnSimpan) {

                    btnSimpan.disabled =
                        false;

                    btnSimpan.innerHTML =
                        teksAwal;

                }

            }

        }
    );

}


// =====================================================
// HAPUS KARYAWAN
// =====================================================

async function hapusKaryawan(
    idKaryawan,
    namaKaryawan
) {

    const konfirmasi =
        confirm(
            "Apakah kamu yakin ingin menghapus karyawan:\n\n" +
            namaKaryawan +
            "\n\nData akun karyawan juga akan dihapus."
        );


    if (!konfirmasi) {
        return;
    }


    try {

        const response =
            await fetch(
                API_HAPUS,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id_karyawan:
                                Number(idKaryawan)
                        })
                }
            );


        const result =
            await getResponseData(
                response
            );


        console.log(
            "Response hapus:",
            result
        );


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Gagal menghapus karyawan."
            );

        }


        alert(
            result.message ||
            "Data karyawan berhasil dihapus."
        );


        loadDataKaryawan();


    } catch (error) {

        console.error(
            "Error hapus:",
            error
        );


        alert(
            "❌ " + error.message
        );

    }

}


// =====================================================
// ALERT EDIT
// =====================================================

function showEditAlert(
    message,
    type = "danger"
) {

    const alert =
        document.getElementById(
            "editKaryawanAlert"
        );


    if (!alert) {
        return;
    }


    alert.className =
        "alert alert-" + type;


    alert.textContent =
        message;


    alert.classList.remove(
        "d-none"
    );

}


// =====================================================
// GET VALUE
// =====================================================

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value || "";

}


// =====================================================
// SET VALUE
// =====================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            "Element tidak ditemukan:",
            id
        );

        return;

    }


    element.value =
        value ?? "";

}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(tanggal) {

    if (!tanggal) {
        return "-";
    }


    const parts =
        String(tanggal).split("-");


    if (parts.length !== 3) {
        return tanggal;
    }


    return (
        parts[2] +
        "-" +
        parts[1] +
        "-" +
        parts[0]
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// =====================================================
// ESCAPE JAVASCRIPT
// =====================================================

function escapeJs(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)

        .replace(/\\/g, "\\\\")

        .replace(/'/g, "\\'")

        .replace(/"/g, '\\"')

        .replace(/\n/g, "\\n")

        .replace(/\r/g, "\\r");

}