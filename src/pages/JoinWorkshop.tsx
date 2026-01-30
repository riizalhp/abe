import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import workshopService from '../../services/workshopService';
import { supabase } from '../../lib/supabase';

const JoinWorkshop: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<{
    email: string;
    role: string;
    workshopName: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    checkInvitation();
  }, [inviteCode]);

  const checkInvitation = async () => {
    if (!inviteCode) {
      setError('Kode undangan tidak valid');
      setIsLoading(false);
      return;
    }

    try {
      // Fetch invitation details
      const { data: invitation, error: invError } = await supabase
        .from('workshop_invitations')
        .select(`
          *,
          workshops:workshop_id (name)
        `)
        .eq('invite_code', inviteCode)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (invError || !invitation) {
        setError('Undangan tidak valid atau sudah kadaluarsa');
        setIsLoading(false);
        return;
      }

      setInvitationInfo({
        email: invitation.email,
        role: invitation.role,
        workshopName: invitation.workshops?.name || 'Unknown Workshop',
        expiresAt: invitation.expires_at
      });
    } catch (err) {
      setError('Gagal memuat informasi undangan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode) return;
    
    setIsJoining(true);
    setError(null);

    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login with return URL
        navigate(`/login?redirect=/join/${inviteCode}`);
        return;
      }

      // Get user from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        setError('User tidak ditemukan. Silakan login terlebih dahulu.');
        setIsJoining(false);
        return;
      }

      // Accept invitation
      const result = await workshopService.acceptInvitation(inviteCode, userData.id);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Gagal bergabung dengan workshop');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat undangan...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Undangan Tidak Valid</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Berhasil Bergabung!</h2>
          <p className="text-gray-600 mb-6">
            Anda sekarang terdaftar sebagai staff di {invitationInfo?.workshopName}
          </p>
          <p className="text-sm text-gray-500">Mengalihkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white text-center">
          <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">mail</span>
          </div>
          <h1 className="text-2xl font-bold">Undangan Workshop</h1>
          <p className="text-white/80 mt-1">Anda diundang untuk bergabung</p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="material-symbols-outlined text-primary">storefront</span>
              <div>
                <p className="text-sm text-gray-500">Workshop</p>
                <p className="font-semibold text-gray-900">{invitationInfo?.workshopName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="material-symbols-outlined text-primary">badge</span>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold text-gray-900">{invitationInfo?.role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <div>
                <p className="text-sm text-gray-500">Kadaluarsa</p>
                <p className="font-semibold text-gray-900">
                  {invitationInfo?.expiresAt 
                    ? new Date(invitationInfo.expiresAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : '-'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Memproses...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">group_add</span>
                Gabung Workshop
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Dengan bergabung, Anda setuju dengan syarat dan ketentuan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinWorkshop;
