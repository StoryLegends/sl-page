import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import NotFound from './NotFound';
import { customPagesApi, type CustomPage } from '../api';
import { renderCustomPageHtml } from '../utils/pageHtml';

const CustomDynamicPage: React.FC = () => {
  const { customPath } = useParams<{ customPath: string }>();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!customPath) return;
    
    setLoading(true);
    customPagesApi.getByPath(customPath)
      .then(data => {
        setPageData(data);
        setError(false);
        document.title = data.title ? `${data.title} | StoryLegends` : 'StoryLegends';
      })
      .catch((err) => {
        console.error('Failed to load custom page', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [customPath]);

  if (loading) {
    return (
      <Layout>
        <div className="pt-24 min-h-screen text-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </Layout>
    );
  }

  if (error || !pageData) {
    return <NotFound />;
  }

  return (
    <Layout>
      <div className="pt-32 pb-16 min-h-screen text-white flex items-center justify-center container mx-auto px-4">
        <div className="w-full max-w-5xl bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-4 md:p-8 min-h-[60vh] flex flex-col relative z-10">
          <iframe
            title={pageData.title}
            srcDoc={renderCustomPageHtml(pageData.htmlContent)}
            className="w-full flex-grow border-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </Layout>
  );
};

export default CustomDynamicPage;
