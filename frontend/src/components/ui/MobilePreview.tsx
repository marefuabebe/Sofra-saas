import React from "react";
import { X, ExternalLink, Smartphone } from "lucide-react";

interface MobilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantSlug: string;
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ isOpen, onClose, restaurantSlug }) => {
  if (!isOpen) return null;

  const previewUrl = `/${restaurantSlug}?preview=true`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Mobile Device Mockup */}
      <div className="relative w-[375px] h-[812px] max-h-[90vh] bg-black rounded-[48px] shadow-2xl overflow-hidden border-[8px] border-gray-900 shrink-0 transform transition-transform animate-in fade-in zoom-in-95 duration-200">
        
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-2xl w-40 mx-auto z-20 flex justify-center items-end pb-1">
          <div className="w-12 h-1.5 bg-gray-800 rounded-full"></div>
        </div>

        {/* Content Iframe */}
        <div className="relative w-full h-full bg-white rounded-[40px] overflow-hidden pt-6">
          <iframe 
            src={previewUrl} 
            className="w-full h-full border-0"
            title="Customer Menu Preview"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>

      {/* Floating Controls (Right Side) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 animate-in fade-in slide-in-from-right-8">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-4 w-48">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-2">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-gray-900 text-sm">Live Preview</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              This is exactly what your customers see when they scan your QR code.
            </p>
          </div>
          
          <div className="w-full h-px bg-gray-100 my-1"></div>
          
          <a 
            href={previewUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Fullscreen
          </a>
          
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Close Preview
          </button>
        </div>
      </div>
      
      {/* Mobile-only Close Button (bottom) */}
      <div className="absolute bottom-6 md:hidden">
         <button 
            onClick={onClose}
            className="flex items-center justify-center w-12 h-12 bg-white text-gray-900 rounded-full shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
      </div>
    </div>
  );
};

export default MobilePreview;
