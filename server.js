const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// Route pour enregistrer les données mises à jour (y compris le tableau d'images modifié)
app.post('/api/save-data', (req, res) => {
    const dataPath = path.join(__dirname, 'data.json');
    
    // Le serveur reçoit directement l'objet propre créé par l'admin
    const nouvellesDonnees = req.body;

    fs.writeFile(dataPath, JSON.stringify(nouvellesDonnees, null, 2), (err) => {
        if (err) {
            console.error("Erreur d'écriture dans data.json", err);
            return res.status(500).json({ success: false, error: "Impossible de sauvegarder" });
        }
        res.json({ success: true });
    });
});
