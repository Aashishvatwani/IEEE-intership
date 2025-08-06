import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import { getFilesByUser, retrieveFromIPFS } from '../services/ipf5Services';

interface UserFile {
  cid: string;
  name: string;
  size: number;
  uploadDate: string;
  encrypted: boolean;
  fileType: string;
  hash: string;
  userName?: string;
  userId?: string;
}

const MyFiles: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn && user?.emailAddresses?.[0]?.emailAddress) {
      loadUserFiles();
    }
  }, [isSignedIn, user]);

  const loadUserFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      if (userEmail) {
        const userFiles = await getFilesByUser(userEmail);
        setFiles(userFiles);
      }
    } catch (err) {
      setError('Failed to load your files. Please try again.');
      console.error('Error loading user files:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (cid: string, filename: string) => {
    try {
      const blob = await retrieveFromIPFS(cid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('document') || fileType.includes('word')) return '📝';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    return '📁';
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">
            Please sign in to view your uploaded files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1),transparent_25%)] pointer-events-none" />
      
      <div className="relative z-10 pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                My Files
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your securely stored documents on IPFS
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Signed in as {user?.emailAddresses?.[0]?.emailAddress}</span>
              </div>
              <button
                onClick={loadUserFiles}
                disabled={loading}
                className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm hover:bg-blue-600/30 transition-colors disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-400">Loading your files...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6"
            >
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Files Grid */}
          {!loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {files.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-300">No files uploaded yet</h3>
                  <p className="text-gray-500 mb-6">Start by uploading your first document to IPFS</p>
                  <a
                    href="/upload"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Upload Files
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.cid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:bg-gray-900/70 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                          <div>
                            <h3 className="font-semibold text-white truncate max-w-[200px]" title={file.name}>
                              {file.name}
                            </h3>
                            <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        {file.encrypted && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full">
                            <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-purple-300">Encrypted</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Uploaded:</span>
                          <span className="text-gray-300">{formatDate(file.uploadDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">CID:</span>
                          <span className="text-gray-300 font-mono text-xs truncate max-w-[120px]" title={file.cid}>
                            {file.cid}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFile(file.cid, file.name)}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(`https://gateway.pinata.cloud/ipfs/${file.cid}`)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                          title="Copy IPFS URL"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Stats */}
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6"
                >
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{files.length}</div>
                    <div className="text-sm text-gray-400">Total Files</div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {files.filter(f => f.encrypted).length}
                    </div>
                    <div className="text-sm text-gray-400">Encrypted</div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">
                      {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
                    </div>
                    <div className="text-sm text-gray-400">Total Size</div>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {new Set(files.map(f => f.fileType)).size}
                    </div>
                    <div className="text-sm text-gray-400">File Types</div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFiles;
