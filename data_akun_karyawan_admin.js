// =====================================================
// DATA AKUN KARYAWAN ADMIN - DIMSUM HOKYA
// =====================================================

const API_URL =
    "http://localhost/absensi_backand/api/auth/admin";


// =====================================================
// ELEMENT
// =====================================================

const tableBody =
    document.getElementById("tableUsersBody");

const alertUsers =
    document.getElementById("alertUsers");

const formEditUser =
    document.getElementById("formEditUser");

const modalElement =
    document.getElementById("modalEditUser");


// =====================================================
// CEK ELEMENT
// =====================================================

if (!tableBody) {
    console.error("❌ tableUsersBody tidak ditemukan.");
}

if (!formEditUser) {
    console.error("❌ formEditUser tidak ditemukan.");
}

if (!modalElement) {
    console.error("❌ modalEditUser tidak ditemukan.");
}


// =====================================================
// BOOTSTRAP MODAL
// =====================================================

let modalEditUser = null;

if (modalElement) {
    modalEditUser =
        new bootstrap.Modal(modalElement);
}


// =====================================================
// LOAD DATA USER
// =====================================================

async function loadUsers() {

    if (!tableBody) return;


    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                <div class="py-3">

                    <div
                        class="spinner-border text-danger"
                        role="status">
                    </div>

                    <div class="mt-2">
                        Memuat data akun...
                    </div>

                </div>
            </td>
        </tr>
    `;


    hideAlert();


    try {

        const url =
            `${API_URL}/get_akun_karyawan.php`;


        console.log(
            "Mengambil data user:",
            url
        );


        const response =
            await fetch(url, {
                method: "GET",
                cache: "no-cache"
            });


        console.log(
            "HTTP Status:",
            response.status
        );


        const text =
            await response.text();


        console.log(
            "Response server:",
            text
        );


        let result;


        try {

            result =
                JSON.parse(text);

        } catch (jsonError) {

            console.error(
                "Response bukan JSON:",
                text
            );

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


        tampilkanUsers(
            result.data || []
        );


    } catch (error) {

        console.error(
            "❌ Error Load Users:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-danger py-4">

                    ❌ Gagal mengambil data akun

                    <br>

                    <small>
                        ${escapeHTML(error.message)}
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
// TAMPILKAN USER
// =====================================================

function tampilkanUsers(data) {

    tableBody.innerHTML = "";


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center py-4">

                    Belum ada data akun karyawan.

                </td>
            </tr>
        `;

        return;
    }


    data.forEach(
        (item, index) => {


            const idUser =
                parseInt(item.id_user);


            // =================================================
            // NAMA DIAMBIL DARI users.nama_lengkap
            // =================================================

            const namaLengkap =
                item.nama_lengkap ||
                "-";


            // =================================================
            // USERNAME DIAMBIL DARI email
            // =================================================

            const username =
                item.username ||
                item.email ||
                "-";


            const status =
                item.status ||
                "-";


            const tr =
                document.createElement("tr");


            tr.innerHTML = `

                <!-- NO -->

                <td class="text-center">
                    ${index + 1}
                </td>


                <!-- NAMA LENGKAP -->

                <td>
                    ${escapeHTML(
                        namaLengkap
                    )}
                </td>


                <!-- USERNAME / EMAIL -->

                <td>
                    ${escapeHTML(
                        username
                    )}
                </td>


                <!-- STATUS -->

                <td class="text-center">

                    <span
                        class="badge ${getStatusClass(status)}">

                        ${escapeHTML(status)}

                    </span>

                </td>


                <!-- AKSI -->

                <td>

                    <div
                        class="d-flex justify-content-center gap-2">


                        <!-- EDIT -->

                        <button
                            type="button"
                            class="btn btn-sm btn-edit"
                            title="Edit akun">

                            <i class="ti ti-edit"></i>

                        </button>


                        <!-- HAPUS -->

                        <button
                            type="button"
                            class="btn btn-sm btn-delete"
                            title="Hapus akun">

                            <i class="ti ti-trash"></i>

                        </button>


                    </div>

                </td>

            `;


            // =================================================
            // EVENT BUTTON EDIT
            // =================================================

            const btnEdit =
                tr.querySelector(".btn-edit");


            btnEdit.addEventListener(
                "click",
                function () {

                    editUser(item);

                }
            );


            // =================================================
            // EVENT BUTTON HAPUS
            // =================================================

            const btnDelete =
                tr.querySelector(".btn-delete");


            btnDelete.addEventListener(
                "click",
                function () {

                    hapusUser(idUser);

                }
            );


            tableBody.appendChild(tr);

        }
    );
}


// =====================================================
// EDIT USER
// =====================================================

function editUser(data) {

    console.log(
        "✏️ Edit user:",
        data
    );


    if (!modalEditUser) {

        console.error(
            "❌ Modal Edit tidak ditemukan."
        );

        return;
    }


    // =================================================
    // ID USER
    // =================================================

    const inputId =
        document.getElementById(
            "edit_id_user"
        );


    // =================================================
    // NAMA LENGKAP
    // =================================================

    const inputNama =
        document.getElementById(
            "edit_nama_lengkap"
        );


    // =================================================
    // USERNAME
    // =================================================

    const inputUsername =
        document.getElementById(
            "edit_username"
        );


    // =================================================
    // PASSWORD
    // =================================================

    const inputPassword =
        document.getElementById(
            "edit_password"
        );


    // =================================================
    // STATUS
    // =================================================

    const inputStatus =
        document.getElementById(
            "edit_status"
        );


    // =================================================
    // CEK ELEMENT
    // =================================================

    if (!inputId) {

        console.error(
            "❌ edit_id_user tidak ditemukan."
        );

        return;
    }


    if (!inputNama) {

        console.error(
            "❌ edit_nama_lengkap tidak ditemukan."
        );

        return;
    }


    if (!inputUsername) {

        console.error(
            "❌ edit_username tidak ditemukan."
        );

        return;
    }


    if (!inputPassword) {

        console.error(
            "❌ edit_password tidak ditemukan."
        );

        return;
    }


    if (!inputStatus) {

        console.error(
            "❌ edit_status tidak ditemukan."
        );

        return;
    }


    // =================================================
    // ISI DATA MODAL
    // =================================================

    inputId.value =
        data.id_user || "";


    inputNama.value =
        data.nama_lengkap || "";


    inputUsername.value =
        data.username ||
        data.email ||
        "";


    inputPassword.value =
        "";


    inputStatus.value =
        data.status ||
        "aktif";


    hideEditAlert();


    // =================================================
    // TAMPILKAN MODAL
    // =================================================

    modalEditUser.show();

}


