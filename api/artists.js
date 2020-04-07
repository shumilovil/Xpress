const express = require('express');
const artistsRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.param('artistId', (req, res, next, artistId) => {  
  db.get(`SELECT * FROM Artist WHERE Artist.id = $artistId`,
         {$artistId: artistId},
         (err, artist) => {
           if (err) {
             next(err);
           } else if (artist) {             
             req.artist = artist;
             next();
           } else {
             res.status(404).send();
           };
         }
        );
});


artistsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Artist WHERE Artist.is_currently_employed = 1`, (err, artists) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({artists: artists});
    };
  });
});

artistsRouter.get('/:artistId', (req, res, next) =>{
  res.status(200).json({artist: req.artist});
});


artistsRouter.post('/', (req, res, next) => {
  const name = req.body.artist.name;
  const dateOfBirth = req.body.artist.dateOfBirth;
  const biography = req.body.artist.biography;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  
  if (!name || !dateOfBirth || !biography) {
    return res.status(400).send();
  };
 
  db.run(`INSERT INTO Artist
          (name, date_of_birth, biography, is_currently_employed) 
          VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)`,

          {$name: name,
           $dateOfBirth: dateOfBirth,
           $biography: biography,
           $isCurrentlyEmployed: isCurrentlyEmployed},

           function(err) {
             if (err) {
               next(err)
             } else {
               db.get(`SELECT * FROM Artist WHERE Artist.id = ${this.lastID}`, (err, artist) => {
                 if (!artist) {
                  return res.status(400).send();
                 } else {
                   res.status(201).send({artist: artist});
                 };
               });
             };
           });
});


artistsRouter.put('/:artistId', (req, res, next) => {
  const name = req.body.artist.name;
  const dateOfBirth = req.body.artist.dateOfBirth;
  const biography = req.body.artist.biography;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

  if (!name || !dateOfBirth || !biography) {
    return res.status(400).send();
  };

  db.run(`UPDATE Artist 
          SET name = $name,
              date_of_birth = $dateOfBirth,
              biography = $biography,
              is_currently_employed = $isCurrentlyEmployed
          WHERE Artist.id = $id`,

          {$name: name,
           $dateOfBirth: dateOfBirth,
           $biography: biography,
           $isCurrentlyEmployed: isCurrentlyEmployed,
           $id: req.params.artistId},
            
            (err) => {
              if (err) {
                next(err);
              } else {
                db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (err, artist) => {
                  res.status(200).send({artist: artist});
                }); 
              };
            });
});



artistsRouter.delete('/:artistId', (req, res, next) => {
  db.run(`UPDATE Artist
          SET is_currently_employed = 0
          WHERE Artist.id = ${req.params.artistId}`,
          (err) => {
            if (err) {
              next(err);
            } else {
              db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (err, artist) => {
                res.status(200).send({artist: artist});
              });
            };
          });
});




module.exports = artistsRouter;
