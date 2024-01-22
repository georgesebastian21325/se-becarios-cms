import ArticleTitleField from '../components/create-post/ArticleTitleField';
import NavBar from '../components/global/NavBar';
import NavBarMobile from '../components/global/NavBarMobile';
import PageTitle from '../components/global/PageTitle';
import ArticleImageField from '../components/create-post/ArticleImageField';
import { useState } from 'react';
import TextEditor from '../components/create-post/TextEditor';
import { SubmitArticleBtn } from '../components/global/Button';
import ArticlePreview from '../components/create-post/ArticlePreview';
import { PostReqSuccessModal } from '../components/global/Modal';

function CreatePost() {
  const [articleTitle, setArticleTitle] = useState('');
  const [isSubmitBtnPressed, setIsSubmitBtnPressed] =
    useState(false);
  const [articleImageFileName, setArticleImageFileName] =
    useState('');
  const [articleImageSrc, setArticleImageSrc] =
    useState('');
  const [articleBody, setArticleBody] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="flex flex-col justify-start lg:flex-row ">
      <div className="navs">
        <NavBar />
        <NavBarMobile />
      </div>

      <div className="content mt-[10rem] flex w-[100%] flex-col gap-[5rem] px-9 md:mb-[5rem] md:px-16 lg:ml-[21rem] lg:mt-[8rem] lg:pb-[20%]">
        {!isPreview ? (
          <>
            <PageTitle title="Create Post" />
            <div className="flex flex-col">
              <ArticleTitleField
                articleTitle={articleTitle}
                setArticleTitle={setArticleTitle}
              />
              <ArticleImageField
                articleImageFileName={articleImageFileName}
                setArticleImageFileName={
                  setArticleImageFileName
                }
                setArticleImageSrc={setArticleImageSrc}
              />

              <TextEditor
                articleBody={articleBody}
                setArticleBody={setArticleBody}
              />
            </div>{' '}
          </>
        ) : (
          <ArticlePreview
            articleTitle={articleTitle}
            articleImageSrc={articleImageSrc}
            articleBody={articleBody}
          />
        )}
        <SubmitArticleBtn
          isPreview={isPreview}
          setIsPreview={setIsPreview}
          setIsButtonPressed={setIsSubmitBtnPressed}
        />
      </div>
      {/* {isSubmitBtnPressed && <PostReqSuccessModal />} */}
    </div>
  );
}

export default CreatePost;
