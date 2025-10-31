import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../services/api';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  username: string;
}

export function DeleteAccountModal({ isOpen, onClose, onDeleted, username }: DeleteAccountModalProps) {
  const [step, setStep] = useState<'warning' | 'confirm' | 'password'>('warning');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    if (!isDeleting) {
      setStep('warning');
      setPassword('');
      setConfirmText('');
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.deleteUser(password);
      toast.success('Account deleted successfully');
      onDeleted();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account. Please check your password and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'warning' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">This action cannot be undone</h3>
                <p className="text-sm text-red-700">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Your user profile and account data</li>
                  <li>All your graphs and visualizations</li>
                  <li>All shared graphs and collaborations</li>
                  <li>Your account history and settings</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-3">
                  Please type <span className="font-semibold">{username}</span> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={username}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('warning')}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('password')}
                  disabled={confirmText !== username}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-3">
                  Enter your password to confirm account deletion:
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password.trim()) {
                      handleDelete();
                    }
                  }}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('confirm')}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!password.trim() || isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors flex items-center justify-center"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}