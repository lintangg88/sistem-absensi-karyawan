// =====================================================
// TAMBAH AKUN KARYAWAN ADMIN
// DIMSUM HOKYA
// =====================================================

const API_URL =
    "http://localhost/absensi_backand/api/auth";


// =====================================================
// SAAT HALAMAN DIBUKA
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "formTambahAkun"
            );


        if (!form) {

            console.error(
                "❌ Form tambah akun tidak ditemukan."
            );

            return;
        }


        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                tambahAkun();

            }
        );

    }
);


// =====================================================
// TAMBAH AKUN
// =====================================================

async function tambahAkun() {

    const namaLengkap =
        document
            .getElementById("nama_lengkap")
            .value
            .trim();


    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    // =================================================
    // VALIDASI NAMA
    // =================================================

    if (!namaLengkap) {

        alert(
            "Silakan isi nama lengkap."
        );

        document
            .getElementById("nama_lengkap")
            .focus();

        return;
    }


    // =================================================
    // VALIDASI EMAIL
    // =================================================

    if (!email) {

        alert(
            "Silakan isi email."
        );

        document
            .getElementById("email")
            .focus();

        return;
    }


    // =================================================
    // VALIDASI FORMAT EMAIL
    // =================================================

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        alert(
            "Format email tidak valid."
        );

        document
            .getElementById("email")
            .focus();

        return;
    }


    // =================================================
    // VALIDASI PASSWORD
    // =================================================

    if (!password) {

        alert(
            "Silakan isi password."
        );

        document
            .getElementById("password")
            .focus();

        return;
    }


    if (password.length < 6) {

        alert(
            "Password minimal 6 karakter."
        );

        document
            .getElementById("password")
            .focus();

        return;
    }


    // =================================================
    // DATA
    // =================================================

    const data = {

        nama_lengkap: namaLengkap,

        email: email,

        password: password

    };


    console.log(
        "Data akun yang dikirim:",
        {
            nama_lengkap: namaLengkap,
            email: email
        }
    );


    try {

        // =================================================
        // REQUEST API
        // =================================================

        const response = await fetch(
            `${API_URL}/admin/tambah_akun.php`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        // =================================================
        // RESPONSE JSON
        // =================================================

        let result;


        try {

            result =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                "Server tidak mengembalikan JSON yang valid."
            );

        }


        console.log(
            "HTTP Status:",
            response.status
        );


        console.log(
            "Response tambah akun:",
            result
        );


        // =================================================
        // CEK RESPONSE
        // =================================================

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                `HTTP Error ${response.status}`
            );

        }


        // =================================================
        // BERHASIL
        // =================================================

        alert(
            "✅ Akun karyawan berhasil dibuat!"
        );


        // Reset form

        document
            .getElementById(
                "formTambahAkun"
            )
            .reset();


    } catch (error) {

        console.error(
            "❌ Error Tambah Akun:",
            error
        );


        alert(
            "❌ " + error.message
        );

    }

}