// =====================================================
// SIMPAN EDIT USER
// =====================================================

if (formEditUser) {

    formEditUser.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const idUser =
                parseInt(
                    document.getElementById(
                        "edit_id_user"
                    ).value
                );


            const namaLengkap =
                document.getElementById(
                    "edit_nama_lengkap"
                ).value.trim();


            const username =
                document.getElementById(
                    "edit_username"
                ).value.trim();


            const password =
                document.getElementById(
                    "edit_password"
                ).value;


            const status =
                document.getElementById(
                    "edit_status"
                ).value;


            // =================================================
            // VALIDASI
            // =================================================

            if (!idUser) {

                showEditAlert(
                    "ID user tidak ditemukan.",
                    "danger"
                );

                return;
            }


            if (!namaLengkap) {

                showEditAlert(
                    "Nama lengkap wajib diisi.",
                    "danger"
                );

                return;
            }


            if (!username) {

                showEditAlert(
                    "Username wajib diisi.",
                    "danger"
                );

                return;
            }


            if (username.length < 3) {

                showEditAlert(
                    "Username minimal 3 karakter.",
                    "danger"
                );

                return;
            }


            if (
                password &&
                password.length < 4
            ) {

                showEditAlert(
                    "Password minimal 4 karakter.",
                    "danger"
                );

                return;
            }


            const button =
                document.getElementById(
                    "btnSimpanUser"
                );


            const textButton =
                button.innerHTML;


            button.disabled = true;


            button.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm">
                </span>

                Menyimpan...
            `;


            try {


                // =================================================
                // DATA YANG DIKIRIM KE PHP
                // =================================================

                const data = {

                    id_user:
                        idUser,

                    nama_lengkap:
                        namaLengkap,

                    username:
                        username,

                    password:
                        password,

                    status:
                        status

                };


                console.log(
                    "📤 Data edit user:",
                    data
                );


                const response =
                    await fetch(
                        `${API_URL}/edit_akun_karyawan.php`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(data)

                        }
                    );


                const text =
                    await response.text();


                console.log(
                    "📥 Response edit user:",
                    text
                );


                let result;


                try {

                    result =
                        JSON.parse(text);

                } catch (jsonError) {

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
                    "✅ Data akun karyawan berhasil diperbarui."
                );


                modalEditUser.hide();


                // =================================================
                // REFRESH DATA
                // =================================================

                await loadUsers();


            } catch (error) {

                console.error(
                    "❌ Error Edit User:",
                    error
                );


                showEditAlert(
                    error.message,
                    "danger"
                );


            } finally {

                button.disabled = false;

                button.innerHTML =
                    textButton;

            }

        }
    );

}


// =====================================================
// HAPUS USER
// =====================================================

async function hapusUser(idUser) {


    if (!idUser) {

        alert(
            "ID user tidak ditemukan."
        );

        return;
    }


    const yakin =
        confirm(
            "Apakah kamu yakin ingin menghapus akun karyawan ini?\n\nData akun yang dihapus tidak dapat dikembalikan."
        );


    if (!yakin) {
        return;
    }


    try {


        console.log(
            "🗑️ Menghapus user:",
            idUser
        );


        const response =
            await fetch(
                `${API_URL}/hapus_akun_karyawan.php`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id_user:
                                idUser
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
                JSON.parse(text);

        } catch (jsonError) {

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
            "✅ Akun karyawan berhasil dihapus."
        );


        await loadUsers();


    } catch (error) {

        console.error(
            "❌ Error Hapus User:",
            error
        );


        alert(
            "❌ Gagal menghapus akun: " +
            error.message
        );

    }

}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    const value =
        String(status)
        .toLowerCase();


    if (value === "aktif") {
        return "bg-success";
    }


    if (value === "nonaktif") {
        return "bg-danger";
    }


    return "bg-secondary";

}


// =====================================================
// ALERT
// =====================================================

function showAlert(
    message,
    type = "danger"
) {

    if (!alertUsers) return;


    alertUsers.className =
        `alert alert-${type}`;


    alertUsers.textContent =
        message;

}


function hideAlert() {

    if (!alertUsers) return;


    alertUsers.className =
        "alert d-none";


    alertUsers.textContent =
        "";

}


// =====================================================
// ALERT MODAL
// =====================================================

function showEditAlert(
    message,
    type = "danger"
) {

    const element =
        document.getElementById(
            "editUserAlert"
        );


    if (!element) return;


    element.className =
        `alert alert-${type}`;


    element.textContent =
        message;

}


function hideEditAlert() {

    const element =
        document.getElementById(
            "editUserAlert"
        );


    if (!element) return;


    element.className =
        "alert d-none";


    element.textContent =
        "";

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


// =====================================================
// LOAD AWAL
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadUsers();

    }
);