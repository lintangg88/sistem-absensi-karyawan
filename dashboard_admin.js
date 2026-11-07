// =====================================================
// DASHBOARD ADMIN - DIMSUM HOKYA
// =====================================================

const API_URL = "http://localhost/absensi_backand/api/auth";


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/admin/dashboard.php`
        );

        console.log("Status API Dashboard:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();

        console.log("Response Dashboard:", result);


        // =============================================
        // CEK RESPONSE
        // =============================================

        if (!result.success) {
            throw new Error(
                result.message || "Gagal mengambil data dashboard"
            );
        }


        // =============================================
        // AMBIL DATA
        // =============================================

        const totalKaryawan =
            Number(result.data.total_karyawan) || 0;

        const totalAbsensi =
            Number(result.data.total_absensi) || 0;

        const totalJadwal =
            Number(result.data.total_jadwal) || 0;

        const totalIzin =
            Number(result.data.total_pengajuan_izin) || 0;


        // =============================================
        // TAMPILKAN DATA KE KARTU
        // =============================================

        document.getElementById("totalKaryawan").textContent =
            totalKaryawan;

        document.getElementById("totalAbsensi").textContent =
            totalAbsensi;

        document.getElementById("totalJadwal").textContent =
            totalJadwal;

        document.getElementById("totalIzin").textContent =
            totalIzin;


        // =============================================
        // TAMPILKAN GRAFIK
        // =============================================

        renderDashboardChart(
            totalKaryawan,
            totalAbsensi,
            totalJadwal,
            totalIzin
        );


        console.log(
            "✅ Data dashboard berhasil ditampilkan"
        );


    } catch (error) {

        console.error("❌ Error Dashboard:", error);


        // =============================================
        // JANGAN RESET DATA KARTU JIKA GRAFIK ERROR
        // =============================================

        console.error(
            "Gagal memuat dashboard:",
            error.message
        );

    }

}


// =====================================================
// GRAFIK DASHBOARD
// =====================================================

function renderDashboardChart(
    totalKaryawan,
    totalAbsensi,
    totalJadwal,
    totalIzin
) {

    const chartContainer =
        document.getElementById("dashboardChart");


    if (!chartContainer) {

        console.error(
            "Element #dashboardChart tidak ditemukan."
        );

        return;

    }


    // =============================================
    // DATA GRAFIK
    // =============================================

    const data = [

        {
            label: "Karyawan",
            value: totalKaryawan,
            className: "chart-bar-karyawan"
        },

        {
            label: "Absensi",
            value: totalAbsensi,
            className: "chart-bar-absensi"
        },

        {
            label: "Jadwal Kerja",
            value: totalJadwal,
            className: "chart-bar-jadwal"
        },

        {
            label: "Pengajuan Izin",
            value: totalIzin,
            className: "chart-bar-izin"
        }

    ];


    // =============================================
    // CARI NILAI TERBESAR
    // =============================================

    const maxValue = Math.max(
        ...data.map(item => item.value),
        1
    );


    // =============================================
    // BUAT HTML GRAFIK
    // =============================================

    chartContainer.innerHTML = "";


    data.forEach(item => {

        const wrapper =
            document.createElement("div");

        wrapper.className = "chart-item";


        // Nilai
        const value =
            document.createElement("div");

        value.className = "chart-value";

        value.textContent = item.value;


        // Area batang
        const barArea =
            document.createElement("div");

        barArea.className = "chart-bar-area";


        // Batang
        const bar =
            document.createElement("div");

        bar.className =
            `chart-bar ${item.className}`;


        // Tinggi batang
        let height =
            (item.value / maxValue) * 100;


        // Jika nilainya 0
        if (item.value === 0) {

            height = 2;

        }


        bar.style.height =
            `${height}%`;


        // Label
        const label =
            document.createElement("div");

        label.className = "chart-label";

        label.textContent =
            item.label;


        // Susun
        barArea.appendChild(bar);

        wrapper.appendChild(value);

        wrapper.appendChild(barArea);

        wrapper.appendChild(label);

        chartContainer.appendChild(wrapper);

    });

}


// =====================================================
// JALANKAN SAAT HALAMAN SELESAI DIMUAT
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboard();

    }
);