const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

server.listen(9000, () => {
    console.log("chat server listening on port 9000")
});

let rootFolder = './files';
let files = ['test.1.txt', 'test.2.txt', 'test.3.txt', 'test.4.txt', 'test.5.txt'];
let lastLineNumbers = 10;
app.use(express.static(__dirname + '/public'));

let filesData = {};

app.get('/file-data', (req, res) => {
    let promiseArray = [];
    for (let i = 0; i < files.length; i++) {
        promiseArray.push(readFileAsynchronously(rootFolder, `${files[i]}`));
    }

    Promise.all(promiseArray)
        .then((responseArray) => {
            for (let index = 0; index < responseArray.length; index++) {
                let fileData = responseArray[index];
                let fileName = fileData[0];
                filesData[fileName] = fileData.slice(1);
            }
            res.send(filesData);
        })
        .catch((err) => {
            console.log(err.message);
        });
});

io.on('connection', function (socket) {
    fs.watch('./files', { persistent: true }, (event, fileName) => {
        if (event === 'change') {
            fs.readFile(`./files/${fileName}`, 'utf8', (error, fileData) => {
                if (error) {
                    socket.emit('error-message', { message: error.message });
                } else {
                    let lineArray = fileData.split('\n');
                    let newArray = lineArray.slice(lineArray.length - lastLineNumbers);
                    // filesData[fileName] = newArray;
                    newArray.unshift(fileName);
                    socket.emit('file-change', newArray);
                }
            });
        }
    });
});

function readFileAsynchronously(rootFolder, fileName) {
    return new Promise((resolve, reject) => {
        fs.readFile(`${rootFolder}/${fileName}`, 'utf8', (err, file) => {
            if (err) {
                reject(err.message);
            } else {
                let lineArray = file.split('\n');
                let newArray = lineArray.slice(lineArray.length - lastLineNumbers);
                newArray.unshift(fileName);
                // let str = `${newArray.join('\n')}`;
                resolve(newArray);
            }
        });
    });
}