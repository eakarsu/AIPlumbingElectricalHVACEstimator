import React from 'react';
import AIReport from './AIReport';

function AIOutput({ content, loading, title = 'AI Analysis' }) {
  if (loading) return <AIReport loading title={title} />;
  if (content === null || content === undefined || content === '') return null;
  return <AIReport response={content} title={title} />;
}

export default AIOutput;
