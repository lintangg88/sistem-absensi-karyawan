// =====================================================
// TAMBAH DATA KARYAWAN - ADMIN DIMSUM HOKYA
// =====================================================

const API_URL = "http://localhost/absensi_backand/api/auth/admin";


// =====================================================
// LOAD AKUN KARYAWAN
// =====================================================

async function loadUsers() {

    const selectUser = document.getElementById("id_user");

    try {

        const response = await fetch(`${API_URL}/get_users.php`);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();

        console.log("Response users:", result);

        if (!result.success) {
            throw new Error(result.message || "Gagal mengambil data akun");
        }

        selectUser.innerHTML = `
            <option value="">
                -- Pilih Akun Karyawan --
            </option>
        `;

        result.data.forEach(user => {

            const option = document.createElement("option");

            option.value = user.id_user;

            option.textContent =
                `${user.email} - ${user.nama_lengkap}`;

            selectUser.appendChild(option);
        });

    } catch (error) {

        console.error("❌ Error Load Users:", error);

        selectUser.innerHTML = `
            <option value="">
                Gagal mengambil data akun
            </option>
        `;
    }
}


// =====================================================
// LOAD CABANG
// =====================================================

async function loadCabang() {

    const selectCabang = document.getElementById("id_cabang");

    try {

        const response = await fetch(`${API_URL}/get_cabang.php`);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();

        console.log("Response cabang:", result);

        if (!result.success) {
            throw new Error(result.message || "Gagal mengambil data cabang");
        }

        selectCabang.innerHTML = `
            <option value="">
                -- Pilih Cabang --
            </option>
        `;

        result.data.forEach(cabang => {

            const option = document.createElement("option");

            option.value = cabang.id_cabang;

            option.textContent =
                cabang.nama_cabang;

            selectCabang.appendChild(option);
        });

    } catch (error) {

        console.error("❌ Error Load Cabang:", error);

        selectCabang.innerHTML = `
            <option value="">
                Gagal mengambil data cabang
            </option>
        `;
    }
}


// =====================================================
// TAMBAH KARYAWAN
// =====================================================

async function tambahKaryawan(event) {

    event.preventDefault();

    const form = document.getElementById("formTambahKaryawan");

    const data = {

        id_user: document.getElementById("id_user").value,

        id_cabang: document.getElementById("id_cabang").value,

        nik: document.getElementById("nik").value.trim(),

        nama_karyawan:
            document.getElementById("nama_karyawan").value.trim(),

        jabatan:
            document.getElementById("jabatan").value.trim(),

        no_hp:
            document.getElementById("no_hp").value.trim(),

        alamat:
            document.getElementById("alamat").value.trim(),

        tanggal_masuk:
            document.getElementById("tanggal_masuk").value,

        status:
            document.getElementById("status").value
    };


    console.log("Data karyawan yang dikirim:", data);


    // =================================================
    // VALIDASI
    // =================================================

    if (!data.id_user) {
        alert("Silakan pilih akun karyawan.");
        return;
    }

    if (!data.id_cabang) {
        alert("Silakan pilih cabang.");
        return;
    }

    if (!data.nik) {
        alert("NIK wajib diisi.");
        return;
    }

    if (!data.nama_karyawan) {
        alert("Nama karyawan wajib diisi.");
        return;
    }

    if (!data.jabatan) {
        alert("Jabatan wajib diisi.");
        return;
    }

    if (!data.no_hp) {
        alert("Nomor HP wajib diisi.");
        return;
    }

    if (!data.alamat) {
        alert("Alamat wajib diisi.");
        return;
    }

    if (!data.tanggal_masuk) {
        alert("Tanggal masuk wajib diisi.");
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/tambah_karyawan.php`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        console.log("HTTP Status:", response.status);


        const result = await response.json();

        console.log("Response tambah karyawan:", result);


        if (!response.ok) {

            throw new Error(
                result.message ||
                `HTTP Error ${response.status}`
            );
        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Gagal menambahkan karyawan"
            );
        }


        // =================================================
        // BERHASIL
        // =================================================

        alert(
            "✅ Data karyawan berhasil ditambahkan!"
        );

        form.reset();

        // Load ulang dropdown
        loadUsers();

        loadCabang();


    } catch (error) {

        console.error(
            "❌ Error Tambah Karyawan:",
            error
        );

        alert(
            "❌ Gagal menambahkan data karyawan.\n\n" +
            error.message
        );
    }
}


// =====================================================
// INIT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "🚀 Halaman Tambah Karyawan siap"
        );

        loadUsers();

        loadCabang();


        const form =
            document.getElementById(
                "formTambahKaryawan"
            );

        if (form) {

            form.addEventListener(
                "submit",
                tambahKaryawan
            );
        }

    }
);