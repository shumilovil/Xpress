const express = require('express');
const seriesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const issuesRouter = require('./issues');

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
   db.get(`SELECT * FROM Series WHERE Series.id = ${seriesId}`,
          (err, series) => {
              if (err) {
                next(err);  
              } else if (series) {
                  req.series = series;
                  next();
              } else {
                  res.status(404).send();
              };
          });
});


seriesRouter.use('/:seriesId/issues', issuesRouter);


seriesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Series`, (err, series) => {
        if (err) {
          next(err);
        } else {
          res.status(200).send({series: series});
        };
    });
});



seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).send({series: req.series});
});



seriesRouter.post('/', (req, res, next) => {
  const name = req.body.series.name;
  const description = req.body.series.description;

  if (!name || !description) {
    return res.status(400).send();
  };

  db.run(`INSERT INTO Series
          (name, description)
          VALUES ($name, $description)`,

          {$name: name,
           $description: description},

           function(err) {
             if (err) {
               next(err);
             } else {
               db.get(`SELECT * FROM Series WHERE Series.id = ${this.lastID}`, (err, series) => {
                 if (err) {
                   next(err);
                 } else {
                   res.status(201).send({series: series});
                 };
               });
             };
            }
           );
});



seriesRouter.put('/:seriesId', (req, res, next) => {
  const name = req.body.series.name;
  const description = req.body.series.description;

  if (!name || !description) {
    return res.status(400).send();
  };

  db.run(`UPDATE Series
          SET name = $name,
              description = $description
          WHERE Series.id = ${req.params.seriesId}`,

          {$name: name,
           $description: description},
           
           (err) => {
             if (err) {
               next(err);
             } else {
               db.get(`SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`, (err, series) => {
                 if (err) {
                   next(err);
                 } else {
                   res.status(200).send({series: series});
                 };
               });
             };
           });

});


seriesRouter.delete('/:seriesId', (req, res, next) => {
  db.get(`SELECT * FROM Issue WHERE Issue.series_id = ${req.params.seriesId}`, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      return res.status(400).send();
    } else {
      db.run(`DELETE FROM Series WHERE Series.id = ${req.params.seriesId}`, (err) => {
        if (err) {
          next(err);
        } else {
          res.status(204).send();
        };
      });
    };
  });
});


module.exports = seriesRouter;