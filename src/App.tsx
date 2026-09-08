import React, { useState, useEffect, useRef } from 'react';
import { 
  PresentationData, 
  ActiveTab, 
  SlideContent, 
  QuizQuestion, 
  UserProfile,
  SectionComment,
  CommentReply,
  CollaboratorInfo,
  FolderData,
  AppNotification
} from './types';
import { DEFAULT_PRESENTATION, DEFAULT_USER } from './data';
import { Navbar } from './components/Navbar';
import { SlidesView } from './components/SlidesView';
import { ExplanationView } from './components/ExplanationView';
import { QuizView } from './components/QuizView';
import { DashboardView } from './components/DashboardView';
import { PublicFolderView } from './components/PublicFolderView';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { 
  db, 
  auth, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  onSnapshot, 
  onAuthStateChanged,
  query,
  where,
  sanitizeForFirestore 
} from './firebase';
import { Check, Cloud, RefreshCw, Presentation } from 'lucide-react';

// Read initial URL parameters immediately to eliminate delay/flicker
const initialSearchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const directSharedId = initialSearchParams?.get('p') || initialSearchParams?.get('share') || null;
const isDirectEditor = initialSearchParams?.get('role') === 'editor';
const initialFolderId = initialSearchParams?.get('folder') || initialSearchParams?.get('f') || null;

