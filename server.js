const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Gestion du stockage des images (crée un dossier images à la racine si inexistant)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'images');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(express.json());

// CONFIGURATION CRUCIALE : On sert les fichiers directement depuis la racine du projet
app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));

const dataPath = path.join(__dirname, 'data.json');

// Initialiser data.json s'il n'existe pas encore
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

// Routes API
app.get('/api/data', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Erreur de lecture" });
        res.json(JSON.parse(data));
    });
});

app.post('/api/upload-carousel', upload.array('carouselFiles'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.json({ srcs: [] });
    }
    const urls = req.files.map(file => `/images/${file.filename}`);
    res.json({ srcs: urls });
});

app.post('/api/save-data', (req, res) => {
    fs.writeFile(dataPath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// Redirection par défaut vers index.html si on tape juste l'URL de base
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
