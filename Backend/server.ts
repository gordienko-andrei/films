import 'zone.js'; 
import { join } from 'path';
import express, { Request, Response } from 'express';
import { ngExpressEngine } from '@nguniversal/express-engine';
import { enableProdMode } from '@angular/core';
import { AppComponent } from '../UI/ReviewFlix/src/app/app.component'; 

enableProdMode();

const app = express();

// Путь к файлам Angular Universal
const distFolder = join(process.cwd(), 'dist/review-flix');

// Для отдачи статических файлов
app.set('view engine', 'html');
app.set('views', distFolder);

// Настроим Angular Universal через Express
app.engine('html', ngExpressEngine({
  bootstrap: AppComponent
}));

// Путь для главной страницы
app.get('*.*', express.static(distFolder, {
  maxAge: '1y'
}));

// Включаем обработку всех остальных запросов
app.get('*', (req: Request, res: Response) => {
  res.render('index', { req });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Node server listening on http://localhost:${port}`);
});
