import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_PRESENTATION, DEFAULT_USER } from './src/data';
import { PresentationData, UserProfile, FolderData, AppNotification } from './src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRESENTATIONS_FILE = path.join(DATA_DIR, 'presentations_list.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FOLDERS_FILE = path.join(DATA_DIR, 'folders.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

// Initialize data store with default sample presentation and user
function initializeDataStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PRESENTATIONS_FILE)) {
      fs.writeFileSync(
        PRESENTATIONS_FILE, 
        JSON.stringify([DEFAULT_PRESENTATION], null, 2), 
        'utf-8'
      );
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(
        USERS_FILE, 
        JSON.stringify([DEFAULT_USER], null, 2), 
        'utf-8'
      );
    }
    if (!fs.existsSync(FOLDERS_FILE)) {
      fs.writeFileSync(
        FOLDERS_FILE, 
        JSON.stringify([], null, 2), 
        'utf-8'
      );
    }
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
      fs.writeFileSync(
        NOTIFICATIONS_FILE, 
        JSON.stringify([], null, 2), 
        'utf-8'
      );
    }
  } catch (err) {
    console.error('Error initializing data store:', err);
  }
}

function readAllNotifications(): AppNotification[] {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (err) {
    console.error('Error reading notifications file:', err);
  }
  return [];
}

function writeAllNotifications(list: AppNotification[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing notifications:', err);
    return false;
  }
}

