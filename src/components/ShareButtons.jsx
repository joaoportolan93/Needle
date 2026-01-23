import React from 'react';

const ShareButtons = ({ title, description, url }) => {
  // Função para criar URLs de compartilhamento
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(description)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(description)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${description} ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(description)}`,
    copyLink: url
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('Link copiado para a área de transferência!');
      })
      .catch(err => {
        console.error('Erro ao copiar: ', err);
      });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => window.open(shareUrls.twitter, '_blank')}
        className="bg-[#1DA1F2] hover:bg-[#0c85d0] text-white px-3 py-1 rounded-md text-sm flex items-center"
      >
        <span>Twitter</span>
      </button>
      
      <button
        onClick={() => window.open(shareUrls.facebook, '_blank')}
        className="bg-[#4267B2] hover:bg-[#365899] text-white px-3 py-1 rounded-md text-sm flex items-center"
      >
        <span>Facebook</span>
      </button>
      
      <button
        onClick={() => window.open(shareUrls.whatsapp, '_blank')}
        className="bg-[#25D366] hover:bg-[#128C7E] text-white px-3 py-1 rounded-md text-sm flex items-center"
      >
        <span>WhatsApp</span>
      </button>
      
      <button
        onClick={() => window.open(shareUrls.telegram, '_blank')}
        className="bg-[#0088cc] hover:bg-[#006da3] text-white px-3 py-1 rounded-md text-sm flex items-center"
      >
        <span>Telegram</span>
      </button>
      
      <button
        onClick={copyToClipboard}
        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm flex items-center"
      >
        <span>Copiar Link</span>
      </button>
    </div>
  );
};

export default ShareButtons; 