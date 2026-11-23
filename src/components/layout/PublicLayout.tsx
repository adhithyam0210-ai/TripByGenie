import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { CustomTripModal } from '../travel/CustomTripModal';
import { DraggableWhatsApp } from '../common/DraggableWhatsApp';

export const PublicLayout: React.FC = () => {
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF8] text-[#173247]">
      {/* Top Navbar with Mega Menus and Top Announcement Bar */}
      <PublicNavbar onOpenTripModal={() => setIsTripModalOpen(true)} />

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet context={{ openTripModal: () => setIsTripModalOpen(true) }} />
      </main>

      {/* Global Customized Trip Modal triggered from anywhere in the navbar or page */}
      <CustomTripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
      />

      {/* Full Travel Genie / Trip by Genie Footer */}
      <PublicFooter />

      {/* Draggable Floating WhatsApp Button only on landing page and when no modal is open */}
      <DraggableWhatsApp isModalOpen={isTripModalOpen} />
    </div>
  );
};
