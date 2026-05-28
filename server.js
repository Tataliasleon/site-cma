const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CONFIGURATION DE CLOUDINARY
// Remplace les valeurs ci-dessous par tes propres identifiants Cloudinary
// ==========================================
cloudinary.config({ 
  cloud_name: 'dotjq0cqg', 
  api_key: '554472961924777', 
  api_secret: 'zCYze8MRkylM9WZ_M3eT3P7gRr4' 
});

// Autorisation des flux externes (YouTube, Facebook, Cloudinary)
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "frame-src 'self' https://www.youtube.com https://youtube.com https://web.facebook.com https://facebook.com; img-src 'self' data: https://res.cloudinary.com;");
    res.removeHeader("X-Frame-Options");
    next();
});

// Configuration temporaire de sauvegarde locale (Multer) avant envoi Cloudinary
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(__dirname));

const dataPath = path.join(__dirname, 'data.json');

// Initialisation de secours pour data.json
if (!fs.existsSync(dataPath)) {
    const initialData = {
        logoSrc: "",
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

// ROUTE API : Récupérer les données
app.get('/api/data', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Erreur de lecture" });
        res.json(JSON.parse(data));
    });
});

// ROUTE API MULTIPLE : Téléverser plusieurs photos vers Cloudinary
app.post('/api/upload-carousel', upload.array('carouselFiles'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.json({ srcs: [] });
    }

    try {
        const uploadPromises = req.files.map(file => {
            return cloudinary.uploader.upload(file.path, { folder: "cma_gallery" })
                .then(result => {
                    // Supprime le fichier temporaire local après envoi réussi
                    fs.unlinkSync(file.path);
                    return result.secure_url; // Lien permanent HTTPS
                });
        });

        const urls = await Promise.all(uploadPromises);
        res.json({ srcs: urls });
    } catch (error) {
        console.error("Erreur Cloudinary:", error);
        res.status(500).json({ error: "Échec du téléversement vers le Cloud" });
    }
});

// ROUTE API : Sauvegarder les données textuelles et liens d'images
app.post('/api/save-data', (req, res) => {
    fs.writeFile(dataPath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Serveur cloud connecté sur le port ${PORT}`));
