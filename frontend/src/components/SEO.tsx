import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    image?: string;
    keywords?: string;
}

const SEO = ({ title, description, image, keywords }: SEOProps) => {
    const defaultKeywords = "Minecraft, сервер, ванилла, StoryLegends, выживание, без доната, РП, RP, roleplay, майнкрафт, приватный сервер";
    const fullTitle = title.includes('StoryLegends') ? title : `${title} | StoryLegends`;
    const metaDescription = description || "StoryLegends - Бесплатный ванильный сервер Minecraft";
    const metaImage = image || "https://www.storylegends.xyz/images/opengraph.png";
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.storylegends.xyz';

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={keywords ? `${defaultKeywords}, ${keywords}` : defaultKeywords} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
        </Helmet>
    );
};

export default SEO;
