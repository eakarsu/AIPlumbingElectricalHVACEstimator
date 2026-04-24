import React from 'react';

function AIOutput({ content, loading, title = 'AI Analysis' }) {
  if (loading) {
    return (
      <div className="ai-output">
        <div className="ai-loading">
          <div className="spinner"></div>
          <p>AI is analyzing your request...</p>
        </div>
      </div>
    );
  }

  if (!content) return null;

  // Parse markdown-like content into beautiful HTML
  const formatContent = (text) => {
    let html = text;
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Bullet lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Line breaks to paragraphs
    html = html.split('\n\n').map(block => {
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol')) return block;
      if (block.trim() === '') return '';
      return `<p>${block}</p>`;
    }).join('');
    html = html.replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className="ai-output">
      <div className="ai-output-header">
        <div className="ai-icon">🤖</div>
        <div>
          <h4>{title}</h4>
        </div>
        <span className="model-badge">Claude Haiku 4.5</span>
      </div>
      <div
        className="ai-output-content"
        dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      />
    </div>
  );
}

export default AIOutput;