function readAllFolders(): FolderData[] {
  try {
    if (fs.existsSync(FOLDERS_FILE)) {
      const raw = fs.readFileSync(FOLDERS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (err) {
    console.error('Error reading folders file:', err);
  }
  return [];
}

function writeAllFolders(list: FolderData[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FOLDERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing folders:', err);
    return false;
  }
}

function readAllPresentations(): PresentationData[] {
  try {
    if (fs.existsSync(PRESENTATIONS_FILE)) {
      const raw = fs.readFileSync(PRESENTATIONS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.error('Error reading presentations file:', err);
  }
  return [DEFAULT_PRESENTATION];
}

function writeAllPresentations(list: PresentationData[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PRESENTATIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing presentations:', err);
    return false;
  }
}

async function startServer() {
  initializeDataStore();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // ==================== AUTH API ====================
  // Get current session / profile
  app.get('/api/auth/me', (req, res) => {
    res.json(DEFAULT_USER);
  });

  // Login / Switch account simulation
  app.post('/api/auth/login', (req, res) => {
    const { email, name } = req.body;
    const user: UserProfile = {
      id: `usr-${Buffer.from(email || 'user').toString('hex').slice(0, 8)}`,
      email: email || 'usuario@universidad.edu',
      name: name || (email ? email.split('@')[0] : 'Expositor'),
      role: 'Profesor / Expositor'
    };
    res.json(user);
  });

  // ==================== PRESENTATIONS API ====================
  // Get all presentations accessible to user or public
  app.get('/api/presentations', (req, res) => {
    const ownerId = (req.query.ownerId || req.query.userId) as string;
    const list = readAllPresentations();
    if (ownerId) {
      const filtered = list.filter(p => p.ownerId === ownerId || p.isPublic);
      return res.json(filtered);
    }
    res.json(list);
  });

  // Get specific presentation by ID
  app.get('/api/presentations/:id', (req, res) => {
    const { id } = req.params;
    const list = readAllPresentations();
    const item = list.find(p => p.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }
    res.json(item);
  });

  // Create a new presentation
  app.post('/api/presentations', (req, res) => {
    const body = req.body;
    const list = readAllPresentations();

    const newPresentation: PresentationData = {
      id: body.id || `pres-${Date.now()}`,
      title: body.title?.trim() || 'Nueva Presentación',
      subject: body.subject?.trim() || 'Materia / Especialidad',
      presenters: Array.isArray(body.presenters) && body.presenters.length > 0 
        ? body.presenters 
        : [body.ownerName || 'Expositor'],
      ownerId: body.ownerId || DEFAULT_USER.id,
      ownerName: body.ownerName || DEFAULT_USER.name,
      ownerEmail: body.ownerEmail || DEFAULT_USER.email,
      isPublic: body.isPublic ?? false,
      folderId: body.folderId || undefined,
      folderName: body.folderName || undefined,
      collaborators: Array.isArray(body.collaborators) ? body.collaborators : [],
      collaboratorIds: Array.isArray(body.collaboratorIds) ? body.collaboratorIds : [],
      googleSlidesEmbedUrl: body.googleSlidesEmbedUrl || '',
      slides: Array.isArray(body.slides) && body.slides.length > 0 ? body.slides : [
        {
          id: `slide-${Date.now()}-1`,
          slideNumber: 1,
          title: 'Introducción al Tema',
          shortDescription: 'Descripción breve de la introducción y objetivos del tema.',
          fullExplanation: 'Desarrollo completo de la introducción teórica y fundamentos científicos.',
          keyPoints: ['Punto clave 1: Fundamento', 'Punto clave 2: Aplicación práctica'],
          practicalExamples: ['Ejemplo de aplicación directa en el campo profesional'],
          keyTerms: []
        }
      ],
      quiz: Array.isArray(body.quiz) && body.quiz.length > 0 ? body.quiz : [
        {
          id: `q-${Date.now()}-1`,
          topic: 'General',
          question: '¿Cuál es el objetivo principal de este tema?',
          options: [
            'Opción A: Explicación de los principios fundamentales',
            'Opción B: Demostración empírica',
            'Opción C: Análisis secundario',
            'Opción D: Ninguna de las anteriores'
          ],
          correctAnswerIndex: 0,
          explanation: 'La opción A es la correcta ya que abarca el fundamento esencial.',
          reinforcementTip: 'Consultar la tarjeta de Introducción.'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newPresentation);
    writeAllPresentations(list);
    res.status(201).json(newPresentation);
  });

  // Update existing presentation
  app.put('/api/presentations/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const list = readAllPresentations();
    const index = list.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const updatedPresentation: PresentationData = {
      ...list[index],
      ...body,
      id: list[index].id,
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedPresentation;
    writeAllPresentations(list);
    res.json(updatedPresentation);
  });

  // Delete presentation
  app.delete('/api/presentations/:id', (req, res) => {
    const { id } = req.params;
    let list = readAllPresentations();
    const initialLen = list.length;
    list = list.filter(p => p.id !== id);

    if (list.length === initialLen) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    // Always keep at least the default presentation
    if (list.length === 0) {
      list = [DEFAULT_PRESENTATION];
    }

    writeAllPresentations(list);
    res.json({ success: true, message: 'Presentación eliminada' });
  });

  // ==================== FOLDERS API ====================
  // Get folders (optional filter by ownerId)
  app.get('/api/folders', (req, res) => {
    const ownerId = (req.query.ownerId || req.query.userId) as string;
    const folders = readAllFolders();
    if (ownerId) {
      const filtered = folders.filter(f => f.ownerId === ownerId || f.isPublic);
      return res.json(filtered);
    }
    res.json(folders);
  });

  // Get specific folder
  app.get('/api/folders/:id', (req, res) => {
    const { id } = req.params;
    const folders = readAllFolders();
    const folder = folders.find(f => f.id === id);
    if (!folder) {
      return res.status(404).json({ error: 'Carpeta no encontrada' });
    }
    res.json(folder);
  });

  // Create folder
  app.post('/api/folders', (req, res) => {
    const body = req.body;
    const folders = readAllFolders();
    const newFolder: FolderData = {
      id: body.id || `folder-${Date.now()}`,
      name: body.name?.trim() || 'Nueva Carpeta',
      ownerId: body.ownerId || DEFAULT_USER.id,
      ownerName: body.ownerName || DEFAULT_USER.name,
      isPublic: body.isPublic ?? true, // Folders are sharable by link
      color: body.color || 'blue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    folders.unshift(newFolder);
    writeAllFolders(folders);
    res.status(201).json(newFolder);
  });

  // Update folder
  app.put('/api/folders/:id', (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const folders = readAllFolders();
    const idx = folders.findIndex(f => f.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Carpeta no encontrada' });
    }
    folders[idx] = {
      ...folders[idx],
      ...body,
      id: folders[idx].id,
      updatedAt: new Date().toISOString()
    };
    writeAllFolders(folders);

    // If folder name changed, update presentations with this folderId
    if (body.name && body.name !== folders[idx].name) {
      const presentations = readAllPresentations();
      let changed = false;
      presentations.forEach(p => {
        if (p.folderId === id) {
          p.folderName = body.name;
          changed = true;
        }
      });
      if (changed) {
        writeAllPresentations(presentations);
      }
    }

    res.json(folders[idx]);
  });

  // Delete folder (removes folderId from presentations, doesn't delete the presentations themselves)
  app.delete('/api/folders/:id', (req, res) => {
    const { id } = req.params;
    let folders = readAllFolders();
    const initialLen = folders.length;
    folders = folders.filter(f => f.id !== id);
    if (folders.length === initialLen) {
      return res.status(404).json({ error: 'Carpeta no encontrada' });
    }
    writeAllFolders(folders);

    // Clean folderId from presentations
    const presentations = readAllPresentations();
    let changed = false;
    presentations.forEach(p => {
      if (p.folderId === id) {
        delete p.folderId;
        delete p.folderName;
        changed = true;
      }
    });
    if (changed) {
      writeAllPresentations(presentations);
    }

    res.json({ success: true, message: 'Carpeta eliminada' });
  });

  // Legacy route for compatibility
  app.get('/api/presentation', (req, res) => {
    const list = readAllPresentations();
    res.json(list[0] || DEFAULT_PRESENTATION);
  });

  app.post('/api/presentation', (req, res) => {
    const newData = req.body;
    const list = readAllPresentations();
    if (list.length > 0) {
      list[0] = { ...list[0], ...newData, updatedAt: new Date().toISOString() };
    } else {
      list.push(newData);
    }
    writeAllPresentations(list);
    res.json({ success: true, data: list[0] });
  });

  // ==================== NOTIFICATIONS API ====================
  // Get notifications for a recipient
  app.get('/api/notifications', (req, res) => {
    const recipientId = req.query.recipientId as string;
    const list = readAllNotifications();
    if (recipientId) {
      const filtered = list.filter(n => n.recipientId === recipientId);
      return res.json(filtered);
    }
    res.json(list);
  });

  // Create a new notification
  app.post('/api/notifications', (req, res) => {
    const body = req.body;
    const newNotif: AppNotification = {
      id: body.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientId: body.recipientId,
      presentationId: body.presentationId,
      presentationTitle: body.presentationTitle || 'Presentación',
      section: body.section || 'slides',
      sectionLabel: body.sectionLabel || 'Diapositivas',
      commentId: body.commentId,
      commentText: body.commentText || '',
      authorId: body.authorId,
      authorName: body.authorName || 'Usuario',
      authorPhotoURL: body.authorPhotoURL,
      createdAt: body.createdAt || new Date().toISOString(),
      read: false
    };

    const list = readAllNotifications();
    list.unshift(newNotif);
    writeAllNotifications(list);
    res.status(201).json(newNotif);
  });

  // Mark all notifications for recipient as read
  app.put('/api/notifications/read-all', (req, res) => {
    const { recipientId } = req.body;
    let list = readAllNotifications();
    if (recipientId) {
      list = list.map(n => n.recipientId === recipientId ? { ...n, read: true } : n);
    } else {
      list = list.map(n => ({ ...n, read: true }));
    }
    writeAllNotifications(list);
    res.json({ success: true });
  });

  // Mark single notification as read
  app.put('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    const list = readAllNotifications();
    const item = list.find(n => n.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    item.read = true;
    writeAllNotifications(list);
    res.json({ success: true, data: item });
  });

  // Delete notification
  app.delete('/api/notifications/:id', (req, res) => {
    const { id } = req.params;
    let list = readAllNotifications();
    const initialLen = list.length;
    list = list.filter(n => n.id !== id);
    if (list.length === initialLen) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    writeAllNotifications(list);
    res.json({ success: true, message: 'Notificación eliminada' });
  });

  // ==================== VITE MIDDLEWARE ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
