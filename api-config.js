(function () {
    "use strict";

    // Konfigurasi API HokyaAttend
    const API_LOCAL =
        "http://localhost/absensi_backand/api";

    // Jika backend memakai tunnel ngrok TERPISAH,
    // isi URL backend ngrok di sini.
    // Jika kosong, diasumsikan frontend dan backend
    // memakai tunnel yang sama.
    const API_NGROK_TERPISAH = "";

    const sedangNgrok =
        window.location.hostname.includes("ngrok");

    const API_BASE = sedangNgrok
        ? (
            API_NGROK_TERPISAH.trim() !== ""
                ? API_NGROK_TERPISAH.replace(/\/+$/, "") + "/api"
                : window.location.origin + "/absensi_backand/api"
        )
        : API_LOCAL;

    window.HOKYA_API_BASE = API_BASE;

    // Simpan fetch asli supaya fungsi lama tetap digunakan.
    const fetchAsli = window.fetch.bind(window);

    // Daftar alamat localhost lama yang akan diarahkan.
    const polaLama = [
        /^https?:\/\/localhost\/absensi_backand\/api(?=\/|$)/i,
        /^https?:\/\/127\.0\.0\.1\/absensi_backand\/api(?=\/|$)/i,
        /^https?:\/\/localhost\/absensi_backend\/api(?=\/|$)/i,
        /^https?:\/\/127\.0\.0\.1\/absensi_backend\/api(?=\/|$)/i
    ];

    window.fetch = function (input, init) {
        let url;

        if (typeof input === "string") {
            url = input;
        } else if (input instanceof URL) {
            url = input.href;
        } else if (input instanceof Request) {
            url = input.url;
        } else {
            return fetchAsli(input, init);
        }

        let urlBaru = url;

        for (const pola of polaLama) {
            if (pola.test(urlBaru)) {
                urlBaru = urlBaru.replace(
                    pola,
                    API_BASE
                );
                break;
            }
        }

        // URL tidak berubah: jalankan fetch seperti semula.
        if (urlBaru === url) {
            return fetchAsli(input, init);
        }

        // Pertahankan method, headers, body, dan opsi Request.
        if (input instanceof Request) {
            const requestBaru = new Request(
                urlBaru,
                input
            );

            return fetchAsli(
                requestBaru,
                init
            );
        }

        return fetchAsli(urlBaru, init);
    };

    console.log(
        "[HokyaAttend] API aktif:",
        API_BASE
    );
})();