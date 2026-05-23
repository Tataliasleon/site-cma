const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration Cloudinary via variables d'environnement
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxi9v9f83',
    api_key: process.env.CLOUDINARY_API_KEY || '236683861214214',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'fWw1_qE83j9_Mv9HwEwD_vK2w_o'
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const upload = multer({ dest: '/tmp/' });
const DATA_FILE = path.join(__dirname, 'data.json');

if (!fs.existsSync(DATA_FILE) || fs.readFileSync(DATA_FILE, 'utf8').trim() === "") {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        logoSrc: "/images/logo.jpeg",
        carouselImages: [],
        texteAccueil: "Bienvenue au Centre Missionnaire Actes 1:8",
        vieEgliseTexte: "",
        lienYouTube: "",
        lienFacebook: "",
        coordonneesBancaires: "",
        mobileMoney: ""
    }, null, 2), 'utf8');
}

app.get('/api/data', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Erreur de lecture" });
        res.json(JSON.parse(data));
    });
});

app.post('/api/save-data', (req, res) => {
    fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

app.post('/api/upload-logo', upload.single('logoFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Aucun fichier" });
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'cma_logo' });
        res.json({ src: result.secure_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/upload-carousel', upload.array('carouselFiles', 15), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: "Aucun fichier" });
        
        const uploadPromises = req.files.map(file => cloudinary.uploader.upload(file.path, { folder: 'cma_carrousel' }));
        const results = await Promise.all(uploadPromises);
        const urls = results.map(r => r.secure_url);
        
        res.json({ srcs: urls });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
    console.log(`SERVEUR CMA LIVE SUR LE PORT ${PORT}`);
});
