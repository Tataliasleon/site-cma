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

// Panneau d'administration injecté directement (Infaillible pour Render)
app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panneau d'Administration - CMA Actes 1:8</title>
    <style>
        :root { --primary: #0056b3; --bg: #f4f6f9; --text: #333; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        h1 { color: var(--primary); text-align: center; margin-bottom: 30px; font-size: 24px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: 600; margin-bottom: 8px; color: #555; }
        textarea, input[type="text"] { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
        textarea { resize: vertical; min-height: 100px; }
        .btn { background: var(--primary); color: white; border: none; padding: 14px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; transition: background 0.2s; }
        .btn:hover { background: #004085; }
        .status { margin-top: 15px; padding: 10px; text-align: center; border-radius: 6px; display: none; font-weight: 600; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ Gestion du Contenu - Centre Missionnaire Actes 1:8</h1>
        
        <div id="statusMessage" class="status"></div>

        <form id="adminForm">
            <div class="form-group">
                <label for="texteAccueil">Texte d'accueil principal :</label>
                <textarea id="texteAccueil" name="texteAccueil"></textarea>
            </div>

            <div class="form-group">
                <label for="vieEgliseTexte">Section "Vie de l'Église" :</label>
                <textarea id="vieEgliseTexte" name="vieEgliseTexte"></textarea>
            </div>

            <div class="form-group">
                <label for="lienYouTube">Lien du Direct YouTube :</label>
                <input type="text" id="lienYouTube" name="lienYouTube" placeholder="https://www.youtube.com/embed/...">
            </div>

            <div class="form-group">
                <label for="lienFacebook">Lien de la Page Facebook :</label>
                <input type="text" id="lienFacebook" name="lienFacebook" placeholder="https://facebook.com/...">
            </div>

            <div class="form-group">
                <label for="coordonneesBancaires">Coordonnées Bancaires (Dons) :</label>
                <textarea id="coordonneesBancaires" name="coordonneesBancaires"></textarea>
            </div>

            <div class="form-group">
                <label for="mobileMoney">Numéros Mobile Money :</label>
                <textarea id="mobileMoney" name="mobileMoney"></textarea>
            </div>

            <button type="submit" class="btn">Enregistrer les modifications</button>
        </form>
    </div>

    <script>
        const statusDiv = document.getElementById('statusMessage');

        // Charger les données actuelles au démarrage
        async function loadCurrentData() {
            try {
                const res = await fetch('/api/data');
                const data = await res.json();
                
                if(data) {
                    document.getElementById('texteAccueil').value = data.texteAccueil || '';
                    document.getElementById('vieEgliseTexte').value = data.vieEgliseTexte || '';
                    document.getElementById('lienYouTube').value = data.lienYouTube || '';
                    document.getElementById('lienFacebook').value = data.lienFacebook || '';
                    document.getElementById('coordonneesBancaires').value = data.coordonneesBancaires || '';
                    document.getElementById('mobileMoney').value = data.mobileMoney || '';
                }
            } catch (err) {
                showStatus("Erreur lors du chargement des données", false);
            }
        }

        function showStatus(msg, isSuccess) {
            statusDiv.textContent = msg;
            statusDiv.className = 'status ' + (isSuccess ? 'success' : 'error');
            statusDiv.style.display = 'block';
            setTimeout(() => { statusDiv.style.style.display = 'none'; }, 5000);
        }

        // Sauvegarder les données à la soumission
        document.getElementById('adminForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                texteAccueil: document.getElementById('texteAccueil').value,
                vieEgliseTexte: document.getElementById('vieEgliseTexte').value,
                lienYouTube: document.getElementById('lienYouTube').value,
                lienFacebook: document.getElementById('lienFacebook').value,
                coordonneesBancaires: document.getElementById('coordonneesBancaires').value,
                mobileMoney: document.getElementById('mobileMoney').value
            };

            try {
                const response = await fetch('/api/save-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if(result.success) {
                    showStatus("Contenu mis à jour avec succès !", true);
                } else {
                    showStatus("Échec de l'enregistrement", false);
                }
            } catch (err) {
                showStatus("Erreur de connexion avec le serveur", false);
            }
        });

        window.onload = loadCurrentData;
    </script>
</body>
</html>
    `);
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

// ROUTE DE SECOURS ABSOLUE (Nouvelle adresse pour éviter les blocages)
app.get('/gestion', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panneau d'Administration - CMA Actes 1:8</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #333; padding: 20px; }
        .container { max-width: 700px; margin: 30px auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        h1 { color: #0056b3; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: bold; margin-bottom: 8px; }
        textarea, input[type="text"] { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
        textarea { min-height: 100px; resize: vertical; }
        .btn { background: #0056b3; color: white; border: none; padding: 14px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; }
        .btn:hover { background: #004085; }
        .status { margin-top: 15px; padding: 10px; text-align: center; border-radius: 6px; display: none; font-weight: bold; }
        .success { background: #d4edda; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ Espace Gestion - CMA Actes 1:8</h1>
        <div id="statusMessage" class="status success">Contenu mis à jour avec succès !</div>
        <form id="adminForm">
            <div class="form-group">
                <label>Texte d'accueil principal :</label>
                <textarea id="texteAccueil"></textarea>
            </div>
            <div class="form-group">
                <label>Section "Vie de l'Église" :</label>
                <textarea id="vieEgliseTexte"></textarea>
            </div>
            <div class="form-group">
                <label>Lien du Direct YouTube :</label>
                <input type="text" id="lienYouTube" placeholder="https://www.youtube.com/embed/...">
            </div>
            <div class="form-group">
                <label>Lien de la Page Facebook :</label>
                <input type="text" id="lienFacebook">
            </div>
            <div class="form-group">
                <label>Coordonnées Bancaires :</label>
                <textarea id="coordonneesBancaires"></textarea>
            </div>
            <div class="form-group">
                <label>Mobile Money :</label>
                <textarea id="mobileMoney"></textarea>
            </div>
            <button type="submit" class="btn">Enregistrer les modifications</button>
        </form>
    </div>
    <script>
        async function loadData() {
            try {
                const res = await fetch('/api/data');
                const data = await res.json();
                if(data) {
                    document.getElementById('texteAccueil').value = data.texteAccueil || '';
                    document.getElementById('vieEgliseTexte').value = data.vieEgliseTexte || '';
                    document.getElementById('lienYouTube').value = data.lienYouTube || '';
                    document.getElementById('lienFacebook').value = data.lienFacebook || '';
                    document.getElementById('coordonneesBancaires').value = data.coordonneesBancaires || '';
                    document.getElementById('mobileMoney').value = data.mobileMoney || '';
                }
            } catch (e) {}
        }
        document.getElementById('adminForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                texteAccueil: document.getElementById('texteAccueil').value,
                vieEgliseTexte: document.getElementById('vieEgliseTexte').value,
                lienYouTube: document.getElementById('lienYouTube').value,
                lienFacebook: document.getElementById('lienFacebook').value,
                coordonneesBancaires: document.getElementById('coordonneesBancaires').value,
                mobileMoney: document.getElementById('mobileMoney').value
            };
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if(response.ok) {
                const div = document.getElementById('statusMessage');
                div.style.display = 'block';
                setTimeout(() => div.style.display = 'none', 4000);
            }
        });
        window.onload = loadData;
    </script>
</body>
</html>
    `);
});
// Lancement du serveur
app.listen(PORT, () => {
    console.log(`\n=== SERVEUR CMA OPÉRATIONNEL SUR LE PORT ${PORT} ===`);
    console.log(`👉 En ligne : https://centre-missionnaire-actes-1-8.onrender.com`);
});