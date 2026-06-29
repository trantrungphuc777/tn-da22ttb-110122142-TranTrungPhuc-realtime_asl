import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ErrorBoundary = ({ children }) => {
  const { t } = useLanguage();
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleGoBack = () => {
    try {
      window.location.href = '/my-assignments';
    } catch (e) {
      window.location.reload();
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-xl bg-white rounded-xl p-8 shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t('errorBoundary.errorOccurred')}</h2>
          <p className="text-gray-700 mb-6">{t('errorBoundary.appCrashed')}</p>
          <div className="flex justify-center gap-4">
            <button onClick={handleGoBack} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{t('errorBoundary.backToAssignment')}</button>
            <button onClick={handleReload} className="px-4 py-2 bg-gray-200 rounded-lg">{t('errorBoundary.reload')}</button>
          </div>
          <pre className="text-xs text-left mt-4 text-gray-400 overflow-auto max-h-40">{String(error)}</pre>
        </div>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;
