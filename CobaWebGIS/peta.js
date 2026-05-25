/* ═══════════════════════════════════════════════════════════════════════════
   DAFTAR FILE GEOJSON PER BLOK
   → Kalau ada blok baru, tinggal tambahkan nama file ke array ini.
   → Warna akan dipilih otomatis dari palet BLOK_COLORS.
   ═══════════════════════════════════════════════════════════════════════════ */
var BLOK_FILES = [
    { file: 'C1_KAI_FIX.geojson', type: 'nisan' },
    {file:'B1n.geojson',type: 'nisan'},
    { file : 'C2_KAI_FIX.geojson', type: 'nisan'},
    {file :'C4_KAI_FIX.geojson', type: 'nisan'},
    {file :'C3n.geojson', type: 'nisan'},
    {file :'C5_KAI_FIX.geojson', type: 'nisan'},
    {file :'c6n.geojson', type: 'nisan'},
    {file :'D1n.geojson', type: 'nisan'},
    {file :'D6n.geojson', type: 'nisan'},
    {file :'B2n.geojson', type: 'nisan'},
    {file :'B3n.geojson', type: 'nisan'},
    {file :'B4n.geojson', type: 'nisan'},
    {file :'B5n.geojson', type: 'nisan'},
    {file :'B6n.geojson', type: 'nisan'},
    {file :'D2n.geojson', type: 'nisan'},
    {file :'D3n.geojson', type: 'nisan'},
    {file :'D4n.geojson', type: 'nisan'},
    {file :'D5n.geojson', type: 'nisan'},
    { file:'A1.geojson', type: 'nisan'},
    {file: 'A2.geojson', type: 'nisan'},
    {file :'e1n.geojson', type: 'nisan'},
    {file:'A1b.geojson', type: 'blok'},
    {file:'A2b.geojson',type: 'blok'},
    {file:'B1.geojson',type: 'blok'},
    {file:'B2.geojson',type: 'blok'},
    {file:'B3.geojson',type: 'blok'},
    {file:'B4t.geojson',type: 'blok'},
    {file:'B5t.geojson',type: 'blok'},
    {file:'B6t.geojson',type: 'blok'},
    {file:'C1.geojson',type: 'blok'},
    {file:'C2.geojson',type: 'blok'},
    {file:'C3.geojson',type: 'blok'},
    {file:'C4.geojson',type: 'blok'},
    {file:'C5.geojson',type: 'blok'},
    {file:'C6.geojson',type: 'blok'},
    {file:'D1.geojson',type: 'blok'},
    {file:'D2.geojson',type: 'blok'},
    {file:'D3.geojson',type: 'blok'},
    {file:'D4.geojson',type: 'blok'},
    {file:'D5.geojson',type: 'blok'},
    {file:'D6.geojson',type: 'blok'},
     {file:'E1.geojson',type: 'blok'}
    // tambahkan file baru di sini, contoh:
    // 'C3_KAI.geojson',
    // 'D1_KAI.geojson',
];

/* Palet warna per blok (dipakai berurutan sesuai urutan BLOK_FILES) */
var BLOK_COLORS = [
    '#e63946',
    '#7095ce', // merah
    '#2196f3', // biru
    '#4caf50', // hijau
    '#ff9800', // oranye
    '#9c27b0', // ungu
    '#00bcd4', // cyan
    '#ff5722', // deep orange
    '#607d8b', // blue grey
    '#8bc34a', // light green
    '#f06292', // pink
    
];

/* ── MAP ─────────────────────────────────────────────────────────────────── */
var map = L.map('map', {
    maxBounds: [[-7.2950, 112.7032], [-7.2860, 112.7129]],
    maxBoundsViscosity: 1.0,
    minZoom: 19, maxZoom: 25
}).setView([-7.289534237418184, 112.70834801662886], 20);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri', maxZoom: 25, maxNativeZoom: 19
}).addTo(map);

// FOTO UDARA
var imageBounds = [
    [-7.2949026979999996, 112.7032717019999950],
    [-7.2860021709999998, 112.7128668109999978]
];

var imageOverlay = L.imageOverlay("images/fotodrone.jpg", imageBounds, {
    opacity: 0.7
}).addTo(map);

// 🔥 BOUNDS FOTO (ISI DARI HASIL QGIS EPSG:4326)
var imageBounds = [
   [-7.2949026979999996, 112.7032717019999950],
    [-7.2860021709999998, 112.7128668109999978]
];

// FOTO UDARA
var imageOverlay = L.imageOverlay("images/fotodrone.jpg", imageBounds, {
    opacity: 0.7
}).addTo(map);

