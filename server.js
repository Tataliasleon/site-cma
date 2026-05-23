const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de stockage pour les images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public', 'images');
        // Crée le dossier s'il n'existe pas pour éviter le crash Render
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataPath = path.join(__dirname, 'data.json');

// Initialiser data.json s'il est absent
if (!fs.existsSync(dataPath)) {
    const initialData = {
        logoSrc: "/images/logo.jpeg",
        carouselImages: [],
        texteAccueil: "Bienvenue au Centre Missionnaire Actes 1:8",
        vieEgliseTexte: "Chargement de la présentation...",
        lienYouTube: "",
        lienFacebook: "",
        coordonneesBancaires: "",
        mobileMoney: ""
    };
    fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
}

// API : Récupérer toutes les données
app.get('/api/data', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Erreur de lecture" });
        res.json(JSON.parse(data));
    });
});

// API : Upload des photos de la galerie
app.post('/api/upload-carousel', upload.array('carouselFiles'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.json({ srcs: [] });
    }
    const urls = req.files.map(file => `/images/${file.filename}`);
    res.json({ srcs: urls });
});

// API : Sauvegarde globale de TOUT le site (Textes, Réseaux, Dons, Images)
app.post('/api/save-data', (req, res) => {
    fs.writeFile(dataPath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
