const API_URL =
    "http://localhost/absensi_backand/api";


const loginForm =
    document.getElementById("loginForm");


const loginMessage =
    document.getElementById("loginMessage");


/*
|--------------------------------------------------------------------------
| CEK FORM
|--------------------------------------------------------------------------
*/

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /*
            |--------------------------------------------------------------------------
            | AMBIL INPUT
            |--------------------------------------------------------------------------
            */

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            /*
            |--------------------------------------------------------------------------
            | VALIDASI FRONTEND
            |--------------------------------------------------------------------------
            */

            if (email === "") {

                loginMessage.innerHTML = `
                    <div class="alert alert-danger mt-3">
                        Email wajib diisi.
                    </div>
                `;

                return;
            }


            if (password === "") {

                loginMessage.innerHTML = `
                    <div class="alert alert-danger mt-3">
                        Password wajib diisi.
                    </div>
                `;

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | TAMPILKAN LOADING
            |--------------------------------------------------------------------------
            */

            loginMessage.innerHTML = `
                <div class="alert alert-info mt-3">
                    Sedang login...
                </div>
            `;


            /*
            |--------------------------------------------------------------------------
            | KIRIM DATA KE API
            |--------------------------------------------------------------------------
            */

            try {

                const response =
                    await fetch(
                        `${API_URL}/auth/login.php`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email: email,
                                password: password
                            })
                        }
                    );


                /*
                |--------------------------------------------------------------------------
                | AMBIL RESPONSE
                |--------------------------------------------------------------------------
                */

                const result =
                    await response.json();


                console.log(
                    "Response API:",
                    result
                );


                /*
                |--------------------------------------------------------------------------
                | LOGIN GAGAL
                |--------------------------------------------------------------------------
                */

                if (!result.success) {

                    loginMessage.innerHTML = `
                        <div class="alert alert-danger mt-3">
                            ${result.message}
                        </div>
                    `;

                    return;
                }


                /*
                |--------------------------------------------------------------------------
                | LOGIN BERHASIL
                |--------------------------------------------------------------------------
                */

                loginMessage.innerHTML = `
                    <div class="alert alert-success mt-3">
                        ${result.message}
                    </div>
                `;


                /*
                |--------------------------------------------------------------------------
                | SIMPAN DATA USER
                |--------------------------------------------------------------------------
                */

                console.log("DATA LOGIN DARI API:", result.data);

                if (!result.data.id_user) {

                    console.error(
                        "id_user tidak ditemukan dari API:",
                        result.data
                    );

                    loginMessage.innerHTML = `
                        <div class="alert alert-danger mt-3">
                            ID user tidak ditemukan dari server.
                        </div>
                    `;

                    return;
                }


                // Simpan seluruh data user
                localStorage.setItem(
                    "user",
                    JSON.stringify(result.data)
                );


                // Simpan id_user secara terpisah
                localStorage.setItem(
                    "id_user",
                    result.data.id_user
                );


                console.log(
                    "ID USER BERHASIL DISIMPAN:",
                    result.data.id_user
                );


                /*
                |--------------------------------------------------------------------------
                | REDIRECT BERDASARKAN ROLE
                |--------------------------------------------------------------------------
                */

                setTimeout(function () {

                    if (result.data.role === "admin") {

                        window.location.href =
                            "dashboard_admin.html";


                    } else if (
                        result.data.role === "karyawan"
                    ) {

                        window.location.href =
                            "dashboard.html";


                    } else {

                        loginMessage.innerHTML = `
                            <div class="alert alert-danger mt-3">
                                Role pengguna tidak dikenali.
                            </div>
                        `;

                    }

                }, 500);

            }


            /*
            |--------------------------------------------------------------------------
            | ERROR KONEKSI
            |--------------------------------------------------------------------------
            */

            catch (error) {

                console.error(
                    "Error:",
                    error
                );


                loginMessage.innerHTML = `
                    <div class="alert alert-danger mt-3">
                        Tidak dapat terhubung ke server.
                        Pastikan Apache dan MySQL Laragon aktif.
                    </div>
                `;

            }

        }
    );

}