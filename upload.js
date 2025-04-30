const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Set up multer to save files in Bilder/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'Bilder'));
  },
  filename: function (req, file, cb) {
    // Use original name or make unique if you want
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Endpoint for uploading multiple images
app.post('/upload', upload.array('images', 40), (req, res) => {
    const docId = req.query.id;
    let fileNames = [];

    req.files.forEach((file, idx) => {
        const ext = path.extname(file.originalname);
        const newName = docId 
            ? `${docId}_${idx}${ext}`  // Pattern: [DOCID]_[INDEX].jpg
            : Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;

        const newPath = path.join(file.destination, newName);
        require('fs').renameSync(file.path, newPath);
        fileNames.push(newName);
    });

    res.json({ files: fileNames });
});

app.listen(4000, () => {
  console.log('Image upload server running on http://localhost:4000');
});