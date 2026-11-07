// =====================================================
// TAMBAH JADWAL KERJA ADMIN
// DIMSUM HOKYA
// =====================================================

const API_URL =
    "http://localhost/absensi_backand/api/auth";


// =====================================================
// LOAD DATA FORM
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    loadDataForm();

    const form = document.getElementById("formJadwal");

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        simpanJadwal();

    });

});


// =====================================================
// AMBIL DATA KARYAWAN DAN CABANG
// =====================================================

async function loadDataForm() {

    try {

        const response = await fetch(
            `${API_URL}/admin/data_form_jadwal.php`
        );

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();

        console.log("Data Form:", result);

        if (!result.success) {
            throw new Error(
                result.message ||
                "Gagal mengambil data form"
            );
        }


        // =============================================
        // KARYAWAN
        // =============================================

        const selectKaryawan =
            document.getElementById("id_karyawan");

        selectKaryawan.innerHTML =
            `<option value="">
                -- Pilih Karyawan --
            </option>`;


        result.data.karyawan.forEach(function (karyawan) {

            const option =
                document.createElement("option");

            option.value =
                karyawan.id_karyawan;

            option.textContent =
                karyawan.nama_karyawan;

            selectKaryawan.appendChild(option);

        });


        // =============================================
        // CABANG
        // =============================================

        const selectCabang =
            document.getElementById("id_cabang");

        selectCabang.innerHTML =
            `<option value="">
                -- Pilih Cabang --
            </option>`;


        result.data.cabang.forEach(function (cabang) {

            const option =
                document.createElement("option");

            option.value =
                cabang.id_cabang;

            option.textContent =
                cabang.nama_cabang;

            selectCabang.appendChild(option);

        });


    } catch (error) {

        console.error(
            "❌ Gagal mengambil data form:",
            error
        );

        alert(
            "Gagal mengambil data karyawan dan cabang."
        );

    }

}


// =====================================================
// SIMPAN JADWAL
// =====================================================

async function simpanJadwal() {

    const idKaryawan =
        document.getElementById("id_karyawan").value;

    const idCabang =
        document.getElementById("id_cabang").value;

    const tanggal =
        document.getElementById("tanggal").value;

    const namaShift =
        document.getElementById("nama_shift").value.trim();

    const pagi =
        document.getElementById("pagi").value.trim();

    const malam =
        document.getElementById("malam").value.trim();

    const keterangan =
        document.getElementById("keterangan").value.trim();


    // =============================================
    // VALIDASI
    // =============================================

    if (!idKaryawan) {
        alert("Silakan pilih karyawan.");
        return;
    }

    if (!idCabang) {
        alert("Silakan pilih cabang.");
        return;
    }

    if (!tanggal) {
        alert("Silakan pilih tanggal.");
        return;
    }

    if (!namaShift) {
        alert("Silakan isi nama shift.");
        return;
    }


    // =============================================
    // DATA
    // =============================================

    const data = {

        id_karyawan: parseInt(idKaryawan),

        id_cabang: parseInt(idCabang),

        tanggal: tanggal,

        nama_shift: namaShift,

        pagi: pagi || null,

        malam: malam || null,

        keterangan: keterangan || null

    };


    console.log(
        "Data yang dikirim:",
        data
    );


    try {

        const response = await fetch(
            `${API_URL}/admin/tambah_jadwal.php`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(data)
            }
        );


        const result =
            await response.json();


        console.log(
            "Response Simpan:",
            result
        );


        if (!result.success) {

            throw new Error(
                result.message ||
                "Gagal menyimpan jadwal."
            );

        }


        // =============================================
        // BERHASIL
        // =============================================

        alert(
            "✅ Jadwal kerja berhasil disimpan!"
        );


        // Reset form
        document
            .getElementById("formJadwal")
            .reset();


    } catch (error) {

        console.error(
            "❌ Error Simpan Jadwal:",
            error
        );

        alert(
            "❌ " + error.message
        );

    }

}