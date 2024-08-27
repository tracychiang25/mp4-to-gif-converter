const gifProcessor = require('../services/gifProcessor');
const Gif = require('../models/Gifs');
const path = require('path');
const User = require('../models/User');

// localhost/upload
exports.uploadVideo = async (req, res) =>{
    try{
        // Ensure req.file contains the uploaded fie
        if(!req.file){
            return res.status(400).json({ error: 'No video file provided'});
        }
        // Transforming the video to GIF and get the URL
        const gifFileName = await gifProcessor.transformToGif(req.file.path);
        const gifUrl = `/gifs/${gifFileName}`;
        // Create a new GIF record associated with the user
        const newGif = {
            userId: req.user.id,
            gifUrl,
            createdAt: new Date(),
        }
        console.log('Created GIF:', newGif);

        // Save the new GIF record to the database
        const gif = await Gif.create(newGif);
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.gifHistory.push(gif._id); // Push the new GIF to the user's history
        await user.save(); // Save the user with the updated gifHistory

        res.status(201).json({ gifUrl });
      } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// localhost/download/:filename
exports.getHistory = async (req, res) => {
    try{
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)
        const username = decodedToken.username;

        const user = await User.findOne({ username }).populate('gifHistory');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user.gifHistory)
    }catch(err){
        res.status(500).json({ error: err.message });
    }
};
// localhost/history/:username
exports.downloadGif = (req, res) =>{
    const gifFileName = req.params.filename;
    const filePath = path.join(__dirname, '/gifs/', gifFileName);

    res.download(filePath, err =>{
        if(err){
            console.error('Error downloading file:', err);
            res.status(500).json({error: 'Error downloading file'});
        }
    });
};