/* ── STATE ───────────────────────────────────────────────────────────────── */
var selFeatures   = [];
var curIdx        = 0;
var lastHL        = null;
var allItems      = [];
var layerBlok     = [];   // array of L.geoJSON layers (blok)
var layerNisan    = [];   // array of L.geoJSON layers (nisan)
var activeLayer   = 'blok'; // 'blok' | 'nisan'

/* ── HELPER: ambil nilai properti dengan fallback key ────────────────────── */
function gp(p, keys) {
    for (var i = 0; i < keys.length; i++) {
        var v = p[keys[i]];
        if (v !== undefined && v !== null && v !== '') return v;
    }
    return '—';
}

/* ── HELPER: reset highlight ke warna asli blok ──────────────────────────── */
function resetHL(layer) {
    if (!layer) return;
    var c = layer._blokColor || '#888888';
    layer.setStyle({ color: c, weight: 1.5, fillColor: c, fillOpacity: 0.55 });
}

/* ── RENDER PANEL INFO ───────────────────────────────────────────────────── */
function renderPanel(f, blokColor) {
    var p = f.properties;

    var nama     = gp(p, ['Nama', 'nama', 'NAMA']);
    var blok     = gp(p, ['Blok', 'blok', 'BLOK']);
    var noReg    = gp(p, ['Nomor_Register_Makam', 'Nomor_Register_Makam']);
    var nrp      = gp(p, ['NRP']);
    var pangkat  = gp(p, ['Pangkat', 'pangkat', 'PANGKAT']);
    var jk       = gp(p, ['Jenis_Kelamin', 'jenis_kelamin']);
    var agama    = gp(p, ['Agama', 'agama']);
    var tglLahir = gp(p, ['Tanggal_Lahir', 'tgl_lahir', 'Tgl_Lahir']);
    var tglWafat = gp(p, ['Tanggal_Wafat', 'Tgl_Wafat', 'tgl_wafat']);

    // chip satuan
    var satuan = [];
    if (p['TNI_AD'] && p['TNI_AD'] !== '' && p['TNI_AD'] !== '0') satuan.push('TNI AD');
    if (p['TNI_AL'] && p['TNI_AL'] !== '' && p['TNI_AL'] !== '0') satuan.push('TNI AL');
    if (p['TNI_AU'] && p['TNI_AU'] !== '' && p['TNI_AU'] !== '0') satuan.push('TNI AU');
    if (p['Polri']  && p['Polri']  !== '' && p['Polri']  !== '0') satuan.push('POLRI');
    if (p['Pejuang'] && p['Pejuang'] !== '' && p['Pejuang'] !== '0') satuan.push('Pejuang');
    if (p['Tokoh_Nasional/Daerah'] && p['Tokoh_Nasional/Daerah'] !== '' && p['Tokoh_Nasional/Daerah'] !== '0') satuan.push('Tokoh Nasional');
    if (p['Pahlawan_Tidak_dikenal'] && p['Pahlawan_Tidak_dikenal'] !== '' && p['Pahlawan_Tidak_dikenal'] !== '0') satuan.push('Pahlawan Tidak Dikenal');

    var chipHtml = satuan.length
        ? '<div class="chip-row">' + satuan.map(function(s){ return '<span class="chip">' + s + '</span>'; }).join('') + '</div>'
        : '';

    var badgeColor = blokColor || layer._blokColor || '#888';

    document.getElementById('panelSub').textContent = blok !== '—' ? 'Blok ' + blok : '—';

    document.getElementById('panelBody').innerHTML =
        '<div style="padding:10px 14px 4px;">' +
            (blok !== '—'
                ? '<span class="blok-badge" style="background:' + badgeColor + '">BLOK ' + blok + '</span>'
                : '') +
        '</div>' +
        '<div class="nama-besar">' + nama + '</div>' +

        '<div class="divider"></div>' +

        '<div class="info-section">' +
            '<div class="info-label">No. Register Makam</div>' +
            '<div class="info-value">' + noReg + '</div>' +
        '</div>' +

        '<div class="info-grid">' +
            '<div class="info-section"><div class="info-label">NRP</div><div class="info-value">' + nrp + '</div></div>' +
            '<div class="info-section"><div class="info-label">Pangkat</div><div class="info-value">' + pangkat + '</div></div>' +
        '</div>' +

        '<div class="info-grid">' +
            '<div class="info-section"><div class="info-label">Jenis Kelamin</div><div class="info-value">' + jk + '</div></div>' +
            '<div class="info-section"><div class="info-label">Agama</div><div class="info-value">' + agama + '</div></div>' +
        '</div>' +

        '<div class="info-grid">' +
            '<div class="info-section"><div class="info-label">Tanggal Lahir</div><div class="info-value">' + tglLahir + '</div></div>' +
            '<div class="info-section"><div class="info-label">Tanggal Wafat</div><div class="info-value">' + tglWafat + '</div></div>' +
        '</div>' +

        (chipHtml
            ? '<div class="info-section"><div class="info-label">Satuan</div>' + chipHtml + '</div>'
            : '');
}

