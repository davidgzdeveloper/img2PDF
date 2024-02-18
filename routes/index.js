
var express = require('express');
var multer = require('multer');
var path = require('path')
var router = express.Router();
var path = require('path');
const { urlToHttpOptions } = require('url');
var fs = require('fs')
const { unlink } = require('fs').promises;
var PDFDocument  = require('pdfkit')


/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.imageFiles === undefined){
    res.sendFile(path.join(__dirname, '..','public/html/index.html'));
  } else{
    res.render('index', {images: req.session.imageFiles} )
  };
});

//multer file storage configuration
let storage = multer.diskStorage({
  destination: (req, file, cb) =>{
    cb(null,'public/images')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + '.' + file.mimetype.split('/')[1])
  }
})

//configuration for file filter
let fileFilter = (req, file, callback) =>{
  let ext = path.extname(file.originalname);
  if(ext !== '.png' && ext!=='.jpg'){
		return callback(new Error('Only png and jpg files are accepted'))
	} else {
		return callback(null, true)
}
}

var upload = multer({storage, fileFilter: fileFilter});

router.post('/upload', upload.array('images'), (req,res)=>{
  let files = req.files;
  let imgNames =[];

  for (i of files) {
    let index = Object.keys(i).findIndex((e)=>{return e ==='filename'})
    imgNames.push(Object.values(i)[index])
  }
  req.session.imageFiles = imgNames;

  res.redirect('/')
})


router.post('/pdf', (req,res)=>{
  let body = req.body

  //create a new pdf
  let doc = new PDFDocument({size: 'A4', autoFirstPage: false})
  let pdfName = 'pdf-' + Date.now() + '.pdf';
  
  doc.pipe( fs.createWriteStream(path.join(__dirname, '..', `/public/pdf/${pdfName}`)))

  for (let name of body){
    doc.addPage();
    doc.image(path.join(__dirname, '..', `/public/images/${name}`), 20, 20, {width: 555.28, align: 'center', valign: 'center'})
  }
  doc.end();

  res.send(`/pdf/${pdfName}`)
})

router.get('/new', (req,res)=>{
  let filenames = req.session.imageFiles;

  let deleteFiles = async(paths) => {
    let deleting = paths.map((file) => unlink(path.join(__dirname, '..', `/public/images/${file}`)))
    await Promise.all(deleting)
  }
  deleteFiles(filenames)

  req.session.imageFiles = undefined

  res.redirect('/');
})
module.exports = router;
