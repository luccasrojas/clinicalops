"use client";

import React, { useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "./ui/input";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AudioUploaderPRARTISProps {
  // On success function
  onSuccess?: (id?: string) => void;
  // Move uploading state up
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const AudioUploaderPRARTIS: React.FC<AudioUploaderPRARTISProps> = ({
  onSuccess,
  isUploading,
  setIsUploading,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  // const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setSuccessMessage("");
    setErrorMessage("");
    setUploadProgress(0);
    setFile(e.target.files?.[0] || null);
  };

  const router = useRouter();

  async function uploadAudio(file: File) {
    try {
      // 1️⃣ Request signed URL
      const res = await fetch(
        `/api/meeting/recording/upload-url?filename=${encodeURIComponent(
          file.name
        )}`
      );
      if (!res.ok) throw new Error("Failed to get upload URL");
      // console.log("Upload URL response:", await res.json());
      const { uploadUrl, objectKey } = await res.json();

      // 2️⃣ PUT directly to GCS with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });

      // 3️⃣ Notify backend for processing
      const result = await fetch("/api/meeting/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectKey }),
      });

      if (result.status === 403) {
        const resultBody = await result.json();
        throw new ConvexError({
          code: "FORBIDDEN",
          message: resultBody.error.data.message || "Forbidden",
        });
      }

      if (!result.ok) {
        throw new Error("Failed to register uploaded file");
      }
      setSuccessMessage("Audio subido y procesado con éxito.");
      // alert(JSON.stringify(await result.json()));
      const resultJson = await result.json();
      // console.log("Processing result:", resultJson);
      const meetingId = resultJson.data.meetingId as string | undefined;
      // alert(`Meeting ID: ${meetingId}`);
      onSuccess?.(meetingId);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error subiendo el archivo.");
      throw err;
    }
  }

  const handleUpload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await uploadAudio(file);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Error subiendo el archivo.");

      // ✅ Unified toast point
      if (err instanceof ConvexError) {
        toast.error(err.data?.message || "Error al crear la sesión");

        if (err.data?.code === "FORBIDDEN") {
          router.push("/dashboard/upgrade");
        }
      } else if (err instanceof Error) {
        toast.error(err.message || "Error creando sesión");
      } else {
        toast.error("Error desconocido al crear sesión");
      }

      // optional: rethrow if upper layers need to know
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <Input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="py-2"
      />

      <Button
        variant="accent"
        onClick={handleUpload}
        disabled={!file || isUploading}
      >
        {isUploading ? "Subiendo..." : "Subir audio"}
      </Button>

      {isUploading && (
        <Progress variant="accent" value={uploadProgress} className="w-full" />
      )}

      {successMessage && (
        <Alert>
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AudioUploaderPRARTIS;
