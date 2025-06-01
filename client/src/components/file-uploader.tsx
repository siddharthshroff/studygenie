import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { UploadedFile } from "@shared/schema";
import type { AIGeneratedContent } from "@/lib/types";

interface FileUploaderProps {
  onContentGenerated: (content: AIGeneratedContent) => void;
}

export function FileUploader({ onContentGenerated }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      return response.json() as Promise<UploadedFile>;
    },
    onSuccess: async (uploadedFile) => {
      setIsProcessing(true);
      
      // Poll for file processing completion
      const pollForCompletion = async () => {
        const response = await fetch(`/api/files/${uploadedFile.id}`);
        const file = await response.json() as UploadedFile;
        
        if (file.status === 'completed') {
          // Generate AI content
          const contentResponse = await fetch(`/api/generate/${uploadedFile.id}`, {
            method: 'POST',
          });
          const content = await contentResponse.json() as AIGeneratedContent;
          
          onContentGenerated(content);
          setIsProcessing(false);
          setUploadProgress(0);
          
          toast({
            title: "Success!",
            description: "File uploaded and content generated successfully.",
          });
        } else if (file.status === 'error') {
          setIsProcessing(false);
          setUploadProgress(0);
          toast({
            title: "Error",
            description: "Failed to process file. Please try again.",
            variant: "destructive",
          });
        } else {
          // Still processing, poll again
          setTimeout(pollForCompletion, 1000);
        }
      };
      
      pollForCompletion();
    },
    onError: () => {
      setUploadProgress(0);
      setIsProcessing(false);
      toast({
        title: "Upload Failed",
        description: "Please check your file format and try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, DOCX, TXT, PPTX, or MP4 files only.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(50);
    uploadMutation.mutate(file);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fas fa-upload text-primary-600 mr-3"></i>
          Upload Study Materials
        </h3>
        <p className="text-gray-600 mt-1">Drop your files or browse to upload PDF, DOCX, TXT, PPTX, or MP4 files</p>
      </div>
      
      <div className="p-6">
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? "border-primary-400 bg-primary-50" 
              : "border-gray-300 hover:border-primary-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="animate-bounce mb-4">
            <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</h4>
          <p className="text-gray-600 mb-4">Supports PDF, DOCX, TXT, PPTX, and MP4 files up to 50MB</p>
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
            <i className="fas fa-folder-open mr-2"></i>
            Choose Files
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.pptx,.mp4"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />

        {/* Upload Progress */}
        {(uploadProgress > 0 || isProcessing) && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {isProcessing ? "Processing file and generating content..." : "Uploading..."}
              </span>
              <span className="text-sm text-gray-500">
                {isProcessing ? "Please wait" : `${uploadProgress}%`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: isProcessing ? "100%" : `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
