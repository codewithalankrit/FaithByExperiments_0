import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SEO = ({ 
  title = 'Faith by Experiments',
  description = 'Faith, tested in real life. Structured experiments, frameworks, and observations for those who treat faith as a hypothesis worth testing.',
  keywords = 'faith, experiments, spirituality, personal growth, philosophy, intellectual faith',
  image = 'https://customer-assets.emergentagent.com/job_34e2cbef-ee34-45ac-8348-79293beec714/artifacts/j8mvu38p_Production-edited-Logo-Photoroom.png',
  url,
  type = 'website'
}) => {
  const siteUrl = process.env.REACT_APP_BACKEND_URL || 'https://faithbyexperiments.com';
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Faith by Experiments" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Ajit Kumar" />
      <meta name="language" content="English" />
    </Helmet>
  );
};

// Pre-configured SEO for common pages
export const HomePageSEO = () => (
  <SEO 
    title="Faith by Experiments - Faith, Tested in Real Life"
    description="Explore faith through the lens of experimentation. Structured frameworks and observations for educated minds who refuse to choose between reason and transcendence."
    url="/"
  />
);

export const FlagshipContentsSEO = () => (
  <SEO 
    title="Flagship Contents - Faith by Experiments"
    description="Premium content exploring experimental approaches to faith. Structured experiments, frameworks, and in-depth observations."
    url="/flagship-contents"
    type="article"
  />
);

export const SubscribeSEO = () => (
  <SEO 
    title="Subscribe - Faith by Experiments"
    description="Join the Faith by Experiments journey. Get full access to structured experiments, frameworks, and exclusive content."
    url="/subscribe"
  />
);

export const ContactSEO = () => (
  <SEO 
    title="Contact - Faith by Experiments"
    description="Get in touch with Faith by Experiments. We'd love to hear from you."
    url="/contact"
  />
);
