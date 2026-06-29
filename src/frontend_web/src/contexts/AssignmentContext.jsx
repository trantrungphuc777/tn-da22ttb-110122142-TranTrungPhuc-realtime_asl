import React, { createContext, useState, useContext, useCallback } from 'react';

const AssignmentContext = createContext(null);

export const AssignmentProvider = ({ children }) => {
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [ready, setReady] = useState(false);

  const lock = useCallback((id) => {
    setActiveAssignmentId(id);
    setIsLocked(true);
  }, []);

  const release = useCallback(() => {
    setActiveAssignmentId(null);
    setIsLocked(false);
    setReady(false);
  }, []);

  const markReady = useCallback(() => setReady(true), []);

  return (
    <AssignmentContext.Provider value={{ activeAssignmentId, isLocked, ready, lock, release, markReady }}>
      {children}
    </AssignmentContext.Provider>
  );
};

export const useAssignment = () => {
  return useContext(AssignmentContext);
};

export default AssignmentContext;
