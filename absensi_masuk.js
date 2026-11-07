// =====================================================
// ABSENSI MASUK - DIMSUM HOKYA
// VERSION DEBUG + FIX KAMERA + FOTO
// =====================================================

console.clear();

console.log("======================================");
console.log("ABSENSI MASUK JS DIMUAT");
console.log("======================================");


// =====================================================
// GLOBAL
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

let fotoBlob = null;
let fotoDiambil = false;

let idUser = null;


// =====================================================
// API
// =====================================================

const API_URL = "http://localhost/absensi_backand/api";


// =====================================================
// DOM READY
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("======================================");
    console.log("DOM READY");
    console.log("======================================");


    // =================================================
    // AMBIL ELEMENT
    // =================================================

    const statusLokasi =
        document.getElementById("statusLokasi");

    const statusAbsensi =
        document.getElementById("statusAbsensi");

    const mapElement =
        document.getElementById("map");

    const video =
        document.getElementById("video");

    const canvas =
        document.getElementById("canvas");

    const previewFoto =
        document.getElementById("previewFoto");

    const kameraPlaceholder =
        document.getElementById("kameraPlaceholder");

    const btnKamera =
        document.getElementById("btnKamera");

    const btnFoto =
        document.getElementById("btnFoto");

    const btnMasuk =
        document.getElementById("btnMasuk");


    console.log("ELEMENT:");
    console.log({
        statusLokasi,
        statusAbsensi,
        mapElement,
        video,
        canvas,
        previewFoto,
        kameraPlaceholder,
        btnKamera,
        btnFoto,
        btnMasuk
    });


    // =================================================
    // VALIDASI ELEMENT
    // =================================================

    if (!btnKamera) {
        console.error("❌ btnKamera TIDAK DITEMUKAN");
        return;
    }

    if (!btnFoto) {
        console.error("❌ btnFoto TIDAK DITEMUKAN");
        return;
    }

    if (!btnMasuk) {
        console.error("❌ btnMasuk TIDAK DITEMUKAN");
        return;
    }

    if (!video) {
        console.error("❌ video TIDAK DITEMUKAN");
        return;
    }

    if (!canvas) {
        console.error("❌ canvas TIDAK DITEMUKAN");
        return;
    }


    console.log("✅ Semua element utama ditemukan");


    // =================================================
    // AMBIL USER
    // =================================================

    try {

        const userStorage =
            localStorage.getItem("user");

        console.log(
            "localStorage user:",
            userStorage
        );


        if (userStorage) {

            const user =
                JSON.parse(userStorage);

            console.log(
                "DATA USER:",
                user
            );


            if (user.id_user) {

                idUser =
                    parseInt(user.id_user);

            }

        }

    } catch (error) {

        console.error(
            "❌ ERROR membaca user:",
            error
        );

    }


    // =================================================
    // FALLBACK
    // =================================================

    if (!idUser) {

        const storageId =
            localStorage.getItem("id_user");

        console.log(
            "Fallback id_user:",
            storageId
        );


        if (storageId) {

            idUser =
                parseInt(storageId);

        }

    }


    console.log(
        "ID USER FINAL:",
        idUser
    );


    // =================================================
    // VALIDASI LOGIN
    // =================================================

    if (!idUser || isNaN(idUser)) {

        console.error(
            "❌ ID USER TIDAK VALID"
        );


        statusLokasi.innerHTML =
            "❌ ID user tidak ditemukan.";


        statusAbsensi.innerHTML = `
            <div class="alert alert-danger">
                ❌ Data login tidak ditemukan.
                <br>
                Silakan login kembali.
            </div>
        `;


        btnKamera.disabled = true;
        btnFoto.disabled = true;
        btnMasuk.disabled = true;

        return;

    }


    // =================================================
    // RESET TOMBOL
    // =================================================

    btnKamera.disabled = true;
    btnFoto.disabled = true;
    btnMasuk.disabled = true;

    btnKamera.style.display = "inline-block";
    btnFoto.style.display = "none";
    btnMasuk.style.display = "none";


    console.log(
        "STATUS TOMBOL AWAL:",
        {
            btnKameraDisabled: btnKamera.disabled,
            btnFotoDisabled: btnFoto.disabled,
            btnMasukDisabled: btnMasuk.disabled
        }
    );


    // =================================================
    // STATUS
    // =================================================

    statusLokasi.innerHTML =
        "📍 Mendeteksi lokasi...";

    statusAbsensi.innerHTML =
        "⏳ Mengambil lokasi dan jadwal kerja...";


    // =================================================
    // EVENT TOMBOL KAMERA
    // =================================================

    btnKamera.addEventListener(
        "click",
        function () {

            console.log("======================================");
            console.log("🔥 BTN KAMERA DIKLIK");
            console.log("======================================");

            bukaKamera();

        }
    );


    // =================================================
    // EVENT TOMBOL FOTO
    // =================================================

    btnFoto.addEventListener(
        "click",
        function () {

            console.log("======================================");
            console.log("🔥 BTN FOTO DIKLIK");
            console.log("======================================");

            ambilFoto();

        }
    );


    // =================================================
    // EVENT ABSEN MASUK
    // =================================================

    btnMasuk.addEventListener(
        "click",
        function () {

            console.log("======================================");
            console.log("🔥 BTN ABSEN MASUK DIKLIK");
            console.log("======================================");

            prosesAbsenMasuk();

        }
    );


    // =================================================
    // CEK BROWSER
    // =================================================

    console.log(
        "navigator.mediaDevices:",
        navigator.mediaDevices
    );

    console.log(
        "getUserMedia:",
        navigator.mediaDevices
            ? navigator.mediaDevices.getUserMedia
            : null
    );


    // =================================================
    // GPS
    // =================================================

    if (!navigator.geolocation) {

        console.error(
            "❌ GEOLOCATION TIDAK DIDUKUNG"
        );


        statusLokasi.innerHTML =
            "❌ Browser tidak mendukung GPS.";

        return;

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            console.log(
                "======================================"
            );

            console.log(
                "✅ GPS BERHASIL"
            );

            console.log(
                position
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


            statusLokasi.innerHTML = `
                📍 Lokasi berhasil dideteksi
                <br>
                Latitude: ${userLat}
                <br>
                Longitude: ${userLng}
                <br>
                Akurasi: ${Math.round(userAccuracy)} meter
            `;


            // =================================================
            // MAP
            // =================================================

            if (mapElement) {

                buatPeta(
                    userLat,
                    userLng,
                    mapElement
                );

            }


            // =================================================
            // AMBIL JADWAL
            // =================================================

            ambilDataLokasi();

        },


        function (error) {

            console.error(
                "❌ GPS ERROR:",
                error
            );


            statusLokasi.innerHTML =
                "❌ Gagal mendapatkan lokasi.";


            statusAbsensi.innerHTML =
                "Silakan izinkan lokasi browser.";

        },


        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        }

    );


    // =====================================================
    // FUNGSI BUKA KAMERA
    // =====================================================

    async function bukaKamera() {

        console.log(
            "MULAI BUKA KAMERA..."
        );


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            console.error(
                "❌ getUserMedia tidak tersedia"
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Kamera tidak didukung.
                    <br>
                    Gunakan Chrome atau Edge.
                </div>
            `;

            return;

        }


        // =================================================
        // STOP CAMERA LAMA
        // =================================================

        if (cameraStream) {

            console.log(
                "Mematikan kamera lama..."
            );


            cameraStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            cameraStream = null;

        }


        statusAbsensi.innerHTML = `
            <div class="alert alert-info">
                📷 Meminta izin kamera...
            </div>
        `;


        try {

            console.log(
                "Memanggil getUserMedia..."
            );


            cameraStream =
                await navigator.mediaDevices.getUserMedia({

                    video: {
                        facingMode: "user",
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
                "======================================"
            );

            console.log(
                "✅ KAMERA BERHASIL DIBUKA"
            );

            console.log(
                cameraStream
            );


            // =================================================
            // PASANG STREAM
            // =================================================

            video.srcObject =
                cameraStream;


            video.style.display =
                "block";


            video.muted = true;

            video.autoplay = true;

            video.playsInline = true;


            if (previewFoto) {

                previewFoto.style.display =
                    "none";

            }


            if (kameraPlaceholder) {

                kameraPlaceholder.style.display =
                    "none";

            }


            // =================================================
            // TOMBOL
            // =================================================

            btnKamera.style.display =
                "none";

            btnKamera.disabled =
                true;


            btnFoto.style.display =
                "inline-block";

            btnFoto.disabled =
                false;


            btnMasuk.style.display =
                "none";

            btnMasuk.disabled =
                true;


            console.log(
                "STATUS BTN FOTO:",
                btnFoto.disabled
            );


            // =================================================
            // PLAY
            // =================================================

            await video.play();


            console.log(
                "✅ VIDEO PLAY"
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-success">
                    📷 Kamera berhasil dibuka.
                    <br>
                    Silakan ambil foto.
                </div>
            `;

        }


        catch (error) {

            console.error(
                "======================================"
            );

            console.error(
                "❌ CAMERA ERROR"
            );

            console.error(
                "NAME:",
                error.name
            );

            console.error(
                "MESSAGE:",
                error.message
            );

            console.error(
                error
            );


            let pesan =
                "Kamera gagal dibuka.";


            if (
                error.name ===
                "NotAllowedError"
            ) {

                pesan =
                    "Izin kamera ditolak browser.";

            }


            else if (
                error.name ===
                "NotFoundError"
            ) {

                pesan =
                    "Kamera tidak ditemukan.";

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
                "OverconstrainedError"
            ) {

                pesan =
                    "Konfigurasi kamera tidak didukung.";

            }


            else if (
                error.name ===
                "SecurityError"
            ) {

                pesan =
                    "Browser memblokir akses kamera.";

            }


            statusAbsensi.innerHTML = `
                <div class="alert alert-danger">
                    ❌ ${pesan}
                    <br><br>
                    Error:
                    ${error.name}
                </div>
            `;


            btnKamera.style.display =
                "inline-block";

            btnKamera.disabled =
                false;


            btnFoto.style.display =
                "none";

            btnFoto.disabled =
                true;

        }

    }


    // =====================================================
    // FUNGSI AMBIL FOTO
    // =====================================================

    function ambilFoto() {

        console.log(
            "MULAI AMBIL FOTO..."
        );


        console.log(
            "cameraStream:",
            cameraStream
        );


        console.log(
            "video.srcObject:",
            video.srcObject
        );


        console.log(
            "videoWidth:",
            video.videoWidth
        );


        console.log(
            "videoHeight:",
            video.videoHeight
        );


        if (!cameraStream) {

            console.error(
                "❌ cameraStream kosong"
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-warning">
                    ❌ Kamera belum aktif.
                </div>
            `;

            return;

        }


        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {

            console.error(
                "❌ VIDEO BELUM SIAP"
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-warning">
                    ⏳ Kamera belum siap.
                    <br>
                    Tunggu beberapa detik lalu coba lagi.
                </div>
            `;

            return;

        }


        // =================================================
        // CANVAS
        // =================================================

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        console.log(
            "✅ FRAME BERHASIL DIAMBIL"
        );


        // =================================================
        // PREVIEW
        // =================================================

        const fotoDataURL =
            canvas.toDataURL(
                "image/jpeg",
                0.9
            );


        console.log(
            "✅ DATA FOTO BERHASIL"
        );


        previewFoto.src =
            fotoDataURL;


        previewFoto.style.display =
            "block";


        video.style.display =
            "none";


        if (kameraPlaceholder) {

            kameraPlaceholder.style.display =
                "none";

        }


        // =================================================
        // BLOB
        // =================================================

        canvas.toBlob(

            function (blob) {

                if (!blob) {

                    console.error(
                        "❌ BLOB FOTO GAGAL"
                    );


                    statusAbsensi.innerHTML = `
                        <div class="alert alert-danger">
                            ❌ Foto gagal diproses.
                        </div>
                    `;

                    return;

                }


                fotoBlob =
                    blob;

                fotoDiambil =
                    true;


                console.log(
                    "======================================"
                );

                console.log(
                    "✅ FOTO BERHASIL DISIMPAN"
                );

                console.log(
                    "Blob:",
                    fotoBlob
                );

                console.log(
                    "Ukuran:",
                    fotoBlob.size
                );


                // =================================================
                // MATIKAN KAMERA
                // =================================================

                if (cameraStream) {

                    cameraStream
                        .getTracks()
                        .forEach(
                            track => track.stop()
                        );

                    cameraStream =
                        null;

                }


                video.srcObject =
                    null;


                // =================================================
                // TOMBOL
                // =================================================

                btnKamera.style.display =
                    "none";

                btnKamera.disabled =
                    true;


                btnFoto.style.display =
                    "none";

                btnFoto.disabled =
                    true;


                btnMasuk.style.display =
                    "inline-block";

                btnMasuk.disabled =
                    false;


                console.log(
                    "BTN MASUK:",
                    btnMasuk.disabled
                );


                statusAbsensi.innerHTML = `
                    <div class="alert alert-success">
                        ✅ Foto berhasil diambil.
                        <br>
                        Silakan tekan
                        <strong>Absen Masuk</strong>.
                    </div>
                `;

            },

            "image/jpeg",

            0.9

        );

    }


    // =====================================================
    // PROSES ABSEN
    // =====================================================

    async function prosesAbsenMasuk() {

        console.log(
            "======================================"
        );

        console.log(
            "MULAI PROSES ABSEN MASUK"
        );

        console.log(
            "======================================"
        );


        // =================================================
        // VALIDASI
        // =================================================

        if (
            userLat === null ||
            userLng === null
        ) {

            console.error(
                "❌ GPS belum tersedia"
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-warning">
                    ❌ Lokasi belum tersedia.
                </div>
            `;

            return;

        }


        if (
            outletLat === null ||
            outletLng === null ||
            outletRadius === null
        ) {

            console.error(
                "❌ DATA CABANG BELUM ADA"
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-warning">
                    ❌ Data cabang belum tersedia.
                </div>
            `;

            return;

        }


        if (
            !fotoDiambil ||
            !fotoBlob
        ) {

            console.error(
                "❌ FOTO BELUM ADA"
            );


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
            jarak
        );


        console.log(
            "RADIUS:",
            outletRadius
        );


        // =================================================
        // RADIUS
        // =================================================

        if (
            jarak >
            outletRadius
        ) {

            statusAbsensi.innerHTML = `
                <div class="alert alert-danger">

                    ❌ Anda berada di luar area absensi.

                    <br><br>

                    Cabang:
                    <strong>
                        ${outletData.nama_cabang}
                    </strong>

                    <br>

                    Jarak:
                    <strong>
                        ${Math.round(jarak)}
                        meter
                    </strong>

                    <br>

                    Radius:
                    <strong>
                        ${outletRadius}
                        meter
                    </strong>

                </div>
            `;

            return;

        }


        // =================================================
        // DISABLE
        // =================================================

        btnMasuk.disabled =
            true;


        statusAbsensi.innerHTML = `
            <div class="alert alert-info">
                ⏳ Menyimpan absensi...
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
            "foto_absensi.jpg"
        );


        console.log(
            "FORM DATA SIAP"
        );


        console.log(
            "API:",
            `${API_URL}/auth/absensi/checkin.php`
        );


        // =================================================
        // FETCH
        // =================================================

        try {

            const response =
                await fetch(
                    `${API_URL}/auth/absensi/checkin.php`,
                    {
                        method: "POST",
                        body: formData
                    }
                );


            console.log(
                "HTTP STATUS:",
                response.status
            );


            const text =
                await response.text();


            console.log(
                "RESPONSE SERVER:",
                text
            );


            let result;


            try {

                result =
                    JSON.parse(text);

            }

            catch (error) {

                console.error(
                    "❌ RESPONSE BUKAN JSON"
                );


                statusAbsensi.innerHTML = `
                    <div class="alert alert-danger">
                        ❌ Server memberikan response tidak valid.
                        <br><br>
                        HTTP:
                        ${response.status}
                    </div>
                `;


                btnMasuk.disabled =
                    false;

                return;

            }


            console.log(
                "HASIL JSON:",
                result
            );


            if (!result.success) {

                console.error(
                    "❌ ABSEN GAGAL:",
                    result.message
                );


                statusAbsensi.innerHTML = `
                    <div class="alert alert-danger">
                        ❌ ${
                            result.message ||
                            "Absensi gagal."
                        }
                    </div>
                `;


                btnMasuk.disabled =
                    false;

                return;

            }


            // =================================================
            // SUKSES
            // =================================================

            console.log(
                "======================================"
            );

            console.log(
                "✅ ABSENSI BERHASIL"
            );

            console.log(
                result
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-success">

                    ✅ ${
                        result.message ||
                        "Check-in berhasil."
                    }

                    <br><br>

                    <strong>Cabang:</strong>
                    ${
                        result.data?.nama_cabang ||
                        outletData.nama_cabang ||
                        "-"
                    }

                    <br>

                    <strong>Shift:</strong>
                    ${
                        result.data?.nama_shift ||
                        outletData.nama_shift ||
                        "-"
                    }

                    <br>

                    <strong>Jam masuk:</strong>
                    ${
                        result.data?.jam_masuk ||
                        "-"
                    }

                    <br>

                    <strong>Jarak:</strong>
                    ${
                        result.data?.jarak_meter ??
                        Math.round(jarak)
                    }
                    meter

                </div>
            `;


            btnMasuk.disabled =
                true;

            btnKamera.disabled =
                true;

            btnFoto.disabled =
                true;

        }


        catch (error) {

            console.error(
                "❌ FETCH CHECKIN ERROR:",
                error
            );


            statusAbsensi.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Tidak dapat terhubung ke server.
                    <br><br>
                    ${error.message}
                </div>
            `;


            btnMasuk.disabled =
                false;

        }

    }


    // =====================================================
    // AMBIL DATA LOKASI
    // =====================================================

    async function ambilDataLokasi() {

        console.log(
            "======================================"
        );

        console.log(
            "MENGAMBIL DATA LOKASI"
        );

        console.log(
            "======================================"
        );


        try {

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
                "LOKASI HTTP:",
                response.status
            );


            const text =
                await response.text();


            console.log(
                "LOKASI RESPONSE:",
                text
            );


            let result;


            try {

                result =
                    JSON.parse(text);

            }

            catch (error) {

                console.error(
                    "❌ LOKASI BUKAN JSON"
                );


                statusLokasi.innerHTML =
                    "❌ Response lokasi tidak valid.";

                return;

            }


            console.log(
                "DATA LOKASI:",
                result
            );


            if (!result.success) {

                console.error(
                    "❌ JADWAL TIDAK ADA:",
                    result.message
                );


                statusLokasi.innerHTML =
                    "❌ " +
                    (
                        result.message ||
                        "Jadwal tidak ditemukan."
                    );


                statusAbsensi.innerHTML = `
                    <div class="alert alert-danger">
                        ❌ Jadwal kerja hari ini tidak ditemukan.
                    </div>
                `;


                return;

            }


            // =================================================
            // SIMPAN DATA
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
                "OUTLET LAT:",
                outletLat
            );

            console.log(
                "OUTLET LNG:",
                outletLng
            );

            console.log(
                "OUTLET RADIUS:",
                outletRadius
            );


            if (
                isNaN(outletLat) ||
                isNaN(outletLng) ||
                isNaN(outletRadius)
            ) {

                console.error(
                    "❌ KOORDINAT CABANG TIDAK VALID"
                );


                statusAbsensi.innerHTML = `
                    <div class="alert alert-danger">
                        ❌ Data koordinat cabang tidak valid.
                    </div>
                `;

                return;

            }


            // =================================================
            // MARKER
            // =================================================

            if (map) {

                outletMarker =
                    L.marker([
                        outletLat,
                        outletLng
                    ])
                    .addTo(map)
                    .bindPopup(
                        `
                        <b>
                            ${outletData.nama_cabang}
                        </b>
                        <br>
                        Shift:
                        ${outletData.nama_shift}
                        `
                    );


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
                    .addTo(map);


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
                            [40, 40]
                    }
                );

            }


            // =================================================
            // JARAK
            // =================================================

            const jarak =
                hitungJarak(
                    userLat,
                    userLng,
                    outletLat,
                    outletLng
                );


            statusLokasi.innerHTML = `

                📍 <strong>
                    ${outletData.nama_cabang}
                </strong>

                <br>

                👤 ${outletData.nama_karyawan}

                <br>

                🗓️ ${outletData.tanggal}

                <br>

                🔄 Shift:
                <strong>
                    ${outletData.nama_shift}
                </strong>

                <br>

                ⏰ Jam:
                <strong>
                    ${outletData.jam_shift || "-"}
                </strong>

                <br>

                📏 Jarak:
                <strong>
                    ${Math.round(jarak)} meter
                </strong>

            `;


            // =================================================
            // KAMERA
            // =================================================

            if (
                jarak <=
                outletRadius
            ) {

                console.log(
                    "✅ DALAM RADIUS"
                );


                statusAbsensi.innerHTML = `
                    <div class="alert alert-success">
                        ✅ Anda berada di area absensi.
                        <br>
                        📷 Kamera siap digunakan.
                    </div>
                `;


                btnKamera.disabled =
                    false;


                btnKamera.style.display =
                    "inline-block";


                console.log(
                    "BTN KAMERA AKTIF:",
                    btnKamera.disabled
                );

            }


            else {

                console.log(
                    "⚠️ DI LUAR RADIUS"
                );


                statusAbsensi.innerHTML = `
                    <div class="alert alert-warning">
                        ⚠️ Anda berada di luar radius absensi.
                        <br><br>
                        Cabang:
                        <strong>
                            ${outletData.nama_cabang}
                        </strong>

                        <br>

                        Jarak:
                        <strong>
                            ${Math.round(jarak)}
                            meter
                        </strong>

                        <br>

                        Radius:
                        <strong>
                            ${outletRadius}
                            meter
                        </strong>
                    </div>
                `;


                // Tetap bisa membuka kamera
                btnKamera.disabled =
                    false;

                btnKamera.style.display =
                    "inline-block";

            }

        }


        catch (error) {

            console.error(
                "❌ ERROR AMBIL LOKASI:",
                error
            );


            statusLokasi.innerHTML =
                "❌ Tidak dapat mengambil data lokasi.";

            statusAbsensi.innerHTML =
                "❌ Periksa lokasi.php dan database.";

        }

    }

});


// =====================================================
// BUAT PETA
// =====================================================

function buatPeta(
    latitude,
    longitude,
    mapElement
) {

    console.log(
        "MEMBUAT PETA..."
    );


    if (
        typeof L ===
        "undefined"
    ) {

        console.error(
            "❌ LEAFLET TIDAK ADA"
        );

        return;

    }


    if (map) {

        map.remove();

        map = null;

    }


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


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    userMarker =
        L.marker([
            latitude,
            longitude
        ])
        .addTo(map)
        .bindPopup(
            "📍 Lokasi Anda"
        );


    userAccuracyCircle =
        L.circle(
            [
                latitude,
                longitude
            ],
            {
                radius:
                    userAccuracy || 30
            }
        )
        .addTo(map);


    console.log(
        "✅ PETA BERHASIL"
    );

}


// =====================================================
// HITUNG JARAK
// =====================================================

function hitungJarak(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;


    const dLat =
        (
            lat2 - lat1
        ) *
        Math.PI /
        180;


    const dLon =
        (
            lon2 - lon1
        ) *
        Math.PI /
        180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

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

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


// =====================================================
// MATIKAN KAMERA SAAT KELUAR
// =====================================================

window.addEventListener(
    "beforeunload",
    function () {

        console.log(
            "MENUTUP HALAMAN - STOP CAMERA"
        );


        if (cameraStream) {

            cameraStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            cameraStream =
                null;

        }

    }
);9