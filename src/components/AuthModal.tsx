import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Sparkles } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, doc, setDoc, db, sanitizeForFirestore } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  isDismissable?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  isDismissable = true
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userProfile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || 'Usuario Google',
        photoURL: user.photoURL || undefined
      };

      // Guardar/actualizar en Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          photoURL: userProfile.photoURL || null,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      } catch (firestoreErr) {
        console.warn('Could not sync user profile to firestore:', firestoreErr);
      }

      localStorage.setItem('presentation_user', JSON.stringify(userProfile));
      onAuthSuccess(userProfile);
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('El inicio de sesión fue cancelado.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('El dominio actual no está autorizado en la consola de Firebase.');
      } else {
        setError(err.message || 'No se pudo iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header decoration */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 text-center text-white relative">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <Sparkles className="w-8 h-8 text-blue-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Iniciar Sesión</h2>
          <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
            Accede con tu cuenta de Google para administrar y sincronizar tus presentaciones en tiempo real.
          </p>
        </div>

        {/* Action body */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs leading-relaxed">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-semibold text-sm shadow-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Conexión segura mediante Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
};
