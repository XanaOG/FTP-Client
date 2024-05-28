const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const ftp = require('basic-ftp');
const upload = multer({ dest: 'uploads/' });

const app = express();
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/upload', upload.single('file'), (req, res) => {
    const { host, username, password, remoteDir } = req.body;
    const localPath = req.file.path;
    const originalName = req.file.originalname;
    const remotePath = path.join(remoteDir, originalName);

    uploadFile(host, username, password, localPath, remotePath, () => {
        fs.remove(localPath);
        res.send('File uploaded successfully');
    });
});

const server = app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

async function uploadFile(host, user, password, localPath, remotePath, callback) {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: host,
            user: user,
            password: password,
            secure: false
        });

        const totalSize = fs.statSync(localPath).size;

        client.trackProgress(info => {
            const percentComplete = (info.bytesOverall / totalSize * 100).toFixed(2);
            console.log(`${info.name}: ${percentComplete}% complete`);
        });

        await client.uploadFrom(localPath, remotePath);

        client.trackProgress(null);
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
        callback();
    }
}