/* ── RENDER PANEL DAFTAR (mode blok) ── */
function renderDaftarPanel(items, blokColor, blokNama) {
    document.getElementById('panelSub').textContent = blokNama || '—';

    var listHtml = items.map(function(item, i) {
        var p       = item.feature.properties;
        var nama    = gp(p, ['Nama','nama','NAMA']);
        var pangkat = gp(p, ['Pangkat','pangkat','PANGKAT']);
        return '<div class="makam-list-item">' +
            '<div class="makam-list-info">' +
                '<div class="makam-list-nama">' + nama + '</div>' +
                (pangkat !== '—' ? '<div class="makam-list-sub">' + pangkat + '</div>' : '') +
            '</div>' +
            '<button class="makam-fly-btn" data-i="' + i + '" style="background:linear-gradient(135deg,' + blokColor + ',' + blokColor + 'cc)">📍 Lihat</button>' +
        '</div>';
    }).join('');

    document.getElementById('panelBody').innerHTML =
        '<div style="padding:14px 18px 6px;">' +
            '<span class="blok-badge" style="background:' + blokColor + '">' + blokNama + '</span>' +
        '</div>' +
        '<div class="daftar-title">Daftar Makam</div>' +
        '<div class="makam-list">' + listHtml + '</div>';

    // Tombol 📍 Lihat — fly ke nisan
    document.querySelectorAll('.makam-fly-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var i    = parseInt(this.getAttribute('data-i'));
            var item = items[i];
            try { map.fitBounds(item.layer.getBounds(), { maxZoom: 23, padding: [60, 60] }); } catch(err) {}
            resetHL(lastHL);
            item.layer.setStyle({ color: '#ffffff', weight: 2.5, fillColor: blokColor, fillOpacity: 0.9 });
            lastHL = item.layer;
        });
    });

    // Klik nama → detail
    document.querySelectorAll('.makam-list-item').forEach(function(el, i) {
        el.addEventListener('click', function(ev) {
            if (ev.target.classList.contains('makam-fly-btn')) return;
            renderPanel(items[i].feature, blokColor);
        });
    });
}

function openPanel(features, title, color, idx) {
    selFeatures        = features;
    curIdx             = idx || 0;
    var _color         = color || '#888';
    document.getElementById('panelTitle').textContent = title || 'Informasi Makam';
    document.getElementById('sidePanel').classList.add('open');
    renderPanel(selFeatures[curIdx], _color);
    updateNav();
}

function updateNav() {
    var total = selFeatures.length;
    var row   = document.getElementById('navRow');
    if (total > 1) {
        row.style.display = 'flex';
        document.getElementById('navCount').textContent = (curIdx + 1) + ' dari ' + total;
        document.getElementById('navPrev').disabled = curIdx === 0;
        document.getElementById('navNext').disabled = curIdx === total - 1;
    } else {
        row.style.display = 'none';
    }
}

document.getElementById('navPrev').addEventListener('click', function () {
    if (curIdx > 0) { curIdx--; renderPanel(selFeatures[curIdx]); updateNav(); }
});
document.getElementById('navNext').addEventListener('click', function () {
    if (curIdx < selFeatures.length - 1) { curIdx++; renderPanel(selFeatures[curIdx]); updateNav(); }
});
document.getElementById('closePanel').addEventListener('click', function () {
    document.getElementById('sidePanel').classList.remove('open');
    resetHL(lastHL); lastHL = null;
});
map.on('click', function () {
    document.getElementById('sidePanel').classList.remove('open');
    resetHL(lastHL); lastHL = null;
});

/* ── TOGGLE LAYER VISIBILITY ── */
function setActiveLayer(type) {
    activeLayer = type;
    layerBlok.forEach(function(l)  { type === 'blok'  ? map.addLayer(l) : map.removeLayer(l); });
    layerNisan.forEach(function(l) { type === 'nisan' ? map.addLayer(l) : map.removeLayer(l); });
    document.getElementById('toggleBlok').classList.toggle('active',  type === 'blok');
    document.getElementById('toggleNisan').classList.toggle('active', type === 'nisan');

    // Hanya tutup panel kalau bukan dari search
    if (!window._fromSearch) {
        document.getElementById('sidePanel').classList.remove('open');
        resetHL(lastHL); lastHL = null;
    }
}

