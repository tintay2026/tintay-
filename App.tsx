import React, { useState } from 'react';
import { AppSection } from './services/types';
import { Layout } from './components/Layout';
import { ChatStudio } from './components/ChatStudio';
import { LiveStudio } from './components/LiveStudio';
import { MuseumStudio } from './components/MuseumStudio';
import { ImageStudio } from './components/ImageStudio';
import { MapsStudio } from './components/MapsStudio';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.CHAT);

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.CHAT: return <ChatStudio />;
      case AppSection.LIVE: return <LiveStudio />;
      case AppSection.HISTORIA: return <MuseumStudio />;
      case AppSection.GALERIA: return <ImageStudio />;
      case AppSection.MAPAS: return <MapsStudio />;
      default: return <ChatStudio />;
    }
  };

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </Layout>
  );
};

export default App;