const getInitialCachedPresentation = (): PresentationData => {
  if (directSharedId && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`cached_pres_${directSharedId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_PRESENTATION;
};

export default function App() {
  // Navigation & View State - start directly in presentation if URL requested it
  const [view, setView] = useState<'dashboard' | 'presentation'>(() => directSharedId ? 'presentation' : 'dashboard');
  const [activeTab, setActiveTab] = useState<ActiveTab>('slides');
  const [isLoadingShared, setIsLoadingShared] = useState<boolean>(() => Boolean(directSharedId && !localStorage.getItem(`cached_pres_${directSharedId}`)));
  
  // Public Folder sharing state (when accessing ?folder=id or ?f=id)
  const [publicFolderId, setPublicFolderId] = useState<string | null>(initialFolderId);

  // Current user authenticated via Google
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('presentation_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Presentations State
  const [allPresentations, setAllPresentations] = useState<PresentationData[]>([]);
  const [currentPresentation, setCurrentPresentation] = useState<PresentationData>(getInitialCachedPresentation);
  
  // Folders State
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Navigation folder context: remembers folder when entering a presentation so "Atrás" returns to that folder
  const [presentationOriginFolder, setPresentationOriginFolder] = useState<{ id: string; name?: string } | null>(null);

  // Owner/Collaborator edit mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(() => isDirectEditor);
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [presentationToShare, setPresentationToShare] = useState<PresentationData | null>(null);

  // Sync state & Auto-save tracker
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'loading'>('synced');
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [targetCommentHighlight, setTargetCommentHighlight] = useState<{
    presentationId: string;
    section: 'slides' | 'explanation' | 'quiz';
    commentId: string;
  } | null>(null);

  // Real-time notifications listener for current user
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }

    // Try Firestore real-time listener for user's notifications
    const notifQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.id)
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      (snapshot) => {
        const notifs: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          notifs.push({ ...(docSnap.data() as AppNotification), id: docSnap.id });
        });
        // Sort newest first
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifs);
      },
      (err) => {
        console.warn('Note listening to notifications from Firestore:', err);
        // Fallback to server REST API
        fetch(`/api/notifications?recipientId=${encodeURIComponent(currentUser.id)}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setNotifications(data);
            }
          })
          .catch(e => console.warn('Note fetching notifications from server:', e));
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch extended user profile with favoriteIds and favoriteFolderIds from Firestore
        let favoriteIds: string[] = [];
        let favoriteFolderIds: string[] = [];
        let savedSharedIds: string[] = [];
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const uData = userDoc.data();
            favoriteIds = uData.favoriteIds || [];
            favoriteFolderIds = uData.favoriteFolderIds || [];
            savedSharedIds = uData.savedSharedIds || [];
          }
        } catch (err) {
          console.warn('Could not load user profile from Firestore:', err);
        }

        const loggedUser: UserProfile = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || 'Usuario Google',
          photoURL: fbUser.photoURL || undefined,
          favoriteIds,
          favoriteFolderIds,
          savedSharedIds
        };
        setCurrentUser(loggedUser);
        localStorage.setItem('presentation_user', JSON.stringify(loggedUser));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time presentations collection
  useEffect(() => {
    setSyncStatus('loading');
    const presentationsRef = collection(db, 'presentations');
    
    const unsubscribe = onSnapshot(presentationsRef, (snapshot) => {
      const firestoreList: PresentationData[] = [];
      snapshot.forEach((docSnap) => {
        firestoreList.push(docSnap.data() as PresentationData);
      });
      setAllPresentations(firestoreList);
      setSyncStatus('synced');
    }, (error) => {
      console.warn('Firestore real-time presentations listener error:', error);
      // Fallback to local server
      fetch('/api/presentations')
        .then(res => res.json())
        .then(data => setAllPresentations(data))
        .catch(() => {});
      setSyncStatus('synced');
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time folders collection
  useEffect(() => {
    const foldersRef = collection(db, 'folders');
    const unsubscribe = onSnapshot(foldersRef, (snapshot) => {
      const list: FolderData[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as FolderData);
      });
      setFolders(list);
    }, (error) => {
      console.warn('Firestore real-time folders listener error:', error);
      // Fallback to local server
      fetch('/api/folders')
        .then(res => res.json())
        .then(data => setFolders(data))
        .catch(() => {});
    });

    return () => unsubscribe();
  }, []);

  // Check URL query param (?p=id or ?share=id) and load directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('p') || params.get('share');
    const isEditorInvite = params.get('role') === 'editor';
    if (!sharedId) {
      setIsLoadingShared(false);
      return;
    }

    let isCancelled = false;

    const loadDirectShared = async () => {
      try {
        setSyncStatus('loading');
        // Fetch in parallel from server and Firestore for speed
        const serverPromise = fetch(`/api/presentations/${sharedId}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null);

        const firestorePromise = getDoc(doc(db, 'presentations', sharedId))
          .then(snap => snap.exists() ? (snap.data() as PresentationData) : null)
          .catch(() => null);

        let data = await Promise.race([serverPromise, firestorePromise]);
        if (!data) {
          data = (await firestorePromise) || (await serverPromise);
        }

        if (isCancelled || !data) return;

        // Cache locally for instant loading
        localStorage.setItem(`cached_pres_${data.id}`, JSON.stringify(data));

        // If accessing via collaborative edit link and logged in
        if (currentUser && isEditorInvite && data.ownerId !== currentUser.id) {
          const alreadyCollab = (data.collaboratorIds || []).includes(currentUser.id) ||
            (data.collaborators || []).some(c => c.id === currentUser.id || (c.email && c.email.toLowerCase() === currentUser.email.toLowerCase()));

          if (!alreadyCollab) {
            const newCollab: CollaboratorInfo = {
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              addedAt: new Date().toISOString(),
              role: 'editor'
            };
            const updatedData: PresentationData = {
              ...data,
              collaborators: [...(data.collaborators || []), newCollab],
              collaboratorIds: [...(data.collaboratorIds || []), currentUser.id]
            };
            data = updatedData;
            setDoc(doc(db, 'presentations', updatedData.id), sanitizeForFirestore(updatedData), { merge: true }).catch(() => {});
            fetch(`/api/presentations/${updatedData.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
              body: JSON.stringify(updatedData)
            }).catch(e => console.warn('Error syncing collab backup:', e));
          }
          setIsEditMode(true);
        } else if (!isEditorInvite && currentUser?.id !== data.ownerId) {
          const isUserCollab = (data.collaboratorIds || []).includes(currentUser?.id || '') ||
            (data.collaborators || []).some(c => c.id === currentUser?.id || (c.email && currentUser?.email && c.email.toLowerCase() === currentUser.email.toLowerCase()));
          if (!isUserCollab) {
            setIsEditMode(false);
          }
        }

        setCurrentPresentation(data);
        setView('presentation');
        setActiveTab('slides');
        setIsLoadingShared(false);
      } catch (err) {
        console.warn('Could not load direct shared presentation:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingShared(false);
          setSyncStatus('synced');
        }
      }
    };

    loadDirectShared();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.id]);

  // Real-time listener for the currently active presentation
  useEffect(() => {
    if (!currentPresentation?.id || view !== 'presentation') return;

    const unsub = onSnapshot(doc(db, 'presentations', currentPresentation.id), (docSnap) => {
      if (docSnap.exists()) {
        const liveData = docSnap.data() as PresentationData;
        setCurrentPresentation(prev => {
          if (isEditMode) {
            return {
              ...prev,
              comments: liveData.comments || [],
              collaborators: liveData.collaborators || [],
              collaboratorIds: liveData.collaboratorIds || [],
              isPublic: liveData.isPublic
            };
          }
          return liveData;
        });
      }
    }, (err) => {
      console.warn('Snapshot on current presentation:', err);
    });

    return () => unsub();
  }, [currentPresentation?.id, view, isEditMode]);

  // Derived presentation lists:
  // 1. My Presentations (Created and owned by current user)
  const myPresentations = currentUser
    ? allPresentations.filter(p => p.ownerId === currentUser.id)
    : [];

  // 2. Shared Presentations (ONLY presentations where current user was explicitly invited with editor role)
  const sharedPresentations = currentUser
    ? allPresentations.filter(p => 
        p.ownerId !== currentUser.id && (
          (p.collaboratorIds || []).includes(currentUser.id) ||
          (p.collaborators || []).some(c => 
            c.id === currentUser.id ||
            (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase())
          )
        )
      )
    : [];

  // 3. Favorite Presentations (External presentations saved by user)
  const favoritePresentations = currentUser
    ? allPresentations.filter(p => 
        p.ownerId !== currentUser.id && 
        (currentUser.favoriteIds || []).includes(p.id)
      )
    : [];

  // Favorite Folders (Shared folders saved by user)
  const favoriteFolders = currentUser
    ? folders.filter(f => (currentUser.favoriteFolderIds || []).includes(f.id))
    : [];

  // 4. Public Presentations (Only presentations marked explicitly as isPublic === true)
  const publicPresentations = allPresentations.filter(p => p.isPublic === true);

  // Filtered user folders (owned by current user)
  const userFolders = currentUser
    ? folders.filter(f => f.ownerId === currentUser.id)
    : [];

  // Persist presentation changes to Cloud Firestore AND local server simultaneously
  const persistPresentation = async (updatedPres: PresentationData) => {
    setSyncStatus('saving');
    const enriched = {
      ...updatedPres,
      updatedAt: new Date().toISOString()
    };

    // Update local cache
    try {
      localStorage.setItem(`cached_pres_${enriched.id}`, JSON.stringify(enriched));
    } catch {}

    try {
      // 1. Save directly to Cloud Firestore with recursive sanitization
      const cleaned = sanitizeForFirestore(enriched);
      await setDoc(doc(db, 'presentations', enriched.id), cleaned, { merge: true });

      // 2. Also keep local Express server synced as backup
      fetch(`/api/presentations/${enriched.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || 'unknown'
        },
        body: JSON.stringify(enriched)
      }).catch(e => console.warn('Backup sync note:', e));

      setSyncStatus('synced');
      setLastSavedTime(new Date());
    } catch (err: any) {
      console.error('Error saving presentation to Firestore:', err);
      try {
        await fetch(`/api/presentations/${enriched.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id || 'unknown'
          },
          body: JSON.stringify(enriched)
        });
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }
  };

  // Debounced auto-save for continuous typing
  const queueAutoSave = (updatedPres: PresentationData) => {
    setCurrentPresentation(updatedPres);
    setSyncStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      persistPresentation(updatedPres);
    }, 400);
  };

  // Folder CRUD handlers
  const handleCreateFolder = async (name: string, color?: string) => {
    const owner = currentUser || DEFAULT_USER;
    const newFolder: FolderData = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      ownerId: owner.id,
      ownerName: owner.name,
      color: color || 'blue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFolders(prev => [...prev, newFolder]);

    try {
      await setDoc(doc(db, 'folders', newFolder.id), sanitizeForFirestore(newFolder));
      fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': owner.id },
        body: JSON.stringify(newFolder)
      }).catch(e => console.warn('Error syncing folder backup:', e));
    } catch (err) {
      console.error('Error creating folder:', err);
    }
    return newFolder;
  };

  const handleRenameFolder = async (folderId: string, newName: string, color?: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const updatedFolder: FolderData = {
      ...folder,
      name: newName.trim(),
      color: color || folder.color,
      updatedAt: new Date().toISOString()
    };

    setFolders(prev => prev.map(f => f.id === folderId ? updatedFolder : f));

    // Update folderName on associated presentations in local state and Firestore
    const affectedPres = allPresentations.filter(p => p.folderId === folderId);
    affectedPres.forEach(pres => {
      const updated = { ...pres, folderName: newName.trim() };
      persistPresentation(updated);
    });

    try {
      await setDoc(doc(db, 'folders', folderId), sanitizeForFirestore(updatedFolder), { merge: true });
      fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser?.id || 'unknown' },
        body: JSON.stringify(updatedFolder)
      }).catch(e => console.warn('Error syncing rename folder backup:', e));
    } catch (err) {
      console.error('Error updating folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));

    // Clear folderId on affected presentations in local state
    setAllPresentations(prev => prev.map(p => {
      if (p.folderId === folderId) {
        return { ...p, folderId: undefined, folderName: undefined };
      }
      return p;
    }));

    if (currentPresentation.folderId === folderId) {
      setCurrentPresentation(prev => ({ ...prev, folderId: undefined, folderName: undefined }));
    }

    // Clear folderId on affected presentations in database
    const affectedPres = allPresentations.filter(p => p.folderId === folderId);
    affectedPres.forEach(pres => {
      const updated = { ...pres, folderId: undefined, folderName: undefined };
      persistPresentation(updated);
    });

    try {
      await deleteDoc(doc(db, 'folders', folderId));
    } catch (err) {
      console.warn('Note deleting folder from Firestore:', err);
    }
    fetch(`/api/folders/${folderId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': currentUser?.id || 'unknown' }
    }).catch(e => console.warn('Error deleting folder backup:', e));
  };

  const handleDuplicateFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const owner = currentUser || DEFAULT_USER;

    const newFolderId = `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newFolderName = `${folder.name} (Copia)`;

    const newFolder: FolderData = {
      id: newFolderId,
      name: newFolderName,
      ownerId: owner.id,
      ownerName: owner.name,
      color: folder.color || 'blue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFolders(prev => [...prev, newFolder]);

    try {
      await setDoc(doc(db, 'folders', newFolder.id), sanitizeForFirestore(newFolder));
      fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': owner.id },
        body: JSON.stringify(newFolder)
      }).catch(e => console.warn('Error syncing duplicated folder backup:', e));
    } catch (err) {
      console.error('Error duplicating folder:', err);
    }

    // Duplicate all presentations inside this folder
    const presInFolder = allPresentations.filter(p => p.folderId === folderId);
    const newPresList: PresentationData[] = [];

    for (const pres of presInFolder) {
      const newPresId = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const duplicatedPres: PresentationData = {
        ...pres,
        id: newPresId,
        title: `${pres.title} (Copia)`,
        folderId: newFolderId,
        folderName: newFolderName,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email,
        collaborators: [],
        collaboratorIds: [],
        comments: [],
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newPresList.push(duplicatedPres);
      persistPresentation(duplicatedPres);
    }

    if (newPresList.length > 0) {
      setAllPresentations(prev => [...newPresList, ...prev]);
    }
  };

  const handleAssignPresentationFolder = async (presentationId: string, folderId?: string, folderName?: string) => {
    const pres = allPresentations.find(p => p.id === presentationId);
    if (!pres) return;

    const updatedPres: PresentationData = {
      ...pres,
      folderId: folderId || undefined,
      folderName: folderName || undefined,
      updatedAt: new Date().toISOString()
    };

    setAllPresentations(prev => prev.map(p => p.id === presentationId ? updatedPres : p));
    if (currentPresentation?.id === presentationId) {
      setCurrentPresentation(updatedPres);
    }
    persistPresentation(updatedPres);
  };

  // Toggle favorite for current user
  const handleToggleFavorite = async (presentationId: string) => {
    if (!currentUser) return;
    const currentFavs = currentUser.favoriteIds || [];
    const isFav = currentFavs.includes(presentationId);
    const updatedFavs = isFav
      ? currentFavs.filter(id => id !== presentationId)
      : [...currentFavs, presentationId];

    const updatedUser: UserProfile = {
      ...currentUser,
      favoriteIds: updatedFavs
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('presentation_user', JSON.stringify(updatedUser));

    try {
      await setDoc(doc(db, 'users', currentUser.id), sanitizeForFirestore({
        favoriteIds: updatedFavs,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (err) {
      console.warn('Error updating favorites in Firestore:', err);
    }
  };

  // Toggle favorite folder for current user
  const handleToggleFavoriteFolder = async (folderId: string) => {
    if (!currentUser) return;
    const currentFavs = currentUser.favoriteFolderIds || [];
    const isFav = currentFavs.includes(folderId);
    const updatedFavs = isFav
      ? currentFavs.filter(id => id !== folderId)
      : [...currentFavs, folderId];

    const updatedUser: UserProfile = {
      ...currentUser,
      favoriteFolderIds: updatedFavs
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('presentation_user', JSON.stringify(updatedUser));

    try {
      await setDoc(doc(db, 'users', currentUser.id), sanitizeForFirestore({
        favoriteFolderIds: updatedFavs,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (err) {
      console.warn('Error updating favorite folders in Firestore:', err);
    }
  };

  // Navigation handlers
  const handleSelectPresentation = (
    presentation: PresentationData, 
    startInEditMode?: boolean,
    originFolder?: { id: string; name?: string }
  ) => {
    setCurrentPresentation(presentation);
    setIsEditMode(Boolean(startInEditMode));
    setView('presentation');
    setActiveTab('slides');

    // Remember origin folder if passed or if currently in a public shared folder
    if (originFolder) {
      setPresentationOriginFolder(originFolder);
    } else if (publicFolderId) {
      const pubFolder = folders.find(f => f.id === publicFolderId);
      setPresentationOriginFolder({
        id: publicFolderId,
        name: pubFolder?.name || 'Carpeta Compartida'
      });
    } else {
      setPresentationOriginFolder(null);
    }

    // Update URL cleanly
    window.history.replaceState({}, '', `?p=${presentation.id}`);
  };

  const handleBackToDashboard = () => {
    // If the presentation was opened from inside a specific folder, return to that folder!
    if (presentationOriginFolder) {
      const targetFolderId = presentationOriginFolder.id;
      // Check if it's the user's own folder or an external/public folder
      const isOwnFolder = folders.some(f => f.id === targetFolderId && f.ownerId === currentUser?.id);
      
      if (isOwnFolder) {
        setActiveFolderId(targetFolderId);
        setPublicFolderId(null);
        setView('dashboard');
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        setPublicFolderId(targetFolderId);
        setView('dashboard');
        window.history.replaceState({}, '', `?folder=${targetFolderId}`);
      }
      setPresentationOriginFolder(null);
      return;
    }

    setView('dashboard');
    setPublicFolderId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Duplicate Presentation handler: clones presentation and appends (Copia) to the title
  const handleDuplicatePresentation = async (presToDuplicate?: PresentationData) => {
    const source = presToDuplicate || currentPresentation;
    if (!source) return;
    const owner = currentUser || DEFAULT_USER;

    const duplicateTitle = `${source.title} (Copia)`;
    const newId = `pres_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const duplicated: PresentationData = {
      ...source,
      id: newId,
      title: duplicateTitle,
      ownerId: owner.id,
      ownerName: owner.name,
      ownerEmail: owner.email,
      collaborators: [],
      collaboratorIds: [],
      comments: [],
      isPublic: false,
      folderId: source.folderId || undefined,
      folderName: source.folderName || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAllPresentations(prev => [duplicated, ...prev]);
    setCurrentPresentation(duplicated);
    setView('presentation');
    setIsEditMode(true);
    setActiveTab('slides');
    window.history.replaceState({}, '', `?p=${newId}`);
    persistPresentation(duplicated);
  };

  const handleCreatePresentation = async (newPres: Partial<PresentationData>) => {
    const id = `pres_${Date.now()}`;
    const owner = currentUser || DEFAULT_USER;
    const fullPresentation: PresentationData = {
      id,
      title: newPres.title || 'Nueva Presentación',
      subject: newPres.subject || 'Ámbito farmacéutico',
      presenters: newPres.presenters || [owner.name || 'Profesor'],
      icon: newPres.icon || 'capsule',
      googleSlidesEmbedUrl: newPres.googleSlidesEmbedUrl || '',
      slides: DEFAULT_PRESENTATION.slides,
      quiz: DEFAULT_PRESENTATION.quiz,
      comments: [],
      collaborators: [],
      collaboratorIds: [],
      ownerId: owner.id,
      ownerName: owner.name,
      ownerEmail: owner.email,
      isPublic: newPres.isPublic ?? false, // DEFAULT: PRIVADO
      folderId: newPres.folderId || undefined,
      folderName: newPres.folderName || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAllPresentations(prev => [fullPresentation, ...prev]);
    setCurrentPresentation(fullPresentation);
    setIsEditMode(true);
    setView('presentation');
    setActiveTab('slides');
    persistPresentation(fullPresentation);
  };

  const handleDeletePresentation = async (id: string) => {
    setAllPresentations(prev => prev.filter(p => p.id !== id));
    if (currentPresentation?.id === id) {
      setView('dashboard');
    }

    try {
      await deleteDoc(doc(db, 'presentations', id));
    } catch (err) {
      console.warn('Note deleting presentation from Firestore:', err);
    }
    fetch(`/api/presentations/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': currentUser?.id || 'unknown' }
    }).catch(e => console.warn('Error deleting backup:', e));
  };

  // Presentation Editor Handlers
  const handleUpdateSlidesUrl = (newUrl: string) => {
    const updated = { ...currentPresentation, googleSlidesEmbedUrl: newUrl };
    queueAutoSave(updated);
  };

  const handleUpdateHeader = (title: string, subject: string, presenters: string[]) => {
    const updated = { ...currentPresentation, title, subject, presenters };
    queueAutoSave(updated);
  };

  const handleUpdateIcon = (newIcon: string) => {
    const updated = { ...currentPresentation, icon: newIcon };
    queueAutoSave(updated);
  };

  const handleUpdateSlide = (updatedSlide: SlideContent) => {
    const updatedSlides = (currentPresentation.slides || []).map(slide => 
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    const updated = { ...currentPresentation, slides: updatedSlides };
    queueAutoSave(updated);
  };

  const handleAddSlide = (newSlide: SlideContent) => {
    const updatedSlides = [...(currentPresentation.slides || []), newSlide];
    const updated = { ...currentPresentation, slides: updatedSlides };
    queueAutoSave(updated);
  };

  const handleDeleteSlide = (slideId: string) => {
    const updatedSlides = (currentPresentation.slides || []).filter(s => s.id !== slideId);
    const updated = { ...currentPresentation, slides: updatedSlides };
    queueAutoSave(updated);
  };

  const handleUpdateQuiz = (updatedQuestions: QuizQuestion[]) => {
    const updated = { ...currentPresentation, quiz: updatedQuestions };
    queueAutoSave(updated);
  };

  // Collaborative Comments
  const handleAddComment = (section: 'slides' | 'explanation' | 'quiz', text: string) => {
    if (!currentUser) return;
    const newComment: SectionComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      section,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorPhotoURL: currentUser.photoURL,
      authorEmail: currentUser.email,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...(currentPresentation.comments || []), newComment];
    const updated = { ...currentPresentation, comments: updatedComments };
    queueAutoSave(updated);

    // Notify the presentation owner if the commenter is not the owner
    if (currentPresentation.ownerId && currentPresentation.ownerId !== currentUser.id) {
      const sectionLabels: Record<'slides' | 'explanation' | 'quiz', string> = {
        slides: 'Diapositivas',
        explanation: 'Explicación a Detalle',
        quiz: 'Preguntas y Dudas'
      };

      const newNotification: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        recipientId: currentPresentation.ownerId,
        presentationId: currentPresentation.id,
        presentationTitle: currentPresentation.title || 'Presentación',
        section,
        sectionLabel: sectionLabels[section] || 'Sección',
        commentId: newComment.id,
        commentText: newComment.text,
        authorId: currentUser.id,
        authorName: currentUser.name || 'Usuario',
        authorPhotoURL: currentUser.photoURL,
        createdAt: new Date().toISOString(),
        read: false
      };

      // Save to Firestore
      setDoc(doc(db, 'notifications', newNotification.id), sanitizeForFirestore(newNotification))
        .catch(err => console.warn('Error saving notification to Firestore:', err));

      // Backup to server API
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      }).catch(e => console.warn('Error posting notification to server:', e));
    }
  };

  const handleReplyComment = (commentId: string, text: string) => {
    if (!currentUser) return;
    const newReply: CommentReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorPhotoURL: currentUser.photoURL,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    let targetSection: 'slides' | 'explanation' | 'quiz' = 'slides';
    let targetAuthorId = '';

    const updatedComments = (currentPresentation.comments || []).map(comm => {
      if (comm.id === commentId) {
        targetSection = comm.section;
        targetAuthorId = comm.authorId;
        return {
          ...comm,
          reply: newReply
        };
      }
      return comm;
    });

    const updated = { ...currentPresentation, comments: updatedComments };
    queueAutoSave(updated);

    // If replier is not the presentation owner or comment author, notify owner
    const recipientId = (currentPresentation.ownerId && currentPresentation.ownerId !== currentUser.id)
      ? currentPresentation.ownerId
      : (targetAuthorId && targetAuthorId !== currentUser.id ? targetAuthorId : null);

    if (recipientId) {
      const sectionLabels: Record<'slides' | 'explanation' | 'quiz', string> = {
        slides: 'Diapositivas',
        explanation: 'Explicación a Detalle',
        quiz: 'Preguntas y Dudas'
      };

      const newNotification: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        recipientId,
        presentationId: currentPresentation.id,
        presentationTitle: currentPresentation.title || 'Presentación',
        section: targetSection,
        sectionLabel: sectionLabels[targetSection] || 'Sección',
        commentId,
        commentText: `Respuesta: ${newReply.text}`,
        authorId: currentUser.id,
        authorName: currentUser.name || 'Usuario',
        authorPhotoURL: currentUser.photoURL,
        createdAt: new Date().toISOString(),
        read: false
      };

      setDoc(doc(db, 'notifications', newNotification.id), sanitizeForFirestore(newNotification))
        .catch(err => console.warn('Error saving reply notification to Firestore:', err));

      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      }).catch(e => console.warn('Error posting notification to server:', e));
    }
  };

  const handleDeleteComment = (commentId: string) => {
    const updatedComments = (currentPresentation.comments || []).filter(c => c.id !== commentId);
    const updated = { ...currentPresentation, comments: updatedComments };
    queueAutoSave(updated);
  };

  // Notification actions
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    try {
      await setDoc(doc(db, 'notifications', notificationId), { read: true }, { merge: true });
    } catch (e) {
      console.warn('Note marking notification read in Firestore:', e);
    }
    fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
      .catch(e => console.warn('Note marking notification read on server:', e));
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notifications.forEach(n => {
      if (!n.read) {
        setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true })
          .catch(e => console.warn('Note marking notification read:', e));
      }
    });
    fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: currentUser.id })
    }).catch(e => console.warn('Note marking all notifications read on server:', e));
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (e) {
      console.warn('Note deleting notification in Firestore:', e);
    }
    fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      .catch(e => console.warn('Note deleting notification on server:', e));
  };

  const handleNavigateToComment = async (notification: AppNotification) => {
    // Mark as read immediately
    handleMarkNotificationAsRead(notification.id);

    // Switch to targeted presentation if needed
    if (currentPresentation?.id !== notification.presentationId) {
      let target = allPresentations.find(p => p.id === notification.presentationId);
      if (!target) {
        try {
          const snap = await getDoc(doc(db, 'presentations', notification.presentationId));
          if (snap.exists()) {
            target = snap.data() as PresentationData;
          }
        } catch (e) {
          console.warn('Error loading presentation for comment navigation:', e);
        }
      }
      if (target) {
        setCurrentPresentation(target);
      }
    }

    // Switch view to presentation and the targeted section screen
    setView('presentation');
    setActiveTab(notification.section);

    // Set targeted comment highlight to trigger auto-expansion and smooth scrolling
    setTargetCommentHighlight({
      presentationId: notification.presentationId,
      section: notification.section,
      commentId: notification.commentId
    });

    window.history.replaceState({}, '', `?p=${notification.presentationId}`);
  };

  // Collaboration and Sharing Handlers
  const handleOpenShareModal = (presentation: PresentationData) => {
    setPresentationToShare(presentation);
    setIsShareModalOpen(true);
  };

  const handleTogglePublic = (isPublic: boolean) => {
    if (!presentationToShare) return;
    const updated = { ...presentationToShare, isPublic };
    setPresentationToShare(updated);
    if (currentPresentation?.id === updated.id) {
      setCurrentPresentation(updated);
    }
    persistPresentation(updated);
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    if (!presentationToShare) return;
    const updatedCollabs = (presentationToShare.collaborators || []).filter(c => c.id !== collaboratorId);
    const updatedCollabIds = (presentationToShare.collaboratorIds || []).filter(id => id !== collaboratorId);
    const updated = {
      ...presentationToShare,
      collaborators: updatedCollabs,
      collaboratorIds: updatedCollabIds
    };
    setPresentationToShare(updated);
    if (currentPresentation?.id === updated.id) {
      setCurrentPresentation(updated);
    }
    persistPresentation(updated);
  };

  const handleUpdateUserName = async (newName: string) => {
    if (!currentUser || !newName.trim()) return;
    const updated = { ...currentUser, name: newName.trim() };
    setCurrentUser(updated);
    localStorage.setItem('presentation_user', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'users', currentUser.id), sanitizeForFirestore({
        name: newName.trim(),
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (e) {
      console.warn('Could not update name in Firestore:', e);
    }
  };

  const handleLogout = () => {
    auth.signOut().catch(() => {});
    localStorage.removeItem('presentation_user');
    setCurrentUser(null);
  };

  // Edit Permissions: Owner OR explicit collaborator
  const isOwner = Boolean(currentUser && currentPresentation?.ownerId === currentUser.id);
  const isCollaborator = Boolean(currentUser && (
    (currentPresentation?.collaboratorIds || []).includes(currentUser.id) ||
    (currentPresentation?.collaborators || []).some(c => 
      c.id === currentUser.id ||
      (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase())
    )
  ));
  const canEdit = isOwner || isCollaborator;
  const isAdmin = canEdit && isEditMode;
  const isCurrentFavorite = Boolean(currentUser && currentPresentation && (currentUser.favoriteIds || []).includes(currentPresentation.id));

  // If loading shared presentation directly from link
  if (isLoadingShared) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold">Cargando presentación interactiva...</h2>
        <p className="text-slate-400 text-sm mt-1">Conectando con base de datos en tiempo real</p>
      </div>
    );
  }

  // If viewing a public shared folder (?folder=id or ?f=id)
  if (publicFolderId && view === 'dashboard') {
    const sharedFolder = folders.find(f => f.id === publicFolderId) || {
      id: publicFolderId,
      name: 'Carpeta Compartida',
      ownerId: 'unknown',
      ownerName: 'Profesor / Expositor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const folderPresentations = allPresentations.filter(p => p.folderId === publicFolderId);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
        <Navbar
          view="dashboard"
          activeTab="slides"
          onSelectTab={setActiveTab}
          onBackToDashboard={handleBackToDashboard}
          title={sharedFolder.name}
          totalSlides={0}
          totalQuestions={0}
          currentUser={currentUser}
          isOwner={false}
          canEdit={false}
          isEditMode={false}
          onToggleEditMode={() => {}}
          onOpenShareModal={() => {}}
          onUpdateUserName={handleUpdateUserName}
          onLogout={handleLogout}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 lg:p-6">
          <PublicFolderView
            folder={sharedFolder}
            presentations={folderPresentations}
            currentUser={currentUser}
            onSelectPresentation={(pres, startEdit) => handleSelectPresentation(pres, startEdit, { id: sharedFolder.id, name: sharedFolder.name })}
            onBackToDashboard={handleBackToDashboard}
            onToggleFavorite={handleToggleFavorite}
            onToggleFavoriteFolder={handleToggleFavoriteFolder}
            isFavoriteFolder={Boolean(currentUser?.favoriteFolderIds?.includes(sharedFolder.id))}
            onDuplicatePresentation={handleDuplicatePresentation}
          />
        </main>
      </div>
    );
  }

  // Authentication requirement modal if not logged in
  if (!currentUser) {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('p') || params.get('share');

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <AuthModal
          isOpen={true}
          isDismissable={false}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            if (sharedId) {
              setView('presentation');
            } else {
              setView('dashboard');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Main Navigation Bar */}
      <Navbar
        view={view}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onBackToDashboard={handleBackToDashboard}
        backButtonLabel={presentationOriginFolder ? `Volver a ${presentationOriginFolder.name || 'Carpeta'}` : 'Inicio'}
        title={currentPresentation.title}
        presentationIcon={currentPresentation.icon}
        totalSlides={currentPresentation.slides?.length || 0}
        totalQuestions={currentPresentation.quiz?.length || 0}
        currentUser={currentUser}
        isOwner={isOwner}
        canEdit={canEdit}
        isEditMode={isEditMode}
        isFavorite={isCurrentFavorite}
        onToggleFavorite={() => handleToggleFavorite(currentPresentation.id)}
        onToggleEditMode={() => setIsEditMode(prev => !prev)}
        onDuplicatePresentation={() => handleDuplicatePresentation(currentPresentation)}
        onOpenShareModal={() => handleOpenShareModal(currentPresentation)}
        onUpdateUserName={handleUpdateUserName}
        onLogout={handleLogout}
        notifications={notifications}
        onNavigateToComment={handleNavigateToComment}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 lg:p-6">
        {view === 'dashboard' ? (
          <DashboardView
            user={currentUser}
            presentations={myPresentations}
            sharedPresentations={sharedPresentations}
            publicPresentations={publicPresentations}
            favoritePresentations={favoritePresentations}
            favoriteFolders={favoriteFolders}
            folders={userFolders}
            activeFolderId={activeFolderId}
            onSelectFolder={setActiveFolderId}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onDuplicateFolder={handleDuplicateFolder}
            onAssignPresentationFolder={handleAssignPresentationFolder}
            onToggleFavorite={handleToggleFavorite}
            onToggleFavoriteFolder={handleToggleFavoriteFolder}
            onOpenSharedFolder={(folderId) => {
              setPublicFolderId(folderId);
              window.history.replaceState({}, '', `?folder=${folderId}`);
            }}
            onSelectPresentation={handleSelectPresentation}
            onCreatePresentation={handleCreatePresentation}
            onDeletePresentation={handleDeletePresentation}
            onDuplicatePresentation={handleDuplicatePresentation}
            onOpenShareModal={(pres) => handleOpenShareModal(pres)}
          />
        ) : (
          <div>
            {/* Notification banner when Edit Mode is active */}
            {isEditMode && canEdit && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold">
                    {isOwner ? 'Modo Edición Propietario' : 'Modo Edición Colaborador'}:
                  </span>
                  <span className="text-emerald-800">
                    Puedes editar textos, tarjetas y preguntas. Los cambios se sincronizan en tiempo real para todos los usuarios.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-mono">
                    {syncStatus === 'saving' ? 'Guardando...' : 'Autoguardado ✓'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 font-semibold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    Finalizar Edición
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'slides' && (
              <SlidesView
                data={currentPresentation}
                currentUser={currentUser}
                onUpdateSlidesUrl={handleUpdateSlidesUrl}
                onUpdateHeader={handleUpdateHeader}
                onUpdateIcon={handleUpdateIcon}
                onNavigateToExplanation={() => setActiveTab('explanation')}
                onAddComment={handleAddComment}
                onReplyComment={handleReplyComment}
                onDeleteComment={handleDeleteComment}
                targetCommentId={targetCommentHighlight?.presentationId === currentPresentation.id && targetCommentHighlight?.section === 'slides' ? targetCommentHighlight.commentId : undefined}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'explanation' && (
              <ExplanationView
                data={currentPresentation}
                currentUser={currentUser}
                onNavigateToSlide={() => setActiveTab('slides')}
                onNavigateToQuiz={() => setActiveTab('quiz')}
                onUpdateSlide={handleUpdateSlide}
                onAddSlide={handleAddSlide}
                onDeleteSlide={handleDeleteSlide}
                onAddComment={handleAddComment}
                onReplyComment={handleReplyComment}
                onDeleteComment={handleDeleteComment}
                targetCommentId={targetCommentHighlight?.presentationId === currentPresentation.id && targetCommentHighlight?.section === 'explanation' ? targetCommentHighlight.commentId : undefined}
                isAdmin={isAdmin}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizView
                data={currentPresentation}
                currentUser={currentUser}
                onNavigateToExplanation={() => setActiveTab('explanation')}
                onUpdateQuiz={handleUpdateQuiz}
                onAddComment={handleAddComment}
                onReplyComment={handleReplyComment}
                onDeleteComment={handleDeleteComment}
                targetCommentId={targetCommentHighlight?.presentationId === currentPresentation.id && targetCommentHighlight?.section === 'quiz' ? targetCommentHighlight.commentId : undefined}
                isAdmin={isAdmin}
              />
            )}
          </div>
        )}
      </main>

      {/* Share / Public Link Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        presentation={presentationToShare}
        isOwner={Boolean(currentUser && presentationToShare?.ownerId === currentUser.id)}
        onTogglePublic={handleTogglePublic}
        onRemoveCollaborator={handleRemoveCollaborator}
      />

      {/* Footer with Sync & Auto-save Status */}
      <footer className="border-t border-slate-200 bg-white py-3.5 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>
            {view === 'presentation' 
              ? `${currentPresentation.title} • ${(currentPresentation.presenters || []).join(' & ')}`
              : `Mis Presentaciones • ${currentUser.name}`}
          </span>
          
          {/* Cloud Sync Status Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            <Cloud className="w-3 h-3 text-blue-500" />
            {syncStatus === 'saving' && (
              <span className="text-amber-600 flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Autoguardando...
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="text-emerald-600 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Autoguardado en base de datos
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-rose-600">Reconectando...</span>
            )}
            {syncStatus === 'loading' && (
              <span>Cargando datos...</span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          {view === 'presentation' ? (
            isOwner ? (
              <span>Propietario • {isEditMode ? 'Modo Edición activo (Permanece activo)' : 'Modo Presentación (Solo Lectura)'}</span>
            ) : isCollaborator ? (
              <span>Colaborador • {isEditMode ? 'Modo Edición activo' : 'Modo Presentación (Haz clic en Editar arriba)'}</span>
            ) : (
              <span>Modo Espectador (Solo Lectura)</span>
            )
          ) : (
            <span>{myPresentations.length} {myPresentations.length === 1 ? 'presentación' : 'presentaciones'}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