/* ── RENDER PANEL INFO BLOK (otomatis dari data nisan) ── */
function renderInfoBlok(blokNama, blokColor, props) {
    var blokKey      = props.Blok             || blokNama.replace('BLOK ', '').trim();
    var jumlah       = props.Jumlah_Makam     || 0;
    var dominanAgama = props.Agama_Dominan    || '—';
    var dominanTahun = props.Tahun_Wafat_Dominan || '—';

    var emoji = dominanAgama === 'Islam' ? '🕌' : '⛪';

    var paragraf = jumlah > 0
        ? 'Blok <strong>' + blokKey + '</strong> memiliki <strong>' + jumlah + ' makam</strong>. ' +
          'Mayoritas pahlawan yang dimakamkan di blok ini beragama <strong>' + dominanAgama + '</strong>. ' +
          'Tahun wafat terbanyak tercatat pada tahun <strong>' + dominanTahun + '</strong>.'
        : 'Data untuk blok <strong>' + blokKey + '</strong> belum tersedia.';

    document.getElementById('panelSub').textContent = 'Blok ' + blokKey;
    document.getElementById('panelBody').innerHTML =
        '<div style="padding:16px 18px 8px;">' +
            '<span class="blok-badge" style="background:' + blokColor + '">BLOK ' + blokKey + '</span>' +
        '</div>' +

        '<div class="blok-stats">' +
            '<div class="blok-stat-card">' +
                '<div class="blok-stat-icon">⚰️</div>' +
                '<div class="blok-stat-val">' + jumlah + '</div>' +
                '<div class="blok-stat-lbl">Total Makam</div>' +
            '</div>' +
            '<div class="blok-stat-card">' +
                '<div class="blok-stat-icon">' + emoji + '</div>' +
                '<div class="blok-stat-val" style="font-size:13px">' + dominanAgama + '</div>' +
                '<div class="blok-stat-lbl">Agama Dominan</div>' +
            '</div>' +
            '<div class="blok-stat-card">' +
                '<div class="blok-stat-icon">📅</div>' +
                '<div class="blok-stat-val" style="font-size:14px">' + dominanTahun + '</div>' +
                '<div class="blok-stat-lbl">Tahun Terbanyak</div>' +
            '</div>' +
        '</div>' +

        '<div class="divider"></div>' +

        '<div class="blok-paragraf">' +
            '<div class="info-label" style="margin-bottom:8px">Ringkasan Blok</div>' +
            '<p class="blok-para-text">' + paragraf + '</p>' +
        '</div>' +

        '<div style="padding:14px 18px;">' +
            '<button class="lihat-nisan-btn" style="background:linear-gradient(135deg,#0f1e2e,#1e3a5f);border-left:4px solid ' + blokColor + '"' +
            ' onclick="setActiveLayer(\'nisan\')">' +
            '🪦 Lihat Nisan di Blok Ini' +
            '</button>' +
        '</div>';
}

