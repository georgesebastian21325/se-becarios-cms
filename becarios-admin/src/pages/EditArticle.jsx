import ArticleTitleField from '../components/create-article/ArticleTitleField';
import NavBar from '../components/global/NavBar';
import NavBarMobile from '../components/global/NavBarMobile';
import PageTitle from '../components/global/PageTitle';
import ArticleImageField from '../components/create-article/ArticleImageField';
import { useEffect, useState } from 'react';
import TextEditor from '../components/create-article/TextEditor';
import { SubmitArticleBtn } from '../components/global/Button';
import ArticlePreview from '../components/create-article/ArticlePreview';
import {
  PostReqSuccessModal,
  SignOutModal,
  SubmitPostModal,
} from '../components/global/Modal';
import { useCreateArticleContext } from '../hooks/useCreateArticleContext';
import { useSignOutContext } from '../hooks/useSignOutContext';
import { useParams } from 'react-router-dom';
import { fetchArticleById } from '../server/API/ManageContentAPI';

function EditArticle() {
  const { isSignOutClicked } = useSignOutContext();
  const { id } = useParams();

  const {
    setArticleTitle,
    setArticleImageFileName,
    setArticleImageSrc,
    setArticleBody,
    isPreview,
    setIsPreview,
    isSubmitBtnPressed,
    isSubmitConfirmed,
  } = useCreateArticleContext();

  useEffect(() => {
    async function fetchData() {
      setIsPreview(true);
      const data = await fetchArticleById(id);
      console.log(data);
      setArticleTitle(data.title);

      const parser = new DOMParser();
      const parsedContent = parser.parseFromString(
        data.body,
        'text/html',
      );

      // Check if the parsed content is different from the current articleBody state
      const newContent =
        parsedContent.documentElement.innerHTML;
      console.log(newContent);
      setArticleBody(newContent);
      // setArticleImageFileName(data.image);
      setArticleImageSrc(data.image);
    }
    fetchData();
  }, [
    id,
    setIsPreview,
    setArticleTitle,
    setArticleBody,
    setArticleImageFileName,
    setArticleImageSrc,
  ]);

  return (
    <div className="flex flex-col justify-start lg:flex-row ">
      <div className="navs">
        <NavBar />
        <NavBarMobile />
      </div>

      <div className="content mt-[10rem] flex w-[100%] flex-col gap-[5rem] px-9 md:mb-[5rem] md:px-16 lg:ml-[21rem] lg:mt-[8rem] lg:pb-[20%]">
        {!isPreview ? (
          <>
            <PageTitle title="Edit Article" />
            <form
              method="POST"
              encType="multipart/form-data"
              className="flex flex-col"
            >
              <ArticleTitleField />
              <ArticleImageField />
              <TextEditor />
            </form>{' '}
          </>
        ) : (
          <ArticlePreview />
        )}
        <SubmitArticleBtn />
      </div>
      {isSubmitBtnPressed && !isSubmitConfirmed && (
        <SubmitPostModal />
      )}

      {isSubmitConfirmed && <PostReqSuccessModal />}
      {isSignOutClicked && <SignOutModal />}
    </div>
  );
}

export default EditArticle;
