import ArticleTitleField from '../components/create-post/ArticleTitleField';
import NavBar from '../components/global/NavBar';
import NavBarMobile from '../components/global/NavBarMobile';
import PageTitle from '../components/global/PageTitle';
import ArticleImageField from '../components/create-post/ArticleImageField';
import { Suspense, useState } from 'react';
import AuthorDropdown from '../components/create-post/AuthorDropdown';
import TextEditor from '../components/create-post/TextEditor';
import {
  SubmitArticleBtn,
  SubmitPostModalBtn,
} from '../components/global/Button';

function CreatePost() {
  const markdown = '';

  const [articleBody, setArticleBody] = useState('');
  // const markdownRef = useRef < MDXEditorMethods > null;

  return (
    <div className="flex flex-col justify-start lg:flex-row ">
      <div className="navs">
        <NavBar />
        <NavBarMobile />
      </div>

      <div className="content mt-[10rem] flex w-[100%] flex-col gap-[5rem] px-9 md:mb-[5rem] md:px-16 lg:ml-[21rem] lg:mt-[8rem] lg:pb-[20%]">
        <PageTitle title="Create Post" />
        {/* <form
          action=""
          method=""
          encType="multipart/form-data"
        > */}
        <div className="flex flex-col">
          <ArticleTitleField />
          <ArticleImageField />

          <TextEditor />
          <SubmitArticleBtn />
        </div>
        {/* </form> */}
      </div>
    </div>
  );
}

export default CreatePost;