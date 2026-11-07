// =====================================================
// LOGOUT - DIMSUM HOKYA
// =====================================================

function logout() {

    const konfirmasi = confirm(
        "Apakah Anda yakin ingin keluar dari akun?"
    );

    if (!konfirmasi) {
        return;
    }

    console.log("PROSES LOGOUT...");

    // =================================================
    // HAPUS DATA LOGIN
    // =================================================

    localStorage.removeItem("user");
    localStorage.removeItem("id_user");
    localStorage.removeItem("nama_lengkap");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("id_karyawan");
    localStorage.removeItem("id_cabang");

    // =================================================
    // HAPUS SEMUA DATA SESSION LAIN
    // =================================================

    sessionStorage.clear();

    // =================================================
    // ARAHKAN KE LOGIN
    // =================================================

    window.location.replace("login.html");
}


// =====================================================
// CEGAH KEMBALI KE HALAMAN SETELAH LOGOUT
// =====================================================

window.addEventListener("pageshow", function (event) {

    if (event.persisted) {

        window.location.reload();

    }

});