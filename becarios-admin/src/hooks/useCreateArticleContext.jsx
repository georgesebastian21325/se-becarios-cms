import { createContext, useContext, useState } from 'react';

export const CreateArticleContext = createContext();

export function useCreateArticleContext() {
  return useContext(CreateArticleContext);
}

export function CreateArticleProvider({ children }) {
  const [articleTitle, setArticleTitle] = useState('');

  const [articleImageFileName, setArticleImageFileName] =
    useState('');
  const [articleImageSrc, setArticleImageSrc] =
    useState('');
  const [articleBody, setArticleBody] = useState('');
  const [isSubmitBtnPressed, setIsSubmitBtnPressed] =
    useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitConfirmed, setIsSubmitConfirmed] =
    useState(false);

  const contextValue = {
    articleTitle,
    setArticleTitle,
    articleImageFileName,
    setArticleImageFileName,
    articleImageSrc,
    setArticleImageSrc,
    articleBody,
    setArticleBody,
    isPreview,
    setIsPreview,
    isSubmitBtnPressed,
    setIsSubmitBtnPressed,
    isSubmitConfirmed,
    setIsSubmitConfirmed,
  };

  return (
    <CreateArticleContext.Provider value={contextValue}>
      {children}
    </CreateArticleContext.Provider>
  );
}