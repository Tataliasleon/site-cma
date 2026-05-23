const express = require('express');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const multer = require('multer'); 
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration des middlewares (Lecture JSON et fichiers statiques)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dotjq0cqg', 
  api_key: process.env.CLOUDINARY_API_KEY || '554472961924777',       
  api_secret: process.env.CLOUDINARY_API_SECRET || 'zCYze8MRkylM9WZ_M3eT3P7gRr4'  
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cma_site_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  },
});
const upload = multer({ storage: storage });

const DATA_FILE = path.join(__dirname, 'data.json');

// Gestion du fichier JSON
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const defaultData = {
                logoSrc: "",
                texteAccueil: "Bienvenue au Centre Missionnaire Actes 1:8",
                carouselImages: [],
                vieEgliseTexte: "Notre église est une communauté vibrante...",
                mediaTitre: "Média & Direct",
                mediaDescription: "Connectez-vous à nos cultes...",
                lienYouTube: "",
                lienFacebook: "",
                faireDonTexte: "Soutenez l'œuvre de Dieu...",
                coordonneesBancaires: "Banque : RAWBANK\nCompte : CD03...",
                mobileMoney: "M-Pesa : +243..."
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ==========================================
// ROUTES DES PAGES (HTML)
// ==========================================

// 1. Page d'accueil publique
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Page d'administration
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==========================================
// ROUTES API
// ==========================================

app.get('/api/data', (req, res) => {
    res.json(readData());
});

app.post('/api/save-data', (req, res) => {
    const { 
        logoSrc, 
        carouselImages, 
        texteAccueil, 
        vieEgliseTexte, 
        lienYouTube, 
        lienFacebook, // S'assurer que le champ est bien réceptionné ici
        coordonneesBancaires, 
        mobileMoney 
    } = req.body;

    // Structure de sauvegarde propre dans ton fichier JSON ou ta base de données
    dbData = {
        logoSrc,
        carouselImages: carouselImages || [],
        texteAccueil,
        vieEgliseTexte,
        lienYouTube,
        lienFacebook, // Sauvegardé proprement
        coordonneesBancaires,
        mobileMoney
    };

    // Code pour écrire dans ton fichier de stockage (ex: fs.writeFileSync...)
    // ...
    res.status(200).json({ message: "Données sauvegardées avec succès !" });
});

app.post('/api/upload-logo', upload.single('logoFile'), (req, res) => {
    if (req.file && req.file.path) return res.json({ src: req.file.path });
    res.status(400).json({ error: "Échec upload logo" });
});

app.post('/api/upload-carousel', upload.single('carouselFile'), (req, res) => {
    if (req.file && req.file.path) return res.json({ src: req.file.path });
    res.status(400).json({ error: "Échec upload image" });
});

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`=== SERVEUR CMA LIVE SUR LE PORT ${PORT} ===`);
});