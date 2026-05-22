const express = require('express');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const multer = require('multer'); 
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration pour lire le JSON et servir les fichiers statiques
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Permet à Express de lire les fichiers à la racine (index.html, style.css, admin.html)
app.use(express.static(__dirname));

// Permet à Express de servir tes anciennes images stockées localement (si existantes)
app.use('/images', express.static(path.join(__dirname, 'images')));

// ==========================================
// 1. CONFIGURATION DE CLOUDINARY (SÉCURISÉE)
// ==========================================
// Utilise les variables d'environnement Render, ou tes clés par défaut si non définies
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dotjq0cqg', 
  api_key: process.env.CLOUDINARY_API_KEY || '554472961924777',       
  api_secret: process.env.CLOUDINARY_API_SECRET || 'zCYze8MRkylM9WZ_M3eT3P7gRr4'  
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

// On force Express à chercher le fichier exact présent sur GitHub
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'Admin.html'));
});
// ==========================================
// 3. LES ROUTES API (DONNÉES & IMAGES)
// ==========================================

// Obtenir toutes les données
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// Enregistrer les modifications de l'admin (Sauvegarde des textes)
app.post('/api/save-data', (req, res) => {
    try {
        const currentData = readData();
        // Fusionner les anciennes données avec les nouvelles reçues du formulaire
        const updatedData = { ...currentData, ...req.body };
        writeData(updatedData);
        res.json({ success: true, message: "Données enregistrées avec succès !" });
    } catch (err) {
        console.error("Erreur lors de la sauvegarde :", err);
        res.status(500).json({ error: "Erreur serveur lors de l'enregistrement" });
    }
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


// Lancement du serveur
app.listen(PORT, () => {
    console.log(`\n=== SERVEUR CMA OPÉRATIONNEL SUR LE PORT ${PORT} ===`);
    console.log(`👉 En ligne : https://centre-missionnaire-actes-1-8.onrender.com`);
});