import { useEffect, useState } from 'react';
import ContentListItem from './ContentListItem';
import {
  fetchArchivedPost,
  fetchPostedArticles,
} from '../../server/API/ManageContentAPI';
import {
  fetchAllPostedArticlesAZ,
  fetchAllPostedArticles09,
  searchArticleByTitle,
} from '../../server/API/GlobalAPI';
import { useManageContentContext } from '../../hooks/useManageContentContext';
import ListSpinner from '../global/ListSpinner';

const ITEMS_PER_PAGE = 9; // Set desired number of articles per page

function ContentList({ type, currentPage, totalPages }) {
  console.log('currentPage:', currentPage);
  console.log('totalPages:', totalPages);
  const context = useManageContentContext();
  console.log('Context:', context);
  const {
    sortOrder = '',
    searchQuery,
    setSortOrder,
    setSearchQuery,
  } = useManageContentContext() || {};
  const [articles, setArticles] = useState([]);

  // Calculate the start and end indices for pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  useEffect(() => {
    console.log('Sort Order:', sortOrder);
    console.log('Search Query:', searchQuery);

    const fetchArticlesData = async () => {
      try {
        let articlesData;

        if (searchQuery && searchQuery !== '') {
          articlesData = await searchArticleByTitle(
            searchQuery,
            type,
          );
        } else {
          articlesData = await (type === 'Posted'
            ? fetchPostedArticles()
            : fetchArchivedPost());
        }

        console.log(
          'Fetched Articles:',
          articlesData,
          type,
        );

        let sortedArticles;

        switch (sortOrder) {
          case 'alpha-asc':
            sortedArticles = await fetchAllPostedArticlesAZ(
              'asc',
              type,
            );
            break;
          case 'alpha-desc':
            sortedArticles = await fetchAllPostedArticlesAZ(
              'desc',
              type,
            );
            break;
          case 'date-asc':
            sortedArticles = await fetchAllPostedArticles09(
              'asc',
              type,
            );
            break;
          case 'date-desc':
            sortedArticles = await fetchAllPostedArticles09(
              'desc',
              type,
            );
            break;
          default:
            sortedArticles = articlesData;
        }

        console.log('Current sortOrder:', sortOrder);
        // Ensure sortedArticles is an array
        sortedArticles = Array.isArray(sortedArticles)
          ? sortedArticles
          : [];

        console.log('sortedArticles: ', sortedArticles);

        setArticles(sortedArticles);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
    };

    // Call the asynchronous function
    fetchArticlesData();
  }, [
    sortOrder,
    searchQuery,
    type,
    currentPage,
    totalPages,
  ]);

  // Handlers for sorting and searching
  const handleSortAlphaUp = () => setSortOrder('alpha-asc');
  const handleSortAlphaDown = () =>
    setSortOrder('alpha-desc');
  const handleSortDateAsc = () => setSortOrder('date-asc');
  const handleSortDateDesc = () =>
    setSortOrder('date-desc');
  const handleSearch = (query) => setSearchQuery(query);

  return (
    <div className=" rounded-8 mt-[2rem] flex w-[100%] flex-col gap-2 sm:min-w-[100%] md:max-w-[100%] lg:min-w-[40vh] lg:max-w-[100%]">
      {articles.length < 1 && <ListSpinner />}
      <div className="req-items -mt-5 mb-4 flex flex-col gap-6 md:grid md:grid-cols-3 ">
        {/* CONVERT INTO ARRAY.MAP */}

        {articles
          .slice(startIndex, endIndex)
          .map((article) => {
            // date displayed would depend on type of article, for archived should be dateArchived
            let articleDate =
              type === 'Posted'
                ? article.data.datePosted
                : article.data.dateArchived;
            return (
              <ContentListItem
                type={type}
                data={{
                  author: article.data.author,
                  datePosted: articleDate,
                  image: article.data.image,
                  title: article.data.title,
                }}
                id={article.id}
                key={article.id}
              />
            );
          })}
      </div>
    </div>
  );
}

export default ContentList;
