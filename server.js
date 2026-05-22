const express = require('express');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration pour lire le JSON et servir les fichiers statiques
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
// Permet à Express de servir tes anciennes images stockées localement
app.use('/images', express.static(path.join(__dirname, 'images')));

// ==========================================
// 1. CONFIGURATION DE CLOUDINARY
// ==========================================
cloudinary.config({
  cloud_name: 'dotjq0cqg', 
  api_key: '554472961924777',       
  api_secret: 'zCYze8MRkylM9WZ_M3eT3P7gRr4'  
});

// Configurer le stockage Cloudinary pour les fichiers
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cma_site_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  },
});

const upload = multer({ storage: storage });

// Fichier de données JSON local
const DATA_FILE = path.join(__dirname, 'data.json');

// Fonction sécurisée pour lire le fichier data.json
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
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error("Erreur de lecture JSON, retour à une structure vide", e);
        return {};
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ==========================================
// 2. LES ROUTES POUR LES PAGES (HTML)
// ==========================================

// Page d'accueil publique
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Page d'administration (SANS le .html dans l'URL)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});


// ==========================================
// 3. LES ROUTES API (DONNÉES & IMAGES)
// ==========================================

// Obtenir toutes les données (C'est la route qui manquait ou qui bloquait !)
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// Enregistrer le Logo sur Cloudinary
app.post('/api/upload-logo', upload.single('logoFile'), (req, res) => {
    if (req.file && req.file.path) {
        return res.json({ src: req.file.path });
    }
    res.status(400).json({ error: "Échec du téléchargement du logo" });
});

// Enregistrer une image du Carrousel sur Cloudinary
app.post('/api/upload-carousel', upload.single('carouselFile'), (req, res) => {
    if (req.file && req.file.path) {
        return res.json({ src: req.file.path });
    }
    res.status(400).json({ error: "Échec du téléchargement de l'image" });
});

// Mettre à jour toutes les informations depuis l'admin
app.post('/api/update-all', (req, res) => {
    try {
        writeData(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// Lancement du serveur
app.listen(PORT, () => {
    console.log(`\n=== SERVEUR CMA OPÉRATIONNEL SUR LE PORT ${PORT} ===`);
    console.log(`👉 Administration : http://localhost:${PORT}/admin\n`);
});