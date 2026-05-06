import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import NotFound from './NotFound';
import { customPagesApi, type CustomPage } from '../api';
import { renderCustomPageHtml } from '../utils/pageHtml';
import SEO from '../components/SEO';

const CustomDynamicPage: React.FC = () => {
  const { customPath } = useParams<{ customPath: string }>();
  const [pageData, setPageData] = useState<CustomPage | null>(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'iframeHeight') {
        setIframeHeight(event.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!customPath) return;

    setLoading(true);
    customPagesApi.getByPath(customPath)
      .then(data => {
        setPageData(data);
        setError(false);
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
        <SEO title="Загрузка..." description="Загрузка..." />
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
      <SEO
        title={pageData.title || 'StoryLegends'}
        description={pageData.title || 'Страница...'}
      />
      <div className="pt-32 pb-16 min-h-screen text-white container mx-auto px-4">
        <div className="w-full max-w-5xl mx-auto flex flex-col relative z-10">
          <iframe
            title={pageData.title}
            srcDoc={renderCustomPageHtml(pageData.htmlContent)}
            className="w-full border-none bg-transparent"
            sandbox="allow-scripts allow-same-origin"
            style={{ 
              background: 'transparent',
              height: `${iframeHeight}px`,
              minHeight: '60vh'
            }}
            allowTransparency={true}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CustomDynamicPage;
