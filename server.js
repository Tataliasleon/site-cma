const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// AUTORISATION CRUCIALE : On configure les en-têtes pour permettre à YouTube de s'afficher
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "frame-src 'self' https://www.youtube.com https://youtube.com https://web.facebook.com https://facebook.com;");
    res.removeHeader("X-Frame-Options"); // Supprime le blocage strict des cadres
    next();
});

// Gestion du stockage des images locales
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

// Redirection par défaut vers index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
