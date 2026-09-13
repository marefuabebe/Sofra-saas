import React from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  fullScreen = false,
  text = "Loading...",
}) => {
  const content = (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center"
    >
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
      <p className="text-text-secondary">{text}</p>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white flex items-center justify-center z-50"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">{content}</div>
  );
};
