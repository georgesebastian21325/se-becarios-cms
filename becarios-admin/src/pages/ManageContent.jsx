import NavBar from '../components/global/NavBar';
import NavBarMobile from '../components/global/NavBarMobile';
import PageTitle from '../components/global/PageTitle';
import ContentFilters from '../components/manage-content/ContentFilters';
import SearchField from '../components/global/SearchField';
import ForApprovalList from '../components/manage-content/ForApprovalList';
import ContentList from '../components/manage-content/ContentList';
import PaginationLabel from '../components/global/PaginationLabel';
import { useSignOutContext } from '../hooks/useSignOutContext';
import { SignOutModal } from '../components/global/Modal';
import ViewArticleModal from '../components/manage-content/ViewArticleModal';
import { useManageContentContext } from '../hooks/useManageContentContext';

function ManageContent() {
  const { isSignOutClicked } = useSignOutContext();

  const { isPendingItemClicked } =
    useManageContentContext();
  return (
    <div className="flex flex-col justify-start lg:flex-row">
      <div className="navs">
        <NavBar />
        <NavBarMobile />
      </div>

      <div className="content mt-[10rem] flex w-[100%] flex-col gap-[5rem] px-9 md:mb-[5rem] md:px-16 lg:ml-[21rem] lg:mt-[8rem] lg:pb-[20%]">
        <PageTitle title="Manage Content" />
        <div className=" flex w-full flex-col justify-evenly gap-3 ">
          <ForApprovalList />
          <SearchField type="Posted" />
          <ContentFilters />
          <div className="pagination mt-[2rem] flex">
            <PaginationLabel />
          </div>
          <ContentList type="Posted" />
        </div>
      </div>
      {isSignOutClicked && <SignOutModal />}
      {isPendingItemClicked && <ViewArticleModal />}
    </div>
  );
}

export default ManageContent;
