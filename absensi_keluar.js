// =====================================================
// ABSENSI KELUAR - DIMSUM HOKYA
// VERSI FINAL
// DISESUAIKAN DENGAN ABSENSI MASUK
// =====================================================

console.log("======================================");
console.log("absensi_keluar.js BERHASIL DIMUAT");
console.log("======================================");


// =====================================================
// VARIABEL GLOBAL
// =====================================================

let userLat = null;
let userLng = null;
let userAccuracy = null;

let outletLat = null;
let outletLng = null;
let outletRadius = null;

let outletData = null;

let map = null;

let userMarker = null;
let outletMarker = null;

let userAccuracyCircle = null;
let outletRadiusCircle = null;

let cameraStream = null;

let fotoDiambil = false;
let fotoBlob = null;

let idUser = null;


// =====================================================
// URL BACKEND
// =====================================================

const API_URL =
    "http://localhost/absensi_backand/api";


// =====================================================
// DOM SELESAI
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log("DOM SUDAH SIAP");


        // =================================================
        // AMBIL ELEMENT
        // =================================================

        const statusLokasi =
            document.getElementById(
                "statusLokasi"
            );

        const statusAbsensi =
            document.getElementById(
                "statusAbsensi"
            );

        const mapElement =
            document.getElementById(
                "map"
            );

        const video =
            document.getElementById(
                "video"
            );

        const canvas =
            document.getElementById(
                "canvas"
            );

        const previewFoto =
            document.getElementById(
                "previewFoto"
            );

        const kameraPlaceholder =
            document.getElementById(
                "kameraPlaceholder"
            );

        const btnKamera =
            document.getElementById(
                "btnKamera"
            );

        const btnFoto =
            document.getElementById(
                "btnFoto"
            );

        const btnKeluar =
            document.getElementById(
                "btnKeluar"
            );


        // =================================================
        // CEK ELEMENT
        // =================================================

        if (!statusLokasi ||
            !statusAbsensi ||
            !mapElement ||
            !video ||
            !canvas ||
            !previewFoto ||
            !kameraPlaceholder ||
            !btnKamera ||
            !btnFoto ||
            !btnKeluar
        ) {

            console.error(
                "❌ Element HTML tidak lengkap."
            );

            return;
        }


        console.log(
            "✅ Semua element HTML ditemukan"
        );


        // =================================================
        // AMBIL ID USER
        // =================================================

        try {

            const userStorage =
                localStorage.getItem(
                    "user"
                );


            console.log(
                "DATA USER LOCALSTORAGE:",
                userStorage
            );


            if (userStorage) {

                const user =
                    JSON.parse(
                        userStorage
                    );


                console.log(
                    "DATA USER:",
                    user
                );


                if (user.id_user) {

                    idUser =
                        parseInt(
                            user.id_user
                        );

                }

            }

        }

        catch (error) {

            console.error(
                "❌ Gagal membaca data user:",
                error
            );

        }


        // =================================================
        // FALLBACK ID USER
        // =================================================

        if (
            !idUser ||
            isNaN(idUser)
        ) {

            const idUserStorage =
                localStorage.getItem(
                    "id_user"
                );


            if (idUserStorage) {

                idUser =
                    parseInt(
                        idUserStorage
                    );

            }

        }


        console.log(
            "ID USER:",
            idUser
        );


        // =================================================
        // CEK ID USER
        // =================================================

        if (
            !idUser ||
            isNaN(idUser)
        ) {

            statusLokasi.innerHTML = `
                ❌ ID user tidak ditemukan.
                <br>
                Silakan login kembali.
            `;


            statusAbsensi.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Data login tidak ditemukan.
                </div>
            `;


            btnKamera.disabled = true;

            btnFoto.disabled = true;

            btnKeluar.disabled = true;


            return;
        }


        // =================================================
        // STATUS AWAL
        // =================================================

        statusLokasi.innerHTML =
            "📍 Mendeteksi lokasi...";


        statusAbsensi.innerHTML =
            "⏳ Mengambil lokasi GPS...";


        // =================================================
        // TOMBOL AWAL
        // =================================================

        // Sama seperti ABSENSI MASUK
        // Kamera boleh digunakan.

        btnKamera.disabled = false;

        btnKamera.style.display =
            "inline-block";


        btnFoto.style.display =
            "none";


        btnKeluar.style.display =
            "none";


        btnKeluar.disabled =
            true;


        // =================================================
        // CEK SUPPORT GPS
        // =================================================

        if (
            !navigator.geolocation
        ) {

            statusLokasi.innerHTML =
                "❌ Browser tidak mendukung GPS.";


            statusAbsensi.innerHTML =
                "❌ GPS tidak tersedia.";


            btnKamera.disabled =
                false;


            return;
        }


        // =================================================
        // AMBIL GPS
        // =================================================

        navigator.geolocation.getCurrentPosition(

            function (position) {

                console.log(
                    "================================="
                );

                console.log(
                    "GPS BERHASIL"
                );

                console.log(
                    "================================="
                );


                userLat =
                    position.coords.latitude;


                userLng =
                    position.coords.longitude;


                userAccuracy =
                    position.coords.accuracy;


                console.log(
                    "Latitude:",
                    userLat
                );


                console.log(
                    "Longitude:",
                    userLng
                );


                console.log(
                    "Accuracy:",
                    userAccuracy
                );


                // =================================================
                // TAMPILKAN LOKASI
                // =================================================

                statusLokasi.innerHTML = `

                    📍 Lokasi berhasil dideteksi

                    <br>

                    Latitude:
                    ${userLat}

                    <br>

                    Longitude:
                    ${userLng}

                    <br>

                    Akurasi:
                    ${Math.round(userAccuracy)}
                    meter

                `;


                statusAbsensi.innerHTML =
                    "⏳ Mengambil data outlet...";


                // =================================================
                // BUAT PETA
                // =================================================

                buatPeta(
                    userLat,
                    userLng,
                    mapElement
                );


                // =================================================
                // AMBIL DATA OUTLET
                // =================================================

                ambilDataLokasi(
                    idUser,
                    statusLokasi,
                    statusAbsensi,
                    btnKamera,
                    btnKeluar
                );

            },


            // =================================================
            // GPS ERROR
            // =================================================

            function (error) {

                console.error(
                    "GPS ERROR:",
                    error
                );


                if (
                    error.code === 1
                ) {

                    statusLokasi.innerHTML =
                        "❌ Izin lokasi ditolak.";


                    statusAbsensi.innerHTML = `

                        <div class="alert alert-danger">

                            Silakan izinkan lokasi
                            pada browser.

                        </div>

                    `;

                }


                else if (
                    error.code === 2
                ) {

                    statusLokasi.innerHTML =
                        "❌ Lokasi tidak tersedia.";


                    statusAbsensi.innerHTML =
                        "❌ GPS tidak tersedia.";

                }


                else if (
                    error.code === 3
                ) {

                    statusLokasi.innerHTML =
                        "❌ Waktu mengambil lokasi habis.";


                    statusAbsensi.innerHTML =
                        "❌ Silakan coba lagi.";

                }


                else {

                    statusLokasi.innerHTML =
                        "❌ Gagal mendapatkan lokasi.";

                }


                // Kamera tetap bisa digunakan
                btnKamera.disabled = false;

            },


            // =================================================
            // GPS OPTIONS
            // =================================================

            {
                enableHighAccuracy: true,

                timeout: 20000,

                maximumAge: 0
            }

        );


        // =====================================================
        // TOMBOL BUKA KAMERA
        // =====================================================

        btnKamera.addEventListener(
            "click",
            async function () {

                console.log(
                    "================================="
                );

                console.log(
                    "TOMBOL BUKA KAMERA DIKLIK"
                );

                console.log(
                    "================================="
                );


                // =================================================
                // CEK MEDIA DEVICES
                // =================================================

                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-danger">

                            ❌ Kamera tidak didukung browser.

                            <br><br>

                            Gunakan Google Chrome
                            atau Microsoft Edge.

                            <br>

                            Pastikan halaman dibuka melalui

                            <strong>
                                http://localhost
                            </strong>

                        </div>

                    `;

                    return;
                }


                statusAbsensi.innerHTML = `

                    <div class="alert alert-info">

                        📷 Meminta akses kamera...

                    </div>

                `;


                try {

                    // =================================================
                    // MATIKAN STREAM LAMA
                    // =================================================

                    if (cameraStream) {

                        cameraStream
                            .getTracks()
                            .forEach(
                                function (track) {

                                    track.stop();

                                }
                            );


                        cameraStream =
                            null;
                    }


                    // =================================================
                    // MINTA AKSES KAMERA
                    // =================================================

                    cameraStream =
                        await navigator
                            .mediaDevices
                            .getUserMedia({

                                video: {

                                    facingMode: {
                                        ideal: "user"
                                    },

                                    width: {
                                        ideal: 1280
                                    },

                                    height: {
                                        ideal: 720
                                    }

                                },

                                audio: false

                            });


                    console.log(
                        "✅ KAMERA BERHASIL DIBUKA"
                    );


                    // =================================================
                    // PASANG STREAM
                    // =================================================

                    video.srcObject =
                        cameraStream;


                    video.style.display =
                        "block";


                    previewFoto.style.display =
                        "none";


                    kameraPlaceholder.style.display =
                        "none";


                    btnKamera.style.display =
                        "none";


                    btnFoto.style.display =
                        "inline-block";


                    btnKeluar.style.display =
                        "none";


                    // =================================================
                    // PLAY VIDEO
                    // =================================================

                    try {

                        await video.play();

                    }

                    catch (error) {

                        console.error(
                            "VIDEO PLAY ERROR:",
                            error
                        );

                    }


                    statusAbsensi.innerHTML = `

                        <div class="alert alert-success">

                            📷 Kamera berhasil dibuka.

                            <br>

                            Silakan arahkan kamera
                            ke wajah.

                        </div>

                    `;

                }


                catch (error) {

                    console.error(
                        "KAMERA ERROR:",
                        error
                    );


                    console.error(
                        "NAMA ERROR:",
                        error.name
                    );


                    let pesan =
                        "Kamera tidak dapat dibuka.";


                    if (
                        error.name ===
                        "NotAllowedError"
                    ) {

                        pesan =
                            "Izin kamera ditolak. Silakan izinkan kamera pada pengaturan browser.";

                    }


                    else if (
                        error.name ===
                        "NotFoundError"
                    ) {

                        pesan =
                            "Kamera tidak ditemukan pada perangkat.";

                    }


                    else if (
                        error.name ===
                        "NotReadableError"
                    ) {

                        pesan =
                            "Kamera sedang digunakan aplikasi lain.";

                    }


                    else if (
                        error.name ===
                        "SecurityError"
                    ) {

                        pesan =
                            "Browser memblokir akses kamera.";

                    }


                    else if (
                        error.name ===
                        "OverconstrainedError"
                    ) {

                        pesan =
                            "Pengaturan kamera tidak didukung perangkat.";

                    }


                    else {

                        pesan =
                            "Kamera gagal dibuka: " +
                            error.message;

                    }


                    statusAbsensi.innerHTML = `

                        <div class="alert alert-danger">

                            ❌ ${pesan}

                        </div>

                    `;


                    btnKamera.style.display =
                        "inline-block";


                    btnKamera.disabled =
                        false;


                    btnFoto.style.display =
                        "none";

                }

            }

        );


        // =====================================================
        // TOMBOL AMBIL FOTO
        // =====================================================

        btnFoto.addEventListener(
            "click",
            function () {

                console.log(
                    "TOMBOL AMBIL FOTO DIKLIK"
                );


                // =================================================
                // CEK STREAM
                // =================================================

                if (
                    !cameraStream ||
                    !video.srcObject
                ) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-warning">

                            ❌ Kamera belum aktif.

                        </div>

                    `;

                    return;
                }


                // =================================================
                // CEK VIDEO
                // =================================================

                if (
                    video.videoWidth === 0 ||
                    video.videoHeight === 0
                ) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-warning">

                            ⏳ Kamera belum siap.

                            <br>

                            Tunggu sebentar lalu coba lagi.

                        </div>

                    `;

                    return;
                }


                // =================================================
                // SET CANVAS
                // =================================================

                canvas.width =
                    video.videoWidth;


                canvas.height =
                    video.videoHeight;


                const context =
                    canvas.getContext(
                        "2d"
                    );


                context.drawImage(
                    video,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );


                // =================================================
                // BUAT FOTO
                // =================================================

                const fotoDataURL =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.9
                    );


                // =================================================
                // PREVIEW
                // =================================================

                previewFoto.src =
                    fotoDataURL;


                previewFoto.style.display =
                    "block";


                video.style.display =
                    "none";


                btnFoto.style.display =
                    "none";


                kameraPlaceholder.style.display =
                    "none";


                // =================================================
                // BUAT BLOB
                // =================================================

                canvas.toBlob(
                    function (blob) {

                        if (!blob) {

                            statusAbsensi.innerHTML = `

                                <div class="alert alert-danger">

                                    ❌ Gagal membuat file foto.

                                </div>

                            `;

                            return;
                        }


                        fotoBlob =
                            blob;


                        fotoDiambil =
                            true;


                        console.log(
                            "FOTO BLOB:",
                            fotoBlob
                        );


                        // =================================================
                        // MATIKAN KAMERA
                        // =================================================

                        if (cameraStream) {

                            cameraStream
                                .getTracks()
                                .forEach(
                                    function (track) {

                                        track.stop();

                                    }
                                );


                            cameraStream =
                                null;
                        }


                        video.srcObject =
                            null;


                        // =================================================
                        // TAMPILKAN TOMBOL PULANG
                        // =================================================

                        btnKeluar.style.display =
                            "inline-block";


                        btnKeluar.disabled =
                            false;


                        // =================================================
                        // STATUS
                        // =================================================

                        statusAbsensi.innerHTML = `

                            <div class="alert alert-success">

                                ✅ Foto berhasil diambil.

                                <br>

                                Silakan tekan

                                <strong>
                                    Absen Pulang
                                </strong>

                                untuk menyimpan absensi.

                            </div>

                        `;

                    },

                    "image/jpeg",

                    0.9

                );

            }

        );


        // =====================================================
        // TOMBOL ABSEN KELUAR
        // =====================================================

        btnKeluar.addEventListener(
            "click",
            async function () {

                console.log(
                    "================================="
                );

                console.log(
                    "TOMBOL ABSEN KELUAR DIKLIK"
                );

                console.log(
                    "================================="
                );


                // =================================================
                // CEK GPS
                // =================================================

                if (
                    userLat === null ||
                    userLng === null
                ) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-warning">

                            ❌ Lokasi belum terdeteksi.

                            <br>

                            Silakan tunggu GPS.

                        </div>

                    `;

                    return;
                }


                // =================================================
                // CEK DATA OUTLET
                // =================================================

                if (
                    outletLat === null ||
                    outletLng === null ||
                    outletRadius === null
                ) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-warning">

                            ❌ Data outlet belum tersedia.

                        </div>

                    `;

                    return;
                }


                // =================================================
                // CEK FOTO
                // =================================================

                if (
                    !fotoDiambil ||
                    !fotoBlob
                ) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-warning">

                            📷 Silakan ambil foto terlebih dahulu.

                        </div>

                    `;

                    return;
                }


                // =================================================
                // HITUNG JARAK
                // =================================================

                const jarak =
                    hitungJarak(
                        userLat,
                        userLng,
                        outletLat,
                        outletLng
                    );


                console.log(
                    "JARAK:",
                    jarak,
                    "meter"
                );


                console.log(
                    "RADIUS:",
                    outletRadius,
                    "meter"
                );


                // =================================================
                // CEK RADIUS
                // =================================================

                if (
                    jarak >
                    outletRadius
                ) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-danger">

                            ❌ Anda berada di luar area absensi.

                            <br><br>

                            Jarak Anda:

                            <strong>
                                ${Math.round(jarak)}
                                meter
                            </strong>

                            <br>

                            Radius outlet:

                            <strong>
                                ${outletRadius}
                                meter
                            </strong>

                            <br><br>

                            Silakan berada di area outlet.

                        </div>

                    `;


                    btnKeluar.disabled =
                        false;


                    return;
                }


                // =================================================
                // CEK ID USER
                // =================================================

                if (!idUser) {

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-danger">

                            ❌ ID user tidak ditemukan.

                            <br>

                            Silakan login kembali.

                        </div>

                    `;

                    return;
                }


                // =================================================
                // LOADING
                // =================================================

                btnKeluar.disabled =
                    true;


                statusAbsensi.innerHTML = `

                    <div class="alert alert-info">

                        ⏳ Menyimpan absensi pulang...

                    </div>

                `;


                // =================================================
                // FORM DATA
                // =================================================

                const formData =
                    new FormData();


                formData.append(
                    "id_user",
                    idUser
                );


                formData.append(
                    "latitude",
                    userLat
                );


                formData.append(
                    "longitude",
                    userLng
                );


                formData.append(
                    "foto",
                    fotoBlob,
                    "foto_pulang.jpg"
                );


                console.log(
                    "FORM DATA SIAP DIKIRIM"
                );


                // =================================================
                // KIRIM KE CHECKOUT.PHP
                // =================================================

                try {

                    const response =
                        await fetch(

                            `${API_URL}/auth/absensi/checkout.php`,

                            {

                                method: "POST",

                                body: formData

                            }

                        );


                    console.log(
                        "STATUS CHECKOUT:",
                        response.status
                    );


                    const text =
                        await response.text();


                    console.log(
                        "RESPONSE CHECKOUT:",
                        text
                    );


                    // =================================================
                    // PARSE JSON
                    // =================================================

                    let result;


                    try {

                        result =
                            JSON.parse(
                                text
                            );

                    }

                    catch (jsonError) {

                        console.error(
                            "Response bukan JSON:",
                            text
                        );


                        statusAbsensi.innerHTML = `

                            <div class="alert alert-danger">

                                ❌ Server memberikan
                                response yang tidak valid.

                                <br><br>

                                Status:
                                ${response.status}

                                <br><br>

                                Silakan buka Console
                                browser untuk melihat detail.

                            </div>

                        `;


                        btnKeluar.disabled =
                            false;


                        return;
                    }


                    // =================================================
                    // CHECKOUT GAGAL
                    // =================================================

                    if (
                        !result.success
                    ) {

                        statusAbsensi.innerHTML = `

                            <div class="alert alert-danger">

                                ❌ ${
                                    result.message ||
                                    "Absensi pulang gagal."
                                }

                            </div>

                        `;


                        btnKeluar.disabled =
                            false;


                        return;
                    }


                    // =================================================
                    // CHECKOUT BERHASIL
                    // =================================================

                    statusAbsensi.innerHTML = `

                        <div class="alert alert-success">

                            ✅ ${
                                result.message ||
                                "Check out berhasil."
                            }

                            <br><br>

                            Jam pulang:

                            <strong>

                                ${
                                    result.data?.jam_keluar ||
                                    "-"
                                }

                            </strong>

                            <br>

                            Jarak:

                            <strong>

                                ${
                                    result.data?.jarak_meter ??
                                    Math.round(jarak)
                                }

                                meter

                            </strong>

                            <br>

                            Cabang:

                            <strong>

                                ${
                                    result.data?.nama_cabang ||
                                    outletData?.nama_cabang ||
                                    "-"
                                }

                            </strong>

                            <br><br>

                            Absensi pulang hari ini
                            sudah selesai.

                        </div>

                    `;


                    // =================================================
                    // MATIKAN SEMUA TOMBOL
                    // =================================================

                    btnKeluar.disabled =
                        true;


                    btnKamera.disabled =
                        true;


                    btnFoto.disabled =
                        true;


                    console.log(
                        "CHECKOUT BERHASIL:",
                        result
                    );

                }


                catch (error) {

                    console.error(
                        "CHECKOUT ERROR:",
                        error
                    );


                    statusAbsensi.innerHTML = `

                        <div class="alert alert-danger">

                            ❌ Tidak dapat terhubung
                            ke server.

                            <br>

                            Pastikan Apache dan
                            MySQL/MariaDB Laragon aktif.

                        </div>

                    `;


                    btnKeluar.disabled =
                        false;

                }

            }

        );

    }

);


// =====================================================
// FUNGSI BUAT PETA
// =====================================================

function buatPeta(
    latitude,
    longitude,
    mapElement
) {

    console.log(
        "MEMBUAT PETA..."
    );


    // =================================================
    // CEK LEAFLET
    // =================================================

    if (
        typeof L ===
        "undefined"
    ) {

        console.error(
            "❌ Leaflet belum dimuat."
        );

        return;
    }


    // =================================================
    // HAPUS PETA LAMA
    // =================================================

    if (map) {

        map.remove();

        map = null;
    }


    // =================================================
    // BUAT PETA
    // =================================================

    map =
        L.map(
            mapElement
        ).setView(

            [
                latitude,
                longitude
            ],

            17
        );


    // =================================================
    // OPEN STREET MAP
    // =================================================

    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            attribution:
                "&copy; OpenStreetMap contributors"

        }

    ).addTo(
        map
    );


    // =================================================
    // MARKER USER
    // =================================================

    userMarker =
        L.marker(

            [
                latitude,
                longitude
            ]

        )

        .addTo(
            map
        )

        .bindPopup(
            "📍 Lokasi Anda"
        );


    // =================================================
    // LINGKARAN AKURASI GPS
    // =================================================

    userAccuracyCircle =
        L.circle(

            [
                latitude,
                longitude
            ],

            {

                radius:
                    userAccuracy ||
                    30

            }

        )

        .addTo(
            map
        );


    console.log(
        "✅ PETA BERHASIL DIBUAT"
    );

}


// =====================================================
// AMBIL DATA OUTLET
// =====================================================

async function ambilDataLokasi(

    idUser,

    statusLokasi,

    statusAbsensi,

    btnKamera,

    btnKeluar

) {

    try {

        console.log(
            "================================="
        );


        console.log(
            "MENGAMBIL DATA OUTLET"
        );


        console.log(
            "ID USER:",
            idUser
        );


        console.log(
            "================================="
        );


        // =================================================
        // REQUEST
        // =================================================

        const response =
            await fetch(

                `${API_URL}/auth/absensi/lokasi.php`,

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


        console.log(
            "STATUS LOKASI:",
            response.status
        );


        const text =
            await response.text();


        console.log(
            "RESPONSE LOKASI:",
            text
        );


        // =================================================
        // PARSE JSON
        // =================================================

        let result;


        try {

            result =
                JSON.parse(
                    text
                );

        }

        catch (jsonError) {

            console.error(
                "Response lokasi bukan JSON:",
                text
            );


            statusLokasi.innerHTML =
                "❌ Backend lokasi mengirim response tidak valid.";


            statusAbsensi.innerHTML = `

                <div class="alert alert-danger">

                    ❌ Periksa lokasi.php
                    dan konfigurasi backend.

                </div>

            `;


            btnKamera.disabled =
                false;


            btnKeluar.disabled =
                true;


            return;
        }


        // =================================================
        // RESPONSE GAGAL
        // =================================================

        if (
            !result.success
        ) {

            statusLokasi.innerHTML =
                "❌ " +
                (
                    result.message ||
                    "Data lokasi gagal diambil."
                );


            statusAbsensi.innerHTML = `

                <div class="alert alert-danger">

                    ❌ Data outlet tidak ditemukan.

                </div>

            `;


            btnKamera.disabled =
                false;


            btnKeluar.disabled =
                true;


            return;
        }


        // =================================================
        // DATA OUTLET
        // =================================================

        outletData =
            result.data;


        outletLat =
            parseFloat(
                outletData.latitude
            );


        outletLng =
            parseFloat(
                outletData.longitude
            );


        outletRadius =
            parseFloat(
                outletData.radius_meter
            );


        console.log(
            "LATITUDE OUTLET:",
            outletLat
        );


        console.log(
            "LONGITUDE OUTLET:",
            outletLng
        );


        console.log(
            "RADIUS OUTLET:",
            outletRadius
        );


        // =================================================
        // VALIDASI
        // =================================================

        if (

            isNaN(outletLat) ||

            isNaN(outletLng) ||

            isNaN(outletRadius)

        ) {

            statusLokasi.innerHTML =
                "❌ Data koordinat outlet tidak valid.";


            statusAbsensi.innerHTML = `

                <div class="alert alert-danger">

                    ❌ Periksa latitude,
                    longitude dan radius
                    di database.

                </div>

            `;


            btnKamera.disabled =
                false;


            return;
        }


        // =================================================
        // MARKER OUTLET
        // =================================================

        if (map) {

            outletMarker =
                L.marker(

                    [
                        outletLat,
                        outletLng
                    ]

                )

                .addTo(
                    map
                )

                .bindPopup(

                    `

                    <b>
                        ${outletData.nama_cabang}
                    </b>

                    <br>

                    ${outletData.alamat || ""}

                    `

                );


            // =================================================
            // LINGKARAN RADIUS
            // =================================================

            outletRadiusCircle =
                L.circle(

                    [
                        outletLat,
                        outletLng
                    ],

                    {

                        radius:
                            outletRadius

                    }

                )

                .addTo(
                    map
                );


            // =================================================
            // FIT MAP
            // =================================================

            const bounds =
                L.latLngBounds(

                    [
                        userLat,
                        userLng
                    ],

                    [
                        outletLat,
                        outletLng
                    ]

                );


            map.fitBounds(

                bounds,

                {

                    padding:
                        [
                            40,
                            40
                        ]

                }

            );

        }


        // =================================================
        // HITUNG JARAK
        // =================================================

        const jarak =
            hitungJarak(

                userLat,
                userLng,

                outletLat,
                outletLng

            );


        console.log(
            "JARAK USER:",
            jarak,
            "METER"
        );


        // =================================================
        // DALAM RADIUS
        // =================================================

        if (
            jarak <=
            outletRadius
        ) {

            statusLokasi.innerHTML = `

                📍 <strong>

                    ${outletData.nama_cabang}

                </strong>

                <br>

                👤 ${
                    outletData.nama_karyawan ||
                    ""
                }

                <br>

                📏 Jarak:

                <strong>

                    ${Math.round(jarak)}
                    meter

                </strong>

                <br>

                🟢 Dalam area absensi

                <br>

                Radius:

                ${outletRadius}
                meter

            `;


            statusAbsensi.innerHTML = `

                <div class="alert alert-success">

                    ✅ Anda berada di area absensi.

                    <br>

                    📷 Kamera siap digunakan.

                </div>

            `;


            // Kamera aktif
            btnKamera.disabled =
                false;


            // Tombol pulang belum aktif
            btnKeluar.disabled =
                true;

        }


        // =================================================
        // LUAR RADIUS
        // =================================================

        else {

            statusLokasi.innerHTML = `

                📍 <strong>

                    ${outletData.nama_cabang}

                </strong>

                <br>

                👤 ${
                    outletData.nama_karyawan ||
                    ""
                }

                <br>

                📏 Jarak:

                <strong>

                    ${Math.round(jarak)}
                    meter

                </strong>

                <br>

                🔴 Di luar area absensi

                <br>

                Radius:

                ${outletRadius}
                meter

            `;


            statusAbsensi.innerHTML = `

                <div class="alert alert-warning">

                    ⚠️ Anda berada di luar
                    radius absensi.

                    <br><br>

                    Jarak Anda:

                    <strong>

                        ${Math.round(jarak)}
                        meter

                    </strong>

                    <br>

                    Radius outlet:

                    <strong>

                        ${outletRadius}
                        meter

                    </strong>

                    <br><br>

                    📷 Kamera tetap dapat dibuka,

                    <br>

                    tetapi absensi pulang hanya
                    dapat disimpan ketika berada
                    di dalam radius.

                </div>

            `;


            // Kamera tetap boleh dibuka
            btnKamera.disabled =
                false;


            // Pulang dikunci
            btnKeluar.disabled =
                true;

        }

    }


    catch (error) {

        console.error(
            "GAGAL MENGAMBIL DATA LOKASI:",
            error
        );


        statusLokasi.innerHTML =
            "❌ Tidak dapat mengambil data outlet.";


        statusAbsensi.innerHTML = `

            <div class="alert alert-danger">

                ❌ Backend lokasi tidak dapat dihubungi.

                <br><br>

                Periksa:

                <br>
                1. Apache/Laragon
                <br>
                2. MariaDB/MySQL
                <br>
                3. API_URL
                <br>
                4. lokasi.php

            </div>

        `;


        btnKamera.disabled =
            false;


        btnKeluar.disabled =
            true;

    }

}


// =====================================================
// HITUNG JARAK GPS
// =====================================================

function hitungJarak(

    lat1,
    lon1,
    lat2,
    lon2

) {

    const R =
        6371000;


    const dLat =
        (
            lat2 -
            lat1
        )
        *
        Math.PI /
        180;


    const dLon =
        (
            lon2 -
            lon1
        )
        *
        Math.PI /
        180;


    const a =

        Math.sin(
            dLat / 2
        )
        *
        Math.sin(
            dLat / 2
        )

        +

        Math.cos(
            lat1 *
            Math.PI /
            180
        )

        *

        Math.cos(
            lat2 *
            Math.PI /
            180
        )

        *

        Math.sin(
            dLon / 2
        )

        *

        Math.sin(
            dLon / 2
        );


    const c =
        2 *
        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(
                1 - a
            )

        );


    return R * c;

}


// =====================================================
// MATIKAN KAMERA SAAT HALAMAN DITINGGALKAN
// =====================================================

window.addEventListener(
    "beforeunload",
    function () {

        if (
            cameraStream
        ) {

            cameraStream
                .getTracks()
                .forEach(
                    function (track) {

                        track.stop();

                    }
                );


            cameraStream =
                null;

        }

    }
);