const express = require('express');
const Question = require('../../models/question');
const catchErrors = require('../../lib/async-error');

const router = express.Router();

var multer = require('multer');
var uploadSetting = multer({dest:"../uploads"});

router.post('/upload', uploadSetting.single('upload'), function(req,res) {
  var tmpPath = req.file.path;
  var fileName = req.file.filename;
  var newPath = "../public/images/" + fileName;

  fs.rename(tmpPath, newPath, function (err) {
    if (err) {
      console.log(err);
    }

    var html;

    html = "";
    html += "<script type='text/javascript'>";
    html += " var funcNum = " + req.query.CKEditorFuncNum + ";";
    html += " var url = \"/images/" + fileName + "\";";
    html += " var message = \"업로드 완료\";";
    html += " window.parent.CKEDITOR.tools.callFunction(funcNum, url);";
    html += "</script>";

    res.send(html);
  });
});


// Index
router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const questions = await Question.paginate({}, {
    sort: {createdAt: -1}, 
    populate: 'author',
    page: page, limit: limit
  });
  res.json({questions: questions.docs, page: questions.page, pages: questions.pages});   
}));

// Read
router.get('/:id', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id).populate('author');
  res.json(question);
}));

// Create
router.post('', catchErrors(async (req, res, next) => {
  var question = new Question({
    title: req.body.title,
    author: req.user._id,
    content: req.body.content,
    tags: req.body.tags.map(e => e.trim()),
  });
  await question.save();
  res.json(question)
}));

// Put
router.put('/:id', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return next({status: 404, msg: 'Not exist question'});
  }
  if (question.author && question.author._id != req.user._id) {
    return next({status: 403, msg: 'Cannot update'});
  }
  question.title = req.body.title;
  question.content = req.body.content;
  question.tags = req.body.tags;
  await question.save();
  res.json(question);
}));

// Delete
router.delete('/:id', catchErrors(async (req, res, next) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return next({status: 404, msg: 'Not exist question'});
  }
  if (question.author && question.author._id != req.user._id) {
    return next({status: 403, msg: 'Cannot update'});
  }
  await Question.findOneAndRemove({_id: req.params.id});
  res.json({msg: 'deleted'});
}));


module.exports = router;