/* ── LOADER ── */
var colorIdx = 0;
BLOK_FILES.forEach(function(cfg) {
    var color = BLOK_COLORS[colorIdx % BLOK_COLORS.length];
    colorIdx++;
    var isNisan = cfg.type === 'nisan';

    fetch(cfg.file)
    .then(function(r) {
        if (!r.ok) throw new Error(cfg.file + ' tidak ditemukan');
        return r.json();
    })
    .then(function(data) {
        // Kumpulkan semua item dalam file ini untuk mode daftar (blok)
        var fileItems = [];

        var lyr = L.geoJSON(data, {
            style: {
                color:       color,
                weight:      isNisan ? 1 : 1.5,
                fillColor:   color,
                fillOpacity: isNisan ? 0.6 : 0.5
            },
            onEachFeature: function(feature, sublyr) {
                sublyr._blokColor = color;
                allItems.push({ feature: feature, layer: sublyr, color: color });
                if (!isNisan) fileItems.push({ feature: feature, layer: sublyr, color: color });

                sublyr.on('click', function(e) {
                    L.DomEvent.stopPropagation(e);
                    resetHL(lastHL);
                    sublyr.setStyle({ color: '#ffffff', weight: 2.5, fillColor: color, fillOpacity: 0.9 });
                    lastHL = sublyr;

                    if (isNisan) {
                        // Mode nisan → langsung detail
                        document.getElementById('panelTitle').textContent = 'Informasi Makam';
                        document.getElementById('sidePanel').classList.add('open');
                        renderPanel(feature, color);
                        document.getElementById('navRow').style.display = 'none';
                   } else {
    // Mode blok → zoom otomatis + info blok
    try {
        map.fitBounds(sublyr.getBounds(), { maxZoom: 21, padding: [60, 60] });
    } catch(e) {}
    var blokKey  = gp(feature.properties, ['Blok','blok','BLOK']);
    var blokNama = 'BLOK ' + (blokKey !== '—' ? blokKey : cfg.file.replace('.geojson','').replace(/[bt]$/i,'').toUpperCase());
    document.getElementById('panelTitle').textContent = 'Informasi Blok';
    document.getElementById('sidePanel').classList.add('open');
    renderInfoBlok(blokNama, color, feature.properties);
    document.getElementById('navRow').style.display = 'none';

                    }
                });

                sublyr.on('mouseover', function() {
                    if (lastHL !== sublyr) sublyr.setStyle({ fillOpacity: 0.85, weight: 2.5 });
                });
                sublyr.on('mouseout', function() {
                    if (lastHL !== sublyr) sublyr.setStyle({ color: color, weight: isNisan ? 1 : 1.5, fillColor: color, fillOpacity: isNisan ? 0.6 : 0.5 });
                });
            }
        });

        if (isNisan) {
            layerNisan.push(lyr);
            map.removeLayer(lyr); // nisan hidden by default
        } else {
            layerBlok.push(lyr);
            lyr.addTo(map);       // blok visible by default
        }

        lyr.bringToFront();
        map.fitBounds(imageBounds);
    })
    .catch(function(e) { console.warn('Gagal load', cfg.file, ':', e.message); });
});

/* ── SEARCH ── */
var searchInput   = document.getElementById('searchInput');
var searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', function () {
    var q = this.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    if (q.length < 2) { searchResults.style.display = 'none'; return; }

    var hits = allItems.filter(function(item) {
    var p = item.feature.properties;
    var n = (p.Nama || p.nama || p.NAMA || '').toString().toLowerCase();
    var r = (p.NRP  || p.nrp  || '').toString().toLowerCase();
    var g = (p.Nomor_Register_Makam || '').toString().toLowerCase();
    return n.includes(q) || r.includes(q) || g.includes(q);
});

    if (!hits.length) {
        searchResults.innerHTML = '<div class="no-result">Tidak ditemukan</div>';
        searchResults.style.display = 'block';
        return;
    }

    hits.slice(0, 15).forEach(function(item) {
        var p       = item.feature.properties;
        var nama    = gp(p, ['Nama','nama','NAMA']);
        var nrp     = gp(p, ['NRP','nrp']);
        var blok    = gp(p, ['Blok','blok','BLOK']);
        var pangkat = gp(p, ['Pangkat','pangkat','PANGKAT']);

        var d = document.createElement('div');
        d.className = 'result-item';
        d.innerHTML =
            '<span class="result-dot" style="background:' + item.color + '"></span>' +
            '<div>' +
                '<div class="r-nama">' + nama + '</div>' +
                '<div class="r-sub">' +
                    [pangkat !== '—' ? pangkat : '',
                     nrp     !== '—' ? 'NRP: ' + nrp : '',
                     blok    !== '—' ? 'Blok ' + blok : '']
                    .filter(Boolean).join(' · ') +
                '</div>' +
            '</div>';

       d.addEventListener('click', function() {
    searchResults.style.display = 'none';
    searchInput.value = gp(item.feature.properties, ['Nama','nama','NAMA']);

    window._fromSearch = true;        // ← tandai dari search
    setActiveLayer('nisan');
    window._fromSearch = false;       // ← reset flag

    setTimeout(function() {
        resetHL(lastHL);
        try { 
            map.fitBounds(item.layer.getBounds(), { maxZoom: 22, padding: [80, 80] }); 
        } catch(e) { console.warn(e); }
        item.layer.setStyle({ color: '#ffffff', weight: 2.5, fillColor: item.color, fillOpacity: 0.9 });
        lastHL = item.layer;
        document.getElementById('panelTitle').textContent = 'Informasi Makam';
        document.getElementById('sidePanel').classList.add('open');
        renderPanel(item.feature, item.color);
        document.getElementById('navRow').style.display = 'none';
    }, 150);
});

        searchResults.appendChild(d);
    });

    searchResults.style.display = 'block';
});

document.addEventListener('click', function(e) {
    if (!document.getElementById('searchBox').contains(e.target)) {
        searchResults.style.display = 'none';
    }
});