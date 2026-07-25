const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'services');
const controllersDir = path.join(__dirname, 'controllers');

const services = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
const controllers = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

// 1. Refactor Services
services.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('throw { status:')) {
    // Add import if not present
    if (!content.includes('AppError')) {
      content = `import AppError from '../utils/AppError.js';\n` + content;
    }
    
    // Replace throw { status: 404, message: '...' }
    content = content.replace(/throw \{ status: (\d+),\s*message: (.*?) \};/g, 'throw new AppError($2, $1);');
    
    // Replace throw { status: 400, errors: { ... } }
    content = content.replace(/throw \{ status: (\d+),\s*errors: (.*?) \};/g, 'throw new AppError(\'Validation Error\', $1, $2);');
    
    fs.writeFileSync(filePath, content);
    console.log(`Refactored ${file}`);
  }
});

// 2. Refactor Controllers
controllers.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;

  // Add next to controller params if needed
  content = content.replace(/export const (\w+) = async \(req, res\) => \{/g, 'export const $1 = async (req, res, next) => {');

  // Replace manual if (error.status) ... with next(error)
  // For userController, roomController
  content = content.replace(/if \(error\.status\)\s*return res\.status\(error\.status\)\.json\(\{ message: error\.message \}\);/g, '');
  content = content.replace(/if \(error\.status\)\s*\{\s*return res\.status\(error\.status\)\.json\(\{ message: error\.message \}\);\s*\}/g, '');
  // Auth controller has a different one
  content = content.replace(/if \(error\.status\) \{\s*return res\.status\(error\.status\)\.json\(error\.errors \? \{ errors: error\.errors \} : \{ message: error\.message \}\);\s*\}/g, '');
  
  // Replace res.status(STATUS_CODES.SERVER_ERROR).json(...) with next(error)
  content = content.replace(/res\.status\(STATUS_CODES\.SERVER_ERROR\)\.json\(\{ message: .*? \}\);/g, 'next(error);');
  content = content.replace(/res\.status\(STATUS_CODES\.SERVER_ERROR\)\.json\(\{ message: ERROR_MESSAGES\.SERVER_ERROR \}\);/g, 'next(error);');

  // Replace remaining console.error(error); inside catch block, because next(error) will log it in dev
  content = content.replace(/console\.error\([^)]+\);/g, '');

  fs.writeFileSync(filePath, content);
  console.log(`Refactored ${file}`);
});
