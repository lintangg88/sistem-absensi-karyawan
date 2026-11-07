// =====================================================
// DASHBOARD KARYAWAN - HOKYAATTEND
// Rekap presensi bulanan realtime
// Grafik Januari - Desember
// Grafik tetap terlihat meskipun persentase 0%
// Data berdasarkan akun karyawan yang login
// =====================================================

const API_URL = "http://localhost/absensi_backand/api";

document.addEventListener("DOMContentLoaded", async function () {

    const user = JSON.parse(localStorage.getItem("user") || "null");

    const idUser = Number(
        user?.id_user || localStorage.getItem("id_user") || 0
    );

    const loading = document.getElementById("loading");
    const errorMessage = document.getElementById("errorMessage");
    const dashboardContent = document.getElementById("dashboardContent");
    const canvasGrafik = document.getElementById("grafikKehadiran");
    const chartContainer = document.querySelector(".chart-container");

    let grafikKehadiran = null;
    let sedangMemuat = false;
    let intervalPembaruan = null;

    const semuaBulan = [
        "Jan", "Feb", "Mar", "Apr",
        "Mei", "Jun", "Jul", "Agu",
        "Sep", "Okt", "Nov", "Des"
    ];

    // =====================================================
    // VALIDASI LOGIN
    // =====================================================
    if (!user || !Number.isInteger(idUser) || idUser <= 0) {
        window.location.href = "login.html";
        return;
    }

    if (!canvasGrafik || !chartContainer) {
        console.error("Elemen grafik tidak ditemukan.");
        return;
    }

    // =====================================================
    // PENGATURAN AREA GRAFIK
    // =====================================================
    let scrollGrafik = chartContainer.parentElement;

    if (!scrollGrafik.classList.contains("grafik-scroll-wrapper")) {
        scrollGrafik = document.createElement("div");
        scrollGrafik.className = "grafik-scroll-wrapper";

        chartContainer.parentNode.insertBefore(
            scrollGrafik,
            chartContainer
        );

        scrollGrafik.appendChild(chartContainer);
    }

    scrollGrafik.style.width = "100%";
    scrollGrafik.style.maxWidth = "100%";
    scrollGrafik.style.overflowX = "auto";
    scrollGrafik.style.overflowY = "hidden";
    scrollGrafik.style.webkitOverflowScrolling = "touch";

    chartContainer.style.width = "1000px";
    chartContainer.style.minWidth = "1000px";
    chartContainer.style.maxWidth = "none";
    chartContainer.style.position = "relative";
    chartContainer.style.height = "360px";

    function aturLebarGrafik() {
        if (grafikKehadiran) {
            grafikKehadiran.resize();
        }
    }

    // =====================================================
    // FORMAT ANGKA
    // =====================================================
    function angkaValid(nilai) {
        const angka = Number(nilai);
        return Number.isFinite(angka) ? angka : 0;
    }

    function tampilkanAngka(nilai) {
        return Math.max(0, angkaValid(nilai));
    }

    // =====================================================
    // PLUGIN LABEL PERSENTASE GRAFIK
    // Menampilkan angka di setiap bulan.
    // Jika 0%, tampilkan penanda abu-abu dan tulisan 0%.
    // =====================================================
    const pluginLabelPersentase = {
        id: "labelPersentaseKehadiran",

        afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            const datasetIndex = 0;
            const meta = chart.getDatasetMeta(datasetIndex);
            const dataset = chart.data.datasets[datasetIndex];

            if (!meta || !meta.data || !dataset) {
                return;
            }

            const areaGrafik = chart.chartArea;

            ctx.save();

            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            meta.data.forEach(function (bar, index) {

                const nilai = tampilkanAngka(dataset.data[index]);
                const nilaiAkhir = Math.min(100, nilai);

                const posisiX = bar.x;
                const posisiY = bar.y;

                if (nilaiAkhir === 0) {

                    // Penanda kecil agar bulan 0% tetap terlihat.
                    const posisiDasar = chart.scales.y.getPixelForValue(0);

                    ctx.beginPath();
                    ctx.strokeStyle = "#bdbdbd";
                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";

                    ctx.moveTo(posisiX - 7, posisiDasar - 1);
                    ctx.lineTo(posisiX + 7, posisiDasar - 1);
                    ctx.stroke();

                    // Label 0% sedikit di atas garis dasar.
                    ctx.fillStyle = "#777777";

                    ctx.fillText(
                        "0%",
                        posisiX,
                        Math.max(
                            areaGrafik.top + 15,
                            posisiDasar - 7
                        )
                    );

                } else {

                    // Label persentase untuk batang yang memiliki nilai.
                    ctx.fillStyle = "#8f0000";

                    ctx.fillText(
                        `${nilaiAkhir}%`,
                        posisiX,
                        Math.max(areaGrafik.top + 15, posisiY - 6)
                    );
                }
            });

            ctx.restore();
        }
    };

    // =====================================================
    // AMBIL DATA DASHBOARD DARI DATABASE MELALUI API
    // =====================================================
    async function ambilDataDashboard() {

        if (sedangMemuat) return;

        sedangMemuat = true;

        try {

            const url =
                `${API_URL}/auth/dashboard.php` +
                `?id_user=${encodeURIComponent(idUser)}` +
                `&_=${Date.now()}`;

            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const teksRespons = await response.text();

            let result;

            try {
                result = JSON.parse(teksRespons);
            } catch (e) {
                throw new Error(
                    "Respons backend bukan JSON. Periksa error PHP dan URL API."
                );
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Gagal mengambil data dashboard."
                );
            }

            const data = result.data || {};

            console.log("ID akun yang sedang login:", idUser);
            console.log("Data dashboard terbaru:", data);

            // =================================================
            // PERBARUI NAMA KARYAWAN
            // =================================================
            const namaElement = document.getElementById("namaKaryawan");

            if (namaElement) {
                namaElement.textContent =
                    data.nama_karyawan ||
                    user.nama_lengkap ||
                    "Karyawan";
            }

            // =================================================
            // PERBARUI KARTU REKAP PRESENSI
            // =================================================
            const hadirElement = document.getElementById("totalHadir");
            const izinElement = document.getElementById("totalIzin");
            const liburElement = document.getElementById("totalLibur");
            const persentaseElement = document.getElementById("persentase");

            if (hadirElement) {
                hadirElement.textContent =
                    tampilkanAngka(data.total_hadir);
            }

            if (izinElement) {
                izinElement.textContent =
                    tampilkanAngka(data.total_izin);
            }

            if (liburElement) {
                liburElement.textContent =
                    tampilkanAngka(data.total_libur);
            }

            if (persentaseElement) {
                persentaseElement.textContent =
                    `${Math.min(100, tampilkanAngka(data.persentase))}%`;
            }

            // =================================================
            // PETAKAN GRAFIK BERDASARKAN NOMOR BULAN
            // =================================================
            const dataGrafik = Array.isArray(data.grafik)
                ? data.grafik
                : [];

            // Semua bulan selalu tersedia meskipun datanya 0%.
            const nilaiGrafik = Array(12).fill(0);

            dataGrafik.forEach(function (item) {

                const nomorBulan = Number(item.nomor_bulan);

                if (
                    Number.isInteger(nomorBulan) &&
                    nomorBulan >= 1 &&
                    nomorBulan <= 12
                ) {
                    nilaiGrafik[nomorBulan - 1] = Math.min(
                        100,
                        tampilkanAngka(item.persentase)
                    );
                }
            });

            console.log(
                "Periode rekap:",
                `${data.bulan_berjalan}/${data.tahun_berjalan}`
            );

            console.log("Nilai grafik Januari–Desember:", nilaiGrafik);

            // =================================================
            // TAMPILKAN DASHBOARD
            // =================================================
            if (loading) {
                loading.classList.add("d-none");
            }

            if (errorMessage) {
                errorMessage.classList.add("d-none");
            }

            if (dashboardContent) {
                dashboardContent.classList.remove("d-none");
            }

            // =================================================
            // BUAT ATAU PERBARUI GRAFIK
            // =================================================
            if (!grafikKehadiran) {

                grafikKehadiran = new Chart(canvasGrafik, {
                    type: "bar",

                    data: {
                        labels: semuaBulan,

                        datasets: [{
                            label: "Persentase Kehadiran",
                            data: nilaiGrafik,

                            backgroundColor: "#b30000",
                            hoverBackgroundColor: "#d71920",

                            borderRadius: 7,
                            maxBarThickness: 38,
                            categoryPercentage: 0.68,
                            barPercentage: 0.8
                        }]
                    },

                    // Plugin untuk label 0% dan persentase lainnya.
                    plugins: [
                        pluginLabelPersentase
                    ],

                    options: {
                        responsive: true,
                        maintainAspectRatio: false,

                        animation: {
                            duration: 300
                        },

                        layout: {
                            autoPadding: true,
                            padding: {
                                top: 20,
                                right: 18,
                                bottom: 8,
                                left: 8
                            }
                        },

                        scales: {
                            y: {
                                beginAtZero: true,
                                min: 0,
                                max: 100,

                                ticks: {
                                    stepSize: 10,
                                    padding: 10,

                                    callback: function (value) {
                                        return value + "%";
                                    }
                                },

                                title: {
                                    display: true,
                                    text: "Persentase Kehadiran",
                                    padding: {
                                        bottom: 12
                                    }
                                },

                                grid: {
                                    color: "rgba(120, 100, 60, 0.15)",
                                    drawBorder: false
                                },

                                border: {
                                    display: false
                                }
                            },

                            x: {
                                offset: true,

                                title: {
                                    display: true,
                                    text: "Bulan",
                                    padding: {
                                        top: 14
                                    }
                                },

                                ticks: {
                                    autoSkip: false,
                                    minRotation: 0,
                                    maxRotation: 0,
                                    padding: 8
                                },

                                grid: {
                                    display: false
                                },

                                border: {
                                    display: false
                                }
                            }
                        },

                        plugins: {
                            legend: {
                                display: false
                            },

                            tooltip: {
                                backgroundColor: "#292929",
                                titleColor: "#ffffff",
                                bodyColor: "#ffffff",
                                padding: 12,
                                displayColors: false,

                                callbacks: {
                                    label: function (context) {
                                        return `Kehadiran: ${context.raw}%`;
                                    }
                                }
                            }
                        }
                    }
                });

            } else {

                grafikKehadiran.data.labels = semuaBulan;

                grafikKehadiran.data.datasets[0].data =
                    nilaiGrafik;

                grafikKehadiran.update();
            }

            aturLebarGrafik();

        } catch (error) {

            console.error("Dashboard error:", error);

            if (!grafikKehadiran) {

                if (loading) {
                    loading.classList.add("d-none");
                }

                if (errorMessage) {
                    errorMessage.textContent =
                        error.message ||
                        "Terjadi kesalahan saat memuat dashboard.";

                    errorMessage.classList.remove("d-none");
                }
            }

        } finally {
            sedangMemuat = false;
        }
    }

    // =====================================================
    // MUAT DATA PERTAMA KALI
    // =====================================================
    await ambilDataDashboard();

    window.addEventListener("resize", aturLebarGrafik);

    // =====================================================
    // PEMBARUAN DATA SETIAP 30 DETIK
    // =====================================================
    intervalPembaruan = setInterval(function () {
        ambilDataDashboard();
    }, 30000);

    // =====================================================
    // BERSIHKAN INTERVAL SAAT HALAMAN DITINGGALKAN
    // =====================================================
    window.addEventListener("pagehide", function () {

        if (intervalPembaruan) {
            clearInterval(intervalPembaruan);
            intervalPembaruan = null;
        }

        window.removeEventListener("resize", aturLebarGrafik);
    });

});