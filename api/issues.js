const express = require('express');
const issuesRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.param('issueId', (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue WHERE Issue.id = ${issueId}`, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      req.issue = issue;
      next();
    } else {
      res.status(404).send();
    };
  });
});

issuesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Issue WHERE Issue.series_id = $seriesID`, {$seriesID: req.params.seriesId}, (err, issues) => {
    if (err) {
      next(err);
    } else {
      res.status(200).send({issues: issues});
    };
  });
});


issuesRouter.post('/', (req, res, next) => {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;
    
    if (!name || !issueNumber || !publicationDate || !artistId) {
      return res.status(400).send();                 
    };

    db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId}`, (err, artist) => {
      if (err) {
        next(err);
      } else if (!artist) {
        return res.status(400).send();
      } else {
        db.run(`INSERT INTO Issue
               (name, issue_number, publication_date, artist_id, series_id)
               VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)`,

              {$name: name,
               $issueNumber: issueNumber,
               $publicationDate: publicationDate,
               $artistId: artistId,
               $seriesId: req.params.seriesId},
               
               function(err) {
                 if (err) {
                   next(err);
                 } else {
                   db.get(`SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`, (err, issue) => {
                     if (err) {
                       next(err);
                     } else {
                       res.status(201).send({issue: issue});
                     };
                   });
                 };
               });
      };
    });
});


issuesRouter.put('/:issueId', (req, res, next) => {
  const name = req.body.issue.name;
  const issueNumber = req.body.issue.issueNumber;
  const publicationDate = req.body.issue.publicationDate;
  const artistId = req.body.issue.artistId;

  if (!name || !issueNumber || !publicationDate || !artistId) {
    return res.status(400).send();                 
  };

  db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId}`, (err, artist) => {
    if (err) {
      next(err);
    } else if (!artist) {
      return res.status(400).send();
    } else {
      db.run(`UPDATE Issue
              SET name = $name,
                  issue_number = $issueNumber,
                  publication_date = $publicationDate,
                  artist_id = $artistId,
                  series_id = $seriesId`, 
                  
                  {$name: name,
                   $issueNumber: issueNumber,
                   $publicationDate: publicationDate,
                   $artistId: artistId,
                   $seriesId: req.params.seriesId},
                   
                   (err) => {
                     if (err) {
                       next(err);
                     } else {
                       db.get(`SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`, (err, issue) => {
                         if (err) {
                           next(err);
                         } else {
                           res.status(200).send({issue: issue});
                         };
                       });
                     };
                   });
    };
  });
});


issuesRouter.delete('/:issueId', (req, res, next) => {
  db.run(`DELETE FROM Issue WHERE Issue.id = ${req.params.issueId}`, (err) => {
    if (err) {
      next(err);
    } else {
      res.status(204).send();
    };
  });
});



module.exports = issuesRouter;
