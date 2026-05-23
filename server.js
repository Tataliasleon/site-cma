const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration de la taille limite pour éviter les blocages de requêtes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

const DATA_FILE = path.join(__dirname, 'data.json');

// CONFIGURATION CLOUDINARY
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cma_assets',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
});
const upload = multer({ storage: storage });

app.use(express.static(__dirname));

// 1. OBTENIR LES DONNÉES (FORCE SANS CACHE)
app.get('/api/data', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    if (fs.existsSync(DATA_FILE)) {
        const fileData = fs.readFileSync(DATA_FILE, 'utf-8');
        return res.json(JSON.parse(fileData));
    }
    res.json({
        logoSrc: "",
        carouselImages: [],
        texteAccueil: "Bienvenue au Centre Missionnaire Actes 1:8",
        vieEgliseTexte: "",
        lienYouTube: "",
        lienFacebook: "",
        coordonneesBancaires: "",
        mobileMoney: ""
    });
});

// 2. ENVOI DU LOGO UNIQUE
app.post('/api/upload-logo', upload.single('logoFile'), (req, res) => {
    if (req.file && req.file.path) {
        return res.json({ src: req.file.path });
    }
    res.status(400).json({ error: "Échec upload logo" });
});

// 3. ENVOI MULTIPLE DES PHOTOS DU CARROUSEL (SANS BUG)
app.post('/api/upload-carousel', upload.array('carouselFiles', 10), (req, res) => {
    try {
        if (req.files && req.files.length > 0) {
            const filePaths = req.files.map(file => file.path);
            return res.json({ srcs: filePaths });
        }
        res.json({ srcs: [] });
    } catch (err) {
        res.status(500).json({ error: "Erreur upload multiple" });
    }
});

// 4. SAUVEGARDE GLOBALE DU FORMULAIRE ET DES LIENS
app.post('/api/save-data', (req, res) => {
    try {
        const { 
            logoSrc, carouselImages, texteAccueil, vieEgliseTexte, 
            lienYouTube, lienFacebook, coordonneesBancaires, mobileMoney 
        } = req.body;

        const newData = {
            logoSrc: logoSrc || "",
            carouselImages: carouselImages || [],
            texteAccueil: texteAccueil || "",
            vieEgliseTexte: vieEgliseTexte || "",
            lienYouTube: lienYouTube || "",
            lienFacebook: lienFacebook || "",
            coordonneesBancaires: coordonneesBancaires || "",
            mobileMoney: mobileMoney || ""
        };

        fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf-8');
        res.json({ success: true, data: newData });
    } catch (err) {
        res.status(500).json({ error: "Erreur écriture" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));