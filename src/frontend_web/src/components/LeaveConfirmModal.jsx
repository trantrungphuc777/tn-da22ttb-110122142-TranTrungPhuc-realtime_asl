import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LeaveConfirmModal = ({ open, onCancel, onConfirm, message }) => {
  const { t, lang } = useLanguage();
  if (!open) return null;

  const defaultMessage = t('studentExamDetail.leaveWarning');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-lg">
        <h3 className="text-lg font-bold mb-2">
          {t('common.confirmLeave')}
        </h3>
        <p className="text-sm text-gray-700 mb-4">{message || defaultMessage}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-white border rounded-lg">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-rose-500 text-white rounded-lg">
            {t('common.leaveAndSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveConfirmModal;
