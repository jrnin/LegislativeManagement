// React 19 compatible head management component
// Replacement for react-helmet to support React 19

import { useEffect } from 'react';

interface HeadProps {
  children: React.ReactNode;
}

interface HelmetProps {
  children?: React.ReactNode;
}

export function Head({ children }: HeadProps) {
  useEffect(() => {
    // Process the children to extract title and meta tags
    const processElements = (elements: React.ReactNode) => {
      if (!elements) return;

      // Handle React elements
      if (typeof elements === 'object' && elements !== null && 'type' in elements) {
        const element = elements as React.ReactElement;
        
        if (element.type === 'title') {
          document.title = element.props.children;
        } else if (element.type === 'meta') {
          const { name, content, property } = element.props;
          
          // Remove existing meta tag if it exists
          const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
          const existing = document.querySelector(selector);
          if (existing) {
            existing.remove();
          }
          
          // Add new meta tag
          const meta = document.createElement('meta');
          if (name) meta.setAttribute('name', name);
          if (property) meta.setAttribute('property', property);
          if (content) meta.setAttribute('content', content);
          document.head.appendChild(meta);
        }
      }
    };

    // Handle both single elements and arrays
    if (Array.isArray(children)) {
      children.forEach(processElements);
    } else {
      processElements(children);
    }
  }, [children]);

  return null;
}

// Compatibility component that matches react-helmet API
export function Helmet({ children }: HelmetProps) {
  return <Head>{children}</Head>;
}